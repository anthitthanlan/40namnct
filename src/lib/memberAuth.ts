import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const MEMBER_COOKIE = "nct_member";
const SESSION_CONTEXT = "nct-member-session-v1";
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;
const THIRTY_DAYS_MS = THIRTY_DAYS_SECONDS * 1000;

/** Secret phiên thành viên - xoay cùng lúc với ADMIN_PASSWORD */
function secret(): string {
  return process.env.ADMIN_PASSWORD || "nct1986";
}

function sign(payload: string): string {
  return createHmac("sha256", `${secret()}.${SESSION_CONTEXT}`)
    .update(payload)
    .digest("base64url");
}

/** Token dạng: payload(base64url JSON {id, exp}).signature(HMAC) */
export function createSessionToken(memberId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ id: memberId, exp: Date.now() + THIRTY_DAYS_MS }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Trả về memberId nếu token hợp lệ và còn hạn, ngược lại null */
export function readSessionToken(token: string | undefined): string | null {
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
    ) as { id?: unknown; exp?: unknown };
    if (typeof parsed.id !== "string" || typeof parsed.exp !== "number") {
      return null;
    }
    if (Date.now() > parsed.exp) return null;
    return parsed.id;
  } catch {
    return null;
  }
}

export function getMemberIdFromRequest(req: NextRequest): string | null {
  return readSessionToken(req.cookies.get(MEMBER_COOKIE)?.value);
}

/** Dùng trong Server Component (cookies() của next/headers) */
export async function getMemberIdFromCookies(): Promise<string | null> {
  const store = await cookies();
  return readSessionToken(store.get(MEMBER_COOKIE)?.value);
}

export const memberCookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  path: "/",
  maxAge: THIRTY_DAYS_SECONDS,
};
