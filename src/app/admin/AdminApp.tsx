"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Post, PostStatus } from "@/lib/posts";
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

export default function AdminApp() {
  const [view, setView] = useState<View>("checking");
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<Tab>("pending");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [banner, setBanner] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });
        const data = await res.json();
        if (data.authenticated) {
          setView("admin");
          await loadPosts();
        } else {
          setView("anon");
        }
      } catch {
        setView("anon");
      }
    })();
  }, [loadPosts]);

  async function login(e: FormEvent) {
    e.preventDefault();
    setLoginError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setLoginError(data.message || "Đăng nhập thất bại.");
        return;
      }
      setPassword("");
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
    setView("anon");
  }

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

  async function act(post: Post, patch: Record<string, unknown>, okText: string) {
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
    if (!window.confirm(`Xoá bài viết "${post.title}"? Thao tác không thể hoàn tác.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
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
      <div className="mx-auto max-w-md px-6 py-10">
        <form onSubmit={login} className="btn-pop-soft rounded-[2rem] bg-white p-8">
          <Image src="/images/logo_nct.png" alt="Logo NCT" width={56} height={56} className="mx-auto" />
          <h1 className="mt-4 text-center text-2xl font-extrabold text-slate-900">
            Quản trị bài viết
          </h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            Khu vực dành cho Ban Biên tập - quản lý bài viết, duyệt câu chuyện
            gửi từ cộng đồng.
          </p>
          <label
            className="mt-6 block text-xs font-extrabold uppercase tracking-wider text-slate-500"
            htmlFor="admin-password"
          >
            Mật khẩu quản trị
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={aInput}
          />
          {loginError && (
            <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="btn-pop mt-5 w-full bg-[#1d4ed8] py-3 font-bold text-white disabled:opacity-50"
          >
            {busy ? "Đang kiểm tra…" : "Đăng nhập"}
          </button>
        </form>
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
            Bài viết · Đăng ký tham dự &amp; vé · Media cộng đồng.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={openNew}
            className="btn-pop rounded-full bg-[#1d4ed8] px-6 py-3 text-sm font-extrabold text-white"
          >
            ✍️ Viết bài mới
          </button>
          <button
            type="button"
            onClick={logout}
            className="btn-pop-soft rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-600"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {banner && (
        <div
          className={`mt-6 rounded-2xl px-5 py-3 text-sm font-bold ${
            banner.ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
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
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-200"
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
                onChange={(e) => setDraft({ ...draft, authorRole: e.target.value })}
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
                onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })}
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
              className="btn-pop bg-[#1d4ed8] px-8 py-3 font-extrabold text-white disabled:opacity-50"
            >
              {busy ? "Đang lưu…" : draft.id ? "💾 Lưu thay đổi" : "🚀 Đăng bài"}
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="btn-pop-soft bg-white px-6 py-3 font-bold text-slate-600"
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
            ["all", "📦 Tất cả"],
            ["tickets", "🎟 Đăng ký & Vé"],
            ["media", "🖼 Media"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-5 py-2.5 text-sm font-extrabold transition ${
              tab === key
                ? "bg-slate-900 text-white"
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
                    <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${status.cls}`}>
                      {status.label}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${
                        post.source === "admin"
                          ? "bg-[#1d4ed8]/10 text-[#1d4ed8]"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {post.source === "admin" ? "✦ Ban Biên tập" : "🗣 Cộng đồng"}
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
                        onClick={() => act(post, { status: "published" }, "Đã duyệt và đăng bài viết.")}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50"
                      >
                        ✅ Duyệt &amp; đăng
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => act(post, { status: "rejected" }, "Đã từ chối bài viết.")}
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
                          act(post, { pinned: !post.pinned }, post.pinned ? "Đã bỏ ghim bài viết." : "Đã ghim bài viết lên đầu.")
                        }
                        className="rounded-full bg-amber-100 px-4 py-2 text-xs font-extrabold text-amber-700 disabled:opacity-50"
                      >
                        {post.pinned ? "Bỏ ghim" : "📌 Ghim"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => act(post, { status: "draft" }, "Đã hạ bài về bản nháp.")}
                        className="rounded-full bg-slate-100 px-4 py-2 text-xs font-extrabold text-slate-600 disabled:opacity-50"
                      >
                        ⬇️ Hạ bài
                      </button>
                    </>
                  )}
                  {(post.status === "draft" || post.status === "rejected") && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => act(post, { status: "published" }, "Đã đăng bài viết.")}
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



