import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toProductWithAvailable } from "@/lib/utils";

/** GET /api/products - 取得前台商品列表 */
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: { in: ["ACTIVE", "SOLD_OUT"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        serialNo: true,
        name: true,
        imageUrl: true,
        totalStock: true,
        reservedStock: true,
        price: true,
        status: true,
      },
    });

    const result = products.map((p) => {
      const available = Math.max(0, p.totalStock - p.reservedStock);
      return {
        id: p.id,
        serialNo: p.serialNo,
        name: p.name,
        imageUrl: p.imageUrl,
        price: p.price,
        availableStock: available,
        status: p.status,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json(
      { success: false, error: "取得商品列表失敗" },
      { status: 500 }
    );
  }
}
