import { Resend } from "resend";
import { render } from "@react-email/render";
import InvitationEmail from "@/emails/InvitationEmail";

// Vui lòng thêm RESEND_API_KEY=re_xxxxxxxxx vào file .env.local của bạn
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Chưa cấu hình RESEND_API_KEY. Email bị bỏ qua.");
    return { ok: false, error: "Missing RESEND_API_KEY" };
  }

  try {
    const data = await resend.emails.send({
      // Đã verify domain thành công
      from: "Ban Tổ chức NCT <no-reply@40namnctru.nctitc.io.vn>",
      to,
      subject,
      html,
    });

    return { ok: true, data };
  } catch (error) {
    console.error("Gửi email thất bại:", error);
    return { ok: false, error: (error as Error).message };
  }
}

export async function sendInvitationEmail({
  to,
  name,
  amount,
  invitationCode,
}: {
  to: string;
  name: string;
  amount: number;
  invitationCode: string;
}) {
  const html = await render(
    InvitationEmail({
      name,
      amount,
      invitationCode,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://nctitc.io.vn",
    })
  );

  return sendEmail({
    to,
    subject: "Xác nhận đóng góp & Thiệp mời Lễ Kỷ niệm 40 năm THPT Nguyễn Công Trứ",
    html,
  });
}
