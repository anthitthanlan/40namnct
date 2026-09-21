/** Module dùng chung client + server - KHÔNG import node:* ở đây */

/** Kích cỡ áo kỷ niệm */
export const SIZES = ["S", "M", "L", "XL", "2XL", "3XL"] as const;
export type Size = (typeof SIZES)[number];

/** Giá Combo: Áo kỷ niệm + Đồ ăn nhẹ = 500.000đ */
export const UNIT_PRICE = 500_000;

export type InvitationStatus =
  | "pending" // Đăng ký dùng, đang chờ chuyển khoản
  | "pending_payment" // Mới tạo, đang chờ chuyển khoản
  | "pending_approval" // Người dùng đã xác nhận chuyển khoản, chờ Admin duyệt cấp vé (24h)
  | "confirmed" // Đã duyệt phát hành, hiển thị mã QR động 30s
  | "rejected" // Bị từ chối (chưa nhận được tiền)
  | "cancelled"; // Đã hủy

export type InvitationView = {
  id: string;
  code: string;
  memberId: string;
  memberPhone?: string;
  memberEmail?: string;
  type: "individual" | "group";
  attendeeName: string;
  nienKhoa?: string;
  size: string | null;
  quantity: number;
  sizes: Record<string, number>;
  /** Số lượng Combo (Áo + Ăn) */
  snacks: number;
  amount: number;
  status: InvitationStatus;
  note: string;
  lastSessionId?: string;
  paymentClaimedAt?: string;
  receiptUrl?: string;
  ocrResult?: {
    amount: number | null;
    content: string | null;
    time: string | null;
    transactionId?: string | null;
    transactionStatus?: "success" | "pending" | "failed" | "unknown";
    trustScore?: number | null;
    confidence: "high" | "low" | "mismatch" | "system_error";
    note: string;
    provider: string;
  };
  checkedIn?: boolean;
  checkedInAt?: string | null;
  shirtReceived?: boolean;
  shirtReceivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

export function invitationStatusInfo(status: InvitationStatus | string): {
  label: string;
  cls: string;
  desc?: string;
} {
  switch (status) {
    case "confirmed":
      return {
        label: "✅ Đã phát hành",
        cls: "bg-emerald-100 text-emerald-800 border border-emerald-300",
        desc: "Vé hợp lệ · Xuất trình QR động khi vào cổng 08/11/2026",
      };
    case "pending_approval":
      return {
        label: "⏳ Chờ duyệt (24h)",
        cls: "bg-blue-100 text-blue-800 border border-blue-300",
        desc: "Đã gửi xác nhận đóng góp, Ban Tổ chức đang đối soát biên lai để phát hành vé",
      };
    case "pending_payment":
    case "pending":
      return {
        label: "🕒 Chờ xác nhận",
        cls: "bg-amber-100 text-amber-800 border border-amber-300",
        desc: "Đang chờ người dùng quét QR và upload biên lai đóng góp",
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
  type: InvitationView["type"],
  size: string | null,
  sizes: Record<string, number>,
): string {
  if (type === "individual") return size ? `Size ${size}` : "";
  const parts = SIZES.filter((s) => (sizes[s] ?? 0) > 0).map(
    (s) => `${s}×${sizes[s]}`,
  );
  return parts.join(" · ");
}

