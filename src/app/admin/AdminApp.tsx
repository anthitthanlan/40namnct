"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Post, PostStatus } from "@/lib/posts";
import type { AdminRole } from "@/lib/admin";
import AdminRegistrations from "./AdminRegistrations";
import AdminMedia from "./AdminMedia";

type View = "checking" | "anon" | "admin";
type Tab = "pending" | "published" | "all" | "tickets" | "media";

type Draft = {
  id: string | null;
  title: string;
  excerpt: string;
  author: string;
  authorRole: string;
  cover: string;
  content: string;
  pinned: boolean;
  status: PostStatus;
};

const EMPTY_DRAFT: Draft = {
  id: null,
  title: "",
  excerpt: "",
  author: "Ban Biên tập",
  authorRole: "Ban Tổ chức Lễ kỷ niệm 40 năm",
  cover: "",
  content: "",
  pinned: false,
  status: "published",
};

function statusInfo(status: PostStatus): { label: string; cls: string } {
  switch (status) {
    case "published":
      return { label: "Đã xuất bản", cls: "bg-emerald-100 text-emerald-700" };
    case "pending":
      return { label: "Chờ duyệt", cls: "bg-amber-100 text-amber-700" };
    case "rejected":
      return { label: "Đã từ chối", cls: "bg-rose-100 text-rose-600" };
    default:
      return { label: "Bản nháp", cls: "bg-slate-200 text-slate-600" };
  }
}

function vi(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

const aInput =
  "mt-2 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none";
const aLabel =
  "mt-5 block text-xs font-extrabold uppercase tracking-wider text-slate-500";

export default function AdminApp({ initialTab = "all" }: { initialTab?: Tab }) {
  const [view, setView] = useState<View>("checking");
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [banner, setBanner] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [adminInfo, setAdminInfo] = useState<{
    fullName: string;
    role: AdminRole;
  } | null>(null);

  const flash = useCallback((ok: boolean, text: string) => {
    setBanner({ ok, text });
    setTimeout(() => setBanner(null), 4000);
  }, []);

  const loadPosts = useCallback(async () => {
    const res = await fetch("/api/admin/posts", { cache: "no-store" });
    if (res.status === 401) {
      setView("anon");
      return;
    }
    const data = await res.json();
    if (data.ok) setPosts(data.posts as Post[]);
  }, []);

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });
        const data = await res.json();
        if (data.authenticated) {
          setAdminInfo({
            fullName: data.admin?.fullName || "Admin",
            role: data.admin?.role || "editor",
          });
          setView("admin");
          await loadPosts();
        } else {
          setView("anon");
        }
      } catch {
        setView("anon");
      }
    }
    check();
  }, [loadPosts]);

  async function login(e: FormEvent) {
    e.preventDefault();
    setLoginError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setLoginError(data.message || "Đăng nhập thất bại.");
        return;
      }
      setUsername("");
      setPassword("");
      setAdminInfo({
        fullName: data.admin?.fullName || "Admin",
        role: data.admin?.role || "editor",
      });
      setView("admin");
      await loadPosts();
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setPosts([]);
    setDraft(null);
    setAdminInfo(null);
    setView("anon");
  }

  // Kiểm tra quyền theo role
  const isEditor = adminInfo?.role === "editor";

  function openEdit(post: Post) {
    setDraft({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      author: post.author,
      authorRole: post.authorRole,
      cover: post.cover ?? "",
      content: post.content,
      pinned: post.pinned,
      status: post.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openNew() {
    setDraft({ ...EMPTY_DRAFT });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveDraft() {
    if (!draft) return;
    if (draft.title.trim().length < 6) {
      flash(false, "Tiêu đề cần ít nhất 6 ký tự.");
      return;
    }
    if (draft.content.trim().length < 10) {
      flash(false, "Nội dung cần ít nhất 10 ký tự.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: draft.title,
        excerpt: draft.excerpt,
        author: draft.author,
        authorRole: draft.authorRole,
        cover: draft.cover,
        content: draft.content,
        pinned: draft.pinned,
        status: draft.status,
      };
      const res = await fetch(
        draft.id ? `/api/admin/posts/${draft.id}` : "/api/admin/posts",
        {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.status === 401) {
        setView("anon");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(false, data.message || "Không lưu được bài viết.");
        return;
      }
      setDraft(null);
      await loadPosts();
      flash(true, draft.id ? "Đã cập nhật bài viết." : "Đã tạo bài viết mới.");
    } finally {
      setBusy(false);
    }
  }

  async function act(
    post: Post,
    patch: Record<string, unknown>,
    okText: string,
  ) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.status === 401) {
        setView("anon");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(false, data.message || "Thao tác thất bại.");
        return;
      }
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? (data.post as Post) : p)),
      );
      flash(true, okText);
    } finally {
      setBusy(false);
    }
  }

  async function remove(post: Post) {
    if (
      !window.confirm(
        `Xoá bài viết "${post.title}"? Thao tác không thể hoàn tác.`,
      )
    )
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        setView("anon");
        return;
      }
      if (!res.ok) {
        flash(false, "Không xoá được bài viết.");
        return;
      }
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      flash(true, "Đã xoá bài viết.");
    } finally {
      setBusy(false);
    }
  }

  if (view === "checking") {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center text-sm font-semibold text-slate-400">
        Đang kiểm tra phiên đăng nhập…
      </div>
    );
  }

  if (view === "anon") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-10 sm:px-6">
        <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-900/10 md:flex-row">
          {/* Left panel: Branding */}
          <div className="relative flex w-full flex-col items-center justify-center bg-white p-10 md:w-5/12 overflow-hidden border-r border-slate-100">
            {/* SVG Cube pattern (URL encoded, stroke is blue now) */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2240%22%20height=%2240%22%20viewBox=%220%200%2040%2040%22%3E%3Cpath%20d=%22M20%200l20%2010v20L20%2040%200%2030V10zM20%2020l20-10M0%2010l20%2010v20%22%20fill=%22none%22%20stroke=%22rgba(29,78,216,0.06)%22%20stroke-width=%221%22/%3E%3C/svg%3E')] bg-[length:40px_40px]" />

            {/* Gradient overlay to make pattern fade at edges if needed */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="flex items-center gap-4">
                <Image
                  src="/images/NCT.png"
                  alt="Logo NCT"
                  width={64}
                  height={64}
                  className="h-16 w-auto object-contain"
                />
                <Image
                  src="/images/Logo_40th_NCT.png"
                  alt="Logo 40 năm NCT"
                  width={64}
                  height={64}
                  className="h-16 w-auto object-contain drop-shadow-sm"
                />
              </div>
              <h1 className="t-stagger is-shown mt-8 flex flex-wrap justify-center gap-[0.3em] md:flex-col md:gap-0 text-2xl font-black tracking-tight text-blue-900 sm:text-3xl">
                <span className="t-stagger-line t-stagger-line--1">
                  Quản trị
                </span>
                <span className="t-stagger-line t-stagger-line--2">
                  hệ thống
                </span>
              </h1>
              <p className="mt-4 max-w-[280px] text-sm font-medium leading-relaxed text-blue-800/80">
                Khu vực dành cho Ban Biên tập — quản lý bài viết, vé, duyệt câu
                chuyện gửi từ cộng đồng.
              </p>
            </div>
          </div>

          {/* Right panel: Form */}
          <div className="w-full p-8 sm:p-12 md:w-7/12">
            <h2 className="text-xl font-bold text-slate-800">Đăng nhập</h2>
            <p className="mt-1 text-sm text-slate-500">
              Xin chào! Vui lòng nhập thông tin để tiếp tục.
            </p>

            <form onSubmit={login} className="mt-8">
              <div className="relative mt-8">
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="peer w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3.5 text-slate-900 placeholder-transparent transition-colors focus:border-[#1d4ed8] focus:outline-none"
                  placeholder="ID TÀI KHOẢN"
                  autoComplete="username"
                />
                <label
                  htmlFor="admin-username"
                  className="pointer-events-none absolute -top-[20px] left-2 text-xs font-extrabold uppercase tracking-wider text-slate-500 transition-all duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-[20px] peer-focus:left-2 peer-focus:text-xs peer-focus:font-extrabold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-[#1d4ed8]"
                >
                  ID Tài khoản
                </label>
              </div>

              <div className="relative mt-8">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3.5 pr-12 text-slate-900 placeholder-transparent transition-colors focus:border-[#1d4ed8] focus:outline-none"
                  placeholder="MẬT KHẨU"
                  autoComplete="current-password"
                />
                <label
                  htmlFor="admin-password"
                  className="pointer-events-none absolute -top-[20px] left-2 text-xs font-extrabold uppercase tracking-wider text-slate-500 transition-all duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-[20px] peer-focus:left-2 peer-focus:text-xs peer-focus:font-extrabold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-[#1d4ed8]"
                >
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <span className="relative block h-6 w-6 overflow-hidden">
                    <span
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${
                        showPassword
                          ? "opacity-100 rotate-0 scale-100"
                          : "opacity-0 -rotate-90 scale-50"
                      }`}
                    >
                      <span className="material-symbols-rounded">
                        visibility
                      </span>
                    </span>
                    <span
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${
                        !showPassword
                          ? "opacity-100 rotate-0 scale-100"
                          : "opacity-0 rotate-90 scale-50"
                      }`}
                    >
                      <span className="material-symbols-rounded">
                        visibility_off
                      </span>
                    </span>
                  </span>
                </button>
              </div>

              {loginError && (
                <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn-lightship mt-6 flex w-full items-center justify-center gap-2 bg-[#1d4ed8] py-3.5 text-base text-white disabled:opacity-70 disabled:pointer-events-none"
              >
                {busy && (
                  <svg
                    className="h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                <span>{busy ? "Đang kiểm tra…" : "Đăng nhập"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = posts.filter((p) => p.status === "pending").length;
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const filtered =
    tab === "pending"
      ? posts.filter((p) => p.status === "pending")
      : tab === "published"
        ? posts.filter((p) => p.status === "published")
        : posts;

  return (
    <div className="mx-auto max-w-5xl px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Bảng quản trị
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {adminInfo?.fullName || "Admin"}
            <span
              className={`ml-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                adminInfo?.role === "super_admin"
                  ? "bg-red-100 text-red-700"
                  : adminInfo?.role === "system_manager"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {adminInfo?.role === "super_admin"
                ? "Quản trị tối cao"
                : adminInfo?.role === "system_manager"
                  ? "Quản lý hệ thống"
                  : "Biên tập viên"}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={openNew}
            className="btn-lightship rounded-full bg-[#1d4ed8] px-6 py-3 text-sm font-extrabold text-white"
          >
            ✍️ Viết bài mới
          </button>
          <button
            type="button"
            onClick={logout}
            className="btn-lightship-soft rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-600"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {banner && (
        <div
          className={`mt-6 rounded-2xl px-5 py-3 text-sm font-bold ${
            banner.ok
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-600"
          }`}
        >
          {banner.text}
        </div>
      )}

      {draft && (
        <div className="mt-8 rounded-[2rem] border-2 border-[#1d4ed8]/20 bg-white p-7 sm:p-9">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-extrabold text-slate-900">
              {draft.id ? "✏️ Sửa bài viết" : "✍️ Viết bài mới"}
            </h2>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:bg-slate-200"
            >
              Đóng
            </button>
          </div>

          <div className="mt-6 grid gap-x-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={aLabel} htmlFor="d-title">
                Tiêu đề *
              </label>
              <input
                id="d-title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className={aInput}
                maxLength={140}
              />
            </div>
            <div>
              <label className={aLabel} htmlFor="d-author">
                Tác giả
              </label>
              <input
                id="d-author"
                value={draft.author}
                onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                className={aInput}
                maxLength={80}
              />
            </div>
            <div>
              <label className={aLabel} htmlFor="d-role">
                Chức danh / vai trò
              </label>
              <input
                id="d-role"
                value={draft.authorRole}
                onChange={(e) =>
                  setDraft({ ...draft, authorRole: e.target.value })
                }
                className={aInput}
                maxLength={120}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={aLabel} htmlFor="d-cover">
                Ảnh bìa (URL - để trống nếu không có)
              </label>
              <input
                id="d-cover"
                value={draft.cover}
                onChange={(e) => setDraft({ ...draft, cover: e.target.value })}
                placeholder="/images/hero-2.jpg"
                className={aInput}
                maxLength={500}
              />
            </div>
          </div>

          <label className={aLabel} htmlFor="d-excerpt">
            Tóm tắt (hiển thị trong danh sách - để trống sẽ tự lấy từ nội dung)
          </label>
          <textarea
            id="d-excerpt"
            rows={2}
            value={draft.excerpt}
            onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
            className={aInput}
            maxLength={300}
          />

          <label className={aLabel} htmlFor="d-content">
            Nội dung * - hỗ trợ: # tiêu đề, ## tiêu đề phụ, &gt; trích dẫn, -
            gạch đầu dòng, **chữ đậm**, *nghiêng*
          </label>
          <textarea
            id="d-content"
            rows={12}
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            className={`${aInput} leading-relaxed`}
          />
          <p className="mt-1 text-right text-xs text-slate-400">
            {draft.content.length} ký tự
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={draft.pinned}
                onChange={(e) =>
                  setDraft({ ...draft, pinned: e.target.checked })
                }
                className="h-4 w-4 accent-[#1d4ed8]"
              />
              📌 Ghim bài này lên đầu
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              Trạng thái:
              <select
                value={draft.status}
                onChange={(e) =>
                  setDraft({ ...draft, status: e.target.value as PostStatus })
                }
                className="rounded-xl border-2 border-slate-100 bg-slate-50 px-3 py-2 text-sm focus:border-[#1d4ed8] focus:outline-none"
              >
                <option value="published">Xuất bản ngay</option>
                <option value="draft">Lưu nháp</option>
              </select>
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={saveDraft}
              disabled={busy}
              className="btn-lightship bg-[#1d4ed8] px-8 py-3 font-extrabold text-white disabled:opacity-50"
            >
              {busy
                ? "Đang lưu…"
                : draft.id
                  ? "💾 Lưu thay đổi"
                  : "🚀 Đăng bài"}
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="btn-lightship-soft bg-white px-6 py-3 font-bold text-slate-600"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        {(
          [
            ["pending", `⏳ Chờ duyệt (${pendingCount})`],
            ["published", `✅ Đã đăng (${publishedCount})`],
            ["all", `📰 Tất cả (${posts.length})`],
            ...(!isEditor ? [["tickets", "🎟 Vé & Giao dịch"] as const] : []),
            ...(!isEditor ? [["media", "📸 Media cộng đồng"] as const] : []),
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key as Tab)}
            className={`rounded-full px-5 py-2.5 text-sm font-extrabold transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] ${
              tab === key
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "tickets" ? (
        <AdminRegistrations onAuthError={() => setView("anon")} />
      ) : tab === "media" ? (
        <AdminMedia onAuthError={() => setView("anon")} />
      ) : (
        <div className="mt-8 space-y-4">
          {filtered.map((post) => {
            const status = statusInfo(post.status);
            return (
              <div key={post.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${status.cls}`}
                      >
                        {status.label}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${
                          post.source === "admin"
                            ? "bg-[#1d4ed8]/10 text-[#1d4ed8]"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {post.source === "admin"
                          ? "✦ Ban Biên tập"
                          : "🗣 Cộng đồng"}
                      </span>
                      {post.pinned && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-700">
                          📌 Ghim
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 truncate text-lg font-extrabold text-slate-900">
                      {post.title}
                    </h3>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {post.author} · {post.authorRole} · {vi(post.createdAt)}
                    </p>
                    {post.status === "pending" && (
                      <p className="mt-2 line-clamp-2 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
                        {post.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {post.status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            act(
                              post,
                              { status: "published" },
                              "Đã duyệt và đăng bài viết.",
                            )
                          }
                          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50"
                        >
                          ✅ Duyệt &amp; đăng
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            act(
                              post,
                              { status: "rejected" },
                              "Đã từ chối bài viết.",
                            )
                          }
                          className="rounded-full bg-rose-100 px-4 py-2 text-xs font-extrabold text-rose-600 disabled:opacity-50"
                        >
                          🚫 Từ chối
                        </button>
                      </>
                    )}
                    {post.status === "published" && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            act(
                              post,
                              { pinned: !post.pinned },
                              post.pinned
                                ? "Đã bỏ ghim bài viết."
                                : "Đã ghim bài viết lên đầu.",
                            )
                          }
                          className="rounded-full bg-amber-100 px-4 py-2 text-xs font-extrabold text-amber-700 disabled:opacity-50"
                        >
                          {post.pinned ? "Bỏ ghim" : "📌 Ghim"}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            act(
                              post,
                              { status: "draft" },
                              "Đã hạ bài về bản nháp.",
                            )
                          }
                          className="rounded-full bg-slate-100 px-4 py-2 text-xs font-extrabold text-slate-600 disabled:opacity-50"
                        >
                          ⬇️ Hạ bài
                        </button>
                      </>
                    )}
                    {(post.status === "draft" ||
                      post.status === "rejected") && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          act(
                            post,
                            { status: "published" },
                            "Đã đăng bài viết.",
                          )
                        }
                        className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50"
                      >
                        🚀 Đăng
                      </button>
                    )}
                    <Link
                      href={`/bai-viet/${post.slug}`}
                      className="rounded-full bg-[#1d4ed8]/10 px-4 py-2 text-xs font-extrabold text-[#1d4ed8]"
                    >
                      👁 Xem
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEdit(post)}
                      className="rounded-full bg-slate-100 px-4 py-2 text-xs font-extrabold text-slate-600"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => remove(post)}
                      className="rounded-full bg-rose-50 px-4 py-2 text-xs font-extrabold text-rose-500 disabled:opacity-50"
                    >
                      🗑 Xoá
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-400">
              {tab === "pending"
                ? "🎉 Không có bài nào chờ duyệt - mọi thứ đã được xử lý!"
                : "Chưa có bài viết nào trong mục này."}
            </div>
          )}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-slate-400">
        40 năm THPT Nguyễn Công Trứ · Trang quản trị nội dung
      </p>
    </div>
  );
}
