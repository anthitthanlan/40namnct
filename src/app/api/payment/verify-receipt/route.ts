import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sendInvitationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nctitc.io.vn";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Forward the form data to FastAPI backend
    const backendRes = await fetch(`${BACKEND_URL}/api/ocr/verify-receipt`, {
      method: "POST",
      body: formData,
    });

    const backendData = await backendRes.json();
    const invitationId = formData.get("invitationId") as string;

    // Xử lý các case rớt dòng hoặc ngân hàng cắt dấu '-'
    const ocrContent = backendData.ocrResult?.content || backendData.content || "";
    if (backendData.ok && backendData.confidence !== "high" && ocrContent && invitationId) {
      try {
        const { findInvitationById, updateInvitationDetails } = await import("@/lib/members");
        const invitation = await findInvitationById(invitationId);
        if (invitation) {
          const expectedCode = invitation.code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
          const actualContent = ocrContent.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

          if (actualContent.includes(expectedCode)) {
            backendData.confidence = "high";
            backendData.transactionStatus = "success";
            
            const { getSystemAdminToken } = await import("@/lib/system-auth");
            const systemToken = (await getSystemAdminToken()) || undefined;
            // Ghi đè cập nhật lại status thành confirmed trên backend bằng systemToken
            await updateInvitationDetails(invitationId, { status: "confirmed", ocrResult: backendData }, systemToken);
          }
        }
      } catch (err) {
        console.error("Lỗi khi so khớp OCR nới lỏng:", err);
      }
    }

    if (backendData.ok && backendData.confidence === "high") {
      if (invitationId) {
        try {
          await sendInvitationEmail(invitationId, {
            adminName: "Hệ thống (AI OCR)",
            logDetail: "Tự động gửi email thư mời khi duyệt qua OCR",
          });
        } catch (err) {
          console.error("[verify-receipt] Lỗi gửi email thư mời tự động:", err);
        }
      }
    }

    return NextResponse.json(backendData, { status: backendRes.status });
  } catch (err) {
    console.error("Lỗi khi chuyển tiếp verify-receipt:", err);
    return NextResponse.json(
      { ok: false, message: "Lỗi hệ thống. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
