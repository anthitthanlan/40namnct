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

  const attendees: { name: string; isLeader?: boolean; size?: string }[] = [];
  if (type === "group" && Array.isArray(body.attendees)) {
    for (const a of body.attendees) {
      if (typeof a === "object" && a !== null && typeof (a as any).name === "string") {
        const cleanName = (a as any).name.trim().slice(0, 80);
        if (cleanName) {
          attendees.push({
            name: cleanName,
            isLeader: Boolean((a as any).isLeader),
            size: typeof (a as any).size === "string" ? (a as any).size : undefined,
          });
        }
      }
    }
  }

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_API_URL ||
    "https://api.nctitc.io.vn";

  let invitationCode = "";
  let invitationId = "";
  let isFallback = false;
  const forceNewInvitation = !!body.forceNewInvitation;

  try {
    let memberId = "";
    const { findMemberByPhone } = await import("@/lib/members");

    if (forceNewInvitation) {
      const existing = await findMemberByPhone(phone);
      if (existing) {
        memberId = existing.id;
      }
    }

    if (!memberId) {
      // 1. Tạo Member trên Backend Server (FastAPI)
      const memberRes = await fetch(`${backendUrl}/api/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email }),
      });

      if (!memberRes.ok) {
        const errData = (await memberRes.json().catch(() => ({}))) as { detail?: string };
        const msg = errData?.detail?.toLowerCase() || "";
        if (msg.includes("đã tồn tại") || msg.includes("already exist") || msg.includes("số điện thoại đã")) {
          return NextResponse.json(
            { ok: false, existingMember: true, message: "Số điện thoại đã được đăng ký." },
            { status: 409 },
          );
        }
        if (memberRes.status < 500) {
          return NextResponse.json(
            { ok: false, message: errData?.detail || "Không thể tạo thông tin thành viên trên server." },
            { status: memberRes.status },
          );
        }
        throw new Error(errData?.detail || "Không thể tạo thông tin thành viên trên server.");
      }

      const memberData = (await memberRes.json()) as { id: string };
      memberId = memberData.id;
    }

    // 2. Tạo Invitation trên Backend Server (FastAPI)
    const invRes = await fetch(`${backendUrl}/api/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: memberId,
        attendeeName: name,
        nienKhoa,
        type,
        size,
        quantity,
        sizes,
        snacks: comboCount,
        amount: comboCount * 500000,
        note: finalNote,
        attendees,
      }),
    });

    if (!invRes.ok) {
      const errData = (await invRes.json().catch(() => ({}))) as { detail?: string };
      // Nếu backend từ chối có chủ đích (ví dụ: hết suất đăng ký 400), trả về ngay thông báo rõ ràng cho client
      if (invRes.status < 500) {
        return NextResponse.json(
          { ok: false, message: errData?.detail || "Không thể tạo thư mời trên server." },
          { status: invRes.status },
        );
      }
      throw new Error(errData?.detail || "Không thể tạo thư mời trên server.");
    }

    const invData = (await invRes.json()) as { id: string; code: string };
    invitationId = invData.id;
    invitationCode = invData.code;
  } catch (backendErr: unknown) {
    console.warn("[BACKEND_API_FALLBACK] Backend error, attempting local fallback:", backendErr);
    isFallback = true;

    // Fallback local file nếu backend không khả dụng
    let fallbackMemberId = "";
    if (forceNewInvitation) {
      const { findMemberByPhone } = await import("@/lib/members");
      const existing = await findMemberByPhone(phone);
      if (existing) {
        fallbackMemberId = existing.id;
      }
    }

    if (!fallbackMemberId) {
      const { createMember } = await import("@/lib/members");
      const memberResult = await createMember(name, phone, email);
      if (!memberResult.ok) {
        const msg = memberResult.message.toLowerCase();
        if (msg.includes("tồn tại") || msg.includes("đã được đăng ký") || msg.includes("already exist")) {
          return NextResponse.json(
            { ok: false, existingMember: true, message: "Số điện thoại đã được đăng ký.", isFallback },
            { status: 409 },
          );
        }
        return NextResponse.json(
          { ok: false, message: memberResult.message, isFallback },
          { status: 409 },
        );
      }
      fallbackMemberId = memberResult.member.id;
    }

    try {
      const { createInvitation } = await import("@/lib/members");
      const invitation = await createInvitation(fallbackMemberId, {
        type,
        nienKhoa,
        attendeeName: name,
        size,
        quantity,
        sizes,
        snacks: comboCount,
        note: finalNote,
        attendees,
      });

      invitationId = invitation.id;
      invitationCode = invitation.code;
    } catch (fallbackInvErr: any) {
      console.error("[FALLBACK_INVITATION_FAILED]:", fallbackInvErr);
      return NextResponse.json(
        {
          ok: false,
          message: fallbackInvErr?.message || "Hệ thống đang quá tải hoặc đã hết suất đăng ký. Vui lòng thử lại sau.",
          isFallback,
        },
        { status: 500 },
      );
    }
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
