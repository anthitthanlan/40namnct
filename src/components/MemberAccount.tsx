"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import TicketForm from "@/components/TicketForm";
import TicketList from "@/components/TicketList";
import type { TicketView } from "@/lib/ticket-view";

type Me = { name: string; phone: string; code: string };
type View = "checking" | "anon" | "member";

export default function MemberAccount() {
  const [view, setView] = useState<View>("checking");
  const [me, setMe] = useState<Me | null>(null);
  const [tickets, setTickets] = useState<TicketView[]>([]);
  const [copied, setCopied] = useState(false);

  const loadTickets = useCallback(async () => {
    const res = await fetch("/api/tickets", { cache: "no-store" });
    if (res.status === 401) {
      setMe(null);
      setView("anon");
      return;
    }
    const data = await res.json();
    if (data.ok) setTickets(data.tickets as TicketView[]);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (data.authenticated) {
          setMe(data.member as Me);
          setView("member");
          await loadTickets();
        } else {
          setView("anon");
        }
      } catch {
        setView("anon");
      }
    })();
  }, [loadTickets]);

  async function copyCode() {
    if (!me) return;
    try {
      await navigator.clipboard.writeText(me.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* bỏ qua */
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    setTickets([]);
    setView("anon");
  }

  if (view === "checking") {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center text-sm font-semibold text-slate-400">
        Đang kiểm tra phiên đăng nhập…
      </div>
    );
  }

  if (view === "anon" || !me) {
    return (
      <div className="btn-pop-soft mx-auto max-w-xl rounded-[2rem] bg-white p-10 text-center">
        <span className="text-5xl">🔐</span>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
          Bạn chưa đăng nhập
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
          Đăng ký tài khoản (họ tên + số điện thoại) để nhận mã định danh và
          đăng ký vé tham dự ngày 15/11/2026 - cá nhân miễn phí hoặc tập thể
          200.000đ/suất.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/dang-ky"
            className="btn-pop bg-[#1d4ed8] px-7 py-3 text-sm font-extrabold text-white"
          >
            🎫 Đăng ký tài khoản
          </Link>
          <Link
            href="/dang-nhap"
            className="btn-pop-soft bg-white px-7 py-3 text-sm font-extrabold text-slate-700"
          >
            Đã có mã định danh? Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Thẻ thông tin tài khoản + mã định danh */}
      <div className="btn-pop-soft rounded-[2rem] bg-gradient-to-br from-[#1d4ed8] to-[#1e3a8a] p-8 text-white sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-200">
              👋 Xin chào
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">{me.name}</h2>
            <p className="mt-1 text-sm text-blue-100">📞 {me.phone}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full bg-white/15 px-5 py-2.5 text-sm font-extrabold transition hover:bg-white/25"
          >
            Đăng xuất
          </button>
        </div>
        <div className="mt-6 rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
          <p className="text-xs font-extrabold uppercase tracking-widest text-blue-200">
            Mã định danh - xuất trình tại cổng ngày 15/11/2026
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <span className="font-mono text-3xl font-extrabold tracking-wider">
              {me.code}
            </span>
            <button
              type="button"
              onClick={copyCode}
              className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#1d4ed8]"
            >
              {copied ? "✅ Đã sao chép!" : "📋 Sao chép"}
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-blue-100">
            Mã này dùng để đăng nhập lại (SĐT + mã định danh) và là vé duyệt
            vào cổng ngày hội. Vé cá nhân miễn phí; vé tập thể 200.000đ/suất
            thanh toán qua QR chuyển khoản (nội dung CK tự đổi mỗi 2 phút).
          </p>
        </div>
      </div>

      <TicketForm defaultName={me.name} onCreated={loadTickets} />

      <div>
        <h2 className="text-xl font-extrabold text-slate-900">
          🎫 Vé của tôi ({tickets.length})
        </h2>
        <div className="mt-5">
          <TicketList tickets={tickets} memberCode={me.code} />
        </div>
      </div>
    </div>
  );
}
