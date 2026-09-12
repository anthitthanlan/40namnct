import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  createSessionToken,
  MEMBER_COOKIE,
  memberCookieOptions,
} from "@/lib/memberAuth";
import { createMember, normalizePhone } from "@/lib/members";

export const dynamic = "force-dynamic";

/** Đăng ký tài khoản: tên + SĐT → UUID + mã định danh, tự động đăng nhập */
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

  const name =
    typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const rawPhone =
    typeof body.phone === "string" ? body.phone.trim().slice(0, 24) : "";

  if (name.length < 2) {
    return NextResponse.json(
      { ok: false, message: "Vui lòng nhập họ tên của bạn." },
      { status: 400 },
    );
  }
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return NextResponse.json(
      { ok: false, message: "Số điện thoại không hợp lệ (VD: 0912345678)." },
      { status: 400 },
    );
  }

  const result = await createMember(name, phone);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message },
      { status: 409 },
    );
  }

  const res = NextResponse.json(
    {
      ok: true,
      member: {
        name: result.member.name,
        phone: result.member.phone,
        code: result.member.code,
      },
    },
    { status: 201 },
  );
  res.cookies.set(
    MEMBER_COOKIE,
    createSessionToken(result.member.id),
    memberCookieOptions,
  );
  return res;
}
