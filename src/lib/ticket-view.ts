/** Module dùng chung client + server - KHÔNG import node:* ở đây */

/** Kích cỡ áo kỷ niệm */
export const SIZES = ["S", "M", "L", "XL", "2XL", "3XL"] as const;
export type Size = (typeof SIZES)[number];

/** Giá vé: Cá nhân cũng 200.000đ, tập thể 200.000đ/suất */
export const UNIT_PRICE = 200_000;

export type TicketStatus =
  | "pending" // Đăng ký dùng, đang chờ chuyển khoản
  | "pending_payment" // Mới tạo, đang chờ chuyển khoản
  | "pending_approval" // Người dùng đã xác nhận chuyển khoản, chờ Admin duyệt cấp vé (24h)
  | "confirmed" // Đã duyệt phát hành, hiển thị mã QR động 30s
  | "rejected" // Bị từ chối (chưa nhận được tiền)
  | "cancelled"; // Đã hủy

export type TicketView = {
  id: string;
  code: string;
  memberId: string;
  type: "individual" | "group";
  attendeeName: string;
  size: string | null;
  quantity: number;
  sizes: Record<string, number>;
  amount: number;
  status: TicketStatus;
  note: string;
  lastSessionId?: string;
  paymentClaimedAt?: string;
  checkedIn?: boolean;
  checkedInAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

export function ticketStatusInfo(status: TicketStatus | string): {
  label: string;
  cls: string;
  desc?: string;
} {
  switch (status) {
    case "confirmed":
      return {
        label: "✅ Đã phát hành",
        cls: "bg-emerald-100 text-emerald-800 border border-emerald-300",
        desc: "Vé hợp lệ · Xuất trình QR động khi vào cổng 15/11/2026",
      };
    case "pending_approval":
      return {
        label: "⏳ Chờ cấp vé (24h)",
        cls: "bg-blue-100 text-blue-800 border border-blue-300",
        desc: "Đã gửi xác nhận CK, Ban Tổ chức đang đối soát để phát hành vé",
      };
    case "pending_payment":
    case "pending":
      return {
        label: "🕒 Chờ chuyển khoản",
        cls: "bg-amber-100 text-amber-800 border border-amber-300",
        desc: "Quét QR chuyển khoản để hoàn tất đăng ký",
      };
    case "rejected":
      return {
        label: "❌ Đã từ chối",
        cls: "bg-rose-100 text-rose-700 border border-rose-300",
        desc: "Không khớp thông tin chuyển khoản",
      };
    default:
      return {
        label: "🚫 Đã hủy",
        cls: "bg-slate-100 text-slate-600 border border-slate-300",
      };
  }
}

/** "Size L" hoặc "M×2 · L×3 · XL×1" */
export function sizesLabel(
  type: TicketView["type"],
  size: string | null,
  sizes: Record<string, number>,
): string {
  if (type === "individual") return size ? `Size ${size}` : "";
  const parts = SIZES.filter((s) => (sizes[s] ?? 0) > 0).map(
    (s) => `${s}×${sizes[s]}`,
  );
  return parts.join(" · ");
}

/* ==========================================================================
   BẢO MẬT VÉ: MÃ QR ĐỘNG THAY ĐỔI MỖI 30 GIÂY (TIME-BASED DYNAMIC QR)
   ========================================================================== */

export const TICKET_ROTATION_MS = 30_000;

function simpleHash(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Sinh chuỗi bảo mật QR động cho vé đã duyệt
 * Thay đổi mỗi 30s dựa trên thời gian thực
 */
export function getDynamicTicketPayload(
  ticketId: string,
  ticketCode: string,
  now = Date.now(),
): { payload: string; remainingSeconds: number; windowIndex: number } {
  const windowIndex = Math.floor(now / TICKET_ROTATION_MS);
  const elapsedInWindow = now % TICKET_ROTATION_MS;
  const remainingSeconds = Math.ceil(
    (TICKET_ROTATION_MS - elapsedInWindow) / 1000,
  );

  const hashVal = simpleHash(`NCT40:${ticketId}:${ticketCode}:${windowIndex}`);
  const sig = hashVal.toString(36).toUpperCase().padStart(6, "0").slice(-6);

  // Payload định dạng chuẩn máy quét: "NCT40-PASS|[ticketId]|[ticketCode]|[windowIndex]|[sig]"
  const payload = `NCT40-PASS|${ticketId}|${ticketCode}|${windowIndex}|${sig}`;
  return { payload, remainingSeconds, windowIndex };
}

/**
 * Xác minh mã QR động (cho phép lệch ±1 cửa sổ 30s để xử lý độ trễ mạng)
 */
export function verifyDynamicTicketPayload(
  payloadStr: string,
  now = Date.now(),
): { valid: boolean; ticketId?: string; ticketCode?: string; message?: string } {
  const parts = payloadStr.split("|");
  if (parts.length !== 5 || parts[0] !== "NCT40-PASS") {
    return { valid: false, message: "Mã QR không đúng định dạng vé NCT40" };
  }

  const [, ticketId, ticketCode, winStr, clientSig] = parts;
  const clientWindow = parseInt(winStr, 10);
  const currentWindow = Math.floor(now / TICKET_ROTATION_MS);

  // Cho phép cửa sổ [hiện tại - 1, hiện tại, hiện tại + 1] (~90s an toàn)
  if (Math.abs(currentWindow - clientWindow) > 1) {
    return { valid: false, message: "Mã QR đã hết hạn 30s, vui lòng quét lại" };
  }

  const expectedHash = simpleHash(
    `NCT40:${ticketId}:${ticketCode}:${clientWindow}`,
  );
  const expectedSig = expectedHash
    .toString(36)
    .toUpperCase()
    .padStart(6, "0")
    .slice(-6);

  if (expectedSig !== clientSig) {
    return { valid: false, message: "Chữ ký bảo mật mã QR không khớp" };
  }

  return { valid: true, ticketId, ticketCode };
}
