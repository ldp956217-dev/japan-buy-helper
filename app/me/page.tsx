"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, Package } from "lucide-react";
import { HeaderBar } from "@/components/public/HeaderBar";
import { ReservationList } from "@/components/public/ReservationList";
import { EmptyState } from "@/components/public/EmptyState";
import { Button } from "@/components/ui/button";
import { NicknameDialog } from "@/components/public/NicknameDialog";
import { useGuest } from "@/hooks/useGuest";
import { formatTWD } from "@/lib/utils";
import type { Reservation } from "@/types";

interface MyReservationsData {
  reservations: Reservation[];
  totalItems: number;
  totalAmount: number;
}

export default function MePage() {
  const { guestToken, nickname, isLoaded } = useGuest();
  const [data, setData] = useState<MyReservationsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNicknameDialog, setShowNicknameDialog] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!guestToken) return;

    setLoading(true);
    fetch(`/api/me/reservations?guestToken=${encodeURIComponent(guestToken)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [guestToken, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderBar />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400 text-sm">載入中...</div>
        </div>
      </div>
    );
  }

  if (!nickname) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderBar />
        <div className="max-w-lg mx-auto px-4 py-12">
          <EmptyState
            title="請先設定暱稱"
            description="設定暱稱後即可查看你的購買記錄"
            icon="👤"
            action={
              <Button
                onClick={() => setShowNicknameDialog(true)}
                className="h-11 px-6"
              >
                設定暱稱
              </Button>
            }
          />
        </div>
        <NicknameDialog
          open={showNicknameDialog}
          onClose={() => setShowNicknameDialog(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBar />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 返回 */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors min-h-[44px] w-fit mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          商品列表
        </Link>

        {/* 身份資訊卡 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-400">目前身份</p>
              <p className="font-semibold text-gray-900">{nickname}</p>
            </div>
          </div>

          {/* 彙總數字 */}
          {data && data.reservations.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-50">
              <div className="text-center">
                <p className="text-xs text-gray-400">預定筆數</p>
                <p className="text-lg font-bold text-gray-900">
                  {data.reservations.length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">總件數</p>
                <p className="text-lg font-bold text-gray-900">{data.totalItems}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">總代付金額</p>
                <p className="text-lg font-bold text-primary">
                  {formatTWD(data.totalAmount)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 已購買商品清單 */}
        <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Package className="h-4 w-4" />
          已購買商品清單
        </h2>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">載入中...</div>
        ) : !data || data.reservations.length === 0 ? (
          <EmptyState
            title="還沒有購買記錄"
            description="快去看看有什麼好東西！"
            icon="🛍️"
            action={
              <Button asChild className="h-11">
                <Link href="/">瀏覽商品</Link>
              </Button>
            }
          />
        ) : (
          <ReservationList reservations={data.reservations} />
        )}
      </main>
    </div>
  );
}
