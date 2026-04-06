/**
 * 後台首頁 - 商品管理列表
 */
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Package } from "lucide-react";
export const dynamic = "force-dynamic";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { toProductWithAvailable, formatPrice, formatTWD } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";

async function getAdminProducts() {
  const products = await prisma.product.findMany({
    where: { status: { not: "INACTIVE" } },
  });
  const statusOrder = { ACTIVE: 0, DRAFT: 1, SOLD_OUT: 2, INACTIVE: 3 } as const;
  return products
    .map((p) => toProductWithAvailable(p))
    .sort((a, b) => {
      const oa = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
      const ob = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
      if (oa !== ob) return oa - ob;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

const statusConfig = {
  ACTIVE: { label: "上架中", variant: "success" as const },
  SOLD_OUT: { label: "已售完", variant: "secondary" as const },
  DRAFT: { label: "草稿", variant: "outline" as const },
  INACTIVE: { label: "已下架", variant: "destructive" as const },
};

export default async function AdminPage() {
  const products = await getAdminProducts();
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${proto}://${host}`;

  return (
    <div>
      {/* 標題區 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5" />
            商品管理
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">共 {products.length} 項商品</p>
        </div>
        <Button asChild className="h-11 gap-2">
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" />
            新增商品
          </Link>
        </Button>
      </div>

      {/* 分享列表連結 */}
      <div className="bg-blue-50 rounded-xl p-4 mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-blue-800">商品列表連結</p>
          <p className="text-xs text-blue-600 mt-0.5">複製後分享給朋友</p>
        </div>
        <CopyLinkButton url={`${baseUrl}/`} label="複製列表連結" />
      </div>

      {/* 商品列表 */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">尚無商品，點擊「新增商品」開始上架</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((product) => {
            const { label, variant } = statusConfig[product.status];
            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="flex gap-3 p-4">
                  {/* 圖片 */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={product.imageUrl || "/placeholder-product.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  {/* 資訊 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-xs text-gray-400">{product.serialNo}</p>
                        <p className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">
                          {product.name}
                        </p>
                      </div>
                      <Badge variant={variant} className="shrink-0 text-xs">
                        {label}
                      </Badge>
                    </div>

                    {/* 數字資訊 */}
                    <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                      <div className="bg-gray-50 rounded-lg py-1.5">
                        <p className="text-xs text-gray-400">總上架</p>
                        <p className="text-sm font-semibold">{product.totalStock}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg py-1.5">
                        <p className="text-xs text-orange-400">已預定</p>
                        <p className="text-sm font-semibold text-orange-600">{product.reservedStock}</p>
                      </div>
                      <div className={`rounded-lg py-1.5 ${product.availableStock === 0 ? "bg-red-50" : "bg-green-50"}`}>
                        <p className={`text-xs ${product.availableStock === 0 ? "text-red-400" : "text-green-400"}`}>剩餘</p>
                        <p className={`text-sm font-semibold ${product.availableStock === 0 ? "text-red-600" : "text-green-600"}`}>
                          {product.availableStock}
                        </p>
                      </div>
                    </div>

                    {/* 售價成本 */}
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <span className="font-semibold text-primary">{formatTWD(product.price)}</span>
                      <span className="text-gray-400 text-xs">成本 {formatPrice(product.cost)}</span>
                    </div>
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
                  <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
                    <Link href={`/admin/products/${product.id}/edit`}>
                      <Edit className="h-3.5 w-3.5" />
                      編輯
                    </Link>
                  </Button>
                  <CopyLinkButton
                    url={`${baseUrl}/product/${product.id}`}
                    label="複製商品連結"
                    text={[
                      `有貨啦！要的請點連結登記，要出現預定成功才有喔！`,
                      product.name,
                      `數量：${product.availableStock} 件｜售價：${formatTWD(product.price)}`,
                      product.note ? `備註：${product.note}` : null,
                      `${baseUrl}/product/${product.id}`,
                    ].filter(Boolean).join("\n")}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
