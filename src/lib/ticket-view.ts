/** Module dùng chung client + server - KHÔNG import node:* ở đây */

/** Kích cỡ áo kỷ niệm */
export const SIZES = ["S", "M", "L", "XL", "2XL", "3XL"] as const;
export type Size = (typeof SIZES)[number];

/** Vé tập thể: 200.000đ / 1 suất (vé cá nhân miễn phí) */
export const UNIT_PRICE = 200000;

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
  status: "pending" | "confirmed" | "cancelled";
  note: string;
  createdAt: string;
  updatedAt: string;
};

export function formatVnd(amount: number): string {
  return amount === 0
    ? "Miễn phí"
    : `${amount.toLocaleString("vi-VN")}đ`;
}

export function ticketStatusInfo(status: TicketView["status"]): {
  label: string;
  cls: string;
} {
  switch (status) {
    case "confirmed":
      return { label: "✅ Đã xác nhận", cls: "bg-emerald-100 text-emerald-700" };
    case "pending":
      return { label: "⏳ Chờ thanh toán", cls: "bg-amber-100 text-amber-700" };
    default:
      return { label: "🚫 Đã hủy", cls: "bg-rose-100 text-rose-600" };
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
