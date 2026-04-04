/**
 * Reservation Service
 * 核心業務邏輯：防超賣、建立訂單、觸發同步
 */
import { prisma } from "@/lib/prisma";
import { nextSerialNo, calcAvailableStock } from "@/lib/utils";
import { safeSync } from "./sync";
import type { CreateReservationRequest, ReservationSummary } from "@/types";

export interface CreateReservationResult {
  success: boolean;
  reservation?: ReservationSummary;
  error?: string;
}

export async function createReservation(
  req: CreateReservationRequest
): Promise<CreateReservationResult> {
  const { productId, guestToken, nickname, quantity } = req;

  if (!productId || !guestToken || !nickname || quantity < 1) {
    return { success: false, error: "請求資料不完整" };
  }

  try {
    // 使用 Prisma transaction 確保原子性，防止 race condition
    const result = await prisma.$transaction(async (tx) => {
      // 1. 查詢商品最新狀態（transaction 內加鎖）
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error("商品不存在");
      }

      if (product.status !== "ACTIVE") {
        throw new Error("商品目前無法預定");
      }

      // 2. 計算可用庫存
      const available = calcAvailableStock(
        product.totalStock,
        product.reservedStock
      );

      if (available <= 0) {
        throw new Error("商品已售完");
      }

      if (quantity > available) {
        throw new Error(`庫存不足，目前剩餘 ${available} 件，請重新確認數量`);
      }

      // 3. Upsert Guest
      const guest = await tx.guest.upsert({
        where: { guestToken },
        update: { nickname },
        create: { guestToken, nickname },
      });

      // 4. 取得訂單流水號
      const orderNo = await nextSerialNo(
        tx as unknown as import("@prisma/client").PrismaClient,
        "reservation"
      );

      // 5. 建立 Reservation
      const totalAmount = product.price * quantity;
      const reservation = await tx.reservation.create({
        data: {
          orderNo,
          productId: product.id,
          guestId: guest.id,
          nicknameSnapshot: nickname,
          productNameSnapshot: product.name,
          quantity,
          unitPrice: product.price,
          totalAmount,
          status: "CONFIRMED",
        },
      });

      // 6. 更新 reservedStock
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          reservedStock: { increment: quantity },
        },
      });

      // 7. 若補貨後仍有庫存才維持 ACTIVE，否則維持原狀（顯示層會判斷）
      const newAvailable = calcAvailableStock(
        updated.totalStock,
        updated.reservedStock
      );
      if (newAvailable === 0 && updated.status === "ACTIVE") {
        await tx.product.update({
          where: { id: productId },
          data: { status: "SOLD_OUT" },
        });
      }

      return {
        reservation,
        product: { ...updated, name: product.name, serialNo: product.serialNo },
        guest,
      };
    });

    // 8. 非同步觸發 Sheets 同步（不阻塞回應）
    const { product: updatedProduct, reservation, guest } = result;
    void triggerSyncAfterReservation(updatedProduct, guest, reservation);

    return {
      success: true,
      reservation: {
        orderNo: reservation.orderNo,
        productName: reservation.productNameSnapshot,
        quantity: reservation.quantity,
        unitPrice: reservation.unitPrice,
        totalAmount: reservation.totalAmount,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "建立預定時發生錯誤";
    return { success: false, error: message };
  }
}

/** 建立訂單後，非同步觸發 Google Sheets 同步 */
async function triggerSyncAfterReservation(
  product: {
    id: string;
    serialNo: string;
    name: string;
    totalStock: number;
    reservedStock: number;
    price: number;
    cost: number;
    status: string;
    updatedAt: Date;
  },
  guest: { guestToken: string; nickname: string },
  reservation: {
    orderNo: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    status: string;
    reservedAt: Date;
  }
) {
  const available = calcAvailableStock(product.totalStock, product.reservedStock);

  // 同步商品總表
  await safeSync((s) =>
    s.syncProductSummary({
      serialNo: product.serialNo,
      name: product.name,
      totalStock: product.totalStock,
      reservedStock: product.reservedStock,
      availableStock: available,
      price: product.price,
      cost: product.cost,
      status: product.status,
      updatedAt: product.updatedAt.toISOString(),
    })
  );

  // 同步購買人總表（重新查詢彙總資料）
  try {
    const buyerStats = await prisma.reservation.aggregate({
      where: { guest: { guestToken: guest.guestToken }, status: "CONFIRMED" },
      _sum: { quantity: true, totalAmount: true },
      _count: { id: true },
      _max: { reservedAt: true },
    });

    await safeSync((s) =>
      s.syncBuyerSummary({
        nickname: guest.nickname,
        guestToken: guest.guestToken,
        reservationCount: buyerStats._count.id,
        totalItems: buyerStats._sum.quantity || 0,
        totalAmount: buyerStats._sum.totalAmount || 0,
        lastReservationAt:
          buyerStats._max.reservedAt?.toISOString() || new Date().toISOString(),
      })
    );
  } catch {
    // 彙總查詢失敗，skip buyer sync
  }

  // 新增購買明細
  await safeSync((s) =>
    s.appendReservationDetail({
      orderNo: reservation.orderNo,
      productSerialNo: product.serialNo,
      productName: product.name,
      nickname: guest.nickname,
      guestToken: guest.guestToken,
      quantity: reservation.quantity,
      unitPrice: reservation.unitPrice,
      totalAmount: reservation.totalAmount,
      status: reservation.status,
      reservedAt: reservation.reservedAt.toISOString(),
    })
  );
}
