"use client";

import { useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "@/types";

export interface GuestInfo {
  guestToken: string | null;
  nickname: string | null;
  isLoaded: boolean;
}

export function useGuest() {
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [nickname, setNicknameState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 初始化：從 localStorage 讀取
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEYS.GUEST_TOKEN);
    const savedNickname = localStorage.getItem(STORAGE_KEYS.GUEST_NICKNAME);
    setGuestToken(savedToken);
    setNicknameState(savedNickname);
    setIsLoaded(true);
  }, []);

  /**
   * 以暱稱登入（首次設定或切換用戶）。
   * 呼叫後端 /api/guests/switch，以 nickname 為 key 找或建立 Guest，
   * 取得對應的 guestToken 存入 localStorage。
   * 同暱稱永遠對應同一身份。
   */
  const setNickname = useCallback(async (newNickname: string) => {
    const res = await fetch("/api/guests/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: newNickname }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "切換失敗");

    const { guestToken: token, nickname: resolvedNickname } = json.data;
    localStorage.setItem(STORAGE_KEYS.GUEST_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.GUEST_NICKNAME, resolvedNickname);
    setGuestToken(token);
    setNicknameState(resolvedNickname);
  }, []);

  /** 登出（清除本機身份，不刪後端資料） */
  const clearNickname = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.GUEST_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.GUEST_NICKNAME);
    setGuestToken(null);
    setNicknameState(null);
  }, []);

  return {
    guestToken,
    nickname,
    isLoaded,
    hasNickname: !!nickname,
    setNickname,
    clearNickname,
  };
}
