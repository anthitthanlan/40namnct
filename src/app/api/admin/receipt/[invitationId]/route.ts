import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import { findInvitationById } from "@/lib/members";
import { getLocalReceiptBuffer } from "@/lib/r2";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/receipt/[invitationId]
 *
 * Serve ảnh biên lai local cho Admin dashboard (có auth check).
 * Dùng khi R2 chưa cấu hình (dev/test mode).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> },
) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role === "editor") return unauthorized();

  const { invitationId } = await params;

  if (!invitationId) {
    return NextResponse.json({ ok: false, message: "Thiếu invitationId." }, { status: 400 });
  }

  // Kiểm tra invitation tồn tại
  const invitation = await findInvitationById(invitationId);
  if (!invitation) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy vé." }, { status: 404 });
  }

  // Nếu invitation có receiptUrl là R2 URL thực, redirect thẳng
  if (invitation.receiptUrl && invitation.receiptUrl.startsWith("http")) {
    return NextResponse.redirect(invitation.receiptUrl);
  }

  // Fallback: đọc file local
  const local = await getLocalReceiptBuffer(invitationId);
  if (!local) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy ảnh biên lai." },
      { status: 404 },
    );
  }

  return new NextResponse(local.buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": local.mimeType,
      "Content-Length": String(local.buffer.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
