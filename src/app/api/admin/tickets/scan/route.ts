import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { checkInTicket, findTicketById } from "@/lib/members";
import { verifyDynamicTicketPayload } from "@/lib/ticket-view";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role === "editor") {
    return NextResponse.json(
      { ok: false, message: "Yêu cầu quyền Quản trị viên." },
      { status: 401 },
    );
  }

  try {
    const { payload } = (await req.json()) as { payload?: string };
    if (!payload || typeof payload !== "string") {
      return NextResponse.json(
        { ok: false, message: "Dữ liệu mã QR trống hoặc không hợp lệ." },
        { status: 400 },
      );
    }

    // Xác minh chữ ký bảo mật và thời hạn 30s của mã QR động
    const verification = verifyDynamicTicketPayload(payload);
    if (!verification.valid || !verification.ticketId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            verification.message ||
            "Mã QR không hợp lệ hoặc đã hết hạn 30 giây.",
        },
        { status: 400 },
      );
    }

    const existingTicket = await findTicketById(verification.ticketId);
    if (!existingTicket) {
      return NextResponse.json(
        { ok: false, message: "Không tìm thấy thông tin vé trong hệ thống." },
        { status: 404 },
      );
    }

    const checkInResult = await checkInTicket(verification.ticketId);
    if (!checkInResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          ticket: existingTicket,
          message: checkInResult.message,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      ticket: checkInResult.ticket,
      message: `Quét vé thành công! Đã duyệt vào cổng: ${existingTicket.attendeeName || existingTicket.code}`,
    });
  } catch (err) {
    console.error("Lỗi quét vé:", err);
    return NextResponse.json(
      { ok: false, message: "Có lỗi khi xử lý quét vé." },
      { status: 500 },
    );
  }
}
