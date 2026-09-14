"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

// Tính số ngày còn lại đến 15/11/2026
function getDaysUntil(target: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const EVENT_DATE = new Date("2026-11-15T00:00:00+07:00");

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const daysLeft = getDaysUntil(EVENT_DATE);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || "Không tạo được tài khoản. Vui lòng thử lại.");
        return;
      }
      setCode(data.member.code);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* không hỗ trợ clipboard - bỏ qua */
    }
  }

  if (code) {
    return (
      <div className="glass-dark glass-box-enter rounded-[2rem] p-6 sm:p-9 text-center text-white">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/20 text-2xl shadow-[0_0_24px_rgba(16,185,129,0.35)]">
          🎉
        </div>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
          Đã tạo tài khoản thành công!
        </h2>
        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-slate-300">
          Bạn đã được{" "}
          <strong className="font-extrabold text-emerald-400">tự động đăng nhập</strong>.
          Dưới đây là{" "}
          <strong className="font-extrabold text-cyan-300">mã định danh</strong> -
          hãy lưu lại để đăng nhập lần sau và duyệt vé vào cổng ngày 15/11/2026.
        </p>

        <div className="mx-auto mt-5 max-w-xs sm:max-w-sm rounded-2xl border border-cyan-400/40 bg-cyan-950/40 p-5 backdrop-blur-xl shadow-[0_0_28px_rgba(6,182,212,0.2)]">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-300/80">
            Mã định danh của bạn
          </p>
          <p className="mt-1 font-mono text-3xl font-black tracking-widest text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]">
            {code}
          </p>
          <button
            type="button"
            onClick={copyCode}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-white/20 active:scale-95"
          >
            {copied ? "✅ Đã sao chép!" : "📋 Sao chép mã"}
          </button>
        </div>

        <Link
          href="/tai-khoan"
          className="btn-lightship mt-6 inline-block rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-950/60 hover:from-emerald-500 hover:to-green-500"
        >
          🎟 Vào tài khoản & đăng ký vé
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="glass-dark glass-box-enter rounded-[2rem] p-6 sm:p-8 text-white"
    >
      {/* Badge & Tiêu đề trong khung kính */}
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/15 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-blue-300 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
          {daysLeft > 0
            ? `Còn ${daysLeft} ngày về mái trường xưa`
            : "15/11/2026 · Ngày Trở Về"}
        </div>
        <h2 className="mt-2.5 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Đăng ký tham dự 40 Năm
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">
          Nhập họ tên và số điện thoại để nhận mã định danh tham dự và duyệt vé vào cổng
          dưới mái trường THPT Nguyễn Công Trứ.
        </p>
      </div>

      <div className="mt-5 space-y-3.5">
        <div>
          <label
            className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300"
            htmlFor="reg-name"
          >
            Họ và tên *
          </label>
          <input
            id="reg-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Lê Minh Trí"
            className="glass-dark-input mt-1.5 w-full rounded-xl px-4 py-3 text-sm font-medium placeholder:text-slate-500"
            maxLength={80}
            required
          />
        </div>

        <div>
          <label
            className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300"
            htmlFor="reg-phone"
          >
            Số điện thoại *
          </label>
          <input
            id="reg-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="VD: 0912345678"
            className="glass-dark-input mt-1.5 w-full rounded-xl px-4 py-3 text-sm font-medium placeholder:text-slate-500"
            maxLength={24}
            required
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/70 p-3 text-xs font-medium text-rose-200 backdrop-blur-md">
          ⚠️ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-lightship mt-5 w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-blue-950/60 transition-all hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 active:scale-[0.98]"
      >
        {busy ? "Đang tạo tài khoản…" : "🎫 Tạo tài khoản & Nhận mã"}
      </button>

      <p className="mt-4 text-center text-xs text-slate-400">
        Mã định danh được cấp ngay sau khi đăng ký.{" "}
        <Link
          href="/dang-nhap"
          className="font-bold text-blue-400 underline-offset-4 hover:text-blue-300 hover:underline"
        >
          Đã có tài khoản? Đăng nhập
        </Link>
      </p>
    </form>
  );
}
