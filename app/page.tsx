/**
 * 前台首頁 - 商品列表
 */
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { toProductWithAvailable } from "@/lib/utils";
import { HeaderBar } from "@/components/public/HeaderBar";
import { ProductCard } from "@/components/public/ProductCard";
import { EmptyState } from "@/components/public/EmptyState";
import type { ProductListItem } from "@/types";

async function getProducts(): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    where: {
      status: { in: ["ACTIVE", "SOLD_OUT"] },
    },
  });

  const statusOrder = { ACTIVE: 0, SOLD_OUT: 1 } as const;

  return products
    .map((p) => {
      const withAvail = toProductWithAvailable(p);
      return {
        id: p.id,
        serialNo: p.serialNo,
        name: p.name,
        imageUrl: p.imageUrl,
        price: p.price,
        availableStock: withAvail.availableStock,
        status: p.status as "ACTIVE" | "SOLD_OUT",
        createdAt: p.createdAt,
      };
    })
    .sort((a, b) => {
      const oa = statusOrder[a.status as keyof typeof statusOrder] ?? 1;
      const ob = statusOrder[b.status as keyof typeof statusOrder] ?? 1;
      if (oa !== ob) return oa - ob;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .map(({ createdAt: _createdAt, ...rest }) => rest);
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBar />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 頁面標題 */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">商品列表</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            共 {products.length} 項商品
          </p>
        </div>

        {/* 商品 Grid */}
        {products.length === 0 ? (
          <EmptyState
            title="目前沒有商品"
            description="代購主尚未上架商品，請稍後再來看看！"
            icon="🛍️"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
