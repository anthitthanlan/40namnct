"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

const inputCls =
  "mt-2 w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-[#1d4ed8] focus:bg-white focus:outline-none";
const labelCls =
  "mt-5 block text-xs font-extrabold uppercase tracking-wider text-slate-600";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

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
      <div className="rounded-[2rem] border border-white/60 bg-white/60 p-8 text-center shadow-2xl shadow-blue-950/25 backdrop-blur-2xl sm:p-10">
        <span className="text-5xl">🎉</span>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
          Đã tạo tài khoản thành công!
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
          Bạn đã được <strong className="font-extrabold">tự động đăng nhập</strong>.
          Dưới đây là <strong className="font-extrabold">mã định danh</strong> -
          hãy lưu lại để đăng nhập lần sau và xuất trình tại cổng ngày
          15/11/2026.
        </p>
        <div className="mx-auto mt-6 max-w-sm rounded-3xl border-2 border-dashed border-[#1d4ed8]/30 bg-white/60 p-6">
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
            Mã định danh của bạn
          </p>
          <p className="mt-2 font-mono text-3xl font-extrabold tracking-wider text-[#1d4ed8]">
            {code}
          </p>
          <button
            type="button"
            onClick={copyCode}
            className="mt-4 rounded-full bg-white/80 px-5 py-2 text-xs font-extrabold text-slate-600 shadow-sm transition hover:bg-white"
          >
            {copied ? "✅ Đã sao chép!" : "📋 Sao chép mã"}
          </button>
        </div>
        <Link
          href="/tai-khoan"
          className="btn-pop mt-7 inline-block rounded-2xl bg-[#16a34a] px-8 py-3.5 text-base font-extrabold text-white"
        >
          🎟 Vào tài khoản & đăng ký vé
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[2rem] border border-white/60 bg-white/60 p-8 shadow-2xl shadow-blue-950/25 backdrop-blur-2xl sm:p-10"
    >
      <h2 className="text-2xl font-extrabold text-slate-900">
        Tạo tài khoản tham dự
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Chỉ cần họ tên và số điện thoại - hệ thống tự sinh mã định danh để bạn
        đăng nhập lại và duyệt vào cổng ngày hội 15/11/2026.
      </p>

      <label className={labelCls} htmlFor="reg-name">
        Họ tên *
      </label>
      <input
        id="reg-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="VD: Lê Minh Trí"
        className={inputCls}
        maxLength={80}
        required
      />

      <label className={labelCls} htmlFor="reg-phone">
        Số điện thoại *
      </label>
      <input
        id="reg-phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="VD: 0912345678"
        className={inputCls}
        maxLength={24}
        required
      />

      {error && (
        <p className="mt-4 rounded-xl border border-rose-200/70 bg-rose-100/80 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-pop mt-6 w-full bg-[#1d4ed8] py-3.5 text-base font-extrabold text-white disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {busy ? "Đang tạo…" : "🎫 Tạo tài khoản"}
      </button>

      <p className="mt-5 text-xs text-slate-400">
        Mã định danh được cấp ngay sau khi đăng ký.{" "}
        <Link
          href="/dang-nhap"
          className="font-bold text-[#1d4ed8] hover:underline"
        >
          Đã có tài khoản? Đăng nhập
        </Link>
      </p>
    </form>
  );
}
