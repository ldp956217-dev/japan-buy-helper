import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toProductWithAvailable, calcAvailableStock } from "@/lib/utils";
import { safeSync } from "@/services/sync";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  totalStock: z.number().int().min(0).optional(),
  price: z.number().int().min(0).optional(),
  cost: z.number().int().min(0).optional(),
  note: z.string().max(300).optional().nullable(),
  storeName: z.string().max(50).optional().nullable(),
  imageUrl: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "SOLD_OUT", "INACTIVE"]).optional(),
});

/** PATCH /api/admin/products/:id */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "資料格式錯誤" },
        { status: 400 }
      );
    }

    const updates = parsed.data;

    // 先查詢現有商品
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "商品不存在" },
        { status: 404 }
      );
    }

    // 若要修改 totalStock，驗證不可低於 reservedStock
    if (updates.totalStock !== undefined) {
      if (updates.totalStock < existing.reservedStock) {
        return NextResponse.json(
          {
            success: false,
            error: `總上架數量不可低於已預定數量 (${existing.reservedStock})`,
          },
          { status: 400 }
        );
      }
    }

    // 計算新的 status（補貨後若有庫存，恢復 ACTIVE）
    let newStatus = updates.status || existing.status;
    const newTotal = updates.totalStock ?? existing.totalStock;
    const newAvailable = calcAvailableStock(newTotal, existing.reservedStock);

    // 若 status 是 SOLD_OUT 且有庫存了，自動恢復 ACTIVE
    if (newStatus === "SOLD_OUT" && newAvailable > 0 && !updates.status) {
      newStatus = "ACTIVE";
    }
    // 若 status 是 ACTIVE 且庫存歸零，設為 SOLD_OUT
    if (newStatus === "ACTIVE" && newAvailable === 0 && !updates.status) {
      newStatus = "SOLD_OUT";
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.totalStock !== undefined && { totalStock: updates.totalStock }),
        ...(updates.price !== undefined && { price: updates.price }),
        ...(updates.cost !== undefined && { cost: updates.cost }),
        ...(updates.note !== undefined && { note: updates.note }),
        ...(updates.storeName !== undefined && { storeName: updates.storeName }),
        ...(updates.imageUrl && { imageUrl: updates.imageUrl }),
        status: newStatus,
      },
    });

    // 非同步同步到 Sheets
    void safeSync((s) =>
      s.syncProductSummary({
        serialNo: product.serialNo,
        name: product.name,
        totalStock: product.totalStock,
        reservedStock: product.reservedStock,
        availableStock: calcAvailableStock(product.totalStock, product.reservedStock),
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
    console.error("[PATCH /api/admin/products/:id]", error);
    return NextResponse.json(
      { success: false, error: "更新商品失敗" },
      { status: 500 }
    );
  }
}

/** DELETE /api/admin/products/:id (軟刪除，改為 INACTIVE) */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    return NextResponse.json({ success: true, data: { id: product.id } });
  } catch (error) {
    console.error("[DELETE /api/admin/products/:id]", error);
    return NextResponse.json(
      { success: false, error: "操作失敗" },
      { status: 500 }
    );
  }
}
