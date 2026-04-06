"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGuest } from "@/hooks/useGuest";

interface NicknameDialogProps {
  open: boolean;
  onClose: () => void;
  /** 確認後回傳已儲存的暱稱與 guestToken，讓父層不依賴 hook 非同步更新即可直接使用 */
  onConfirm?: (confirmedNickname: string, confirmedGuestToken: string) => void;
}

export function NicknameDialog({
  open,
  onClose,
  onConfirm,
}: NicknameDialogProps) {
  const { setNickname } = useGuest();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
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
      const result = await setNickname(trimmed);
      // 直接回傳 API 解析後的 nickname 與 guestToken，父層不依賴 hook re-render
      onConfirm?.(result.nickname, result.guestToken);
      onClose();
    } catch {
      setError("操作失敗，請重試");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>請先輸入你的暱稱</DialogTitle>
          <DialogDescription>
            暱稱確認後不可修改，同暱稱的訂單會歸在同一身份。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="nickname">暱稱</Label>
          <Input
            id="nickname"
            placeholder="例如：小美、阿豪..."
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            maxLength={20}
            autoFocus
            autoComplete="off"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:w-auto h-11"
          >
            {loading ? "儲存中..." : "確認"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
