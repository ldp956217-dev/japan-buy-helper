import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn/ui 標準 cn utility */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 格式化日幣金額（成本用） */
export function formatPrice(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

/** 格式化台幣金額（售價用） */
export function formatTWD(amount: number): string {
  return `$${amount.toLocaleString("zh-TW")}`;
}

/** 格式化日期時間 (台灣時區) */
export function formatDateTime(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 產生新的流水號：輸入 counter value（已遞增後），輸出如 P00001 */
export function generateSerialNo(prefix: "P" | "R", value: number): string {
  return `${prefix}${String(value).padStart(5, "0")}`;
}

/** 原子遞增流水號並回傳新值 */
export async function nextSerialNo(
  prisma: import("@prisma/client").PrismaClient,
  type: "product" | "reservation"
): Promise<string> {
  const counter = await prisma.counter.update({
    where: { id: type },
    data: { value: { increment: 1 } },
  });
  const prefix = type === "product" ? "P" : "R";
  return generateSerialNo(prefix, counter.value);
}

/** 計算 available stock */
export function calcAvailableStock(
  totalStock: number,
  reservedStock: number
): number {
  return Math.max(0, totalStock - reservedStock);
}

/** 將 Prisma Product 轉成包含 availableStock 的 plain object */
export function toProductWithAvailable<
  T extends { totalStock: number; reservedStock: number }
>(product: T): T & { availableStock: number } {
  return {
    ...product,
    availableStock: calcAvailableStock(product.totalStock, product.reservedStock),
  };
}
