import { NextResponse } from "next/server";
import { getPayBankConfig, buildTransferContent } from "@/lib/emvqr";
import { findInvitationById, getMemberById } from "@/lib/members";

export const dynamic = "force-dynamic";

/**
 * GET /api/payment/bank-info?invitationId=xxx
 *
 * Trả về thông tin ngân hàng + nội dung CK cho client render QR động.
 * Không hardcode — đọc từ biến môi trường.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const invitationId = searchParams.get("invitationId");

  if (!invitationId) {
    return NextResponse.json(
      { ok: false, message: "Thiếu invitationId." },
      { status: 400 },
    );
  }

  // Sample/Dev mode
  if (invitationId === "SAMPLE" || invitationId === "DEV") {
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
      amount: invitationId === "DEV" ? 20_000 : 500_000,
      addInfo: invitationId === "DEV" ? "DEV AI TEST" : "LAI NHAT PHONG 20052008 0909000900",
      invitationCode: invitationId,
      id: invitationId,
      status: "pending_payment",
    });
  }
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_API_URL ||
    "https://api.nctitc.io.vn";

  try {
    const res = await fetch(`${backendUrl}/api/invitations/${invitationId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const inv = (await res.json()) as {
        id: string;
        code: string;
        amount: number;
        status: string;
        attendeeName?: string;
        nienKhoa?: string;
      };
      const bank = getPayBankConfig();
      return NextResponse.json({
        ok: true,
        bank,
        amount: inv.amount,
        addInfo: inv.code,
        invitationCode: inv.code,
        id: inv.id,
        status: inv.status,
        attendeeName: inv.attendeeName,
        isFallback: false,
      });
    }
  } catch (backendErr) {
    console.warn("[BANK_INFO] Backend fetch failed, falling back to local JSON:", backendErr);
  }

  const invitation = await findInvitationById(invitationId);
  if (!invitation) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy vé." },
      { status: 404 },
    );
  }

  const member = await getMemberById(invitation.memberId);
  if (!member) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy thông tin đăng ký." },
      { status: 404 },
    );
  }

  const bank = getPayBankConfig();
  const addInfo = invitation.code;

  return NextResponse.json({
    ok: true,
    bank,
    amount: invitation.amount,
    addInfo,
    invitationCode: invitation.code,
    id: invitation.id,
    status: invitation.status,
    attendeeName: invitation.attendeeName,
    isFallback: true,
  });
}
