"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { AdminProductForm } from "@/components/admin/AdminProductForm";
import { StockQuickAdjust } from "@/components/admin/StockQuickAdjust";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { Product, UpdateProductRequest } from "@/types";

interface EditProductClientProps {
  product: Product & { availableStock: number };
}

const statusConfig = {
  ACTIVE: { label: "上架中", variant: "success" as const },
  SOLD_OUT: { label: "已售完", variant: "secondary" as const },
  DRAFT: { label: "草稿", variant: "outline" as const },
  INACTIVE: { label: "已下架", variant: "destructive" as const },
};

export function EditProductClient({ product: initialProduct }: EditProductClientProps) {
  const router = useRouter();
  const [product, setProduct] = useState(initialProduct);
  const [statusLoading, setStatusLoading] = useState(false);

  const handleSubmit = async (data: UpdateProductRequest & { imageUrl?: string }) => {
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || "更新失敗");
    }

    router.push("/admin");
    router.refresh();
  };

  /** 快速調整庫存 */
  const handleQuickStockAdjust = async (newTotal: number) => {
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalStock: newTotal }),
    });
    const json = await res.json();
    if (json.success) {
      setProduct({
        ...product,
        totalStock: newTotal,
        availableStock: newTotal - product.reservedStock,
        status: newTotal > product.reservedStock ? "ACTIVE" : product.status,
      });
    }
  };

  /** 切換上架/下架狀態 */
  const handleToggleStatus = async () => {
    const newStatus = product.status === "ACTIVE" || product.status === "SOLD_OUT"
      ? "INACTIVE"
      : "ACTIVE";

    setStatusLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setProduct({ ...product, status: newStatus });
      }
    } finally {
      setStatusLoading(false);
    }
  };

  const { label, variant } = statusConfig[product.status];

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors min-h-[44px] mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        返回
      </button>

      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-gray-400">{product.serialNo}</p>
          <h1 className="text-xl font-bold text-gray-900">編輯商品</h1>
        </div>
        <Badge variant={variant}>{label}</Badge>
      </div>

      {/* 庫存概覽卡 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">庫存狀態</h2>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center bg-gray-50 rounded-lg py-2">
            <p className="text-xs text-gray-400">總上架</p>
            <p className="text-lg font-bold">{product.totalStock}</p>
          </div>
          <div className="text-center bg-orange-50 rounded-lg py-2">
            <p className="text-xs text-orange-400">已預定</p>
            <p className="text-lg font-bold text-orange-600">{product.reservedStock}</p>
          </div>
          <div className={`text-center rounded-lg py-2 ${product.availableStock === 0 ? "bg-red-50" : "bg-green-50"}`}>
            <p className={`text-xs ${product.availableStock === 0 ? "text-red-400" : "text-green-400"}`}>剩餘</p>
            <p className={`text-lg font-bold ${product.availableStock === 0 ? "text-red-600" : "text-green-600"}`}>
              {product.availableStock}
            </p>
          </div>
        </div>

        {/* 快速庫存調整 */}
        <div>
          <p className="text-xs text-gray-400 mb-2">快速調整庫存</p>
          <StockQuickAdjust
            currentTotal={product.totalStock}
            reservedStock={product.reservedStock}
            onAdjust={handleQuickStockAdjust}
          />
        </div>

        {/* 重新上架提示 */}
        {(product.status === "SOLD_OUT" || product.status === "INACTIVE") && product.availableStock > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-yellow-50 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
            <p className="text-xs text-yellow-700">有剩餘庫存，可重新上架</p>
          </div>
        )}
      </div>

      {/* 上下架切換 */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleStatus}
          disabled={statusLoading}
          className={`h-9 text-sm ${
            product.status === "ACTIVE" || product.status === "SOLD_OUT"
              ? "text-red-600 border-red-200 hover:bg-red-50"
              : "text-green-700 border-green-200 hover:bg-green-50"
          }`}
        >
          {product.status === "INACTIVE" || product.status === "DRAFT"
            ? "重新上架"
            : "下架商品"}
        </Button>
      </div>

      {/* 編輯表單 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <AdminProductForm
          initialData={product}
          onSubmit={handleSubmit}
          submitLabel="儲存變更"
        />
      </div>

      {/* 售價成本提示 */}
      <div className="mt-3 text-xs text-gray-400 text-right">
        目前售價 {formatPrice(product.price)} · 成本 {formatPrice(product.cost)}
      </div>
    </div>
  );
}
