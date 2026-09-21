import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizePhone, listMembers, listInvitations } from "@/lib/members";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    /* body rỗng */
  }

  const b = body as Record<string, unknown> | null;
  const name = typeof b?.name === "string" ? b.name.trim() : "";
  const phone = typeof b?.phone === "string" ? b.phone.trim() : "";

  if (!name || name.length < 2) {
    return NextResponse.json(
      { ok: false, message: "Vui lòng nhập họ tên (ít nhất 2 ký tự)." },
      { status: 400 },
    );
  }

  if (!phone) {
    return NextResponse.json(
      { ok: false, message: "Vui lòng nhập số điện thoại." },
      { status: 400 },
    );
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return NextResponse.json(
      { ok: false, message: "Số điện thoại không hợp lệ." },
      { status: 400 },
    );
  }

  // Tìm thành viên theo SĐT + họ tên
  const members = await listMembers();
  const member = members.find(
    (m) =>
      m.phone === normalized &&
      m.name.toLowerCase().trim() === name.toLowerCase(),
  );

  if (!member) {
    return NextResponse.json({
      ok: false,
      message:
        "Không tìm thấy thông tin phù hợp. Vui lòng kiểm tra lại họ tên và số điện thoại.",
    });
  }

  // Lấy danh sách vé của thành viên
  const allInvitations = await listInvitations();
  const memberInvitations = allInvitations
    .filter((t) => t.memberId === member.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((t) => ({
      id: t.id,
      code: t.code,
      type: t.type,
      attendeeName: t.attendeeName,
      quantity: t.quantity,
      sizes: t.sizes,
      amount: t.amount,
      status: t.status,
      note: t.note,
      checkedIn: t.checkedIn,
      createdAt: t.createdAt,
    }));

  return NextResponse.json({
    ok: true,
    member: {
      name: member.name,
    },
    invitations: memberInvitations,
  });
}
