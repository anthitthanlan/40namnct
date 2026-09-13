import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMemberIdFromRequest } from "@/lib/memberAuth";
import { claimPayment, findTicketById } from "@/lib/members";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const memberId = getMemberIdFromRequest(req);
  if (!memberId) {
    return NextResponse.json(
      { ok: false, message: "Vui lòng đăng nhập tài khoản trước." },
      { status: 401 },
    );
  }

  try {
    const { ticketId, sessionId } = (await req.json()) as {
      ticketId: string;
      sessionId?: string;
    };

    if (!ticketId) {
      return NextResponse.json(
        { ok: false, message: "Thiếu mã vé cần xác nhận." },
        { status: 400 },
      );
    }

    const ticket = await findTicketById(ticketId);
    if (!ticket || ticket.memberId !== memberId) {
      return NextResponse.json(
        { ok: false, message: "Vé không tồn tại hoặc không thuộc tài khoản của bạn." },
        { status: 404 },
      );
    }

    const updated = await claimPayment(ticketId, sessionId);
    return NextResponse.json({
      ok: true,
      ticket: updated,
      message:
        "Đã gửi yêu cầu xác nhận chuyển khoản. Ban Tổ chức sẽ duyệt và cấp vé trong vòng 24 giờ!",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Không thể gửi xác nhận lúc này, vui lòng thử lại." },
      { status: 500 },
    );
  }
}
