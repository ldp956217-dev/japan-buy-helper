import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextSerialNo, toProductWithAvailable } from "@/lib/utils";
import { safeSync } from "@/services/sync";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  totalStock: z.number().int().min(1),
  price: z.number().int().min(0),
  cost: z.number().int().min(0).default(0),
  note: z.string().max(300).optional(),
  storeName: z.string().max(50).optional(),
  imageUrl: z.string().optional(),
});

/** GET /api/admin/products */
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: products.map((p) => toProductWithAvailable(p)),
    });
  } catch (error) {
    console.error("[GET /api/admin/products]", error);
    return NextResponse.json({ success: false, error: "取得商品失敗" }, { status: 500 });
  }
}

/** POST /api/admin/products - 新增商品 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "資料格式錯誤" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 取得流水號（在 transaction 外，因為 serial 是獨立 counter）
    const serialNo = await nextSerialNo(prisma, "product");

    const product = await prisma.product.create({
      data: {
        serialNo,
        name: data.name,
        imageUrl: data.imageUrl || "",
        totalStock: data.totalStock,
        reservedStock: 0,
        price: data.price,
        cost: data.cost,
        note: data.note,
        storeName: data.storeName,
        status: "ACTIVE",
      },
    });

    // 非同步同步到 Sheets
    const available = product.totalStock - product.reservedStock;
    void safeSync((s) =>
      s.syncProductSummary({
        serialNo: product.serialNo,
        name: product.name,
        totalStock: product.totalStock,
        reservedStock: product.reservedStock,
        availableStock: available,
        price: product.price,
        cost: product.cost,
        status: product.status,
        updatedAt: product.updatedAt.toISOString(),
      })
    );

    return NextResponse.json({
      success: true,
      data: toProductWithAvailable(product),
    });
  } catch (error) {
    console.error("[POST /api/admin/products]", error);
    return NextResponse.json({ success: false, error: "新增商品失敗" }, { status: 500 });
  }
}
