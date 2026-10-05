import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized, COOKIE_NAME } from "@/lib/auth";
import { logAction } from "@/lib/action-logs";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

type Recipient = {
  name?: string;
  email: string;
};

type SendEmailPayload = {
  recipients: Recipient[];
  subject: string;
  content: string;
  fromName?: string;
  fromEmail?: string;
};

function formatEmailHtml(content: string, recipientName: string, recipientEmail: string): string {
  const safeName = recipientName?.trim() || "Quý Thầy Cô / Cựu học sinh / Quý Khách";
  
  // Replace placeholders like {name}, {ten}, {email}
  let personalizedContent = content
    .replace(/\{name\}/gi, safeName)
    .replace(/\{ten\}/gi, safeName)
    .replace(/\{email\}/gi, recipientEmail);

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lễ Kỷ Niệm 40 Năm THPT Nguyễn Công Trứ</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 30px 15px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header-badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.18);
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 10px;
      border: 1px solid rgba(255, 255, 255, 0.25);
    }
    .header-title {
      font-size: 20px;
      font-weight: 800;
      margin: 0 0 6px 0;
      letter-spacing: -0.5px;
    }
    .header-sub {
      font-size: 13px;
      margin: 0;
      opacity: 0.9;
      font-weight: 500;
    }
    .content {
      padding: 32px 28px;
      font-size: 15px;
      line-height: 1.7;
      color: #334155;
    }
    .content h1, .content h2, .content h3 {
      color: #0f172a;
      margin-top: 1.2em;
      margin-bottom: 0.5em;
    }
    .content p {
      margin-top: 0;
      margin-bottom: 1em;
    }
    .content a {
      color: #1d4ed8;
      text-decoration: underline;
      font-weight: 600;
    }
    .content img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      margin: 16px 0;
    }
    .content blockquote {
      border-left: 4px solid #1d4ed8;
      padding-left: 16px;
      margin: 16px 0;
      color: #475569;
      font-style: italic;
      background: #f8fafc;
      padding-top: 8px;
      padding-bottom: 8px;
      border-radius: 0 8px 8px 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 28px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer-brand {
      font-weight: 700;
      color: #334155;
      font-size: 13px;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-badge">1986 — 2026</div>
        <h1 class="header-title">TRƯỜNG THPT NGUYỄN CÔNG TRỨ</h1>
        <p class="header-sub">Kỷ Niệm 40 Năm Thành Lập Trường</p>
      </div>
      <div class="content">
        ${personalizedContent}
      </div>
      <div class="footer">
        <div class="footer-brand">Ban Tổ Chức Lễ Kỷ Niệm 40 Năm THPT Nguyễn Công Trứ</div>
        <div>Cổng thông tin & Thư mời kỷ niệm 40 năm thành lập trường</div>
        <div style="margin-top: 8px; font-size: 11px; color: #94a3b8;">
          Email được gửi tới: <strong>${recipientEmail}</strong>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role === "editor") return unauthorized();

  let body: SendEmailPayload;
  try {
    body = (await req.json()) as SendEmailPayload;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Dữ liệu yêu cầu không hợp lệ." },
      { status: 400 }
    );
  }

  const { recipients, subject, content, fromName, fromEmail } = body;

  if (!subject || !subject.trim()) {
    return NextResponse.json(
      { ok: false, message: "Vui lòng nhập tiêu đề email." },
      { status: 400 }
    );
  }

  if (!content || !content.trim()) {
    return NextResponse.json(
      { ok: false, message: "Vui lòng nhập nội dung email." },
      { status: 400 }
    );
  }

  // Filter valid emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validRecipients = (recipients || []).filter(
    (r) => r.email && emailRegex.test(r.email.trim())
  );

  if (validRecipients.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy người nhận nào có địa chỉ email hợp lệ." },
      { status: 400 }
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const senderDisplayName = fromName?.trim() || "Lễ Kỷ Niệm 40 Năm NCT";
  const defaultSenderEmail = process.env.RESEND_FROM_EMAIL || "hi@nctitc.io.vn";
  const senderEmailAddress = fromEmail?.trim() || defaultSenderEmail;
  const formattedFrom = senderEmailAddress.includes("<")
    ? senderEmailAddress
    : `${senderDisplayName} <${senderEmailAddress}>`;

  // If RESEND_API_KEY is not configured in Next.js environment, check if FastAPI backend has it configured
  if (!resendApiKey) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nctitc.io.vn";
    const token = req.cookies.get(COOKIE_NAME)?.value;

    try {
      // Try sending via backend proxy
      const backendRes = await fetch(`${API_URL}/api/email/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          to: validRecipients.map((r) => r.email.trim()),
          subject: subject.trim(),
          html: formatEmailHtml(content, validRecipients[0]?.name || "", validRecipients[0]?.email || ""),
          from_email: formattedFrom,
        }),
      });

      if (backendRes.ok) {
        await logAction(
          "send_email",
          "registrations",
          "email-campaign",
          admin.fullName || admin.username,
          admin.username,
          admin.role,
          `Đã gửi email "${subject}" đến ${validRecipients.length} người nhận qua backend.`
        );

        return NextResponse.json({
          ok: true,
          total: validRecipients.length,
          sentCount: validRecipients.length,
          failedCount: 0,
          message: `Đã đưa ${validRecipients.length} email vào hàng đợi gửi thành công!`,
        });
      }
    } catch {
      // Continue to error reporting below
    }

    return NextResponse.json(
      {
        ok: false,
        message:
          "Chưa cấu hình biến môi trường RESEND_API_KEY trên hệ thống. Vui lòng thêm RESEND_API_KEY vào tệp .env.local hoặc cấu hình trên máy chủ.",
      },
      { status: 500 }
    );
  }

  // Initialize Resend
  const resend = new Resend(resendApiKey);

  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  // Batch into chunks of 50 to respect Resend batch limits and network reliability
  const CHUNK_SIZE = 50;
  const chunks: Recipient[][] = [];
  for (let i = 0; i < validRecipients.length; i += CHUNK_SIZE) {
    chunks.push(validRecipients.slice(i, i + CHUNK_SIZE));
  }

  for (const chunk of chunks) {
    try {
      const emailBatch = chunk.map((recipient) => ({
        from: formattedFrom,
        to: [recipient.email.trim()],
        subject: subject.trim(),
        html: formatEmailHtml(content, recipient.name || "", recipient.email.trim()),
      }));

      const { data, error } = await resend.batch.send(emailBatch);

      if (error) {
        failedCount += chunk.length;
        errors.push(error.message || "Lỗi gửi batch Resend");
      } else if (data && data.data) {
        sentCount += data.data.length;
      } else {
        sentCount += chunk.length;
      }
    } catch (err: any) {
      failedCount += chunk.length;
      errors.push(err?.message || "Lỗi mạng hoặc kết nối Resend");
    }
  }

  await logAction(
    "send_email",
    "registrations",
    "email-campaign",
    admin.fullName || admin.username,
    admin.username,
    admin.role,
    `Gửi email "${subject}" (Thành công: ${sentCount}, Thất bại: ${failedCount})`
  );

  return NextResponse.json({
    ok: sentCount > 0,
    total: validRecipients.length,
    sentCount,
    failedCount,
    errors: errors.slice(0, 5),
    message:
      sentCount > 0
        ? `Đã gửi thành công ${sentCount} email${failedCount > 0 ? ` (${failedCount} email gặp lỗi)` : ""}!`
        : `Gửi email thất bại: ${errors[0] || "Không thể gửi"}`,
  });
}
