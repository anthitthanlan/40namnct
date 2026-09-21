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
      const data = await res.json();
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
    <div className="mx-auto max-w-2xl px-6">
      {!result ? (
        <form
          onSubmit={submit}
          className="rounded-[2rem] border border-slate-200/60 bg-white p-6 sm:p-8 shadow-sm"
        >
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#1d4ed8]">
              <span className="material-symbols-rounded text-sm">search</span>
              Tra cứu vé tham dự
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Tra cứu vé 08/11/2026
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Nhập đúng họ tên và số điện thoại đã đăng ký để xem kết quả giao
              dịch và tải vé QR về.
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
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-600">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-xl bg-[#1d4ed8] py-3.5 text-sm font-extrabold text-white shadow-md transition-all hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98]"
          >
            {busy ? "Đang tra cứu…" : "🔍 Tra cứu"}
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
      ) : (
        <div className="space-y-6">
          {/* Header kết quả */}
          <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50/50 p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
              🎫
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-slate-900">
              Xin chào, {result.member.name}!
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Thông tin tra cứu hợp lệ.
            </p>
            <button
              type="button"
              onClick={resetSearch}
              className="mt-4 rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50"
            >
              ← Tra cứu khác
            </button>
          </div>

          {/* Danh sách vé */}
          {result.invitations.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">
                Bạn chưa có vé nào. Hãy{" "}
                <Link
                  href="/dang-ky"
                  className="font-bold text-[#1d4ed8] hover:underline"
                >
                  đăng ký tham dự
                </Link>{" "}
                để nhận vé.
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
                          ? `Vé cá nhân · ${invitation.attendeeName}`
                          : `Vé tập thể · ${invitation.quantity} suất`}
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
                        {invitation.status === "pending_payment" ? (
                          <Link
                            href={`/payment-legacy?id=${invitation.id}`}
                            className="w-full text-center rounded-xl bg-[#1d4ed8] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                          >
                            Thanh toán ngay
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
  );
}
