import { getMemberById, findInvitationById } from "./members";
import { render } from "@react-email/render";
import InvitationEmail from "@/emails/InvitationEmail";
import { renderTicketPng } from "./ticket-image";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nctitc.io.vn";

export async function sendInvitationEmail(invitationId: string) {
  try {
    const inv = await findInvitationById(invitationId);
    if (!inv) return false;

    const member = await getMemberById(inv.memberId);
    if (!member || !member.email) return false;

    const html = await render(
      InvitationEmail({
        name: member.name,
        amount: inv.amount || 0,
        invitationCode: inv.code,
        nienKhoa: inv.nienKhoa || undefined,
        phone: member.phone,
        appUrl: `https://nct40.poln.id.vn`,
        type: inv.type === "group" ? "Tập thể" : "Cá nhân",
        shirts: inv.sizes || {},
      })
    );

    const ticketPng = await renderTicketPng({
      name: member.name,
      phone: member.phone,
      nienKhoa: inv.nienKhoa || undefined,
      invitationCode: inv.code,
    });

    const res = await fetch(`${BACKEND_URL}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: [member.email.trim()],
        subject: "Thư mời tham dự Hội ngộ 40 năm NCT",
        html: html,
        from_email: "Thư mời <bantochuc@40namnctru.nctitc.io.vn>",
        attachments: [
          {
            filename: `ve-moi-NCT40-${inv.code}.png`,
            content: ticketPng.toString("base64"),
          },
        ],
      }),
    });

    return res.ok;
  } catch (err) {
    console.error("Failed to send invitation email:", err);
    return false;
  }
}
