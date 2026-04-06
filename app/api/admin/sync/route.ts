/**
 * POST /api/admin/sync
 * 手動觸發全量同步到 Google Sheets
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSyncService } from "@/services/sync";
import { calcAvailableStock } from "@/lib/utils";
import { getAdminSession } from "@/lib/auth";

export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const syncErrors: string[] = [];
    const results = { products: 0, buyers: 0, reservations: 0, errors: syncErrors };

    // 取得 sync service（會 log 使用哪種模式）
    const service = await getSyncService();
    const isGoogle = service.constructor.name === "GoogleSheetsSyncService";

    const runSync = async (fn: () => Promise<void>, label: string) => {
      try {
        await fn();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        syncErrors.push(`${label}: ${msg}`);
        console.error(`[Sync] ${label} 失敗:`, e);
      }
    };

    // ── 1. 商品總表 ──────────────────────────────
    const products = await prisma.product.findMany({
      where: { status: { not: "INACTIVE" } },
      orderBy: { serialNo: "asc" },
    });

    for (const p of products) {
      await runSync(() => service.syncProductSummary({
        serialNo: p.serialNo,
        name: p.name,
        totalStock: p.totalStock,
        reservedStock: p.reservedStock,
        availableStock: calcAvailableStock(p.totalStock, p.reservedStock),
        price: p.price,
        cost: p.cost,
        status: p.status,
        updatedAt: p.updatedAt.toISOString(),
      }), `商品總表/${p.serialNo}`);
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
      await runSync(() => service.syncBuyerSummary({
        nickname: g.nickname,
        guestToken: g.guestToken,
        reservationCount: g.reservations.length,
        totalItems,
        totalAmount,
        lastReservationAt: g.reservations[0].reservedAt.toISOString(),
      }), `購買人/${g.nickname}`);
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
      await runSync(() => service.appendReservationDetail({
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
      }), `明細/${r.orderNo}`);
      results.reservations++;
    }

    const hasErrors = syncErrors.length > 0;
    return NextResponse.json({
      success: !hasErrors,
      mode: isGoogle ? "google_sheets" : "mock",
      data: results,
      errors: syncErrors,
    });
  } catch (error) {
    console.error("[POST /api/admin/sync]", error);
    return NextResponse.json(
      { success: false, error: "同步失敗，請查看 server log" },
      { status: 500 }
    );
  }
}
