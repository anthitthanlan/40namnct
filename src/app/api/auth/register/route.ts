import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMember, createInvitation, normalizePhone, SIZES, type Size } from "@/lib/members";

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
      const allowedKeys: string[] = [
        ...SIZES,
        ...["Nam", "Nữ"].flatMap((g) => SIZES.map((s) => `${g}-${s}`)),
      ];
      if (!allowedKeys.includes(rawSize)) {
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
      const allowedKeys: string[] = [
        ...SIZES,
        ...["Nam", "Nữ"].flatMap((g) => SIZES.map((s) => `${g}-${s}`)),
      ];
      for (const s of allowedKeys) {
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

  const lop = typeof body.lop === "string" ? body.lop.trim().slice(0, 50) : "";
  const userNote = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";
  const finalNote = [lop ? `Lớp: ${lop}` : "", userNote ? `Lời nhắn: ${userNote}` : ""].filter(Boolean).join(" | ");

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_API_URL ||
    "https://api.nctitc.io.vn";

  let invitationCode = "";
  let invitationId = "";
  let isFallback = false;

  try {
    // 1. Tạo Member trên Backend Server (FastAPI)
    const memberRes = await fetch(`${backendUrl}/api/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email }),
    });

    if (!memberRes.ok) {
      const errData = (await memberRes.json().catch(() => ({}))) as { detail?: string };
      throw new Error(errData?.detail || "Không thể tạo thông tin thành viên trên server.");
    }

    const memberData = (await memberRes.json()) as { id: string };

    // 2. Tạo Invitation trên Backend Server (FastAPI)
    const invRes = await fetch(`${backendUrl}/api/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: memberData.id,
        attendeeName: name,
        nienKhoa,
        type,
        size,
        quantity,
        sizes,
        snacks: comboCount,
        amount: comboCount * 500000,
        note: finalNote,
      }),
    });

    if (!invRes.ok) {
      const errData = (await invRes.json().catch(() => ({}))) as { detail?: string };
      throw new Error(errData?.detail || "Không thể tạo thư mời trên server.");
    }

    const invData = (await invRes.json()) as { id: string; code: string };
    invitationId = invData.id;
    invitationCode = invData.code;
  } catch (backendErr: unknown) {
    console.warn("[BACKEND_API_FALLBACK] Backend error, attempting local fallback:", backendErr);
    isFallback = true;

    // Fallback local file nếu backend không khả dụng
    const memberResult = await createMember(name, phone, email);
    if (!memberResult.ok) {
      return NextResponse.json(
        { ok: false, message: memberResult.message, isFallback },
        { status: 409 },
      );
    }

    const invitation = await createInvitation(memberResult.member.id, {
      type,
      nienKhoa,
      attendeeName: name,
      size,
      quantity,
      sizes,
      snacks: comboCount,
      note: finalNote,
    });

    invitationId = invitation.id;
    invitationCode = invitation.code;
  }

  return NextResponse.json(
    {
      ok: true,
      invitationCode,
      invitationId,
      isFallback,
    },
    { status: 201 },
  );
}
