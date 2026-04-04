"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeaderBar } from "@/components/public/HeaderBar";
import { useGuest } from "@/hooks/useGuest";

export default function NicknamePage() {
  const router = useRouter();
  const { nickname, setNickname, clearNickname, isLoaded } = useGuest();

  // 切換模式：輸入新暱稱
  const [switching, setSwitching] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("請輸入暱稱");
      return;
    }
    if (trimmed.length > 20) {
      setError("暱稱最多 20 個字");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await setNickname(trimmed);
      router.back();
    } catch {
      setError("操作失敗，請重試");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderBar />
        <div className="flex items-center justify-center py-20">
          <span className="text-gray-400 text-sm">載入中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBar />

      <main className="max-w-md mx-auto px-4 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors min-h-[44px] mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">我的身份</h1>
              <p className="text-xs text-gray-400">
                {nickname ? "目前登入身份" : "請設定你的暱稱"}
              </p>
            </div>
          </div>

          {nickname && !switching ? (
            /* 已登入：顯示暱稱（唯讀），提供切換用戶 */
            <div className="flex flex-col gap-4">
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {nickname.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{nickname}</p>
                  <p className="text-xs text-gray-400">暱稱確認後不可修改</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center">
                若要以其他名義預定，請切換用戶
              </p>

              <Button
                variant="outline"
                onClick={() => {
                  clearNickname();
                  setSwitching(true);
                }}
                className="h-11 w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                切換用戶
              </Button>
            </div>
          ) : (
            /* 未登入 / 切換中：輸入暱稱 */
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nickname">暱稱</Label>
                <Input
                  id="nickname"
                  placeholder="例如：小美、阿豪..."
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  maxLength={20}
                  autoFocus
                  autoComplete="off"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <p className="text-xs text-gray-400">
                  同暱稱的訂單會自動歸在同一個身份，暱稱確認後不可修改。
                </p>
              </div>

              <Button
                onClick={handleSave}
                disabled={loading}
                className="h-11 w-full"
              >
                {loading ? "確認中..." : "確認暱稱"}
              </Button>

              {switching && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSwitching(false);
                    // 若取消切換，把原本暱稱重新填回（從 localStorage 重新 init）
                    window.location.reload();
                  }}
                  className="h-10 w-full text-gray-400"
                >
                  取消
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
