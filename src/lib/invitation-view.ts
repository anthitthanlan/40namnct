/** Module dùng chung client + server - KHÔNG import node:* ở đây */

/** Kích cỡ áo kỷ niệm */
export const SIZES = ["S", "M", "L", "XL", "XXL", "NC1", "NC2", "NC3"] as const;
export type Size = (typeof SIZES)[number];

/** Giá Combo: Áo kỷ niệm + Đồ ăn nhẹ = 500.000đ */
export const UNIT_PRICE = 500_000;

export type InvitationStatus =
  | "pending" // Đăng ký dùng, đang chờ chuyển khoản
  | "pending_payment" // Mới tạo, đang chờ chuyển khoản
  | "pending_approval" // Người dùng đã xác nhận chuyển khoản, chờ Admin duyệt cấp thư mời (24h)
  | "confirmed" // Đã duyệt phát hành, hiển thị mã QR động 30s
  | "rejected" // Bị từ chối (chưa nhận được tiền)
  | "cancelled"; // Đã hủy

export type CheckInEntry = {
  name: string;
  time: string;
  by?: string;
};

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
  checkinEntries?: CheckInEntry[];
  shirtReceived?: boolean;
  shirtReceivedAt?: string | null;
  emailSent?: boolean;
  emailSentAt?: string | null;
  emailSentCount?: number;
  createdAt: string;
  updatedAt: string;
  receiptAttempts?: any[];
};

export function formatVnd(amount?: number | null): string {
  const num = typeof amount === "number" && !isNaN(amount) ? amount : (Number(amount) || 0);
  return `${num.toLocaleString("vi-VN")}đ`;
}

export function invitationStatusInfo(status: InvitationStatus | string): {
  label: string;
  cls: string;
  desc?: string;
} {
  switch (status) {
    case "confirmed":
      return {
        label: "Đã phát hành",
        cls: "bg-emerald-600 text-white font-bold",
        desc: "Mã QR thư mời sẽ được dùng để nhận áo và xuất trình vào cổng ngày hội 08/11/2026.",
      };
    case "pending_approval":
      return {
        label: "Chờ đối soát (48h)",
        cls: "bg-blue-600 text-white font-bold",
        desc: "Đã gửi xác nhận đóng góp, Ban Tổ chức đang đối soát biên lai (tối đa 48h)",
      };
    case "pending_payment":
    case "pending":
      return {
        label: "Chờ thanh toán",
        cls: "bg-amber-500 text-white font-bold",
        desc: "Đang chờ người dùng quét QR và upload biên lai đóng góp",
      };
    case "rejected":
      return {
        label: "Đã từ chối",
        cls: "bg-red-600 text-white font-bold",
        desc: "Không khớp thông tin chuyển khoản",
      };
    default:
      return {
        label: "Đã hủy",
        cls: "bg-slate-500 text-white font-bold",
      };
  }
}

/** Tiền tố giới tính cho key size của đơn tập thể: "Nam-M", "Nữ-L"... */
export const GENDERS = ["Nam", "Nữ"] as const;
export type Gender = (typeof GENDERS)[number];
export const genderSizeKey = (g: Gender, s: string) => `${g}-${s}`;

/** "Size L" hoặc "Nam-M×2 · Nữ-L×3" */
export function sizesLabel(
  type: InvitationView["type"],
  size: string | null | undefined,
  sizes?: Record<string, number> | null,
): string {
  if (type === "individual") {
    if (!size) return "";
    const parts = size.split("-");
    return parts.length === 2 ? `Size ${parts[1]} (${parts[0]})` : `Size ${size}`;
  }
  if (!sizes || typeof sizes !== "object") return "";
  const keys: string[] = [
    ...SIZES,
    ...GENDERS.flatMap((g) => SIZES.map((s) => genderSizeKey(g, s))),
  ];
  const parts = keys
    .filter((k) => (Number(sizes[k]) || 0) > 0)
    .map((k) => `${k.replace("-", " ")}×${sizes[k]}`);
  return parts.join(" · ");
}

