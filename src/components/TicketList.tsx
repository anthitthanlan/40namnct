"use client";

import {
  formatVnd,
  sizesLabel,
  ticketStatusInfo,
  type TicketView,
} from "@/lib/ticket-view";
import TransferQr from "./TransferQr";
import DynamicTicketQr from "./DynamicTicketQr";

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
  onRefresh,
}: {
  tickets: TicketView[];
  memberCode?: string;
  onRefresh?: () => void;
}) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
        Chưa có vé nào - hãy đăng ký vé phía trên nhé!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tickets.map((t) => {
        const status = ticketStatusInfo(t.status);
        const isGroup = t.type === "group";
        const isConfirmed = t.status === "confirmed";
        const isPendingPayment =
          t.status === "pending_payment" || (t.status as string) === "pending";
        const isPendingApproval = t.status === "pending_approval";

        return (
          <div
            key={t.id}
            className={`rounded-3xl border bg-white p-6 shadow-sm transition ${
              isConfirmed
                ? "border-emerald-200 ring-1 ring-emerald-100"
                : "border-slate-200"
            }`}
          >
            {/* Header hàng vé */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${
                    isGroup
                      ? "bg-blue-50 text-[#1d4ed8]"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {isGroup ? "👥 Vé tập thể" : "👤 Vé cá nhân"}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${status.cls}`}
                >
                  {status.label}
                </span>

                {t.checkedIn && (
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-[11px] font-extrabold text-purple-700">
                    🎯 Đã Check-in vào cổng
                  </span>
                )}
              </div>

              <span className="font-mono text-xs font-bold text-slate-400">
                Mã: {t.code}
              </span>
            </div>

            {/* Thân thông tin vé */}
            <div className="mt-4 grid gap-6 md:grid-cols-[1.2fr_1fr] items-start">
              <div className="space-y-2 text-sm text-slate-600">
                {isGroup ? (
                  <>
                    <p className="text-base font-extrabold text-slate-900">
                      {t.quantity} suất · {formatVnd(t.amount)}
                    </p>
                    <p>
                      <span className="font-bold text-slate-800">
                        Phân bổ size áo:
                      </span>{" "}
                      {sizesLabel(t.type, t.size, t.sizes) || "-"}
                    </p>
                  </>
                ) : (
                  <p className="text-base font-extrabold text-slate-900">
                    {t.attendeeName} · Size {t.size} · {formatVnd(t.amount)}
                  </p>
                )}

                {t.note && (
                  <p className="text-xs">
                    <span className="font-bold text-slate-700">Ghi chú:</span>{" "}
                    {t.note}
                  </p>
                )}

                <p className="text-xs text-slate-400">
                  Đăng ký ngày {formatDate(t.createdAt)}
                </p>

                {t.checkedIn && t.checkedInAt && (
                  <p className="text-xs font-semibold text-purple-600">
                    ⏱ Đã quét vào cổng lúc:{" "}
                    {new Date(t.checkedInAt).toLocaleTimeString("vi-VN")} -{" "}
                    {formatDate(t.checkedInAt)}
                  </p>
                )}
              </div>

              {/* Cột hành động & QR tương ứng trạng thái */}
              <div>
                {/* 1. ĐÃ DUYỆT PHÁT HÀNH: HIỆN QR ĐỘNG BẢO MẬT 30S */}
                {isConfirmed && (
                  <DynamicTicketQr
                    ticketId={t.id}
                    ticketCode={t.code}
                    attendeeName={t.attendeeName || memberCode}
                  />
                )}

                {/* 2. CHỜ CHUYỂN KHOẢN: HIỆN CỔNG QR EMVCO 2 PHÚT */}
                {isPendingPayment && (
                  <TransferQr
                    amount={t.amount}
                    memberCode={memberCode}
                    ticketId={t.id}
                    onClaimed={onRefresh}
                  />
                )}

                {/* 3. CHỜ ADMIN DUYỆT 24H: HIỆN THÔNG BÁO CHỜ */}
                {isPendingApproval && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-5 text-center text-xs text-blue-900">
                    <span className="text-2xl">⏳</span>
                    <p className="mt-2 font-extrabold text-sm">
                      Đang chờ duyệt cấp vé (24h)
                    </p>
                    <p className="mt-1 text-blue-700 leading-relaxed">
                      Bạn đã xác nhận chuyển khoản thành công{" "}
                      {t.lastSessionId && (
                        <span>(Phiên: <strong>{t.lastSessionId}</strong>)</span>
                      )}
                      . Ban Tổ chức sẽ đối soát sao kê với ngân hàng Sacombank
                      và kích hoạt mã QR vào cổng cho bạn.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
