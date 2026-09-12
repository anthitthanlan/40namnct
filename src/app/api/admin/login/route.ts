import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, sessionCookieValue, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SEVEN_DAYS = 60 * 60 * 24 * 7;

export async function POST(req: NextRequest) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    /* bỏ qua - body rỗng */
  }
  const password =
    typeof body === "object" &&
    body !== null &&
    typeof (body as Record<string, unknown>).password === "string"
      ? ((body as Record<string, unknown>).password as string)
      : "";

  if (!password || !verifyPassword(password)) {
    return NextResponse.json(
      { ok: false, message: "Mật khẩu quản trị không đúng." },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, sessionCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS,
  });
  return res;
}
