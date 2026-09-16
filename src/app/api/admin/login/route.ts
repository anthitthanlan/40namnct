import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, createSessionToken, adminCookieOptions } from "@/lib/auth";
import { authenticateAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    /* bỏ qua - body rỗng */
  }

  const b = body as Record<string, unknown> | null;
  const username = typeof b?.username === "string" ? b.username : "";
  const password = typeof b?.password === "string" ? b.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { ok: false, message: "Vui lòng nhập tên đăng nhập và mật khẩu." },
      { status: 400 },
    );
  }

  const result = await authenticateAdmin(username, password);
  if (!result.ok || !result.admin) {
    return NextResponse.json(
      { ok: false, message: result.message || "Đăng nhập thất bại." },
      { status: 401 },
    );
  }

  const token = createSessionToken({
    id: result.admin.id,
    username: result.admin.username,
    fullName: result.admin.fullName,
    title: result.admin.title,
    role: result.admin.role,
  });

  const res = NextResponse.json({
    ok: true,
    admin: {
      id: result.admin.id,
      username: result.admin.username,
      fullName: result.admin.fullName,
      title: result.admin.title,
      role: result.admin.role,
    },
  });
  res.cookies.set(COOKIE_NAME, token, adminCookieOptions);
  return res;
}
