import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import { deleteInvitation } from "@/lib/members";
import { logAction } from "@/lib/action-logs";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role === "editor") return unauthorized();

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, message: "ID không hợp lệ." }, { status: 400 });
  }

  const success = await deleteInvitation(id);
  if (!success) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy vé để xóa." }, { status: 404 });
  }

  await logAction(
    "delete_invitation",
    "registrations",
    id,
    admin.fullName || admin.username,
    admin.username,
    admin.role,
    `Admin đã xóa vé ${id}`
  );

  return NextResponse.json({ ok: true, message: "Đã xóa vé." });
}
