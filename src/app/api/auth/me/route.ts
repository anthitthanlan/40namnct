import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMemberIdFromRequest } from "@/lib/memberAuth";
import { getMemberById } from "@/lib/members";

export const dynamic = "force-dynamic";

/** Thông tin phiên thành viên hiện tại */
export async function GET(req: NextRequest) {
  const memberId = getMemberIdFromRequest(req);
  if (!memberId) {
    return NextResponse.json({ ok: true, authenticated: false, member: null });
  }
  const member = await getMemberById(memberId);
  if (!member) {
    return NextResponse.json({ ok: true, authenticated: false, member: null });
  }
  return NextResponse.json({
    ok: true,
    authenticated: true,
    member: { name: member.name, phone: member.phone, code: member.code },
  });
}
