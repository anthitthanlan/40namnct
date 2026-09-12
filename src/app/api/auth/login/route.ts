import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  createSessionToken,
  MEMBER_COOKIE,
  memberCookieOptions,
} from "@/lib/memberAuth";
import { normalizePhone, verifyMemberLogin } from "@/lib/members";

export const dynamic = "force-dynamic";

/** Đăng nhập thành viên: SĐT + mã định danh */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  const rawPhone =
    typeof body.phone === "string" ? body.phone.trim().slice(0, 24) : "";
  const code =
    typeof body.code === "string" ? body.code.trim().slice(0, 24) : "";

  const phone = normalizePhone(rawPhone);
  if (!phone || !code) {
    return NextResponse.json(
      { ok: false, message: "Vui lòng nhập số điện thoại và mã định danh." },
      { status: 400 },
    );
  }

  const member = await verifyMemberLogin(phone, code);
  if (!member) {
    return NextResponse.json(
      { ok: false, message: "Số điện thoại hoặc mã định danh không đúng." },
      { status: 401 },
    );
  }

  const res = NextResponse.json({
    ok: true,
    member: { name: member.name, phone: member.phone, code: member.code },
  });
  res.cookies.set(
    MEMBER_COOKIE,
    createSessionToken(member.id),
    memberCookieOptions,
  );
  return res;
}
