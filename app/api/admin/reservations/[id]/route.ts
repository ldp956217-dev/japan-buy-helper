import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { calcAvailableStock } from "@/lib/utils";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!reservation) {
      return NextResponse.json({ success: false, error: "訂單不存在" }, { status: 404 });
    }
    if (reservation.status === "CANCELLED") {
      return NextResponse.json({ success: false, error: "訂單已取消" }, { status: 400 });
    }

    // Transaction: cancel reservation + restore stock
    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      const updatedProduct = await tx.product.update({
        where: { id: reservation.productId },
        data: { reservedStock: { decrement: reservation.quantity } },
      });

      // If product was SOLD_OUT and now has stock, set to ACTIVE
      const newAvailable = calcAvailableStock(updatedProduct.totalStock, updatedProduct.reservedStock);
      if (updatedProduct.status === "SOLD_OUT" && newAvailable > 0) {
        await tx.product.update({
          where: { id: reservation.productId },
          data: { status: "ACTIVE" },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/reservations/:id]", error);
    return NextResponse.json({ success: false, error: "操作失敗" }, { status: 500 });
  }
}
