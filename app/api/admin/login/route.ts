import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signAdminToken, getAdminCookieOptions } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/** POST /api/admin/login */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "請輸入帳號與密碼" },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    const admin = await prisma.adminUser.findUnique({
      where: { username },
    });

    if (!admin || admin.passwordHash !== hashPassword(password)) {
      return NextResponse.json(
        { success: false, error: "帳號或密碼錯誤" },
        { status: 401 }
      );
    }

    // 產生 JWT
    const token = await signAdminToken({
      adminId: admin.id,
      username: admin.username,
    });

    // 設定 cookie
    const cookieOptions = getAdminCookieOptions();
    const response = NextResponse.json({ success: true });
    response.cookies.set(cookieOptions.name, token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      maxAge: cookieOptions.maxAge,
      path: cookieOptions.path,
    });

    return response;
  } catch (error) {
    console.error("[POST /api/admin/login]", error);
    return NextResponse.json(
      { success: false, error: "登入失敗" },
      { status: 500 }
    );
  }
}
