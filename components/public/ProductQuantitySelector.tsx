"use client";

import { Minus, Plus } from "lucide-react";

interface ProductQuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  max: number;
  min?: number;
  disabled?: boolean;
}

export function ProductQuantitySelector({
  value,
  onChange,
  max,
  min = 1,
  disabled = false,
}: ProductQuantitySelectorProps) {
  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden w-fit">
      {/* 減少按鈕 - 最小 44x44 */}
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className="w-11 h-11 flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:bg-gray-200"
        aria-label="減少數量"
      >
        <Minus className="h-4 w-4" />
      </button>

      {/* 數量顯示 */}
      <div className="min-w-[48px] h-11 flex items-center justify-center text-base font-semibold select-none px-3">
        {value}
      </div>

      {/* 增加按鈕 */}
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className="w-11 h-11 flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:bg-gray-200"
        aria-label="增加數量"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
