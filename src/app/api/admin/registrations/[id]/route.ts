import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import { deleteInvitation } from "@/lib/members";
import { logAction } from "@/lib/action-logs";
import { sendInvitationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role === "editor") return unauthorized();

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { ok: false, message: "Thiếu id thư mời." },
      { status: 400 }
    );
  }

  const token = req.cookies.get("nct_admin")?.value;
  const success = await deleteInvitation(id, token);
  if (!success) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy thư mời để xóa hoặc lỗi xác thực." },
      { status: 404 }
    );
  }

  await logAction(
    "delete_invitation",
    "registrations",
    id,
    admin.fullName || admin.username,
    admin.username,
    admin.role,
    "Đã xoá thư mời"
  );

  return NextResponse.json({ ok: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role === "editor") return unauthorized();

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { ok: false, message: "Thiếu id thư mời." },
      { status: 400 }
    );
  }

  const success = await sendInvitationEmail(id);
  
  if (success) {
    await logAction(
      "update_status",
      "registrations",
      id,
      admin.fullName || admin.username,
      admin.username,
      admin.role,
      "Gửi email thư mời thủ công"
    );
    return NextResponse.json({ ok: true });
  } else {
    return NextResponse.json(
      { ok: false, message: "Gửi email thất bại. Hãy kiểm tra địa chỉ email." },
      { status: 500 }
    );
  }
}
