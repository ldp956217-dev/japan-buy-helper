"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Store, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductQuantitySelector } from "@/components/public/ProductQuantitySelector";
import { NicknameDialog } from "@/components/public/NicknameDialog";
import { ReserveConfirmDialog } from "@/components/public/ReserveConfirmDialog";
import { ToastContainer } from "@/components/ui/toast";
import { useGuest } from "@/hooks/useGuest";
import { useToast } from "@/hooks/useToast";
import { formatTWD } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductDetailClientProps {
  product: Product & { availableStock: number };
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { guestToken, nickname, isLoaded } = useGuest();
  const { toasts, addToast, removeToast } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [showNicknameDialog, setShowNicknameDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [reserveLoading, setReserveLoading] = useState(false);
  // 從 NicknameDialog 直接拿到的暱稱（解決 useGuest hook 非同步更新導致空值的 bug）
  const [pendingNickname, setPendingNickname] = useState("");

  // 以 hook 的 nickname 為主（已存在的用戶），首次設定時用 pendingNickname 作為即時備援
  const effectiveNickname = nickname || pendingNickname;

  const isSoldOut = product.availableStock <= 0;

  /** 點擊「確認預定」— 先檢查 nickname，再開確認 dialog */
  const handleReserveClick = () => {
    if (!isLoaded) return;
    if (!nickname) {
      setShowNicknameDialog(true);
      return;
    }
    setShowConfirmDialog(true);
  };

  /** nickname 設定完成後，把剛確認的暱稱存入 pendingNickname，再開確認 dialog */
  const handleNicknameConfirm = (confirmedNickname: string) => {
    setPendingNickname(confirmedNickname);
    setShowConfirmDialog(true);
  };

  /** 送出預定 */
  const handleConfirmReserve = async () => {
    if (!guestToken || !effectiveNickname) return;
    setReserveLoading(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          guestToken,
          nickname: effectiveNickname,
          quantity,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setShowConfirmDialog(false);
        addToast(
          `預定成功！${product.name} × ${quantity}`,
          "success"
        );
        // 短暫延遲後導向我的預定
        setTimeout(() => router.push("/me"), 1500);
      } else {
        setShowConfirmDialog(false);
        addToast(json.error || "預定失敗，請重試", "error");
      }
    } catch {
      addToast("網路錯誤，請重試", "error");
    } finally {
      setReserveLoading(false);
    }
  };

  return (
    <>
      <main className="max-w-2xl mx-auto pb-28">
        {/* 返回按鈕 */}
        <div className="px-4 pt-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
        </div>

        {/* 商品圖片 */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          <Image
            src={product.imageUrl || "/placeholder-product.svg"}
            alt={product.name}
            fill
            className={`object-cover ${isSoldOut ? "opacity-60" : ""}`}
            sizes="(max-width: 672px) 100vw, 672px"
            priority
          />
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-black/70 text-white text-xl font-bold px-6 py-2 rounded-full">
                已售完
              </span>
            </div>
          )}
        </div>

        {/* 商品資訊 */}
        <div className="px-4 py-5 flex flex-col gap-4">
          {/* 名稱 & 流水號 */}
          <div>
            <p className="text-xs text-gray-400 mb-1">{product.serialNo}</p>
            <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
          </div>

          {/* 售價 & 庫存 */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              {formatTWD(product.price)}
            </span>
            {isSoldOut ? (
              <Badge variant="secondary">已售完</Badge>
            ) : (
              <Badge variant="success">剩餘 {product.availableStock} 件</Badge>
            )}
          </div>

          {/* 店家 & 備註 */}
          {product.storeName && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Store className="h-4 w-4 shrink-0 text-gray-400" />
              <span>{product.storeName}</span>
            </div>
          )}
          {product.note && (
            <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
              <FileText className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
              <span className="leading-relaxed">{product.note}</span>
            </div>
          )}

          {/* 數量選擇 */}
          {!isSoldOut && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">選擇數量</span>
              <ProductQuantitySelector
                value={quantity}
                onChange={setQuantity}
                max={product.availableStock}
                disabled={isSoldOut}
              />
            </div>
          )}

          {/* 小計 */}
          {!isSoldOut && (
            <div className="flex items-center justify-between bg-blue-50 rounded-xl p-3">
              <span className="text-sm text-gray-600">小計</span>
              <span className="text-lg font-bold text-primary">
                {formatTWD(product.price * quantity)}
              </span>
            </div>
          )}
        </div>

      </main>

      {/* 底部固定按鈕區 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-4 pb-safe">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleReserveClick}
            disabled={isSoldOut || !isLoaded}
            className="w-full h-12 text-base font-semibold"
            variant={isSoldOut ? "secondary" : "default"}
          >
            {isSoldOut ? "已售完，無法預定" : `確認預定 ${formatTWD(product.price * quantity)}`}
          </Button>
        </div>
      </div>

      {/* 暱稱 Dialog */}
      <NicknameDialog
        open={showNicknameDialog}
        onClose={() => setShowNicknameDialog(false)}
        onConfirm={handleNicknameConfirm}
      />

      {/* 確認預定 Dialog */}
      <ReserveConfirmDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmReserve}
        productName={product.name}
        quantity={quantity}
        unitPrice={product.price}
        nickname={effectiveNickname}
        isLoading={reserveLoading}
      />

      {/* Toast */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
