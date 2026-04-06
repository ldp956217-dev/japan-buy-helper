/**
 * PATCH /api/admin/reservations/:id
 * 取消訂單 + 補回庫存（Transaction 確保原子性）
 * 若商品原為 SOLD_OUT 且補回後有餘量，自動恢復 ACTIVE
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { calcAvailableStock } from "@/lib/utils";
import { safeSync } from "@/services/sync";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── 驗證管理員身份 ───────────────────────────────
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    // ── 查詢訂單（含商品、買家資訊供後續 sync 使用）──
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        product: true,
        guest: { select: { guestToken: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "訂單不存在" },
        { status: 404 }
      );
    }
    if (reservation.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, error: "訂單已取消" },
        { status: 400 }
      );
    }

    // ── Transaction：取消訂單 + 補回庫存 ─────────────
    await prisma.$transaction(async (tx) => {
      // 1. 將訂單狀態改為 CANCELLED
      await tx.reservation.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      // 2. 補回 reservedStock
      const updatedProduct = await tx.product.update({
        where: { id: reservation.productId },
        data: { reservedStock: { decrement: reservation.quantity } },
      });

      // 3. 若商品為 SOLD_OUT 且補回後有剩餘庫存，自動恢復 ACTIVE
      const newAvailable = calcAvailableStock(
        updatedProduct.totalStock,
        updatedProduct.reservedStock
      );
      if (updatedProduct.status === "SOLD_OUT" && newAvailable > 0) {
        await tx.product.update({
          where: { id: reservation.productId },
          data: { status: "ACTIVE" },
        });
      }
    });

    // ── Transaction 結束後，重新讀取最新商品狀態供 sync ─
    const latestProduct = await prisma.product.findUnique({
      where: { id: reservation.productId },
    });

    // ── 非同步同步 Google Sheets（不阻塞回應）─────────
    if (latestProduct) {
      void safeSync((s) =>
        s.syncProductSummary({
          serialNo: latestProduct.serialNo,
          name: latestProduct.name,
          totalStock: latestProduct.totalStock,
          reservedStock: latestProduct.reservedStock,
          availableStock: calcAvailableStock(
            latestProduct.totalStock,
            latestProduct.reservedStock
          ),
          price: latestProduct.price,
          cost: latestProduct.cost,
          status: latestProduct.status,
          updatedAt: latestProduct.updatedAt.toISOString(),
        })
      );
    }

    // 將此訂單以 CANCELLED 狀態覆寫到 Google Sheets 購買明細（upsert by orderNo）
    void safeSync((s) =>
      s.upsertReservationDetail({
        orderNo: reservation.orderNo,
        productSerialNo: reservation.product?.serialNo ?? "",
        productName: reservation.productNameSnapshot,
        nickname: reservation.nicknameSnapshot,
        guestToken: reservation.guest?.guestToken ?? "",
        quantity: reservation.quantity,
        unitPrice: reservation.unitPrice,
        totalAmount: reservation.totalAmount,
        status: "CANCELLED",
        reservedAt: reservation.reservedAt.toISOString(),
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/reservations/:id]", error);
    return NextResponse.json(
      { success: false, error: "操作失敗，請稍後重試" },
      { status: 500 }
    );
  }
}
