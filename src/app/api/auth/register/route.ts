import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMember, createTicket, normalizePhone, SIZES, type Size } from "@/lib/members";

export const dynamic = "force-dynamic";

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
  const email =
    typeof body.email === "string" ? body.email.trim().slice(0, 120) : "";
  const type = body.type === "group" ? "group" : "individual";

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
  if (email && !email.includes("@")) {
    return NextResponse.json(
      { ok: false, message: "Email không hợp lệ." },
      { status: 400 },
    );
  }

  // --- Validate type-specific fields ---
  let size: Size | null = null;
  let quantity = 1;
  let comboCount = 0;
  const sizes: Record<string, number> = {};

  if (type === "individual") {
    const rawSize = typeof body.size === "string" ? body.size : null;
    if (rawSize) {
      if (!SIZES.includes(rawSize as Size)) {
        return NextResponse.json(
          { ok: false, message: "Size áo không hợp lệ." },
          { status: 400 },
        );
      }
      size = rawSize as Size;
      comboCount = 1;
    }
  } else {
    // Group
    quantity = typeof body.quantity === "number" ? Math.floor(body.quantity) : 1;
    if (quantity < 1 || quantity > 500) {
      return NextResponse.json(
        { ok: false, message: "Số lượng tham gia nhóm phải từ 1 đến 500." },
        { status: 400 },
      );
    }
    comboCount = typeof body.comboCount === "number" ? Math.floor(body.comboCount) : 0;
    if (comboCount < 0 || comboCount > quantity) {
      return NextResponse.json(
        { ok: false, message: "Số lượng Combo không được vượt quá số người tham gia." },
        { status: 400 },
      );
    }
    if (comboCount > 0) {
      const rawSizes = typeof body.sizes === "object" && body.sizes !== null ? (body.sizes as Record<string, unknown>) : {};
      let totalSizeCount = 0;
      for (const s of SIZES) {
        const c = typeof rawSizes[s] === "number" ? Math.floor(rawSizes[s] as number) : 0;
        if (c > 0) {
          sizes[s] = c;
          totalSizeCount += c;
        }
      }
      if (totalSizeCount !== comboCount) {
        return NextResponse.json(
          { ok: false, message: `Vui lòng phân bổ chính xác ${comboCount} áo vào các size.` },
          { status: 400 },
        );
      }
    }
  }

  const nienKhoa =
    typeof body.nienKhoa === "string" ? body.nienKhoa.trim().slice(0, 50) : "";

  // --- 1. Tạo Member ---
  const memberResult = await createMember(name, phone, email);
  if (!memberResult.ok) {
    return NextResponse.json(
      { ok: false, message: memberResult.message },
      { status: 409 },
    );
  }

  // --- 2. Tạo Ticket (chứa combo) ---
  const ticket = await createTicket(memberResult.member.id, {
    type,
    nienKhoa,
    attendeeName: name,
    size,
    quantity,
    sizes,
    snacks: comboCount,
    note: "", // có thể thêm field note nếu cần, tạm để trống
  });

  return NextResponse.json(
    {
      ok: true,
      ticketCode: ticket.code, // Trả về ticketCode cho UI (nếu cần)
      ticketId: ticket.id,     // Trả về UUID để dùng làm index trên URL
      memberCode: memberResult.member.code,
    },
    { status: 201 },
  );
}
