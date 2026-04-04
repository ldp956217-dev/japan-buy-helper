/**
 * POST /api/admin/sync
 * 手動觸發全量同步到 Google Sheets
 * - 商品總表：所有商品
 * - 購買人總表：所有有訂單的 guest 彙總
 * - 購買明細：所有訂單（清空後重寫）
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeSync } from "@/services/sync";
import { calcAvailableStock } from "@/lib/utils";

export async function POST() {
  try {
    const results = { products: 0, buyers: 0, reservations: 0, errors: [] as string[] };

    // ── 1. 商品總表 ──────────────────────────────
    const products = await prisma.product.findMany({
      where: { status: { not: "INACTIVE" } },
      orderBy: { serialNo: "asc" },
    });

    for (const p of products) {
      await safeSync((s) =>
        s.syncProductSummary({
          serialNo: p.serialNo,
          name: p.name,
          totalStock: p.totalStock,
          reservedStock: p.reservedStock,
          availableStock: calcAvailableStock(p.totalStock, p.reservedStock),
          price: p.price,
          cost: p.cost,
          status: p.status,
          updatedAt: p.updatedAt.toISOString(),
        })
      );
      results.products++;
    }

    // ── 2. 購買人總表 ────────────────────────────
    const guests = await prisma.guest.findMany({
      include: {
        reservations: {
          where: { status: "CONFIRMED" },
          select: { quantity: true, totalAmount: true, reservedAt: true },
          orderBy: { reservedAt: "desc" },
        },
      },
    });

    for (const g of guests) {
      if (g.reservations.length === 0) continue;
      const totalItems = g.reservations.reduce((s, r) => s + r.quantity, 0);
      const totalAmount = g.reservations.reduce((s, r) => s + r.totalAmount, 0);
      await safeSync((s) =>
        s.syncBuyerSummary({
          nickname: g.nickname,
          guestToken: g.guestToken,
          reservationCount: g.reservations.length,
          totalItems,
          totalAmount,
          lastReservationAt: g.reservations[0].reservedAt.toISOString(),
        })
      );
      results.buyers++;
    }

    // ── 3. 購買明細 ──────────────────────────────
    const reservations = await prisma.reservation.findMany({
      orderBy: { reservedAt: "asc" },
      include: {
        product: { select: { serialNo: true } },
        guest: { select: { guestToken: true } },
      },
    });

    for (const r of reservations) {
      await safeSync((s) =>
        s.appendReservationDetail({
          orderNo: r.orderNo,
          productSerialNo: r.product?.serialNo ?? "",
          productName: r.productNameSnapshot,
          nickname: r.nicknameSnapshot,
          guestToken: r.guest?.guestToken ?? "",
          quantity: r.quantity,
          unitPrice: r.unitPrice,
          totalAmount: r.totalAmount,
          status: r.status,
          reservedAt: r.reservedAt.toISOString(),
        })
      );
      results.reservations++;
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("[POST /api/admin/sync]", error);
    return NextResponse.json(
      { success: false, error: "同步失敗，請查看 server log" },
      { status: 500 }
    );
  }
}
