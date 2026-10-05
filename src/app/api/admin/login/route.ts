import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, adminCookieOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nctitc.io.vn";

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

  try {
    const apiRes = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!apiRes.ok) {
      return NextResponse.json(
        { ok: false, message: "Đăng nhập thất bại." },
        { status: 401 },
      );
    }

    const data = await apiRes.json();
    const token = data.access_token;
    if (!token) {
      return NextResponse.json(
        { ok: false, message: "Lỗi phản hồi từ máy chủ." },
        { status: 500 },
      );
    }

    const res = NextResponse.json({
      ok: true,
      admin: data.admin || {
        id: username,
        username,
        role: "editor",
      },
    });
    res.cookies.set(COOKIE_NAME, token, adminCookieOptions);
    return res;
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: "Lỗi kết nối máy chủ." },
      { status: 500 },
    );
  }
}
