"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

const ROLES = [
  "Cựu học sinh",
  "Thầy giáo / Cô giáo",
  "Phụ huynh",
  "Học sinh hiện tại",
  "Người thân / Bạn của trường",
];

const inputCls =
  "mt-2 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none";

const labelCls =
  "mt-5 block text-xs font-extrabold uppercase tracking-wider text-slate-500";

type SendState = "idle" | "sending" | "success" | "error";

export default function StoryForm() {
  const [author, setAuthor] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [khoa, setKhoa] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (author.trim().length < 2) {
      setState("error");
      setMessage("Vui lòng nhập họ tên của bạn.");
      return;
    }
    if (title.trim().length < 6) {
      setState("error");
      setMessage("Tiêu đề câu chuyện cần ít nhất 6 ký tự.");
      return;
    }
    if (content.trim().length < 30) {
      setState("error");
      setMessage("Câu chuyện cần ít nhất 30 ký tự để người đọc hiểu rõ hơn.");
      return;
    }
    setState("sending");
    setMessage("");
    try {
      const authorRole = khoa.trim() ? `${role}, khóa ${khoa.trim()}` : role;
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, authorRole, title, content }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(
          data.message || "Không gửi được câu chuyện. Vui lòng thử lại.",
        );
      }
      setState("success");
    } catch (err) {
      setState("error");
      setMessage(
        err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại.",
      );
    }
  }

  if (state === "success") {
    return (
      <div className="btn-lightship-soft rounded-[2rem] bg-white p-10 text-center">
        <span className="text-5xl">🎉</span>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
          Đã gửi câu chuyện!
        </h2>
        <p className="mx-auto mt-3 max-w-md text-slate-600">
          Cảm ơn bạn đã góp một mảnh ghép ký ức cho Trứ. Câu chuyện của bạn
          đang chờ Ban Biên tập duyệt - ngay khi được duyệt, bài viết sẽ xuất
          hiện trong mục{" "}
          <Link href="/bai-viet" className="font-bold text-[#1d4ed8] hover:underline">
            Bài viết
          </Link>
          .
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/bai-viet"
            className="btn-lightship bg-[#1d4ed8] px-6 py-3 text-sm font-extrabold text-white"
          >
            Đọc bài viết khác
          </Link>
          <button
            type="button"
            onClick={() => {
              setState("idle");
              setTitle("");
              setContent("");
            }}
            className="btn-lightship-soft bg-white px-6 py-3 text-sm font-extrabold text-slate-700"
          >
            Kể thêm một câu chuyện
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="btn-lightship-soft rounded-[2rem] bg-white p-8 sm:p-10">
      <h2 className="text-2xl font-extrabold text-slate-900">
        Kể câu chuyện của bạn
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Câu chuyện sẽ được Ban Biên tập duyệt trước khi hiển thị công khai.
      </p>

      <div className="grid gap-x-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="story-author">
            Họ tên của bạn *
          </label>
          <input
            id="story-author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="VD: Lê Minh Trí"
            className={inputCls}
            maxLength={80}
            required
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="story-role">
            Bạn là…
          </label>
          <select
            id="story-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputCls}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className={labelCls} htmlFor="story-khoa">
        Khóa (năm tốt nghiệp - nếu có)
      </label>
      <input
        id="story-khoa"
        value={khoa}
        onChange={(e) => setKhoa(e.target.value)}
        placeholder="VD: 1998"
        className={inputCls}
        maxLength={20}
      />

      <label className={labelCls} htmlFor="story-title">
        Tiêu đề câu chuyện *
      </label>
      <input
        id="story-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="VD: Chiếc bàn gỗ lớp 10A2"
        className={inputCls}
        maxLength={140}
        required
      />

      <label className={labelCls} htmlFor="story-content">
        Câu chuyện của bạn *
      </label>
      <textarea
        id="story-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        placeholder={
          "Kể lại kỷ niệm của bạn dưới mái trường Trứ…\n\nMẹo nhỏ: dùng ## để làm tiêu đề mục, **chữ đậm** để nhấn câu quan trọng, và - để gạch đầu dòng."
        }
        className={`${inputCls} leading-relaxed`}
        maxLength={12000}
        required
      />
      <p className="mt-2 text-right text-xs text-slate-400">
        {content.length} / 12.000 ký tự
      </p>

      {state === "error" && message && (
        <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="btn-lightship mt-6 w-full bg-[#16a34a] py-3.5 text-base font-extrabold text-white disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {state === "sending" ? "Đang gửi…" : "📨 Gửi câu chuyện"}
      </button>
      <p className="mt-4 text-xs text-slate-400">
        Bằng việc gửi câu chuyện, bạn đồng ý cho nhà trường trưng bày nội dung
        trong Triển lãm 40 năm và các ấn phẩm kỷ niệm.
      </p>
    </form>
  );
}

