"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CancelReservationButtonProps {
  reservationId: string;
  orderNo: string;
}

export function CancelReservationButton({ reservationId, orderNo }: CancelReservationButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm(`確定要取消訂單 ${orderNo} 嗎？取消後庫存會自動補回。`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (json.success) {
        window.location.reload();
      } else {
        alert(json.error || "取消失敗");
      }
    } catch {
      alert("網路錯誤，請重試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCancel}
      disabled={loading}
      className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
    >
      {loading ? "處理中..." : "取消訂單"}
    </Button>
  );
}
