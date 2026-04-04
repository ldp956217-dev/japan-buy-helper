"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface StockQuickAdjustProps {
  currentTotal: number;
  reservedStock: number;
  onAdjust: (newTotal: number) => void;
  disabled?: boolean;
}

export function StockQuickAdjust({
  currentTotal,
  reservedStock,
  onAdjust,
  disabled,
}: StockQuickAdjustProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const adjustments = [
    { label: "+1", delta: 1 },
    { label: "+5", delta: 5 },
    { label: "+10", delta: 10 },
    { label: "-1", delta: -1 },
  ];

  const handleAdjust = async (delta: number, label: string) => {
    const newTotal = currentTotal + delta;
    // 不可低於 reservedStock
    if (newTotal < reservedStock) {
      alert(`總上架數量不可低於已預定數量 (${reservedStock})`);
      return;
    }
    if (newTotal < 0) return;

    setLoading(label);
    try {
      await onAdjust(newTotal);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {adjustments.map(({ label, delta }) => {
        const newTotal = currentTotal + delta;
        const isDisabled = disabled || newTotal < reservedStock || newTotal < 0;
        return (
          <Button
            key={label}
            variant="outline"
            size="sm"
            className={`h-9 min-w-[44px] text-sm ${delta < 0 ? "text-red-600 hover:text-red-700 border-red-200" : "text-green-700 hover:text-green-800 border-green-200"}`}
            disabled={isDisabled || loading !== null}
            onClick={() => handleAdjust(delta, label)}
          >
            {loading === label ? "..." : label}
          </Button>
        );
      })}
    </div>
  );
}
