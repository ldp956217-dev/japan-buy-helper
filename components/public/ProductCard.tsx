import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTWD } from "@/lib/utils";
import type { ProductListItem } from "@/types";

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const isSoldOut = product.availableStock <= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* 商品圖片 */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <Image
          src={product.imageUrl || "/placeholder-product.svg"}
          alt={product.name}
          fill
          className={`object-cover transition-opacity ${isSoldOut ? "opacity-50" : ""}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-black/70 text-white text-sm font-bold px-3 py-1 rounded-full">
              已售完
            </span>
          </div>
        )}
      </div>

      {/* 商品資訊 */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-base font-bold text-gray-900">
            {formatTWD(product.price)}
          </span>
          {isSoldOut ? (
            <Badge variant="secondary" className="text-xs">已售完</Badge>
          ) : (
            <Badge variant="success" className="text-xs">
              剩 {product.availableStock} 件
            </Badge>
          )}
        </div>

        <Button
          asChild
          variant={isSoldOut ? "secondary" : "default"}
          size="sm"
          className="w-full h-10 text-sm mt-1"
        >
          <Link href={`/product/${product.id}`}>
            {isSoldOut ? "查看詳情" : "查看 / 預定"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
