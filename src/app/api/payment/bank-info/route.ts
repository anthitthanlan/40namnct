import { NextResponse } from "next/server";
import { getPayBankConfig, buildTransferContent } from "@/lib/emvqr";
import { findTicketById, getMemberById } from "@/lib/members";

export const dynamic = "force-dynamic";

/**
 * GET /api/payment/bank-info?ticketId=xxx
 *
 * Trả về thông tin ngân hàng + nội dung CK cho client render QR động.
 * Không hardcode — đọc từ biến môi trường.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get("ticketId");

  if (!ticketId) {
    return NextResponse.json(
      { ok: false, message: "Thiếu ticketId." },
      { status: 400 },
    );
  }

  // Sample/Dev mode
  if (ticketId === "SAMPLE" || ticketId === "DEV") {
    // Giữ nguyên tài khoản test cho DEV/SAMPLE
    const bank = {
      bin: "970436",
      account: "2772998715",
      accountName: "LAI NHAT PHONG",
      shortName: "Vietcombank",
    };
    return NextResponse.json({
      ok: true,
      bank,
      amount: ticketId === "DEV" ? 20_000 : 500_000,
      addInfo: ticketId === "DEV" ? "DEV AI TEST" : "LAI NHAT PHONG 20052008 0909000900",
      ticketCode: ticketId,
      status: "pending_payment",
    });
  }

  const ticket = await findTicketById(ticketId);
  if (!ticket) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy vé." },
      { status: 404 },
    );
  }

  const member = await getMemberById(ticket.memberId);
  if (!member) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy thông tin đăng ký." },
      { status: 404 },
    );
  }

  const bank = getPayBankConfig();
  const addInfo = buildTransferContent(
    member.name,
    ticket.nienKhoa || "",
    member.phone,
  );

  return NextResponse.json({
    ok: true,
    bank,
    amount: ticket.amount,
    addInfo,
    ticketCode: ticket.code,
    status: ticket.status,
  });
}
