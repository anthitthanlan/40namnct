"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

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

const IMAGE_LIMIT = 10 * 1024 * 1024;
const VIDEO_LIMIT = 40 * 1024 * 1024;

function prettySize(bytes: number): string {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
    : `${Math.round(bytes / 1024)}KB`;
}

export default function MediaUploader() {
  const [author, setAuthor] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    setError("");
    const picked = Array.from(e.target.files ?? []);
    setFiles(picked);
    const bad = picked.find(
      (f) => /\.(jpe?g|png|webp|gif|mp4|webm)$/i.test(f.name) === false,
    );
    if (bad) setError(`Tệp "${bad.name}" không đúng định dạng ảnh/video.`);
    const over = picked.find((f) =>
      /\.(mp4|webm)$/i.test(f.name)
        ? f.size > VIDEO_LIMIT
        : f.size > IMAGE_LIMIT,
    );
    if (over)
      setError(`Tệp "${over.name}" quá lớn (tối đa 10MB ảnh / 40MB video).`);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setDone("");
    setError("");
    if (author.trim().length < 2) {
      setError("Vui lòng nhập họ tên của bạn.");
      return;
    }
    if (files.length === 0 || files.length > 8) {
      setError("Chọn từ 1 đến 8 tệp ảnh / video.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("author", author);
      form.append("authorRole", role);
      form.append("caption", caption);
      files.forEach((f) => form.append("files", f));
      const res = await fetch("/api/media", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || "Không gửi được media. Vui lòng thử lại.");
        return;
      }
      setDone(data.message);
      setFiles([]);
      setCaption("");
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="btn-pop-soft rounded-[2rem] bg-white p-10 text-center">
        <span className="text-5xl">🎉</span>
        <h3 className="mt-4 text-2xl font-extrabold text-slate-900">
          Đã gửi kỷ niệm!
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
          {done} Sau khi được duyệt, kỷ niệm của bạn sẽ xuất hiện trong Tường
          ký ức bên dưới.
        </p>
        <button
          type="button"
          onClick={() => setDone("")}
          className="btn-pop mt-7 rounded-2xl bg-[#1d4ed8] px-8 py-3 text-sm font-extrabold text-white"
        >
          📤 Gửi thêm kỷ niệm khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="btn-pop-soft rounded-[2rem] bg-white p-7 text-left sm:p-9">
      <h3 className="text-xl font-extrabold text-slate-900">
        📤 Gửi hình ảnh / tư liệu ngay
      </h3>
      <p className="mt-2 text-sm text-slate-500">
        Tải lên ảnh cũ, học bạ, sổ liên lạc, phù hiệu… hoặc video ngắn. Sau khi
        Ban Biên tập duyệt, kỷ niệm sẽ được trưng bày trong Triển lãm 40 năm.
      </p>

      <label className={labelCls} htmlFor="media-files">
        Chọn ảnh / video * (tối đa 8 tệp · ảnh ≤ 10MB · video ≤ 40MB)
      </label>
      <input
        ref={inputRef}
        id="media-files"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
        onChange={onPick}
        className="mt-2 w-full cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-[#1d4ed8] file:px-5 file:py-2 file:text-sm file:font-extrabold file:text-white"
      />
      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((f) => (
            <li
              key={`${f.name}-${f.size}`}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              <span className="truncate">📎 {f.name}</span>
              <span className="ml-3 shrink-0 text-slate-400">
                {prettySize(f.size)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <label className={labelCls} htmlFor="media-caption">
        Chú thích (khoảnh khắc, năm tháng, người trong ảnh…)
      </label>
      <textarea
        id="media-caption"
        rows={3}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="VD: Lễ chào cờ đầu năm học 1998, trước sân trường cũ"
        className={inputCls}
        maxLength={300}
      />

      <div className="grid gap-x-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="media-author">
            Họ tên của bạn *
          </label>
          <input
            id="media-author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="VD: Lê Minh Trí"
            className={inputCls}
            maxLength={80}
            required
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="media-role">
            Bạn là…
          </label>
          <select
            id="media-role"
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

      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-pop mt-6 w-full bg-[#1d4ed8] py-3.5 text-base font-extrabold text-white disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {busy ? "Đang tải lên…" : "📤 Gửi kỷ niệm"}
      </button>
    </form>
  );
}
