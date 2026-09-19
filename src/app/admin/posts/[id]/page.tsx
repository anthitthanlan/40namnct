"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { PostStatus } from "@/lib/posts";

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
  "mt-2 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none";
const aLabel =
  "mt-5 block text-xs font-extrabold uppercase tracking-wider text-slate-500";

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ ok: boolean; text: string } | null>(null);

  const isNew = params.id === "new";

  useEffect(() => {
    async function load() {
      const authRes = await fetch("/api/admin/me", { cache: "no-store" });
      const authData = await authRes.json();
      if (!authData.authenticated) {
        router.replace("/admin");
        return;
      }

      if (isNew) {
        setDraft({ ...EMPTY_DRAFT });
        return;
      }

      const res = await fetch("/api/admin/posts", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        const post = data.posts.find((p: any) => p.id === params.id);
        if (post) {
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
        } else {
          router.replace("/admin");
        }
      }
    }
    load();
  }, [params.id, isNew, router]);

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
      const res = await fetch(
        draft.id ? `/api/admin/posts/${draft.id}` : "/api/admin/posts",
        {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.status === 401) {
        router.replace("/admin");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(false, data.message || "Không lưu được bài viết.");
        return;
      }
      flash(true, draft.id ? "Đã cập nhật bài viết." : "Đã tạo bài viết mới.");
      setTimeout(() => {
        router.push("/admin?tab=all");
      }, 1500);
    } finally {
      setBusy(false);
    }
  }

  if (!draft) {
    return <div className="p-10 text-center font-bold text-slate-500">Đang tải...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-10">
      {banner && (
        <div
          className={`mb-8 rounded-3xl px-6 py-4 text-sm font-bold ${
            banner.ok
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-rose-100 text-rose-800 border border-rose-200"
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className="mb-8 rounded-[2rem] border-2 border-[#1d4ed8]/20 bg-white p-7 sm:p-10 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {isNew ? "Viết bài mới" : "Sửa bài viết"}
          </h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-full bg-slate-100 px-5 py-2 text-sm font-bold text-slate-500 transition-all hover:bg-slate-200"
            >
              Trở về
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={busy}
              className="rounded-full bg-[#1d4ed8] px-5 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? "Đang lưu..." : "Lưu bài viết"}
            </button>
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

        <label className={aLabel} htmlFor="d-content">Nội dung * - hỗ trợ: # tiêu đề, ## tiêu đề phụ, &gt; trích dẫn, - gạch đầu dòng, **chữ đậm**, *nghiêng*</label>
        <textarea
          id="d-content"
          rows={12}
          value={draft.content}
          onChange={(e) => setDraft({ ...draft, content: e.target.value })}
          className={`${aInput} leading-relaxed`}
        />
        <p className="mt-1 text-right text-xs text-slate-400">{draft.content.length} ký tự</p>

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
    </div>
  );
}
