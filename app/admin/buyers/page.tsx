/**
 * 後台 - 購買人總覽頁
 */
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { formatTWD, formatDateTime } from "@/lib/utils";
import { Users } from "lucide-react";

async function getBuyerSummary() {
  // 用 Prisma groupBy 彙整每位 guest 的數據
  const guests = await prisma.guest.findMany({
    include: {
      reservations: {
        where: { status: "CONFIRMED" },
        select: {
          quantity: true,
          totalAmount: true,
          reservedAt: true,
        },
        orderBy: { reservedAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return guests
    .filter((g) => g.reservations.length > 0)
    .map((g) => {
      const totalItems = g.reservations.reduce((s, r) => s + r.quantity, 0);
      const totalAmount = g.reservations.reduce((s, r) => s + r.totalAmount, 0);
      const lastReservationAt = g.reservations[0]?.reservedAt || null;

      return {
        id: g.id,
        nickname: g.nickname,
        guestToken: g.guestToken,
        reservationCount: g.reservations.length,
        totalItems,
        totalAmount,
        lastReservationAt,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

export default async function BuyersPage() {
  const buyers = await getBuyerSummary();
  const grandTotal = buyers.reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5" />
          購買人總覽
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          共 {buyers.length} 人 · 總代付金額 {formatTWD(grandTotal)}
        </p>
      </div>

      {buyers.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          尚無購買記錄
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {buyers.map((buyer, idx) => (
            <div
              key={buyer.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-center justify-between gap-3">
                {/* 排名 + 名稱 */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{buyer.nickname}</p>
                    <p className="text-xs text-gray-400 font-mono">
                      {buyer.guestToken.slice(0, 8)}...
                    </p>
                  </div>
                </div>

                {/* 總金額 */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-primary">
                    {formatTWD(buyer.totalAmount)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {buyer.totalItems} 件
                  </p>
                </div>
              </div>

              {/* 詳細數字 */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-50 text-center">
                <div>
                  <p className="text-xs text-gray-400">預定筆數</p>
                  <p className="text-sm font-semibold">{buyer.reservationCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">總件數</p>
                  <p className="text-sm font-semibold">{buyer.totalItems}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">最近預定</p>
                  <p className="text-xs font-medium">
                    {buyer.lastReservationAt
                      ? formatDateTime(buyer.lastReservationAt)
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
