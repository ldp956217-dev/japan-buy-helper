import { formatTWD, formatDateTime } from "@/lib/utils";
import type { Reservation } from "@/types";

interface ReservationListProps {
  reservations: Reservation[];
}

export function ReservationList({ reservations }: ReservationListProps) {
  return (
    <div className="flex flex-col gap-3">
      {reservations.map((r) => (
        <div
          key={r.id}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="font-medium text-gray-900 text-sm leading-snug">
                {r.productNameSnapshot}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                訂單 {r.orderNo} · {formatDateTime(r.reservedAt)}
              </p>
            </div>
            <span className="shrink-0 text-base font-bold text-gray-900">
              {formatTWD(r.totalAmount)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm border-t border-gray-50 pt-3">
            <div>
              <span className="text-gray-400 text-xs">數量</span>
              <p className="font-medium">{r.quantity} 件</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">單價</span>
              <p className="font-medium">{formatTWD(r.unitPrice)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
