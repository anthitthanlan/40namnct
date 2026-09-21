"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  formatVnd,
  sizesLabel,
  invitationStatusInfo,
  type InvitationView,
} from "@/lib/invitation-view";

type MemberRow = {
  id: string;
  name: string;
  phone: string;
  code: string;
  createdAt: string;
  invitationCount: number;
  peopleCount: number;
  confirmedAmount: number;
  pendingAmount: number;
};

type InvitationRow = InvitationView & {
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [invitations, setInvitations] = useState<InvitationRow[] | null>(null);
  const [banner, setBanner] = useState<Banner>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending_approval" | "confirmed" | "pending_payment" | "rejected" | "cancelled" | "checked_in" | "shirt_received"
  >("pending_approval");
  const [typeFilter, setTypeFilter] = useState<"all" | "individual" | "group">("all");
  const [mobileSubTab, setMobileSubTab] = useState<"overview" | "list">("overview");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [mainTab, setMainTab] = useState<"approve" | "sizes" | "transactions" | "logs">("approve");

  const flash = useCallback((ok: boolean, text: string) => {
    setBanner({ ok, text });
    setTimeout(() => setBanner(null), 4000);
  }, []);

  const [page, setPage] = useState(1);

  const [logs, setLogs] = useState<any[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/registrations", { cache: "no-store" });
    if (res.status === 401) {
      onAuthError?.();
      return;
    }
    const data = await res.json();
    if (data.ok) {
      setMembers(data.members as MemberRow[]);
      setInvitations(data.invitations as InvitationRow[]);
      if (data.logs) {
        setLogs(data.logs);
      }
    }
  }, [onAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(
    t: InvitationRow,
    status: InvitationView["status"],
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
      setInvitations((prev) =>
        prev
          ? prev.map((x) =>
              x.id === t.id ? { ...x, status: data.invitation.status } : x,
            )
          : prev,
      );
      flash(true, okText);
    } finally {
      setBusy(false);
    }
  }

  async function toggleShirt(t: InvitationRow) {
    setBusy(true);
    const newStatus = !t.shirtReceived;
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, action: "update_shirt", shirtReceived: newStatus }),
      });
      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(false, data.message || "Lỗi cập nhật nhận áo.");
        return;
      }
      setInvitations((prev) =>
        prev
          ? prev.map((x) =>
              x.id === t.id ? { ...x, shirtReceived: data.invitation.shirtReceived } : x,
            )
          : prev,
      );
      flash(true, newStatus ? `Đã đánh dấu ${t.code} nhận áo.` : `Bỏ đánh dấu nhận áo ${t.code}.`);
    } finally {
      setBusy(false);
    }
  }

  function handleStatClick(status: typeof statusFilter) {
    setStatusFilter(status);
    setTypeFilter("all");
    setMobileSubTab("list");
  }

  async function handleDeleteInvitation(t: InvitationRow) {
    if (!window.confirm(`Xoá thư mời "${t.code}" của ${t.memberName}? Thao tác không thể hoàn tác.`)) {
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
        flash(false, data.message || "Xóa thư mời thất bại.");
        return;
      }
      setInvitations((prev) => prev ? prev.filter((x) => x.id !== t.id) : prev);
      flash(true, "Đã xóa thư mời.");
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

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, typeFilter]);

  const filteredInvitations = useMemo(() => {
    return (invitations ?? []).filter((t) => {
      if (typeFilter === "individual" && t.type !== "individual") {
        return false;
      }
      if (typeFilter === "group" && t.type !== "group") {
        return false;
      }

      // Lọc theo tab trạng thái
      if (statusFilter === "pending_approval" && t.status !== "pending_approval") {
        return false;
      }
      if (statusFilter === "confirmed" && t.status !== "confirmed") {
        return false;
      }
      if (
        statusFilter === "pending_payment" &&
        t.status !== "pending_payment" &&
        (t.status as string) !== "pending"
      ) {
        return false;
      }
      if (statusFilter === "rejected" && t.status !== "rejected") {
        return false;
      }
      if (statusFilter === "cancelled" && t.status !== "cancelled") {
        return false;
      }
      if (statusFilter === "checked_in" && !t.checkedIn) {
        return false;
      }
      if (statusFilter === "shirt_received" && !t.shirtReceived) {
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
  }, [invitations, statusFilter, typeFilter, q]);

  if (members === null || invitations === null) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center text-sm font-semibold text-slate-400">
        Đang tải dữ liệu đăng ký &amp; sao kê…
      </div>
    );
  }

  // =========================================================================
  // SAO KÊ TỰ ĐỘNG: CHỈ TÍNH TIỀN KHI VÉ ĐÃ THỰC SỰ ĐƯỢC DUYỆT PHÁT HÀNH
  // =========================================================================
  const confirmedInvitations = invitations.filter((t) => t.status === "confirmed");
  const totalConfirmedRevenue = confirmedInvitations.reduce(
    (sum, t) => sum + t.amount,
    0,
  );
  const totalConfirmedPeople = confirmedInvitations.reduce(
    (sum, t) => sum + (t.type === "group" ? t.quantity : 1),
    0,
  );
  const pendingApprovalInvitations = invitations.filter(
    (t) => t.status === "pending_approval",
  );
  const totalCheckedIn = invitations.filter((t) => t.checkedIn).length;
  const totalShirtInvs = invitations.filter((t) => t.shirtReceived).length;
  const totalShirtsReceived = invitations.filter((t) => t.shirtReceived).reduce((sum, t) => sum + (t.snacks || 0), 0);

  return (
    <div className="mt-4 space-y-6 sm:mt-8 sm:space-y-10">
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
      <div className="mb-6">
        <div className="sm:hidden relative z-50 mb-6">
          <div
            className="t-morph shadow-sm"
            data-open={isMenuOpen}
            style={{ "--morph-height-open": logs.length > 0 ? "192px" : "148px" } as React.CSSProperties}
          >
            <div className="t-morph-menu">
              {[
                { id: "approve", label: "Quản lý Đăng ký" },
                { id: "sizes", label: "Thống kê Size áo" },
                { id: "transactions", label: "Thống kê Giao dịch" },
                ...(logs.length > 0 ? [{ id: "logs", label: "Nhật ký Hệ thống" }] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMainTab(tab.id as typeof mainTab);
                    setIsMenuOpen(false);
                  }}
                  className={`flex-1 flex items-center px-4 text-left text-sm font-bold rounded-xl transition-colors ${
                    mainTab === tab.id
                      ? "bg-slate-100 text-blue-600"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <button
              type="button"
              className="t-morph-plus text-sm font-bold text-slate-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
            >
              <span>
                {mainTab === "approve"
                  ? "Quản lý Đăng ký"
                  : mainTab === "sizes"
                    ? "Thống kê Size áo"
                    : mainTab === "transactions"
                      ? "Thống kê Giao dịch"
                      : "Nhật ký Hệ thống"}
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden sm:flex flex-wrap gap-2 border-b border-slate-100 pb-4 text-sm font-bold">
          {[
            { id: "approve", label: "Quản lý Đăng ký" },
            { id: "sizes", label: "Thống kê Size áo" },
            { id: "transactions", label: "Thống kê Giao dịch" },
            ...(logs.length > 0 ? [{ id: "logs", label: "Nhật ký Hệ thống" }] : []),
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
      </div>

      {mainTab === "approve" && (
        <>
          {/* Mobile Sub-Tabs (Overview / List) */}
          <div className="relative flex sm:hidden p-1 bg-slate-100 rounded-xl mb-6">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                mobileSubTab === "overview" ? "translate-x-0" : "translate-x-full"
              }`}
            />
            <button
              type="button"
              onClick={() => setMobileSubTab("overview")}
              className={`relative z-10 flex-1 py-2 text-sm font-bold transition-colors duration-300 ${
                mobileSubTab === "overview"
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Tổng quát
            </button>
            <button
              type="button"
              onClick={() => setMobileSubTab("list")}
              className={`relative z-10 flex-1 py-2 text-sm font-bold transition-colors duration-300 ${
                mobileSubTab === "list"
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Danh sách
            </button>
          </div>

          {/* ===================================================================
              1. BẢNG SAO KÊ TÀI CHÍNH TỰ ĐỘNG (CHỈ TÍNH VÉ ĐÃ DUYỆT)
              =================================================================== */}
          <section className={`sm:rounded-3xl sm:bg-white sm:p-8 ${mobileSubTab === "overview" ? "block anim-slide-left sm:anim-none" : "hidden sm:block"}`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>

            <h2 className="mt-2 text-2xl font-black text-slate-900">
              Tổng quan
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Hệ thống tự động sao kê: chỉ ghi nhận số tiền khi thư mời đã được Ban
              Tổ chức phê duyệt chính thức.
            </p>
          </div>

        </div>

        {/* 5 Khối thống kê KPI sao kê */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div onClick={() => handleStatClick("confirmed")} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
              <span className="material-symbols-rounded inline-block align-middle text-[14px]">payments</span> Thực nhận (Đã duyệt)
            </span>
            <div className="mt-2">
              <p className="text-xl font-black text-white sm:text-2xl">
                {formatVnd(totalConfirmedRevenue)}
              </p>
              <p className="mt-1 text-[10px] font-semibold text-emerald-100">
                Từ {confirmedInvitations.length} đơn hợp lệ
              </p>
            </div>
          </div>

          <div onClick={() => handleStatClick("confirmed")} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
              <span className="material-symbols-rounded inline-block align-middle text-[14px]">confirmation_number</span> Người dự duyệt
            </span>
            <div className="mt-2">
              <p className="text-xl font-black text-white sm:text-2xl">
                {totalConfirmedPeople} <span className="text-xs font-bold">suất</span>
              </p>
              <p className="mt-1 text-[10px] font-semibold text-blue-100">
                Bao gồm cá nhân &amp; tập thể
              </p>
            </div>
          </div>

          <div onClick={() => handleStatClick("pending_approval")} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
              <span className="material-symbols-rounded inline-block align-middle text-[14px]">hourglass_empty</span> Chờ đối soát (24h)
            </span>
            <div className="mt-2">
              <p className="text-xl font-black text-white sm:text-2xl">
                {pendingApprovalInvitations.length} <span className="text-xs font-bold">thư mời</span>
              </p>
              <p className="mt-1 text-[10px] font-semibold text-amber-100">
                Đã báo chuyển khoản
              </p>
            </div>
          </div>

          <div onClick={() => handleStatClick("checked_in")} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
              <span className="material-symbols-rounded inline-block align-middle text-[14px]">gps_fixed</span> Đã Check-in cổng
            </span>
            <div className="mt-2">
              <p className="text-xl font-black text-white sm:text-2xl">
                {totalCheckedIn} <span className="text-xs font-bold">thư mời</span>
              </p>
              <p className="mt-1 text-[10px] font-semibold text-purple-100">
                Quét QR code thành công
              </p>
            </div>
          </div>

          <div onClick={() => handleStatClick("shirt_received")} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
              <span className="material-symbols-rounded inline-block align-middle text-[14px]">checkroom</span> Đã trao áo / F&B
            </span>
            <div className="mt-2 flex flex-col gap-1">
              <p className="text-xl font-black text-white sm:text-2xl">
                {totalShirtsReceived} <span className="text-xs font-bold">áo đã trao</span>
              </p>
              <p className="text-[11px] font-bold text-pink-100">
                Cho {totalShirtInvs} thư mời
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          2. DANH SÁCH VÉ & PHÊ DUYỆT CẤP VÉ
          =================================================================== */}
      <section className={`mt-8 sm:mt-0 sm:rounded-3xl sm:bg-white sm:p-8 ${mobileSubTab === "list" ? "block anim-slide-right sm:anim-none" : "hidden sm:block"}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Quản lý Đăng ký ({invitations.length})
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Hệ thống tự động duyệt nếu AI đọc đúng (Khớp hoàn toàn). Cần đối soát thủ công các thư mời cảnh báo.
            </p>
          </div>

          {/* Ô tìm kiếm */}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo mã thư mời, Session ID, tên, SĐT…"
            className="w-full sm:w-72 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Lọc danh sách (Button mở Modal) */}
        <div className="mt-5 border-b border-slate-100 pb-4">
          <button
            type="button"
            onClick={() => setShowFilterModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="material-symbols-rounded text-[18px]">filter_list</span>
            Bộ lọc hiện tại: {
              statusFilter === "all" ? "Tất cả" :
              statusFilter === "pending_approval" ? "Chờ duyệt 24h" :
              statusFilter === "confirmed" ? "Đã duyệt" :
              statusFilter === "pending_payment" ? "Chờ thanh toán" :
              statusFilter === "checked_in" ? "Đã check-in" :
              statusFilter === "shirt_received" ? "Đã nhận áo" :
              statusFilter === "rejected" ? "Đã từ chối" :
              statusFilter === "cancelled" ? "Đã hủy" : statusFilter
            }
            {typeFilter !== "all" && ` - ${typeFilter === "individual" ? "Cá nhân" : "Tập thể"}`}
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] text-blue-700">
              {filteredInvitations.length}
            </span>
          </button>
        </div>

        {/* Danh sách thẻ thư mời */}
        <div className="mt-6 space-y-4">
          {filteredInvitations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
              Không có thư mời nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <>
              {filteredInvitations.slice(0, page * 20).map((t) => {
                const status = invitationStatusInfo(t.status);
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

                    <div className="flex flex-col items-end gap-1 text-right">
                      <span className="text-base font-black text-slate-900">
                        {formatVnd(t.amount)}
                      </span>
                      {t.amount === 0 && (
                        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-700">
                          <span className="material-symbols-rounded inline-block align-middle text-[1em]">card_giftcard</span> Miễn phí
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3 text-slate-600">
                    <div>
                      <p>
                        <strong className="text-slate-500">Người đăng ký:</strong>{" "}
                        <span className="font-bold text-slate-900">{t.memberName}</span> (
                        {t.memberPhone})
                      </p>
                    </div>

                    <div>
                      <p>
                        <strong className="text-slate-500">Người dự / Niên khóa:</strong>{" "}
                        {t.attendeeName || t.memberName} {t.nienKhoa ? `· ${t.nienKhoa}` : ""}
                      </p>
                      <p className="mt-0.5">
                        <strong className="text-slate-500">Đăng ký Áo &amp; F&B:</strong>{" "}
                        <span className="font-bold text-slate-900">{t.snacks} suất</span>{" "}
                        <span className="text-[11px]">({sizesLabel(t.type, t.size, t.sizes) || "-"})</span>
                      </p>
                      {t.lastSessionId && (
                        <p className="mt-0.5 font-mono text-indigo-600 font-extrabold break-all">
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
                              {(t.ocrResult as any).transactionId && (
                                <p className="rounded-md bg-slate-50 px-2.5 py-1.5 border border-slate-100">
                                  <span className="text-slate-500 block text-[10px] uppercase mb-0.5">Mã GD / Số tham chiếu</span>
                                  <span className="font-mono text-slate-800 font-bold">{(t.ocrResult as any).transactionId}</span>
                                </p>
                              )}
                              {(t.ocrResult as any).trustScore !== undefined && (
                                <p className="rounded-md bg-slate-50 px-2.5 py-1.5 border border-slate-100">
                                  <span className="text-slate-500 block text-[10px] uppercase mb-0.5">Độ tin cậy của ảnh</span>
                                  <span className={`font-mono font-bold ${(t.ocrResult as any).trustScore >= 60 ? "text-emerald-600" : "text-rose-600"}`}>
                                    {(t.ocrResult as any).trustScore}% {(t.ocrResult as any).trustScore < 60 && "(Cảnh báo: Có thể làm giả)"}
                                  </span>
                                </p>
                              )}
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

                  {/* Thanh nút hành động duyệt thư mời */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="text-[11px] font-medium text-slate-500">
                      {isConfirmed
                        ? (t.ocrResult?.confidence === "high" 
                            ? <><span className="material-symbols-rounded inline-block align-middle text-[1em]">check_circle</span> AI đã phê duyệt tự động. Thư mời đã vào sao kê và có mã QR động 30s.</>
                            : <><span className="material-symbols-rounded inline-block align-middle text-[1em]">check_circle</span> Thư mời đã được admin duyệt thủ công. Kích hoạt mã QR động 30s.</>)
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
                              `Đã duyệt & phát hành thư mời ${t.code}`,
                            )
                          }
                          className="rounded-xl bg-[#16a34a] px-5 py-2.5 text-xs font-black text-white shadow-xs hover:bg-emerald-700 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] disabled:opacity-50"
                        >
                          Duyệt thủ công &amp; Cấp thư mời
                        </button>
                      )}

                      {t.status !== "rejected" && !isConfirmed && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            act(t, "rejected", `Đã từ chối thư mời ${t.code}`)
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
                          onClick={() => toggleShirt(t)}
                          className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] inline-flex items-center gap-1 ${
                            t.shirtReceived
                              ? "bg-pink-100 text-pink-700 hover:bg-pink-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          <span className="material-symbols-rounded text-[14px]">
                            {t.shirtReceived ? "check_box" : "check_box_outline_blank"}
                          </span>
                          {t.shirtReceived ? "Đã trao áo" : "Chưa trao áo"}
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
                              `Đã hoàn tác duyệt thư mời ${t.code}`,
                            )
                          }
                          className="rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-200 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]"
                        >
                          Hoàn tác
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
                          href={`/thu-moi?id=${t.id}`}
                          target="_blank"
                          className="rounded-xl bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-rounded text-[14px]">visibility</span> Thẻ thư mời
                        </a>
                      )}

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDeleteInvitation(t)}
                        className="rounded-xl bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-rounded text-[14px]">delete</span> Xóa thư mời
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

              {filteredInvitations.length > page * 20 && (
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Tải thêm thư mời (Đã hiển thị {page * 20} / {filteredInvitations.length})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>


        </>
      )}

      {mainTab === "sizes" && (
        <section className="mt-8 sm:mt-0 sm:rounded-3xl sm:bg-white sm:p-8">
          <h2 className="text-xl font-extrabold text-slate-900">Thống kê Size Áo Đăng ký</h2>
          <p className="mt-2 text-sm text-slate-500">Thống kê chi tiết các size áo đã được đăng ký (chỉ tính thư mời đã duyệt).</p>
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
                  confirmedInvitations.reduce((acc, t) => {
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
        <section className="mt-8 sm:mt-0 sm:rounded-3xl sm:bg-white sm:p-8">
          <h2 className="text-xl font-extrabold text-slate-900">Thống kê Giao dịch</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-slate-100 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Tổng thu dự kiến</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{formatVnd(invitations.reduce((sum, t) => sum + (t.status !== "rejected" && t.status !== "cancelled" ? t.amount : 0), 0))}</p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Đã thu (Khớp OCR/Duyệt tay)</p>
              <p className="mt-2 text-2xl font-black text-emerald-800">{formatVnd(totalConfirmedRevenue)}</p>
            </div>
            <div className="rounded-2xl bg-amber-100 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Chờ duyệt</p>
              <p className="mt-2 text-2xl font-black text-amber-800">
                {formatVnd(invitations.filter(t => t.status === "pending" || t.status === "pending_payment").reduce((sum, t) => sum + t.amount, 0))}
              </p>
            </div>
          </div>
        </section>
      )}

      {mainTab === "logs" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-extrabold text-slate-900">
            <span className="material-symbols-rounded inline-block align-middle text-[1em]">history</span> Nhật ký Hệ thống (Action Logs)
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Ghi nhận mọi thao tác phê duyệt, từ chối, xóa bỏ của Ban Quản trị. Chỉ hiển thị với Super Admin.
          </p>

          <div className="mt-6 space-y-4">
            {logs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                Chưa có thao tác nào được ghi nhận.
              </div>
            ) : (
              [...logs].reverse().map((log) => (
                <div key={log.id} className="flex gap-4 p-4 border border-slate-100 bg-slate-50/50 rounded-2xl">
                  <div className="shrink-0 pt-1">
                    <span className={`material-symbols-rounded text-[20px] ${log.action === "delete_invitation" ? "text-rose-500" : "text-blue-500"}`}>
                      {log.action === "delete_invitation" ? "delete_forever" : "edit_document"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{log.details}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Thực hiện bởi: <span className="font-semibold text-slate-700">{log.adminName}</span> ({log.adminRole})
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                      ID Tác động: {log.entityId} · Lúc: {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Filter Modal */}
      {showFilterModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h3 className="text-lg font-bold text-slate-900">Bộ lọc danh sách</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <span className="material-symbols-rounded block text-xl">close</span>
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-5 space-y-6">
              {/* Nhóm 1: Loại đăng ký */}
              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Loại đăng ký
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "Tất cả" },
                    { id: "individual", label: "Cá nhân" },
                    { id: "group", label: "Tập thể" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setTypeFilter(tab.id as typeof typeFilter)}
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                        typeFilter === tab.id
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nhóm 2: Trạng thái */}
              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Trạng thái đăng ký
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "Tất cả" },
                    { id: "pending_approval", label: "Chờ duyệt 24h" },
                    { id: "confirmed", label: "Đã duyệt" },
                    { id: "pending_payment", label: "Chờ thanh toán" },
                    { id: "checked_in", label: "Đã check-in" },
                    { id: "shirt_received", label: "Đã nhận áo" },
                    { id: "rejected", label: "Đã từ chối" },
                    { id: "cancelled", label: "Đã hủy" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                        statusFilter === tab.id
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 p-5 bg-slate-50">
              <button
                onClick={() => setShowFilterModal(false)}
                className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
              >
                Hiển thị {filteredInvitations.length} kết quả
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
