import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMemberById, listInvitations } from "@/lib/members";

export const dynamic = "force-dynamic";

function removeAccents(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ ok: false, message: "Thiếu ID định danh." }, { status: 400 });
  }

  if (id?.toUpperCase() === "SAMPLE") {
    return NextResponse.json({
      ok: true,
      invitation: {
        code: "NCT19862026-000POLN7",
        amount: 500000,
        status: "pending_payment",
        type: "individual",
        sizes: { L: 1 },
      },
      member: {
        name: "Lại Nhất Phong",
        nienKhoa: "1986 - 1989",
        phone: "0909000900",
      },
      addInfo: "LAI NHAT PHONG 19861989 0909000900",
    });
  }

  if (id?.toUpperCase() === "SAMPLE-GROUP") {
    return NextResponse.json({
      ok: true,
      invitation: {
        code: "NCT19862026-000GROUP",
        amount: 5000000,
        status: "pending_payment",
        type: "group",
        sizes: { S: 0, M: 1, L: 2, XL: 3, XXL: 4 },
      },
      member: {
        name: "Lại Nhất Phong",
        nienKhoa: "1986 - 1989",
        phone: "0909000900",
      },
      addInfo: "LAI NHAT PHONG 19861989 0909000900",
    });
  }

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_API_URL ||
    "https://api.nctitc.io.vn";

  try {
    const res = await fetch(`${backendUrl}/api/invitations/${id}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const inv = await res.json();
      return NextResponse.json({
        ok: true,
        invitation: {
          code: inv.code,
          amount: inv.amount,
          status: inv.status,
          sizes: inv.sizes || {},
          snacks: inv.snacks || 0,
          checkedIn: inv.checkedIn || false,
        },
        member: {
          name: inv.attendeeName || "Thành viên",
          nienKhoa: inv.nienKhoa || "",
          phone: inv.phone || "",
        },
        addInfo: inv.code,
        isFallback: false,
      });
    }
  } catch (backendErr) {
    console.warn("[INVITATION_INFO] Backend fetch failed, falling back to local JSON:", backendErr);
  }

  // Find invitation by id
  const invitations = await listInvitations();
  const invitation = invitations.find(t => t.id === id);
  
  if (!invitation) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy vé." }, { status: 404 });
  }

  const member = await getMemberById(invitation.memberId);
  if (!member) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy thông tin thành viên." }, { status: 404 });
  }

  // Generate addInfo: [Họ Tên Không Dấu] [Niên Khóa] [SĐT]
  const nameUnaccented = removeAccents(member.name).toUpperCase().trim();
  const nienKhoaFormatted = (invitation.nienKhoa || "").replace(/\D/g, "").trim(); // Remove space and dash
  const addInfo = `${nameUnaccented} ${nienKhoaFormatted} ${member.phone}`.trim();

  return NextResponse.json({
    ok: true,
    invitation: {
      code: invitation.code,
      amount: invitation.amount,
      status: invitation.status,
      sizes: invitation.sizes,
      snacks: invitation.snacks,
      checkedIn: invitation.checkedIn,
    },
    member: {
      name: member.name,
      nienKhoa: invitation.nienKhoa,
      phone: member.phone,
    },
    addInfo,
  });
}
