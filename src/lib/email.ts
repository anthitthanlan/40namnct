import { getMemberById, findInvitationById } from "./members";
import { render } from "@react-email/render";
import InvitationEmail from "@/emails/InvitationEmail";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nctitc.io.vn";

export async function sendInvitationEmail(invitationId: string) {
  try {
    const inv = await findInvitationById(invitationId);
    if (!inv) return false;

    const member = await getMemberById(inv.memberId);
    if (!member || !member.email) return false;

    const html = await render(
      InvitationEmail({
        recipientName: member.name,
        ticketUrl: `https://nct40.poln.id.vn/thu-moi?id=${inv.id}`,
        eventName: "Hội ngộ 40 năm - Kết nối và Lan tỏa",
        eventDate: "Chủ nhật, 15/11/2026 - 08:30 AM",
        eventLocation: "Trường THPT Nguyễn Công Trứ, 97 Quang Trung, Gò Vấp, TP.HCM",
      })
    );

    const res = await fetch(`${BACKEND_URL}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: [member.email.trim()],
        subject: "Thư mời tham dự Hội ngộ 40 năm NCT",
        html: html,
        from_email: "Thư mời <hi@nctitc.io.vn>"
      }),
    });

    return res.ok;
  } catch (err) {
    console.error("Failed to send invitation email:", err);
    return false;
  }
}
