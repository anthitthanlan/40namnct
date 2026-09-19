import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { findTicketById, getMemberById, updateTicketReceipt } from "@/lib/members";
import { buildTransferContent } from "@/lib/emvqr";
import { uploadReceipt } from "@/lib/r2";
import { verifyReceipt } from "@/lib/ocr";
import type { OcrResult } from "@/lib/members";

export const dynamic = "force-dynamic";

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];

/**
 * POST /api/payment/verify-receipt
 * Content-Type: multipart/form-data
 *
 * Body:
 *   - ticketId: string
 *   - receipt: File (ảnh biên lai, max 10MB)
 *
 * Luồng 2 song song:
 *   1. Upload ảnh lên Cloudflare R2
 *   2. AI OCR trích xuất + so khớp
 */
export async function POST(req: NextRequest) {
  // --- Parse multipart form ---
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Dữ liệu không hợp lệ. Vui lòng thử lại." },
      { status: 400 },
    );
  }

  const ticketId = formData.get("ticketId");
  const receiptFile = formData.get("receipt");

  if (!ticketId || typeof ticketId !== "string") {
    return NextResponse.json(
      { ok: false, message: "Thiếu ticketId." },
      { status: 400 },
    );
  }

  if (!receiptFile || !(receiptFile instanceof File)) {
    return NextResponse.json(
      { ok: false, message: "Vui lòng chọn ảnh biên lai chuyển khoản." },
      { status: 400 },
    );
  }

  // --- Validate file ---
  if (!ALLOWED_MIME.includes(receiptFile.type)) {
    return NextResponse.json(
      {
        ok: false,
        message: `Định dạng file không được hỗ trợ. Chỉ chấp nhận: JPEG, PNG, WebP.`,
      },
      { status: 400 },
    );
  }

  if (receiptFile.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { ok: false, message: "File quá lớn. Vui lòng chọn ảnh dưới 10MB." },
      { status: 400 },
    );
  }

  if (receiptFile.size < 1024) {
    return NextResponse.json(
      { ok: false, message: "File ảnh quá nhỏ hoặc bị hỏng." },
      { status: 400 },
    );
  }

  // --- Load ticket ---
  if (ticketId === "DEV") {
    const fileBuffer = Buffer.from(await receiptFile.arrayBuffer());
    const mimeType = receiptFile.type || "image/jpeg";
    const imageBase64 = fileBuffer.toString("base64");
    
    // AI OCR trích xuất + so khớp
    const verifyResult = await verifyReceipt(imageBase64, mimeType, {
      amount: 20_000,
      addInfo: "DEV AI TEST",
      ticketCode: "DEV",
    });

    const confidence = verifyResult.matchResult.confidence;
    let message = "";
    if (confidence === "mismatch") {
      message = buildMismatchMessage(verifyResult.matchResult.amountMatch, verifyResult.matchResult.contentMatch, verifyResult.ocrResult.amount, 20_000);
    } else if (confidence === "high") {
      message = "Biên lai hợp lệ, vé của bạn đã được kích hoạt! (Chế độ DEV)";
    } else if (confidence === "low") {
      message = "Giao dịch đã được đưa vào hàng chờ. Ban Tổ chức sẽ đối soát và xác nhận trong vòng 24 giờ. (Chế độ DEV)";
    } else if (confidence === "system_error") {
      message = "Hệ thống đang bảo trì. Biên lai của bạn đã được lưu lại để duyệt thủ công. (Chế độ DEV)";
    }

    return NextResponse.json({
      ok: confidence !== "mismatch" && confidence !== "system_error",
      confidence: confidence,
      message,
      ticketStatus: confidence === "high" ? "confirmed" : "pending_approval",
      ocrResult: {
        amount: verifyResult.ocrResult.amount,
        content: verifyResult.ocrResult.content,
        time: verifyResult.ocrResult.time,
        confidence: verifyResult.matchResult.confidence,
        note: verifyResult.matchResult.note,
        provider: verifyResult.ocrResult.provider,
      },
    });
  }

  const ticket = await findTicketById(ticketId);
  if (!ticket) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy vé." },
      { status: 404 },
    );
  }

  if (ticket.amount <= 0) {
    return NextResponse.json(
      { ok: false, message: "Vé này không yêu cầu đóng góp." },
      { status: 400 },
    );
  }

  if (ticket.status === "confirmed") {
    return NextResponse.json({
      ok: true,
      confidence: "high" as const,
      message: "Vé đã được xác nhận trước đó.",
      alreadyConfirmed: true,
    });
  }

  const member = await getMemberById(ticket.memberId);
  if (!member) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy thông tin đăng ký." },
      { status: 404 },
    );
  }

  if ((ticket.receiptAttempts?.length || 0) >= 3) {
    return NextResponse.json({
      ok: false,
      confidence: "mismatch_fallback",
      message: "Vé của bạn đã được chuyển cho Ban Tổ chức duyệt thủ công do tải ảnh không hợp lệ nhiều lần.",
      canRetry: false
    });
  }

  // --- Prepare data ---
  const fileBuffer = Buffer.from(await receiptFile.arrayBuffer());
  const mimeType = receiptFile.type || "image/jpeg";
  const imageBase64 = fileBuffer.toString("base64");

  const addInfo = buildTransferContent(
    member.name,
    ticket.nienKhoa || "",
    member.phone,
  );

  // ============================================================
  // 2 LUỒNG SONG SONG
  // ============================================================
  const [uploadResult, verifyResult] = await Promise.all([
    // Luồng 1: Upload ảnh lên Cloudflare R2
    uploadReceipt(ticketId, fileBuffer, mimeType),

    // Luồng 2: AI OCR trích xuất + so khớp
    verifyReceipt(imageBase64, mimeType, {
      amount: ticket.amount,
      addInfo,
      ticketCode: ticket.code,
    }),
  ]);

  // --- Gộp kết quả ---
  const receiptUrl = uploadResult.ok ? uploadResult.url : "";

  if (!uploadResult.ok) {
    console.error("[verify-receipt] R2 upload failed:", uploadResult.error);
    // Không block flow — tiếp tục với OCR result dù upload fail
  }

  const { ocrResult, matchResult } = verifyResult;

  // Build OcrResult để lưu vào DB
  const ocrRecord: OcrResult = {
    amount: ocrResult.amount,
    content: ocrResult.content,
    time: ocrResult.time,
    transactionStatus: ocrResult.transactionStatus,
    confidence: matchResult.confidence,
    note: matchResult.note,
    provider: ocrResult.provider,
  };

  // --- Cập nhật ticket ---
  const updated = await updateTicketReceipt(ticketId, receiptUrl || "", ocrRecord);
  if (!updated) {
    return NextResponse.json(
      { ok: false, message: "Lỗi cập nhật trạng thái vé. Vui lòng thử lại." },
      { status: 500 },
    );
  }

  const attempts = updated.receiptAttempts?.length || 1;
  const attemptsLeft = Math.max(0, 3 - attempts);
  const isLocked = attempts >= 3;

  if (matchResult.confidence === "mismatch") {
    return NextResponse.json({
      ok: false,
      confidence: isLocked ? "mismatch_fallback" : "mismatch",
      message: isLocked 
        ? "Đã gửi xét duyệt thủ công do ảnh không hợp lệ nhiều lần." 
        : buildMismatchMessage(matchResult.amountMatch, matchResult.contentMatch, ocrResult.amount, ticket.amount),
      attemptsLeft,
      canRetry: !isLocked,
      ocrResult: ocrRecord,
    });
  }

  if (matchResult.confidence === "system_error") {
    return NextResponse.json({
      ok: false, // Để UI bắt lỗi và chuyển phase system_error
      confidence: "system_error",
      message: "Hệ thống đang bảo trì. Biên lai của bạn đã được lưu lại để duyệt thủ công.",
      attemptsLeft,
      canRetry: !isLocked, // Cho phép thử lại nếu chưa hết 3 lần
      ocrResult: ocrRecord,
    });
  }

  // --- Response cho High / Low ---
  if (matchResult.confidence === "high") {
    return NextResponse.json({
      ok: true,
      confidence: "high" as const,
      message: "Xác nhận đóng góp thành công! Vé của bạn đã được phát hành.",
      ticketStatus: "confirmed",
      ocrResult: ocrRecord,
    });
  } else {
    // low (thiếu ngữ cảnh)
    return NextResponse.json({
      ok: true,
      confidence: "low" as const,
      message:
        "Giao dịch đã được đưa vào hàng chờ. Ban Tổ chức sẽ đối soát và xác nhận trong vòng 24 giờ.",
      ticketStatus: "pending_approval",
      ocrResult: ocrRecord,
    });
  }
}

function buildMismatchMessage(
  amountMatch: boolean,
  contentMatch: boolean,
  extractedAmount: number | null,
  expectedAmount: number,
): string {
  if (!amountMatch && !contentMatch) {
    if (extractedAmount === null) {
      return "Hệ thống không đọc được thông tin từ ảnh. Vui lòng chụp lại biên lai rõ hơn và thử lại.";
    }
    return `Thông tin không khớp: AI đọc được ${extractedAmount.toLocaleString("vi-VN")}đ nhưng cần ${expectedAmount.toLocaleString("vi-VN")}đ. Vui lòng kiểm tra và upload lại ảnh biên lai đúng.`;
  }
  if (!amountMatch) {
    return `Số tiền không khớp: AI đọc được ${extractedAmount?.toLocaleString("vi-VN") ?? "không rõ"}đ, cần chuyển ${expectedAmount.toLocaleString("vi-VN")}đ. Vui lòng kiểm tra lại giao dịch.`;
  }
  return "Nội dung chuyển khoản không khớp. Vui lòng đảm bảo chuyển đúng nội dung được hiển thị và upload lại biên lai.";
}
