"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { FormEvent } from "react";
import type { Post, PostStatus } from "@/lib/posts";
import type { AdminRole } from "@/lib/admin";
import AdminRegistrations from "./AdminRegistrations";
import AdminMedia from "./AdminMedia";
import AdminAccounts from "./AdminAccounts";
import AdminEditPost from "./AdminEditPost";

type View = "checking" | "anon" | "admin";
type Tab = "pending" | "published" | "draft" | "all" | "invitations" | "media" | "accounts" | "edit";

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [view, setView] = useState<View>("checking");
  const [posts, setPosts] = useState<Post[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const editPostId = searchParams.get("edit");
  const urlTab = editPostId ? "edit" : (searchParams.get("tab") as Tab | null);
  const [tab, setTab] = useState<Tab>(urlTab || initialTab);

  useEffect(() => {
    if (urlTab && urlTab !== tab) {
      setTab(urlTab);
    }
  }, [urlTab]);

  const [visited, setVisited] = useState<Set<string>>(new Set([tab]));
  useEffect(() => {
    setVisited((prev) => (prev.has(tab) ? prev : new Set(prev).add(tab)));
    
    // Unmount inactive tabs after animation completes to prevent giant scrollbars
    const timer = setTimeout(() => {
      setVisited(new Set([tab]));
    }, 450);
    return () => clearTimeout(timer);
  }, [tab]);

  const handleTabChange = (newTab: Tab) => {
    if (window.__isDirty && !window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời khỏi trang này?")) {
      return;
    }
    setTab(newTab);
    const params = new URLSearchParams(searchParams);
    params.set("tab", newTab);
    params.delete("edit");
    router.replace(`${pathname}?${params.toString()}`);
  };
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<"all" | "admin" | "community">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
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
      console.error("loadPosts returned 401");
      alert("Lỗi: loadPosts trả về 401! Phiên đăng nhập không hợp lệ.");
      setView("anon");
      return;
    }
    const data = await res.json();
    if (data.ok) setPosts(data.posts as Post[]);
  }, []);

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (editPostId) {
      // Delay slightly so the CSS transition triggers
      const t = setTimeout(() => setPanelOpen(true), 10);
      return () => clearTimeout(t);
    } else {
      setPanelOpen(false);
    }
  }, [editPostId]);

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
          setView((prev) => (prev === "checking" ? "anon" : prev));
        }
      } catch (err) {
        console.error("check() threw an error:", err);
        setView((prev) => (prev === "checking" ? "anon" : prev));
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
      setTab("pending"); // Reset tab
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
    setTab("pending"); // Reset tab
    setView("anon");
  }

  // Kiểm tra quyền theo role
  const isEditor = adminInfo?.role === "editor";

  function openEdit(post: Post) {
    if (window.__isDirty && !window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời khỏi trang này?")) return;
    const params = new URLSearchParams(searchParams);
    params.set("edit", post.id);
    router.push(`${pathname}?${params.toString()}`);
  }

  function openNew() {
    if (window.__isDirty && !window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời khỏi trang này?")) return;
    const params = new URLSearchParams(searchParams);
    params.set("edit", "new");
    router.push(`${pathname}?${params.toString()}`);
  }

  const handleLogout = () => {
    if (window.__isDirty && !window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời khỏi trang này?")) return;
    logout();
  };

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
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${showPassword
                          ? "opacity-100 rotate-0 scale-100"
                          : "opacity-0 -rotate-90 scale-50"
                        }`}
                    >
                      <span className="material-symbols-rounded">
                        visibility
                      </span>
                    </span>
                    <span
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${!showPassword
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
  const draftCount = posts.filter((p) => p.status === "draft").length;
  const filtered =
    tab === "pending"
      ? posts.filter((p) => p.status === "pending")
      : tab === "published"
        ? posts.filter((p) => p.status === "published")
        : tab === "draft"
          ? posts.filter((p) => p.status === "draft")
          : posts;

  const isSuperAdmin = adminInfo?.role === "super_admin";

  const menuGroups = [
    {
      title: "Quản lý bài đăng",
      items: [
        { key: "pending", label: `Chờ duyệt (${pendingCount})` },
        { key: "published", label: `Đã đăng (${publishedCount})` },
        { key: "draft", label: `Bản nháp (${draftCount})` },
        { key: "all", label: `Tất cả (${posts.length})` },
      ],
    },
    {
      title: "Hệ thống",
      items: [
        ...(!isEditor ? [{ key: "invitations", label: "Thư mời" } as const] : []),
        ...(!isEditor ? [{ key: "media", label: "Media cộng đồng" } as const] : []),
        ...(isSuperAdmin ? [{ key: "accounts", label: "Quản lý tài khoản" } as const] : []),
      ],
    },
  ].filter((g) => g.items.length > 0);

  const ALL_TABS: Tab[] = ["pending", "published", "draft", "all", "invitations", "media", "accounts", "edit"];
  const activeIndex = ALL_TABS.indexOf(tab);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16">
      <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8 lg:gap-16">
        {/* SIDEBAR */}
        <aside className="md:w-[280px] shrink-0">
          <div className="md:sticky md:top-20 space-y-4 md:space-y-8">
            {/* Header Info */}
            <div className={tab === "edit" ? "hidden md:block" : ""}>
              <h1 className="text-3xl font-extrabold text-slate-900">
                Bảng quản trị
              </h1>
              <p className="mt-2 text-sm text-slate-500 flex flex-wrap items-center gap-2">
                {adminInfo?.fullName || "Admin"}
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${adminInfo?.role === "super_admin"
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

            {/* Mobile & Desktop Action Buttons */}
            <div className="flex flex-row md:flex-col gap-3 hidden md:flex pt-2">
              <button
                type="button"
                onClick={openNew}
                className="btn-lightship w-full rounded-2xl bg-[#1d4ed8] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#1d4ed8]/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1d4ed8]/40"
              >
                <span className={tab === "edit" && editPostId === "new" ? "underline underline-offset-4 decoration-2" : ""}>
                  Viết bài mới
                </span>
              </button>
            </div>

            {/* Mobile Floating Action Button (+) cho Quản lý bài đăng */}
            {(tab === "pending" || tab === "published" || tab === "all") && (
              <button
                type="button"
                onClick={openNew}
                className="md:hidden fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#1d4ed8] text-white shadow-lg shadow-blue-500/40 hover:bg-blue-700 transition-transform duration-300"
                title="Viết bài mới"
              >
                <span className="material-symbols-rounded text-3xl">add</span>
              </button>
            )}

            {/* Desktop Side Navigation Menu */}
            <nav className="hidden md:flex flex-col items-start gap-8 pt-6">
              {menuGroups.map((group) => (
                <div key={group.title} className="flex flex-col items-start gap-3">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    {group.title}
                  </h3>
                  <div className="flex flex-col items-start gap-4">
                    {group.items.map(({ key, label }) => {
                      const isCurrent = tab === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleTabChange(key as Tab)}
                          className={`group/link relative py-2 text-left text-[15px] font-extrabold transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] flex items-center ${isCurrent
                              ? "text-[#1d4ed8]"
                              : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                          <span>{label}</span>
                          <span
                            className={`absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-[#1d4ed8] transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] origin-left ${isCurrent
                                ? "opacity-100 scale-x-100"
                                : "opacity-0 scale-x-0 group-hover/link:opacity-60 group-hover/link:scale-x-75"
                              }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-slate-200 mt-2 w-full">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="group/link relative py-2 text-left text-[15px] font-extrabold text-rose-500 hover:text-rose-700 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] flex items-center"
                >
                  <span>Đăng xuất</span>
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-rose-500 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] origin-left opacity-0 scale-x-0 group-hover/link:opacity-60 group-hover/link:scale-x-75"
                  />
                </button>
              </div>
            </nav>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0">
          {banner && (
            <div
              className={`mb-8 rounded-3xl px-6 py-4 text-sm font-bold ${banner.ok
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-rose-100 text-rose-800 border border-rose-200"
                }`}
            >
              {banner.text}
            </div>
          )}



          <div className="t-page-slide relative">
            {ALL_TABS.map((k, i) => {
              if (!visited.has(k)) return null;
              const isActive = tab === k;
              const fromX = i < activeIndex ? "calc(var(--page-slide-distance) * -1)" : "var(--page-slide-distance)";

              let content = null;
              if (k === "invitations") {
                content = <AdminRegistrations onAuthError={() => setView("anon")} />;
              } else if (k === "media") {
                content = <AdminMedia onAuthError={() => setView("anon")} />;
              } else if (k === "accounts" && isSuperAdmin) {
                content = <AdminAccounts onAuthError={() => setView("anon")} />;
              } else if (k === "edit") {
                content = (
                  <AdminEditPost
                    key={editPostId || "new"}
                    postId={editPostId}
                    onBack={() => {
                      if (window.__isDirty && !window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời khỏi trang này?")) return;
                      const params = new URLSearchParams(searchParams);
                      params.delete("edit");
                      router.push(`${pathname}?${params.toString()}`);
                    }}
                    adminInfo={adminInfo!}
                  />
                );
              } else if (k === "pending" || k === "published" || k === "draft" || k === "all") {
                const tabPosts = posts
                  .filter((p) => {
                    if (k === "pending") return p.status === "pending";
                    if (k === "published") return p.status === "published";
                    if (k === "draft") return p.status === "draft";
                    return true;
                  })
                  .filter((p) => filterSource === "all" || p.source === filterSource)
                  .filter((p) => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return p.title.toLowerCase().includes(q) ||
                      p.author.toLowerCase().includes(q) ||
                      (p.authorRole && p.authorRole.toLowerCase().includes(q));
                  })
                  .sort((a, b) => {
                    return sortOrder === "desc"
                      ? b.createdAt.localeCompare(a.createdAt)
                      : a.createdAt.localeCompare(b.createdAt);
                  });

                content = (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 mb-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                      <input
                        type="search"
                        placeholder="Tìm theo tiêu đề, tác giả, người duyệt..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                      <select
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value as any)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="all">Tất cả bài đăng</option>
                        <option value="admin">Bài của Admin</option>
                        <option value="community">Bài của Cộng đồng</option>
                      </select>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="desc">Mới nhất trước</option>
                        <option value="asc">Cũ nhất trước</option>
                      </select>
                    </div>
                    {tabPosts.map((post) => {
                      const status = statusInfo(post.status);
                      return (
                        <div key={post.id} className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${status.cls}`}
                                >
                                  {status.label}
                                </span>
                                <span
                                  className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${post.source === "admin"
                                      ? "bg-[#1d4ed8]/10 text-[#1d4ed8]"
                                      : "bg-emerald-100 text-emerald-700"
                                    }`}
                                >
                                  {post.source === "admin"
                                    ? "Ban Biên tập"
                                    : "Cộng đồng"}
                                </span>
                                {post.pinned && (
                                  <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-700">
                                    Ghim
                                  </span>
                                )}
                              </div>
                              <h3 className="mt-2.5 truncate text-lg font-extrabold text-slate-900">
                                {post.title}
                              </h3>
                              <p className="mt-0.5 truncate text-sm text-slate-500">
                                {post.author} · {post.authorRole} · {vi(post.createdAt)}
                              </p>
                              {post.status === "pending" && (
                                <p className="mt-2.5 line-clamp-2 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
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
                                    className="rounded-xl bg-[#16a34a] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    Duyệt đăng
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
                                    className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                                  >
                                    Từ chối
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
                                    className="rounded-xl bg-amber-100 px-3.5 py-2 text-xs font-bold text-amber-700 hover:bg-amber-200 disabled:opacity-50"
                                  >
                                    {post.pinned ? "Bỏ ghim" : "Ghim"}
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
                                    className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                                  >
                                    Hạ bài
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
                                    className="rounded-xl bg-[#16a34a] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    Đăng bài
                                  </button>
                                )}
                              <Link
                                href={`/bai-viet/${post.slug}`}
                                className="rounded-xl bg-[#1d4ed8]/10 px-3.5 py-2 text-xs font-bold text-[#1d4ed8] hover:bg-[#1d4ed8]/20"
                              >
                                Xem
                              </Link>
                              <button
                                type="button"
                                onClick={() => openEdit(post)}
                                className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => remove(post)}
                                className="rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                              >
                                Xoá
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {tabPosts.length === 0 && (
                      <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-400">
                        {k === "pending"
                          ? "🎉 Không có bài nào chờ duyệt - mọi thứ đã được xử lý!"
                          : "Chưa có bài viết nào trong mục này."}
                      </div>
                    )}
                  </div>
                );
              }

              if (!content) return null;

              return (
                <div
                  key={k}
                  className="t-page"
                  data-active={isActive ? "true" : "false"}
                  style={{ "--t-page-from-x": fromX } as React.CSSProperties}
                >
                  {content}
                </div>
              );
            })}
          </div>


        </div>
      </div>

      <p className="mt-10 text-center text-xs text-slate-400">
        40 năm THPT Nguyễn Công Trứ · Trang quản trị nội dung
      </p>
    </div>
  );
}
