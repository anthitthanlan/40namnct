import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const COOKIE_NAME = "nct_admin";

/** Đổi mật khẩu bằng biến môi trường ADMIN_PASSWORD trước khi chạy thật! */
const DEFAULT_PASSWORD = "nct1986";
const SESSION_CONTEXT = "nct-admin-session-v1";

if (!process.env.ADMIN_PASSWORD) {
  console.warn(
    `[nct-admin] Chưa đặt biến môi trường ADMIN_PASSWORD - đang dùng mật khẩu mặc định "${DEFAULT_PASSWORD}". Hãy đặt ADMIN_PASSWORD trước khi chạy thật!`,
  );
}

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

/** So khớp mật khẩu bằng hằng thời gian, tránh timing attack */
export function verifyPassword(input: string): boolean {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(adminPassword()).digest();
  return timingSafeEqual(a, b);
}

/** Giá trị cookie phiên - HMAC của mật khẩu, tự vô hiệu khi đổi mật khẩu */
export function sessionCookieValue(): string {
  return createHmac("sha256", adminPassword()).update(SESSION_CONTEXT).digest("hex");
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const expected = Buffer.from(sessionCookieValue(), "utf8");
  const actual = Buffer.from(token, "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function isAdminRequest(req: NextRequest): boolean {
  return isValidSessionToken(req.cookies.get(COOKIE_NAME)?.value);
}

/** Kiểm tra phiên admin trong Server Component */
export async function hasAdminCookie(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(COOKIE_NAME)?.value);
}

export function unauthorized(): NextResponse {
  return NextResponse.json(
    { ok: false, message: "Yêu cầu quyền quản trị viên." },
    { status: 401 },
  );
}
