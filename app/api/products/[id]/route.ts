import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/products/:id - 取得商品詳情 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product || product.status === "INACTIVE" || product.status === "DRAFT") {
      return NextResponse.json(
        { success: false, error: "商品不存在" },
        { status: 404 }
      );
    }

    const availableStock = Math.max(0, product.totalStock - product.reservedStock);

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        availableStock,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[GET /api/products/:id]", error);
    return NextResponse.json(
      { success: false, error: "取得商品詳情失敗" },
      { status: 500 }
    );
  }
}
