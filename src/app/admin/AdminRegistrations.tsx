"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TransferQr from "@/components/TransferQr";
import { matchTransferContent } from "@/lib/emvqr";
import {
  formatVnd,
  sizesLabel,
  ticketStatusInfo,
  type TicketView,
} from "@/lib/ticket-view";

type MemberRow = {
  id: string;
  name: string;
  phone: string;
  code: string;
  createdAt: string;
  ticketCount: number;
  peopleCount: number;
  confirmedAmount: number;
  pendingAmount: number;
};

type TicketRow = TicketView & {
  memberName: string;
  memberPhone: string;
  memberCode: string;
};

type Banner = { ok: boolean; text: string } | null;

function vi(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AdminRegistrations({
  onAuthError,
}: {
  onAuthError?: () => void;
}) {
  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [tickets, setTickets] = useState<TicketRow[] | null>(null);
  const [banner, setBanner] = useState<Banner>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const flash = useCallback((ok: boolean, text: string) => {
    setBanner({ ok, text });
    setTimeout(() => setBanner(null), 4000);
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/registrations", { cache: "no-store" });
    if (res.status === 401) {
      onAuthError?.();
      return;
    }
    const data = await res.json();
    if (data.ok) {
      setMembers(data.members as MemberRow[]);
      setTickets(data.tickets as TicketRow[]);
    }
  }, [onAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(
    t: TicketRow,
    status: TicketView["status"],
    okText: string,
  ) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, status }),
      });
      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(false, data.message || "Thao tác thất bại.");
        return;
      }
      setTickets((prev) =>
        prev
          ? prev.map((x) =>
              x.id === t.id ? { ...x, status: data.ticket.status } : x,
            )
          : prev,
      );
      flash(true, okText);
    } finally {
      setBusy(false);
    }
  }

  if (members === null || tickets === null) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center text-sm font-semibold text-slate-400">
        Đang tải dữ liệu đăng ký…
      </div>
    );
  }

  const pendingTickets = tickets.filter((t) => t.status === "pending").length;

  const q = query.trim().toUpperCase();
  const visibleTickets = useMemo(() => {
    if (!q) return tickets;
    return tickets.filter((t) => {
      if (matchTransferContent(t.memberCode, query)) return true;
      return [
        t.code,
        t.memberCode,
        t.memberName,
        t.memberPhone,
        t.attendeeName,
        t.note,
      ].some((s) => (s ?? "").toUpperCase().includes(q));
    });
  }, [tickets, q, query]);

  return (
    <div className="mt-8 space-y-10">
      {banner && (
        <div
          className={`rounded-2xl px-5 py-3 text-sm font-bold ${
            banner.ok
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-600"
          }`}
        >
          {banner.text}
        </div>
      )}

      {/* Thành viên đã đăng ký */}
      <section>
        <h2 className="text-xl font-extrabold text-slate-900">
          👥 Thành viên ({members.length}) - mã định danh duyệt cổng
        </h2>
        {members.length === 0 ? (
          <div className="mt-4 rounded-3xl bg-white p-8 text-center text-sm text-slate-400">
            Chưa có thành viên nào đăng ký.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {members.map((m) => (
              <div key={m.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-base font-extrabold text-slate-900">
                  {m.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">📞 {m.phone}</p>
                <p className="mt-2 font-mono text-lg font-extrabold tracking-wider text-[#1d4ed8]">
                  {m.code}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-extrabold">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    {m.ticketCount} vé
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    {m.peopleCount} người
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                    Đã nhận {formatVnd(m.confirmedAmount)}
                  </span>
                  {m.pendingAmount > 0 && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                      Chờ {formatVnd(m.pendingAmount)}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Đăng ký ngày {vi(m.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Danh sách vé */}
      <section>
        <h2 className="text-xl font-extrabold text-slate-900">
          🎟 Vé đăng ký ({tickets.length}) - {pendingTickets} chờ thanh toán
        </h2>

        {/* Duyệt chuyển khoản - tìm vé theo nội dung CK */}
        <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <label
            htmlFor="ck-search"
            className="text-xs font-extrabold uppercase tracking-wider text-slate-500"
          >
            💰 Duyệt chuyển khoản - dán nội dung CK từ thông báo ngân hàng
          </label>
          <input
            id="ck-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="VD: NCT40-JZ6FEY-K3A (hoặc mã vé, SĐT, tên…)"
            className="mt-2 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none"
          />
          {q && (
            <p className="mt-2 text-xs font-bold text-slate-500">
              Đang lọc {visibleTickets.length}/{tickets.length} vé theo:{" "}
              <span className="font-mono text-slate-700">{query}</span>{" "}
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-[#1d4ed8] underline"
              >
                xoá lọc
              </button>
            </p>
          )}
        </div>

        {visibleTickets.length === 0 ? (
          <div className="mt-4 rounded-3xl bg-white p-8 text-center text-sm text-slate-400">
            {q
              ? "Không có vé nào khớp nội dung CK / từ khóa tìm kiếm."
              : "Chưa có vé nào."}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {visibleTickets.map((t) => {
              const status = ticketStatusInfo(t.status);
              const isGroup = t.type === "group";
              return (
                <div key={t.id} className="rounded-3xl bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${
                            isGroup
                              ? "bg-[#1d4ed8]/10 text-[#1d4ed8]"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {isGroup ? "👥 Tập thể" : "👤 Cá nhân"}
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
                      <p className="mt-2 text-base font-extrabold text-slate-900">
                        {isGroup
                          ? `${t.quantity} suất · ${formatVnd(t.amount)}`
                          : `${t.attendeeName} · Size ${t.size} · ${formatVnd(t.amount)}`}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {t.memberName} · {t.memberPhone} ·{" "}
                        <span className="font-mono font-bold">
                          {t.memberCode}
                        </span>
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        Size: {sizesLabel(t.type, t.size, t.sizes) || "-"}
                        {t.note ? ` · 📝 ${t.note}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {vi(t.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {t.status !== "confirmed" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            act(t, "confirmed", `Đã xác nhận vé ${t.code}.`)
                          }
                          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50"
                        >
                          ✅ Đã nhận tiền
                        </button>
                      )}
                      {t.status !== "pending" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            act(t, "pending", `Vé ${t.code} về trạng thái chờ.`)
                          }
                          className="rounded-full bg-amber-100 px-4 py-2 text-xs font-extrabold text-amber-700 disabled:opacity-50"
                        >
                          ⏳ Chờ lại
                        </button>
                      )}
                      {t.status !== "cancelled" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            act(t, "cancelled", `Đã hủy vé ${t.code}.`)
                          }
                          className="rounded-full bg-rose-100 px-4 py-2 text-xs font-extrabold text-rose-600 disabled:opacity-50"
                        >
                          🚫 Hủy
                        </button>
                      )}
                    </div>
                  </div>
                  {isGroup && t.amount > 0 && t.status === "pending" && (
                    <div className="mt-3">
                      <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        💰 Duyệt chuyển khoản - QR EMVCo + nội dung CK dự kiến
                        (xoay mỗi 2 phút)
                      </p>
                      <TransferQr
                        amount={t.amount}
                        memberCode={t.memberCode}
                        size={132}
                        admin
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="text-center text-xs text-slate-400">
        Mã định danh (NCT40-…) là vé duyệt vào cổng - đối chiếu khi check-in
        ngày 15/11/2026.
      </p>
    </div>
  );
}
