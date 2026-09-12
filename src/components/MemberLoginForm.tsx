"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

const inputCls =
  "mt-2 w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-[#15803d] focus:bg-white focus:outline-none";
const labelCls =
  "mt-5 block text-xs font-extrabold uppercase tracking-wider text-slate-600";

export default function MemberLoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || "Đăng nhập thất bại.");
        return;
      }
      router.push("/tai-khoan");
      router.refresh();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[2rem] border border-white/60 bg-white/60 p-8 shadow-2xl shadow-emerald-950/25 backdrop-blur-2xl sm:p-10"
    >
      <h2 className="text-2xl font-extrabold text-slate-900">Đăng nhập</h2>
      <p className="mt-2 text-sm text-slate-600">
        Dùng số điện thoại đã đăng ký cùng mã định danh (bắt đầu bằng
        <span className="font-mono font-bold"> NCT40-…</span>).
      </p>

      <label className={labelCls} htmlFor="login-phone">
        Số điện thoại *
      </label>
      <input
        id="login-phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="VD: 0912345678"
        className={inputCls}
        maxLength={24}
        required
      />

      <label className={labelCls} htmlFor="login-code">
        Mã định danh *
      </label>
      <input
        id="login-code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="NCT40-XXXXXX"
        className={`${inputCls} font-mono font-bold tracking-wider`}
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
        className="btn-pop mt-6 w-full bg-[#16a34a] py-3.5 text-base font-extrabold text-white disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {busy ? "Đang kiểm tra…" : "Đăng nhập"}
      </button>

      <p className="mt-5 text-xs text-slate-500">
        Chưa có tài khoản?{" "}
        <Link href="/dang-ky" className="font-bold text-[#15803d] hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </form>
  );
}
