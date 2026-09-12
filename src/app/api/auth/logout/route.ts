import { NextResponse } from "next/server";
import { MEMBER_COOKIE } from "@/lib/memberAuth";

export const dynamic = "force-dynamic";

/** Đăng xuất thành viên - xoá cookie phiên */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MEMBER_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
