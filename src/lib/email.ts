import { getMemberById, findInvitationById, updateInvitationDetails } from "./members";
import { render } from "@react-email/render";
import InvitationEmail from "@/emails/InvitationEmail";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nctitc.io.vn";

export type SendInvitationOptions = {
  token?: string;
  adminName?: string;
  adminUsername?: string;
  adminRole?: string;
  logDetail?: string;
  skipLog?: boolean;
};

export async function sendInvitationEmail(
  invitationId: string,
  options?: SendInvitationOptions
): Promise<boolean> {
  try {
    const inv = await findInvitationById(invitationId);
    if (!inv) return false;

    const member = await getMemberById(inv.memberId);
    const email = member?.email || (inv as any).memberEmail;
    if (!email) return false;

    const displayName = inv.attendeeName || member?.name || "Quý khách";

    const html = await render(
      InvitationEmail({
        name: displayName,
        amount: inv.amount || 0,
        invitationId: inv.id,
        nienKhoa: inv.nienKhoa || undefined,
        phone: member?.phone,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || `https://40namnctru.nctitc.io.vn`,
        type: inv.type === "group" ? "Tập thể" : "Cá nhân",
        shirts: inv.sizes || {},
      })
    );

    const res = await fetch(`${BACKEND_URL}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: [email.trim()],
        subject: "Thư mời tham dự Hội ngộ 40 năm NCT",
        html: html,
        from_email: "Thư mời <bantochuc@40namnctru.nctitc.io.vn>",
      }),
    });

    if (res.ok) {
      let token = options?.token;
      if (!token) {
        const { getSystemAdminToken } = await import("./system-auth");
        token = (await getSystemAdminToken()) || undefined;
      }

      if (token) {
        try {
          await updateInvitationDetails(
            inv.id,
            {
              emailSent: true,
              emailSentAt: new Date().toISOString(),
            },
            token
          );
        } catch (err) {
          console.error("[sendInvitationEmail] Lỗi cập nhật trạng thái vé:", err);
        }
      }

      if (!options?.skipLog) {
        try {
          const { logAction } = await import("./action-logs");
          await logAction(
            "send_email",
            "registrations",
            inv.id,
            options?.adminName || "Hệ thống (AI OCR)",
            options?.adminUsername || "system",
            options?.adminRole || "system",
            options?.logDetail || "Tự động gửi email thư mời khi duyệt qua OCR",
            token
          );
        } catch (err) {
          console.error("[sendInvitationEmail] Lỗi ghi log gửi email:", err);
        }
      }
    }

    return res.ok;
  } catch (err) {
    console.error("Failed to send invitation email:", err);
    return false;
  }
}
