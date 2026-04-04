/**
 * 商品詳情頁 + 預定功能（Client 互動部分）
 */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toProductWithAvailable } from "@/lib/utils";
import { HeaderBar } from "@/components/public/HeaderBar";
import { ProductDetailClient } from "./ProductDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product || product.status === "INACTIVE" || product.status === "DRAFT") {
    return null;
  }

  return toProductWithAvailable(product);
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  // 序列化（避免 Date 物件傳到 client）
  const productData = {
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBar />
      <ProductDetailClient product={productData} />
    </div>
  );
}
