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
    if (backendData.ok && backendData.confidence !== "high" && backendData.content && invitationId) {
      try {
        const { findInvitationById, updateInvitationDetails } = await import("@/lib/members");
        const invitation = await findInvitationById(invitationId);
        if (invitation) {
          const expectedCode = invitation.code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
          const actualContent = backendData.content.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

          if (actualContent.includes(expectedCode)) {
            backendData.confidence = "high";
            backendData.transactionStatus = "success";
            // Ghi đè cập nhật lại status thành confirmed trên backend
            await updateInvitationDetails(invitationId, { status: "confirmed", ocrResult: backendData });
          }
        }
      } catch (err) {
        console.error("Lỗi khi so khớp OCR nới lỏng:", err);
      }
    }

    if (backendData.ok && backendData.confidence === "high") {
      // Send email asynchronously without blocking the response
      if (invitationId) {
        sendInvitationEmail(invitationId).catch(err =>
          console.error("Async email send failed:", err)
        );
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
