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

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_API_URL ||
    "https://api.nctitc.io.vn";

  try {
    const res = await fetch(
      `${backendUrl}/api/invitations/search?q=${encodeURIComponent(normalized)}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const data = (await res.json()) as { items?: Array<any> };
      const items = data.items || [];
      
      if (items.length > 0) {
        // Khớp họ tên (không phân biệt hoa thường) nếu có
        const matched = items.filter(
          (item) =>
            !name ||
            item.attendeeName.toLowerCase().trim() === name.toLowerCase() ||
            item.attendeeName.toLowerCase().includes(name.toLowerCase()),
        );

        const listToReturn = matched.length > 0 ? matched : items;
        return NextResponse.json({
          ok: true,
          member: {
            name: listToReturn[0].attendeeName || name,
          },
          invitations: listToReturn,
          isFallback: false,
        });
      } else {
        // Nếu FastAPI trả về rỗng, có thể vé được tạo lúc đang fallback (lưu ở Local DB)
        // Nên ném lỗi để nhảy vào khối catch và tìm ở Local DB
        throw new Error("FastAPI returned empty, trying local DB fallback...");
      }
    }
  } catch (backendErr) {
    console.warn("[TRA_CUU] Backend search empty/failed, falling back to local JSON");
  }

  // Fallback: Tìm thành viên theo SĐT + họ tên (linh hoạt hơn) từ file local
  const members = await listMembers();
  const member = members.find(
    (m) =>
      m.phone === normalized &&
      (m.name.toLowerCase().trim() === name.toLowerCase() ||
       m.name.toLowerCase().includes(name.toLowerCase())),
  );

  if (!member) {
    return NextResponse.json({
      ok: false,
      message:
        "Không tìm thấy thông tin phù hợp. Vui lòng kiểm tra lại họ tên và số điện thoại.",
      isFallback: true,
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
    isFallback: true,
  });
}
