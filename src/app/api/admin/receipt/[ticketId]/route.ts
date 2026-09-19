import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/auth";
import { findTicketById } from "@/lib/members";
import { getLocalReceiptBuffer } from "@/lib/r2";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/receipt/[ticketId]
 *
 * Serve ảnh biên lai local cho Admin dashboard (có auth check).
 * Dùng khi R2 chưa cấu hình (dev/test mode).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  if (!isAdminRequest(req)) return unauthorized();

  const { ticketId } = await params;

  if (!ticketId) {
    return NextResponse.json({ ok: false, message: "Thiếu ticketId." }, { status: 400 });
  }

  // Kiểm tra ticket tồn tại
  const ticket = await findTicketById(ticketId);
  if (!ticket) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy vé." }, { status: 404 });
  }

  // Nếu ticket có receiptUrl là R2 URL thực, redirect thẳng
  if (ticket.receiptUrl && ticket.receiptUrl.startsWith("http")) {
    return NextResponse.redirect(ticket.receiptUrl);
  }

  // Fallback: đọc file local
  const local = await getLocalReceiptBuffer(ticketId);
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
