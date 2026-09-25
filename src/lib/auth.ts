import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { AdminRole } from "./admin";

export const COOKIE_NAME = "nct_admin";

const SESSION_CONTEXT = "nct-admin-session-v2";

/** Secret dùng ký session token - lấy từ biến môi trường */
function secret(): string {
  return process.env.SUPER_ADMIN_PASSWORD || "";
}

// ============================================================
// Session token: base64url(JSON {id, role, exp}).HMAC
// ============================================================

function sign(payload: string): string {
  return createHmac("sha256", `${secret()}.${SESSION_CONTEXT}`)
    .update(payload)
    .digest("base64url");
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

export type AdminSession = {
  id: string;
  username: string;
  fullName: string;
  title: string;
  role: AdminRole;
};

/** Tạo session token chứa ID và role */
export function createSessionToken(admin: AdminSession): string {
  const payload = Buffer.from(
    JSON.stringify({
      id: admin.id,
      username: admin.username,
      fullName: admin.fullName,
      title: admin.title,
      role: admin.role,
      exp: Date.now() + SEVEN_DAYS_MS,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Đọc và xác thực session token, trả về thông tin admin */
export function readSessionToken(
  token: string | undefined,
): AdminSession | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = Buffer.from(sign(payload), "utf8");
  const actual = Buffer.from(sig, "utf8");
  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as {
      id?: unknown;
      username?: unknown;
      fullName?: unknown;
      title?: unknown;
      role?: unknown;
      exp?: unknown;
    };
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.role !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    if (Date.now() > parsed.exp) return null;
    return {
      id: parsed.id,
      username: (parsed.username as string) || "",
      fullName: (parsed.fullName as string) || "",
      title: (parsed.title as string) || "",
      role: parsed.role as AdminRole,
    };
  } catch {
    return null;
  }
}

/** Lấy thông tin admin từ cookie trong request */
export function getAdminFromRequest(req: NextRequest): AdminSession | null {
  return readSessionToken(req.cookies.get(COOKIE_NAME)?.value);
}

/** Kiểm tra request có phải admin hợp lệ */
export function isAdminRequest(req: NextRequest): boolean {
  return getAdminFromRequest(req) !== null;
}

/** Kiểm tra phiên admin trong Server Component */
export async function getAdminFromCookies(): Promise<AdminSession | null> {
  const store = await cookies();
  return readSessionToken(store.get(COOKIE_NAME)?.value);
}

/** Backward-compat: kiểm tra có cookie admin hợp lệ */
export async function hasAdminCookie(): Promise<boolean> {
  return (await getAdminFromCookies()) !== null;
}

export const adminCookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SEVEN_DAYS_SECONDS,
};

export function unauthorized(): NextResponse {
  return NextResponse.json(
    { ok: false, message: "Yêu cầu quyền quản trị viên." },
    { status: 401 },
  );
}
