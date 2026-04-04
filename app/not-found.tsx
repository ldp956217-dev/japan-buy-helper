import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">找不到頁面</h1>
      <p className="text-gray-500 text-sm mb-6">
        這個頁面不存在，或商品已下架。
      </p>
      <Button asChild className="h-11">
        <Link href="/">回到商品列表</Link>
      </Button>
    </div>
  );
}
