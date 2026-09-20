"use client";

import { useEffect, useState } from "react";
import type { PostStatus } from "@/lib/posts";
import RichTextEditor from "@/components/RichTextEditor";
import { ChevronLeft, Save, Loader2 } from "lucide-react";

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

const aInput =
  "mt-2 w-full rounded-xl border-none bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#1d4ed8] focus:outline-none transition-shadow";
const aLabel =
  "mt-4 block text-[11px] font-black uppercase tracking-widest text-slate-400";

export default function AdminEditPost({
  postId,
  onBack,
  onAuthError,
}: {
  postId: string | null;
  onBack: () => void;
  onAuthError?: () => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [originalDraft, setOriginalDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ ok: boolean; text: string } | null>(null);

  const isNew = postId === null || postId === "new";

  // Check if draft has changed
  const isDirty = draft && originalDraft && JSON.stringify(draft) !== JSON.stringify(originalDraft);

  // Sync to global window for tab switches in AdminApp
  useEffect(() => {
    (window as any).__isDirty = isDirty;
    return () => {
      (window as any).__isDirty = false;
    };
  }, [isDirty]);

  // Prevent browser reload/close
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // Required for Chrome
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    async function load() {
      if (isNew) {
        setDraft({ ...EMPTY_DRAFT });
        setOriginalDraft({ ...EMPTY_DRAFT });
        return;
      }

      const res = await fetch("/api/admin/posts", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        const post = data.posts.find((p: any) => p.id === postId);
        if (post) {
          const loadedDraft = {
            id: post.id,
            title: post.title,
            excerpt: post.excerpt,
            author: post.author,
            authorRole: post.authorRole,
            cover: post.cover ?? "",
            content: post.content,
            pinned: post.pinned,
            status: post.status,
          };
          setDraft(loadedDraft);
          setOriginalDraft(loadedDraft);
        } else {
          onBack();
        }
      }
    }
    load();
  }, [postId, isNew, onBack]);

  const flash = (ok: boolean, text: string) => {
    setBanner({ ok, text });
    setTimeout(() => setBanner(null), 4000);
  };

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
      const url = isNew ? "/api/admin/posts" : `/api/admin/posts/${postId}`;
      const res = await fetch(
        url,
        {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(false, data.message || "Không lưu được bài viết.");
        return;
      }
      setOriginalDraft({ ...draft, id: draft.id || data.post?.id || "saved" } as Draft);
      (window as any).__isDirty = false;
      flash(true, draft.id ? "Đã cập nhật bài viết." : "Đã tạo bài viết mới.");
      setTimeout(() => {
        onBack();
      }, 1500);
    } finally {
      setBusy(false);
    }
  }

  if (!draft) {
    return <div className="p-10 text-center font-bold text-slate-500">Đang tải...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 pb-24">
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

      <div className="sticky top-0 z-40 -mt-16 pt-16 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-4">
        {/* Blurred background with gradient mask */}
        <div
          className="absolute inset-0 pointer-events-none bg-slate-100/85 backdrop-blur-xl"
          style={{
            maskImage: "linear-gradient(to bottom, black 0%, black calc(100% - 1.5rem), transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black calc(100% - 1.5rem), transparent 100%)"
          }}
        />
        {/* Actual Header Content */}
        <div className="relative flex items-center justify-between gap-4 pb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isNew ? "Viết bài mới" : "Sửa bài viết"}
          </h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (isDirty && !window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời khỏi trang này?")) return;
                onBack();
              }}
              className="flex items-center justify-center gap-1.5 rounded-full bg-slate-100 p-3 sm:px-5 sm:py-2 text-sm font-bold text-slate-500 transition-all hover:bg-slate-200"
              title="Trở về"
            >
              <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Trở về</span>
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={busy}
              className="flex items-center justify-center gap-1.5 rounded-full bg-[#1d4ed8] p-3 sm:px-5 sm:py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
              title="Lưu bài viết"
            >
              {busy ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <Save className="w-5 h-5 sm:w-4 sm:h-4" />}
              <span className="hidden sm:inline">{busy ? "Đang lưu..." : "Lưu bài viết"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={aLabel} htmlFor="d-title">Tiêu đề *</label>
          <input
            id="d-title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className={aInput}
            maxLength={140}
          />
        </div>
        <div>
          <label className={aLabel} htmlFor="d-author">Tác giả</label>
          <input
            id="d-author"
            value={draft.author}
            onChange={(e) => setDraft({ ...draft, author: e.target.value })}
            className={aInput}
            maxLength={80}
          />
        </div>
        <div>
          <label className={aLabel} htmlFor="d-role">Chức danh / vai trò</label>
          <input
            id="d-role"
            value={draft.authorRole}
            onChange={(e) => setDraft({ ...draft, authorRole: e.target.value })}
            className={aInput}
            maxLength={120}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={aLabel} htmlFor="d-cover">Ảnh bìa (URL - để trống nếu không có)</label>
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

      <label className={aLabel} htmlFor="d-excerpt">Tóm tắt (hiển thị trong danh sách - để trống sẽ tự lấy từ nội dung)</label>
      <textarea
        id="d-excerpt"
        rows={2}
        value={draft.excerpt}
        onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
        className={aInput}
        maxLength={300}
      />

      <label className={aLabel} htmlFor="d-content">Nội dung *</label>
      <div className="mt-2">
        <RichTextEditor
          content={draft.content}
          onChange={(html) => setDraft({ ...draft, content: html })}
        />
      </div>
      <p className="mt-2 text-right text-xs text-slate-400">Đã lưu tự động độ dài: {draft.content.length} ký tự</p>

      <div className="mt-6 flex flex-wrap items-center gap-6 rounded-2xl bg-slate-50 p-5 border border-slate-100">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            checked={draft.pinned}
            onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })}
            className="h-5 w-5 accent-[#1d4ed8] rounded-md"
          />
          Ghim bài này lên đầu
        </label>
        <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
          Trạng thái:
          <select
            value={draft.status}
            onChange={(e) => setDraft({ ...draft, status: e.target.value as PostStatus })}
            className="rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-[#1d4ed8] focus:outline-none"
          >
            <option value="published">Xuất bản ngay</option>
            <option value="draft">Lưu nháp</option>
          </select>
        </label>
      </div>
    </div>
  );
}
