"use client";

import {
  formatVnd,
  sizesLabel,
  ticketStatusInfo,
  type TicketView,
} from "@/lib/ticket-view";
import TransferQr from "./TransferQr";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TicketList({
  tickets,
  memberCode = "",
}: {
  tickets: TicketView[];
  /** Mã định danh của member đang đăng nhập - dùng sinh nội dung CK xoay */
  memberCode?: string;
}) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-400">
        Chưa có vé nào - hãy đăng ký vé phía trên nhé!
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {tickets.map((t) => {
        const status = ticketStatusInfo(t.status);
        const isGroup = t.type === "group";
        return (
          <div key={t.id} className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${
                  isGroup
                    ? "bg-[#1d4ed8]/10 text-[#1d4ed8]"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isGroup ? "👥 Vé tập thể" : "👤 Vé cá nhân"}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${status.cls}`}
              >
                {status.label}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-[11px] font-extrabold text-slate-500">
                {t.code}
              </span>
            </div>

            <div className="mt-4 grid gap-6 md:grid-cols-[1fr_auto]">
              <div className="space-y-1.5 text-sm text-slate-600">
                {isGroup ? (
                  <>
                    <p className="text-base font-extrabold text-slate-900">
                      {t.quantity} suất · {formatVnd(t.amount)}
                    </p>
                    <p>
                      <span className="font-bold">Size áo:</span>{" "}
                      {sizesLabel(t.type, t.size, t.sizes) || "-"}
                    </p>
                  </>
                ) : (
                  <p className="text-base font-extrabold text-slate-900">
                    {t.attendeeName} · Size {t.size} · {formatVnd(t.amount)}
                  </p>
                )}
                {t.note && (
                  <p>
                    <span className="font-bold">Ghi chú:</span> {t.note}
                  </p>
                )}
                <p className="text-xs text-slate-400">
                  Đăng ký ngày {formatDate(t.createdAt)}
                </p>
              </div>

              {isGroup && t.amount > 0 && (
                <TransferQr amount={t.amount} memberCode={memberCode} />
              )}
            </div>

            {t.status === "pending" && (
              <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                ⏳ Vé sẽ chuyển sang “✅ Đã xác nhận” sau khi Ban Tổ chức nhận
                được chuyển khoản.
              </p>
            )}
            {t.status === "confirmed" && !isGroup && (
              <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                🎫 Vé đã sẵn sàng - xuất trình mã định danh tại cổng ngày
                15/11/2026.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
