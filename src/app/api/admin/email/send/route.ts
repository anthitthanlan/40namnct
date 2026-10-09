import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized, COOKIE_NAME } from "@/lib/auth";
import { logAction } from "@/lib/action-logs";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

type Recipient = {
  name?: string;
  email: string;
  amount?: string | number;
  donate_code?: string;
  invi_id?: string;
};

type SendEmailPayload = {
  recipients: Recipient[];
  subject: string;
  content: string;
  fromName?: string;
  fromEmail?: string;
  useOfficialTemplate?: boolean;
};

function formatEmailHtml(content: string, recipient: Recipient): string {
  const safeName = recipient.name?.trim() || "Quý Thầy Cô / Cựu học sinh / Quý Khách";
  
  // Replace placeholders like {name}, {ten}, {email}, {amount}, {donate_code}, {invi_id}
  let personalizedContent = content
    .replace(/\{name\}/gi, safeName)
    .replace(/\{ten\}/gi, safeName)
    .replace(/\{email\}/gi, recipient.email)
    .replace(/\{amount\}/gi, recipient.amount ? recipient.amount.toString() : "")
    .replace(/\{donate_code\}/gi, recipient.donate_code || "")
    .replace(/\{invi_id\}/gi, recipient.invi_id || "");

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
      padding: 20px 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: transparent;
    }
    .content {
      font-size: 15px;
      line-height: 1.6;
      color: #334155;
      text-align: left;
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
      color: #2563eb;
      text-decoration: underline;
    }
    .content img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      margin: 16px 0;
    }
    .content blockquote {
      border-left: 4px solid #2563eb;
      padding-left: 16px;
      margin: 16px 0;
      color: #475569;
      font-style: italic;
      background: #ffffff;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      border: 1px solid #e5e7eb;
      border-left: 4px solid #2563eb;
    }
    .footer {
      font-size: 13px;
      line-height: 1.6;
      color: #94a3b8;
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="content">
        ${personalizedContent}
      </div>
      <div class="footer">
        Ban Tổ Chức chương trình Kỷ Niệm 40 Năm THPT Nguyễn Công Trứ<br>
        Email được gửi tới: <strong>${recipient.email}</strong>
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

  const { recipients, subject, content, fromName, fromEmail, useOfficialTemplate } = body;

  if (!useOfficialTemplate && (!subject || !subject.trim())) {
    return NextResponse.json(
      { ok: false, message: "Vui lòng nhập tiêu đề email." },
      { status: 400 }
    );
  }

  if (!useOfficialTemplate && (!content || !content.trim())) {
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

  if (useOfficialTemplate) {
    const { sendInvitationEmail } = await import("@/lib/email");
    let sentCount = 0;
    let failedCount = 0;
    for (const recipient of validRecipients) {
      if (recipient.invi_id) {
        const success = await sendInvitationEmail(recipient.invi_id);
        if (success) sentCount++;
        else failedCount++;
      } else {
        failedCount++;
      }
    }
    
    await logAction(
      "send_email",
      "registrations",
      "email-campaign",
      admin.fullName || admin.username,
      admin.username,
      admin.role,
      `Gửi email "Thư mời chính thức" (Thành công: ${sentCount}, Thất bại: ${failedCount})`
    );

    return NextResponse.json({
      ok: sentCount > 0,
      total: validRecipients.length,
      sentCount,
      failedCount,
      errors: [],
      message:
        sentCount > 0
          ? `Đã gửi thành công ${sentCount} email thư mời${failedCount > 0 ? ` (${failedCount} email gặp lỗi)` : ""}!`
          : `Gửi email thất bại.`,
    });
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
          html: formatEmailHtml(content, validRecipients[0] || { email: "" }),
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
      } else {
        const errorText = await backendRes.text();
        console.error("Backend email send failed:", backendRes.status, errorText);
        return NextResponse.json(
          {
            ok: false,
            message: `Lỗi từ Backend (${backendRes.status}): ${errorText}`,
          },
          { status: backendRes.status }
        );
      }
    } catch (err) {
      console.error("Fetch to backend failed:", err);
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
        html: formatEmailHtml(content, recipient),
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
