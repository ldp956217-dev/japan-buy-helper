/**
 * Prisma Seed Script
 * 執行方式: npm run db:seed
 */
import { PrismaClient, ProductStatus } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  // 使用 SHA-256 + salt 的簡易 hash (production 建議換成 bcrypt)
  const salt = "japan_buy_helper_salt";
  return crypto
    .createHash("sha256")
    .update(password + salt)
    .digest("hex");
}

async function main() {
  console.log("🌱 Starting seed...");

  // ==============================
  // 初始化流水號計數器
  // ==============================
  await prisma.counter.upsert({
    where: { id: "product" },
    update: {},
    create: { id: "product", value: 0 },
  });

  await prisma.counter.upsert({
    where: { id: "reservation" },
    update: {},
    create: { id: "reservation", value: 0 },
  });

  // ==============================
  // Admin 帳號
  // ==============================
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";

  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      passwordHash: hashPassword(adminPassword),
    },
  });
  console.log(`✅ Admin 帳號建立: ${adminUsername} / ${adminPassword}`);

  // ==============================
  // 更新計數器到 3 (for 3 seed products)
  // ==============================
  await prisma.counter.update({
    where: { id: "product" },
    data: { value: 3 },
  });

  // ==============================
  // 種子商品資料
  // ==============================
  const products = [
    {
      id: "seed-product-1",
      serialNo: "P00001",
      name: "DHC 深層卸妝油 200ml",
      imageUrl: "/placeholder-product.svg",
      totalStock: 10,
      reservedStock: 2,
      price: 680,
      cost: 520,
      note: "日本藥妝熱銷卸妝油，溫和不刺激",
      storeName: "松本清",
      status: ProductStatus.ACTIVE,
    },
    {
      id: "seed-product-2",
      serialNo: "P00002",
      name: "樂敦 肌研 極潤玻尿酸化妝水 170ml",
      imageUrl: "/placeholder-product.svg",
      totalStock: 8,
      reservedStock: 8,
      price: 420,
      cost: 300,
      note: "超人氣保濕化妝水，幾乎每次去都搶購一空",
      storeName: "BIC CAMERA",
      status: ProductStatus.ACTIVE,
    },
    {
      id: "seed-product-3",
      serialNo: "P00003",
      name: "明色 Cosmetics 小粉瓶防曬乳 SPF50+ PA++++",
      imageUrl: "/placeholder-product.svg",
      totalStock: 15,
      reservedStock: 3,
      price: 550,
      cost: 390,
      note: "輕薄不油膩，台灣很難買到",
      storeName: "藥妝大國",
      status: ProductStatus.ACTIVE,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }
  console.log(`✅ 種子商品建立完成 (${products.length} 筆)`);

  // ==============================
  // 種子 Guest 資料
  // ==============================
  const guestToken = "seed-guest-token-001";
  const guest = await prisma.guest.upsert({
    where: { guestToken },
    update: {},
    create: {
      guestToken,
      nickname: "小美",
    },
  });

  // ==============================
  // 種子 Reservation 資料
  // ==============================
  await prisma.counter.update({
    where: { id: "reservation" },
    data: { value: 2 },
  });

  await prisma.reservation.upsert({
    where: { id: "seed-reservation-1" },
    update: {},
    create: {
      id: "seed-reservation-1",
      orderNo: "R00001",
      productId: "seed-product-1",
      guestId: guest.id,
      nicknameSnapshot: "小美",
      productNameSnapshot: "DHC 深層卸妝油 200ml",
      quantity: 1,
      unitPrice: 680,
      totalAmount: 680,
      status: "CONFIRMED",
    },
  });

  await prisma.reservation.upsert({
    where: { id: "seed-reservation-2" },
    update: {},
    create: {
      id: "seed-reservation-2",
      orderNo: "R00002",
      productId: "seed-product-3",
      guestId: guest.id,
      nicknameSnapshot: "小美",
      productNameSnapshot: "明色 Cosmetics 小粉瓶防曬乳 SPF50+ PA++++",
      quantity: 1,
      unitPrice: 550,
      totalAmount: 550,
      status: "CONFIRMED",
    },
  });

  console.log(`✅ 種子訂單建立完成`);
  console.log("🎉 Seed 完成！");
  console.log("---");
  console.log(`Admin 登入: ${adminUsername} / ${adminPassword}`);
  console.log(`前台網址: http://localhost:3000`);
  console.log(`後台網址: http://localhost:3000/admin`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
