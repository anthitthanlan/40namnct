"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  invitationStatusInfo,
  formatVnd,
  sizesLabel,
} from "@/lib/invitation-view";
import type { InvitationStatus } from "@/lib/invitation-view";

type InvitationResult = {
  id: string;
  code: string;
  type: "individual" | "group";
  attendeeName: string;
  quantity: number;
  sizes: Record<string, number>;
  amount: number;
  status: InvitationStatus;
  note: string;
  checkedIn?: boolean;
  createdAt: string;
};

type LookupResult = {
  member: { name: string };
  invitations: InvitationResult[];
};

export default function TraCuuClient() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [expandedInvitation, setExpandedInvitation] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    if (name.trim().length < 2) {
      setError("Vui lòng nhập họ tên của bạn.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      setError("Vui lòng nhập số điện thoại hợp lệ (VD: 0912345678).");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/tra-cuu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      let data;
      try {
        data = await res.json();
      } catch (err) {
        setError("Lỗi máy chủ (Không thể đọc phản hồi). Vui lòng thử lại.");
        return;
      }

      if (data.isFallback) {
        console.warn("⚠️ [FALLBACK_ACTIVATED] Máy chủ Backend FastAPI không phản hồi. Hệ thống đang sử dụng dữ liệu Local!");
      }

      if (!data.ok) {
        setError(data.message || "Không tìm thấy thông tin.");
        return;
      }
      setResult({ member: data.member, invitations: data.invitations });
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  function resetSearch() {
    setResult(null);
    setError("");
    setExpandedInvitation(null);
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6">
      <div className={`flex flex-col lg:flex-row gap-8 items-start ${result ? "justify-start" : "justify-center"} transition-all duration-500`}>
        {/* Khung Tra cứu */}
        <div className="w-full lg:w-[480px] shrink-0">
          <form
            onSubmit={submit}
            className="rounded-[2rem] border border-slate-200/60 bg-white p-6 sm:p-8 shadow-sm"
          >
          <div className="text-center sm:text-left">
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Tra cứu thư mời 08/11/2026
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Nhập đúng họ tên và số điện thoại đã đăng ký để xem kết quả giao
              dịch và tải thư mời điện tử.
            </p>
          </div>

          <div className="mt-5 space-y-3.5">
            <div>
              <label
                className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500"
                htmlFor="lookup-name"
              >
                Họ và tên *
              </label>
              <input
                id="lookup-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Lê Minh Trí"
                className="mt-1.5 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none"
                maxLength={80}
                required
              />
            </div>

            <div>
              <label
                className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500"
                htmlFor="lookup-phone"
              >
                Số điện thoại *
              </label>
              <input
                id="lookup-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0912345678"
                className="mt-1.5 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none"
                maxLength={24}
                required
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <a
                href="https://m.me/clb.Tin.nct"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-lg bg-rose-100 text-rose-700 font-bold hover:bg-rose-200 transition-colors flex items-center justify-center gap-2 text-[13px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.915 1.48 5.512 3.796 7.234v3.508c0 .542.593.856 1.05.56l3.435-2.227A10.74 10.74 0 0 0 12 20.516c5.523 0 10-4.145 10-9.258S17.523 2 12 2zm1.188 12.386l-2.617-2.793-5.11 2.793 5.625-5.973 2.65 2.793 5.074-2.793-5.622 5.973z"/></svg>
                Cần hỗ trợ? Liên hệ Fanpage
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-xl bg-[#1d4ed8] py-3.5 text-sm font-extrabold text-white shadow-md transition-all hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98]"
          >
            {busy ? "Đang tra cứu…" : "Tra cứu"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">
            Chưa đăng ký?{" "}
            <Link
              href="/dang-ky"
              className="font-bold text-[#1d4ed8] underline-offset-4 hover:underline"
            >
              Đăng ký tham dự ngay
            </Link>
          </p>
        </form>
        </div>

        {/* Khung Kết quả (Hiện khi có data) */}
        {result && (
          <div className="w-full lg:flex-1 max-w-[600px] space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Header kết quả */}
            <div className="text-center pb-2">
              <h2 className="text-2xl font-black text-slate-900">
                Xin chào, {result.member.name}!
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Thông tin tra cứu hợp lệ.
              </p>
            </div>

          {/* Danh sách vé */}
          {result.invitations.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">
                Bạn chưa có thư mời nào. Hãy{" "}
                <Link
                  href="/dang-ky"
                  className="font-bold text-[#1d4ed8] hover:underline"
                >
                  đăng ký tham dự
                </Link>{" "}
                để nhận thư mời.
              </p>
            </div>
          ) : (
            result.invitations.map((invitation) => {
              const status = invitationStatusInfo(invitation.status);
              const isExpanded = expandedInvitation === invitation.id;
              return (
                <div
                  key={invitation.id}
                  className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden"
                >
                  {/* Header vé */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedInvitation(isExpanded ? null : invitation.id)
                    }
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${status.cls}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-slate-700">
                        {invitation.type === "individual"
                          ? `Thư mời cá nhân · ${invitation.attendeeName}`
                          : `Thư mời tập thể · ${invitation.quantity} suất`}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatVnd(invitation.amount)} ·{" "}
                        {sizesLabel(
                          invitation.type,
                          invitation.type === "individual"
                            ? Object.keys(invitation.sizes)[0] || null
                            : null,
                          invitation.sizes,
                        )}
                      </p>
                    </div>
                    <span
                      className={`material-symbols-rounded text-slate-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Chi tiết mở rộng */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-4">
                      {status.desc && (
                        <p className="text-xs text-slate-500">{status.desc}</p>
                      )}
                      {invitation.note && (
                        <p className="text-xs text-slate-600 mb-4">
                          <strong>Ghi chú:</strong> {invitation.note}
                        </p>
                      )}

                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-slate-600">Trạng thái thanh toán</span>
                          {invitation.status === "confirmed" ? (
                            <span className="text-[13px] font-bold text-emerald-600">Đã thanh toán</span>
                          ) : invitation.status === "pending_approval" ? (
                            <span className="text-[13px] font-bold text-blue-600">Đang chờ xác thực</span>
                          ) : (
                            <span className="text-[13px] font-bold text-amber-600">Chưa thanh toán</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-slate-600">Trạng thái nhận áo</span>
                          {(!invitation.sizes || Object.keys(invitation.sizes).length === 0) ? (
                            <span className="text-[13px] font-medium text-slate-500">Không đăng ký</span>
                          ) : (
                            <span className="text-[13px] font-medium text-amber-600">Chưa nhận</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-slate-600">Điểm danh sự kiện</span>
                          {invitation.checkedIn ? (
                            <span className="text-[13px] font-bold text-emerald-600">Đã check-in</span>
                          ) : (
                            <span className="text-[13px] font-medium text-slate-500">Chưa điểm danh</span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-center pt-4 mt-2">
                        {["pending_payment", "pending", "rejected"].includes(invitation.status) ? (
                          <Link
                            href={`/xac-nhan-dong-gop?id=${invitation.id}`}
                            className="w-full text-center rounded-xl bg-[#1d4ed8] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                          >
                            {invitation.status === "rejected" ? "Xem chi tiết / Thanh toán lại" : "Thanh toán ngay"}
                          </Link>
                        ) : (
                          <Link
                            href={`/thu-moi?id=${invitation.id}`}
                            className="w-full text-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                          >
                            Xem & Tải thư mời
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        )}
      </div>
    </div>
  );
}
