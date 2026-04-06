/**
 * 後台 - 預定明細頁
 */
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { formatTWD, formatDateTime } from "@/lib/utils";
import { ClipboardList } from "lucide-react";
import { CancelReservationButton } from "@/components/admin/CancelReservationButton";

async function getReservations() {
  return prisma.reservation.findMany({
    orderBy: { reservedAt: "desc" },
    include: {
      guest: { select: { nickname: true, guestToken: true } },
      product: { select: { serialNo: true, name: true } },
    },
  });
}

export default async function ReservationsPage() {
  const reservations = await getReservations();
  const totalAmount = reservations
    .filter((r) => r.status === "CONFIRMED")
    .reduce((sum, r) => sum + r.totalAmount, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          預定明細
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          共 {reservations.length} 筆 · 總金額 {formatTWD(totalAmount)}
        </p>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
          尚無預定記錄
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reservations.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
            >
              {/* 頂部：訂單號 + 狀態 */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {r.orderNo}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === "CONFIRMED"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500 line-through"
                    }`}
                  >
                    {r.status === "CONFIRMED" ? "已確認" : "已取消"}
                  </span>
                  {r.status === "CONFIRMED" && (
                    <CancelReservationButton reservationId={r.id} orderNo={r.orderNo} />
                  )}
                </div>
              </div>

              {/* 商品 & 買家 */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">
                    {r.product?.serialNo}
                  </p>
                  <p className="font-medium text-gray-900 text-sm line-clamp-2">
                    {r.productNameSnapshot}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    購買人：<span className="font-medium">{r.nicknameSnapshot}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">{formatTWD(r.totalAmount)}</p>
                  <p className="text-xs text-gray-400">
                    {r.quantity} 件 × {formatTWD(r.unitPrice)}
                  </p>
                </div>
              </div>

              {/* 時間 */}
              <p className="text-xs text-gray-400 mt-2 border-t border-gray-50 pt-2">
                {formatDateTime(r.reservedAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
