"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminCameraScanner from "@/components/AdminCameraScanner";
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
  const [filterTab, setFilterTab] = useState<
    "all" | "pending_approval" | "confirmed" | "pending_payment"
  >("all");
  const [mainTab, setMainTab] = useState<"approve" | "sizes" | "transactions">("approve");
  const [showScanner, setShowScanner] = useState(false);

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

  async function handleDeleteTicket(t: TicketRow) {
    if (!window.confirm(`Xoá vé "${t.code}" của ${t.memberName}? Thao tác không thể hoàn tác.`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/registrations/${t.id}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(false, data.message || "Xóa vé thất bại.");
        return;
      }
      setTickets((prev) => prev ? prev.filter((x) => x.id !== t.id) : prev);
      flash(true, "Đã xóa vé.");
    } finally {
      setBusy(false);
    }
  }

  // =========================================================================
  // LƯU Ý QUAN TRỌNG VỀ REACT HOOKS:
  // useMemo BẮT BUỘC phải nằm TRƯỚC khối "đang tải" (early return) bên dưới.
  // Nếu đặt sau, lần render đầu (dữ liệu còn null) hook sẽ bị bỏ qua →
  // lỗi "change in the order of Hooks".
  // =========================================================================
  const q = query.trim().toUpperCase();
  const filteredTickets = useMemo(() => {
    return (tickets ?? []).filter((t) => {
      // Lọc theo tab
      if (filterTab === "pending_approval" && t.status !== "pending_approval") {
        return false;
      }
      if (filterTab === "confirmed" && t.status !== "confirmed") {
        return false;
      }
      if (
        filterTab === "pending_payment" &&
        t.status !== "pending_payment" &&
        (t.status as string) !== "pending"
      ) {
        return false;
      }

      // Lọc theo từ khóa tìm kiếm
      if (!q) return true;
      return [
        t.code,
        t.memberCode,
        t.memberName,
        t.memberPhone,
        t.attendeeName,
        t.lastSessionId,
        t.note,
      ].some((s) => (s ?? "").toUpperCase().includes(q));
    });
  }, [tickets, filterTab, q]);

  if (members === null || tickets === null) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center text-sm font-semibold text-slate-400">
        Đang tải dữ liệu đăng ký &amp; sao kê…
      </div>
    );
  }

  // =========================================================================
  // SAO KÊ TỰ ĐỘNG: CHỈ TÍNH TIỀN KHI VÉ ĐÃ THỰC SỰ ĐƯỢC DUYỆT PHÁT HÀNH
  // =========================================================================
  const confirmedTickets = tickets.filter((t) => t.status === "confirmed");
  const totalConfirmedRevenue = confirmedTickets.reduce(
    (sum, t) => sum + t.amount,
    0,
  );
  const totalConfirmedPeople = confirmedTickets.reduce(
    (sum, t) => sum + (t.type === "group" ? t.quantity : 1),
    0,
  );
  const pendingApprovalTickets = tickets.filter(
    (t) => t.status === "pending_approval",
  );
  const totalCheckedIn = tickets.filter((t) => t.checkedIn).length;

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

      {/* Main Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4 text-sm font-bold">
        {[
          { id: "approve", label: "Quản lý & Phê duyệt" },
          { id: "sizes", label: "Bảng tính Size áo" },
          { id: "transactions", label: "Thống kê Giao dịch" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMainTab(tab.id as typeof mainTab)}
            className={`rounded-xl px-4 py-2.5 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] ${
              mainTab === tab.id
                ? "bg-[#1d4ed8] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mainTab === "approve" && (
        <>
          {/* ===================================================================
              1. BẢNG SAO KÊ TÀI CHÍNH TỰ ĐỘNG (CHỈ TÍNH VÉ ĐÃ DUYỆT)
              =================================================================== */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              SAO KÊ TỰ ĐỘNG THEO THỜI GIAN THỰC
            </span>
            <h2 className="mt-2 text-2xl font-black text-slate-900">
              Tổng Quát Doanh Thu Vé &amp; Tiếp Nhận
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Hệ thống tự động sao kê: chỉ ghi nhận số tiền khi vé đã được Ban
              Tổ chức phê duyệt chính thức.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowScanner(!showScanner)}
            className="btn-lightship rounded-2xl bg-[#16a34a] px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-emerald-700"
          >
            {showScanner ? "✕ Đóng Camera Quét" : <><span className="material-symbols-rounded inline-block align-middle text-[1em]">photo_camera</span> Bật Camera Quét Vé (Check-in)</>}
          </button>
        </div>

        {/* Khung quét camera trực tiếp nếu bật */}
        {showScanner && (
          <div className="mt-6">
            <AdminCameraScanner
              onCheckInSuccess={(t) => {
                flash(true, `Check-in thành công: ${t.attendeeName || t.code}`);
                load();
              }}
            />
          </div>
        )}

        {/* 4 Khối thống kê KPI sao kê */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              <span className="material-symbols-rounded inline-block align-middle text-[1em]">payments</span> Thực nhận (Đã duyệt)
            </span>
            <p className="mt-2 text-2xl font-black text-emerald-700 sm:text-3xl">
              {formatVnd(totalConfirmedRevenue)}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-emerald-600">
              Từ {confirmedTickets.length} đơn vé hợp lệ
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              <span className="material-symbols-rounded inline-block align-middle text-[1em]">confirmation_number</span> Số người tham dự đã duyệt
            </span>
            <p className="mt-2 text-2xl font-black text-blue-700 sm:text-3xl">
              {totalConfirmedPeople} <span className="text-sm font-bold">suất</span>
            </p>
            <p className="mt-1 text-[11px] font-semibold text-blue-600">
              Bao gồm cá nhân &amp; tập thể
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              <span className="material-symbols-rounded inline-block align-middle text-[1em]">hourglass_empty</span> Vé chờ đối soát (24h)
            </span>
            <p className="mt-2 text-2xl font-black text-amber-700 sm:text-3xl">
              {pendingApprovalTickets.length} <span className="text-sm font-bold">vé</span>
            </p>
            <p className="mt-1 text-[11px] font-semibold text-amber-600">
              Người mua đã bấm &ldquo;Đã CK&rdquo;
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
              <span className="material-symbols-rounded inline-block align-middle text-[1em]">gps_fixed</span> Đã Check-in vào cổng
            </span>
            <p className="mt-2 text-2xl font-black text-purple-700 sm:text-3xl">
              {totalCheckedIn} <span className="text-sm font-bold">vé</span>
            </p>
            <p className="mt-1 text-[11px] font-semibold text-purple-600">
              Quét camera xác thực 30s
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================================
          2. DANH SÁCH VÉ & PHÊ DUYỆT CẤP VÉ
          =================================================================== */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              <span className="material-symbols-rounded inline-block align-middle text-[1em]">content_paste</span> Quản lý &amp; Phê duyệt vé ({tickets.length})
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Hệ thống tự động duyệt nếu AI đọc đúng (Khớp hoàn toàn). Cần đối soát thủ công các vé cảnh báo.
            </p>
          </div>

          {/* Ô tìm kiếm */}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo mã vé, Session ID, tên, SĐT…"
            className="w-full sm:w-72 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Filter tabs */}
        <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-100 pb-4 text-xs font-bold">
          {[
            { id: "all", label: `Tất cả (${tickets.length})` },
            {
              id: "pending_approval",
              label: <><span className="material-symbols-rounded inline-block align-middle text-[1em]">hourglass_empty</span> Chờ duyệt 24h ({pendingApprovalTickets.length})</>,
            },
            {
              id: "confirmed",
              label: <><span className="material-symbols-rounded inline-block align-middle text-[1em]">check_circle</span> Đã phát hành ({confirmedTickets.length})</>,
            },
            {
              id: "pending_payment",
              label: <><span className="material-symbols-rounded inline-block align-middle text-[1em]">schedule</span> Chờ chuyển khoản ({
                tickets.filter(
                  (t) =>
                    t.status === "pending_payment" ||
                    (t.status as string) === "pending",
                ).length
              })</>,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as typeof filterTab)}
              className={`rounded-xl px-3.5 py-2 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] ${
                filterTab === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Danh sách thẻ vé */}
        <div className="mt-6 space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
              Không có vé nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredTickets.map((t) => {
              const status = ticketStatusInfo(t.status);
              const isGroup = t.type === "group";
              const isConfirmed = t.status === "confirmed";

              return (
                <div
                  key={t.id}
                  className={`rounded-2xl border p-5 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] ${
                    t.status === "pending_approval"
                      ? "border-blue-300 bg-blue-50/40"
                      : isConfirmed
                        ? "border-emerald-200 bg-white"
                        : "border-slate-200 bg-slate-50/50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-black text-slate-900">
                        {t.code}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${status.cls}`}
                      >
                        {status.label}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                        {isGroup ? <><span className="material-symbols-rounded inline-block align-middle text-[1em]">group</span> Tập thể ({t.quantity} suất)</> : <><span className="material-symbols-rounded inline-block align-middle text-[1em]">person</span> Cá nhân</>}
                      </span>
                      {t.checkedIn && (
                        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-extrabold text-purple-700">
                          <span className="material-symbols-rounded inline-block align-middle text-[1em]">gps_fixed</span> Đã vào cổng
                        </span>
                      )}
                    </div>

                    <span className="text-base font-black text-slate-900">
                      {formatVnd(t.amount)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3 text-slate-600">
                    <div>
                      <p>
                        <strong className="text-slate-500">Người đăng ký:</strong>{" "}
                        <span className="font-bold text-slate-900">{t.memberName}</span> (
                        {t.memberPhone})
                      </p>
                      <p className="mt-0.5 font-mono text-blue-700 font-bold">
                        {t.memberCode}
                      </p>
                    </div>

                    <div>
                      <p>
                        <strong className="text-slate-500">Người dự / Size:</strong>{" "}
                        {t.attendeeName || t.memberName} ·{" "}
                        {sizesLabel(t.type, t.size, t.sizes) || "-"}
                      </p>
                      {t.lastSessionId && (
                        <p className="mt-0.5 font-mono text-indigo-600 font-extrabold">
                          Session CK: {t.lastSessionId}
                        </p>
                      )}
                    </div>

                    <div>
                      <p>
                        <strong className="text-slate-500">Ngày tạo:</strong>{" "}
                        {vi(t.createdAt)}
                      </p>
                      {t.note && (
                        <p className="mt-0.5 italic text-slate-500">
                          &ldquo;{t.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ảnh biên lai & Kết quả OCR */}
                  {t.receiptUrl && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-4 border-t border-slate-100 pt-4">
                      {/* Thumbnail ảnh */}
                      <a
                        href={t.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 group relative block h-24 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:h-32 sm:w-24 shadow-sm"
                        title="Bấm để xem ảnh lớn"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={t.receiptUrl}
                          alt="Biên lai"
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10 flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 text-xl drop-shadow-md"><span className="material-symbols-rounded inline-block align-middle text-[1em]">search</span></span>
                        </div>
                      </a>

                      {/* Thông tin OCR */}
                      <div className="flex-1 space-y-2 text-xs">
                        {t.ocrResult ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-700 uppercase tracking-wide">Trạng thái AI OCR:</span>
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                  t.ocrResult.confidence === "high"
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                    : t.ocrResult.confidence === "low"
                                      ? "bg-amber-100 text-amber-700 border border-amber-200"
                                      : "bg-rose-100 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {t.ocrResult.confidence === "high" ? "Khớp hoàn toàn" : t.ocrResult.confidence === "low" ? "Khớp 1 phần (Cần xem lại)" : "Không khớp"}
                              </span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <p className="rounded-md bg-slate-50 px-2.5 py-1.5 border border-slate-100">
                                <span className="text-slate-500 block text-[10px] uppercase mb-0.5">Số tiền đọc được</span>
                                <span className={`font-mono font-bold ${t.ocrResult.amount === t.amount ? "text-emerald-600" : "text-rose-600"}`}>
                                  {t.ocrResult.amount !== null ? formatVnd(t.ocrResult.amount) : "Không đọc được"}
                                </span>
                              </p>
                              <p className="rounded-md bg-slate-50 px-2.5 py-1.5 border border-slate-100">
                                <span className="text-slate-500 block text-[10px] uppercase mb-0.5">Thời gian CK</span>
                                <span className="font-mono text-slate-700 font-semibold">{t.ocrResult.time || "Không rõ"}</span>
                              </p>
                              <p className="rounded-md bg-slate-50 px-2.5 py-1.5 border border-slate-100 sm:col-span-2">
                                <span className="text-slate-500 block text-[10px] uppercase mb-0.5">Nội dung CK</span>
                                <span className="font-mono text-slate-800 break-all font-semibold">
                                  {t.ocrResult.content || "Không đọc được"}
                                </span>
                              </p>
                            </div>
                            <p className="text-[11px] text-slate-500 italic mt-1 leading-relaxed">
                              {t.ocrResult.note}
                            </p>
                          </>
                        ) : (
                          <div className="flex h-full items-center text-slate-400 italic">
                            Biên lai chưa được phân tích OCR
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Thanh nút hành động duyệt vé */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="text-[11px] font-medium text-slate-500">
                      {isConfirmed
                        ? (t.ocrResult?.confidence === "high" 
                            ? <><span className="material-symbols-rounded inline-block align-middle text-[1em]">check_circle</span> AI đã phê duyệt tự động. Vé đã vào sao kê và có mã QR động 30s.</>
                            : <><span className="material-symbols-rounded inline-block align-middle text-[1em]">check_circle</span> Vé đã được admin duyệt thủ công. Kích hoạt mã QR động 30s.</>)
                        : t.status === "pending_approval"
                          ? <><span className="material-symbols-rounded inline-block align-middle text-[1em]">warning</span> Chờ duyệt thủ công do AI phát hiện rủi ro (lệch tiền/nội dung).</>
                          : <><span className="material-symbols-rounded inline-block align-middle text-[1em]">schedule</span> Đang chờ thành viên thực hiện chuyển khoản.</>}
                    </span>

                    <div className="flex gap-2">
                      {!isConfirmed && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            act(
                              t,
                              "confirmed",
                              `Đã duyệt & phát hành vé ${t.code}`,
                            )
                          }
                          className="rounded-xl bg-[#16a34a] px-5 py-2.5 text-xs font-black text-white shadow-xs hover:bg-emerald-700 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] disabled:opacity-50"
                        >
                          Duyệt thủ công &amp; Cấp vé
                        </button>
                      )}

                      {t.status !== "rejected" && !isConfirmed && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            act(t, "rejected", `Đã từ chối vé ${t.code}`)
                          }
                          className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                      )}

                      {isConfirmed && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            act(
                              t,
                              "pending_approval",
                              `Đã hoàn tác duyệt vé ${t.code}`,
                            )
                          }
                          className="rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-200 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]"
                        >
                          Hoàn tác về chờ duyệt
                        </button>
                      )}

                      {t.receiptUrl && (
                        <a
                          href={t.receiptUrl}
                          target="_blank"
                          download
                          className="rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-rounded text-[14px]">download</span> Biên lai
                        </a>
                      )}
                      
                      {isConfirmed && (
                        <a
                          href={`/tra-cuu/${t.code}`}
                          target="_blank"
                          className="rounded-xl bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-rounded text-[14px]">visibility</span> Thẻ vé
                        </a>
                      )}

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDeleteTicket(t)}
                        className="rounded-xl bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-rounded text-[14px]">delete</span> Xóa vé
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ===================================================================
          3. THÀNH VIÊN ĐÃ ĐĂNG KÝ
          =================================================================== */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-extrabold text-slate-900">
          <span className="material-symbols-rounded inline-block align-middle text-[1em]">group</span> Danh sách tài khoản thành viên ({members.length})
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 text-sm">
                  {m.name}
                </span>
                <span className="font-mono text-[11px] font-extrabold text-[#1d4ed8]">
                  {m.code}
                </span>
              </div>
              <p className="mt-1 text-slate-500"><span className="material-symbols-rounded inline-block align-middle text-[1em]">call</span> {m.phone}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5 font-bold">
                <span className="rounded-md bg-white px-2 py-0.5 border border-slate-200 text-slate-700">
                  {m.ticketCount} vé
                </span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-100">
                  Đã duyệt: {formatVnd(m.confirmedAmount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
        </>
      )}

      {mainTab === "sizes" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-extrabold text-slate-900">Bảng tính Size Áo Đăng ký</h2>
          <p className="mt-2 text-sm text-slate-500">Thống kê chi tiết các size áo đã được đăng ký (chỉ tính vé đã duyệt).</p>
          <div className="mt-6">
            <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Size</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Số lượng</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {Object.entries(
                  confirmedTickets.reduce((acc, t) => {
                    if (t.type === "individual" && t.size) {
                      acc[t.size] = (acc[t.size] || 0) + 1;
                    } else if (t.type === "group" && t.sizes) {
                      Object.entries(t.sizes).forEach(([size, qty]) => {
                        acc[size] = (acc[size] || 0) + qty;
                      });
                    }
                    return acc;
                  }, {} as Record<string, number>)
                ).sort((a, b) => {
                  const order = { S: 1, M: 2, L: 3, XL: 4, "2XL": 5, "3XL": 6 };
                  return (order[a[0] as keyof typeof order] || 99) - (order[b[0] as keyof typeof order] || 99);
                }).map(([size, count]) => (
                  <tr key={size}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{size}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{count} áo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {mainTab === "transactions" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-extrabold text-slate-900">Thống kê Giao dịch</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng thu dự kiến</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{formatVnd(tickets.reduce((sum, t) => sum + (t.status !== "rejected" && t.status !== "cancelled" ? t.amount : 0), 0))}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Đã thu (Khớp OCR/Duyệt tay)</p>
              <p className="mt-2 text-2xl font-black text-emerald-700">{formatVnd(totalConfirmedRevenue)}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Chờ chuyển khoản</p>
              <p className="mt-2 text-2xl font-black text-amber-700">
                {formatVnd(tickets.filter(t => t.status === "pending" || t.status === "pending_payment").reduce((sum, t) => sum + t.amount, 0))}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
