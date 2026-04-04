/**
 * 後台編輯商品頁
 */
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { toProductWithAvailable } from "@/lib/utils";
import { EditProductClient } from "./EditProductClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return null;
  return toProductWithAvailable(product);
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const productData = {
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  return <EditProductClient product={productData} />;
}
