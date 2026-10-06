import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { AdminRole } from "./admin";

export const COOKIE_NAME = "nct_admin";
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

export type AdminSession = {
  id: string;
  username: string;
  fullName: string;
  title: string;
  role: AdminRole;
};

export function readSessionToken(
  token: string | undefined,
): AdminSession | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  
  try {
    const payload = parts[1];
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    
    // Check expiration if available
    if (parsed.exp && Date.now() >= parsed.exp * 1000) {
      return null;
    }
    
    return {
      id: parsed.sub || parsed.id || "",
      username: parsed.username || "",
      fullName: parsed.fullName || parsed.username || "",
      title: parsed.title || "",
      role: (parsed.role as AdminRole) || "admin",
    };
  } catch {
    return null;
  }
}

export function getAdminFromRequest(req: NextRequest): AdminSession | null {
  return readSessionToken(req.cookies.get(COOKIE_NAME)?.value);
}

export function isAdminRequest(req: NextRequest): boolean {
  return getAdminFromRequest(req) !== null;
}

export async function getAdminFromCookies(): Promise<AdminSession | null> {
  const store = await cookies();
  return readSessionToken(store.get(COOKIE_NAME)?.value);
}

export async function hasAdminCookie(): Promise<boolean> {
  return (await getAdminFromCookies()) !== null;
}

export const adminCookieOptions = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
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
