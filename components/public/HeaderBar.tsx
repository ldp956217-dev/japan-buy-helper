"use client";

import Link from "next/link";
import { ShoppingBag, User, ChevronRight } from "lucide-react";
import { useGuest } from "@/hooks/useGuest";
import { Button } from "@/components/ui/button";

export function HeaderBar() {
  const { nickname, isLoaded } = useGuest();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
          <span className="text-xl">🇯🇵</span>
          <span className="text-base">日本代購</span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* 身份顯示 */}
          {isLoaded && (
            <Link href="/nickname" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] px-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">
                {nickname ? (
                  <>
                    <span className="text-gray-400 text-xs mr-1">身份</span>
                    <span className="font-medium">{nickname}</span>
                  </>
                ) : (
                  <span className="text-gray-400">設定暱稱</span>
                )}
              </span>
            </Link>
          )}

          {/* 我的預定 */}
          <Button asChild variant="outline" size="sm" className="h-10 px-3">
            <Link href="/me" className="flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">我的預定</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
