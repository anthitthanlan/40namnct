"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { convertImageToWebpClient } from "@/lib/client-image-convert";

const ROLES = [
  "Cựu học sinh",
  "Thầy giáo / Cô giáo",
  "Phụ huynh",
  "Học sinh hiện tại",
  "Người thân / Bạn của trường",
];

const ADMIN_ROLES = [
  "Ban Biên tập",
  "Ban Tổ chức Lễ kỷ niệm 40 năm",
  ...ROLES,
];

const inputCls =
  "mt-2 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none";
const labelCls =
  "mt-5 block text-xs font-extrabold uppercase tracking-wider text-slate-500";

const RAW_IMAGE_LIMIT = 50 * 1024 * 1024; // Cho phép ảnh gốc lên đến 50MB
const WEBP_IMAGE_LIMIT = 10 * 1024 * 1024; // Giới hạn sau cùng sau khi chuyển thành WebP là 10MB
const VIDEO_LIMIT = 40 * 1024 * 1024; // 40MB cho video
const MAX_FILES = 8;

function prettySize(bytes: number): string {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
    : `${Math.round(bytes / 1024)}KB`;
}

function isVideo(name: string) {
  return /\.(mp4|webm)$/i.test(name);
}

type FileEntry = {
  file: File;
  previewUrl: string | null;
  originalSize?: number;
  isOptimized?: boolean;
};

export default function MediaUploader({ onSuccess, onCancel, isAdmin = false }: { onSuccess?: () => void; onCancel?: () => void; isAdmin?: boolean }) {
  const [author, setAuthor] = useState(isAdmin ? "Ban Biên tập" : "");
  const [role, setRole] = useState(isAdmin ? "Ban Biên tập" : ROLES[0]);
  const [caption, setCaption] = useState("");
  const [mediaType, setMediaType] = useState("feed");
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(isAdmin ? new Date().getFullYear().toString() : "");
  const [month, setMonth] = useState(isAdmin ? (new Date().getMonth() + 1).toString() : "");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  function validateFiles(picked: File[]): string | null {
    const bad = picked.find(
      (f) => /\.(jpe?g|png|webp|gif|mp4|webm)$/i.test(f.name) === false
    );
    if (bad) return `Tệp "${bad.name}" không đúng định dạng ảnh/video.`;
    const over = picked.find((f) =>
      isVideo(f.name) ? f.size > VIDEO_LIMIT : f.size > RAW_IMAGE_LIMIT
    );
    if (over)
      return `Tệp "${over.name}" quá lớn (tối đa 50MB ảnh gốc / 40MB video).`;
    return null;
  }

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    setError("");
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;

    // Reset input so same files can be re-picked
    if (inputRef.current) inputRef.current.value = "";

    const err = validateFiles(picked);
    if (err) {
      setError(err);
      return;
    }

    setOptimizing(true);
    try {
      const processed: FileEntry[] = [];
      for (const f of picked) {
        if (isVideo(f.name)) {
          processed.push({
            file: f,
            previewUrl: null,
            originalSize: f.size,
            isOptimized: false,
          });
        } else {
          // Tự động chuyển đổi ảnh sang WebP ngay trên trình duyệt và tính dung lượng sau cùng
          const res = await convertImageToWebpClient(f);
          if (res.file.size > WEBP_IMAGE_LIMIT) {
            setError(
              `Tệp "${f.name}" sau khi tối ưu WebP (${prettySize(res.file.size)}) vẫn vượt quá 10MB.`
            );
            setOptimizing(false);
            return;
          }
          processed.push({
            file: res.file,
            previewUrl: URL.createObjectURL(res.file),
            originalSize: res.originalSize,
            isOptimized: res.isOptimized,
          });
        }
      }

      // Merge new files with existing ones, deduplicate by name+size
      setEntries((prev) => {
        const existing = new Set(prev.map((e) => `${e.file.name}-${e.file.size}`));
        const newEntries = processed.filter(
          (p) => !existing.has(`${p.file.name}-${p.file.size}`)
        );
        const merged = [...prev, ...newEntries];
        if (merged.length > MAX_FILES) {
          setError(`Chỉ được chọn tối đa ${MAX_FILES} tệp.`);
          return prev;
        }
        return merged;
      });
    } catch (err) {
      console.error("Lỗi tối ưu ảnh:", err);
      setError("Không thể xử lý tối ưu ảnh. Vui lòng thử lại.");
    } finally {
      setOptimizing(false);
    }
  }

  function removeFile(idx: number) {
    setEntries((prev) => {
      const entry = prev[idx];
      if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
    setError("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setDone("");
    setError("");
    if (author.trim().length < 2) {
      setError("Vui lòng nhập họ tên của bạn.");
      return;
    }
    const y = parseInt(year, 10);
    if (Number.isNaN(y) || y < 1950 || y > 2100) {
      setError("Vui lòng nhập năm (1950 - 2100) - năm dùng để sắp trên Timeline.");
      return;
    }
    // Month is optional — default to 1 if not provided
    const rawMonth = month.trim();
    const m = rawMonth ? parseInt(rawMonth, 10) : 1;
    if (rawMonth && (Number.isNaN(m) || m < 1 || m > 12)) {
      setError("Tháng không hợp lệ (1 - 12).");
      return;
    }
    if (entries.length === 0 || entries.length > MAX_FILES) {
      setError(`Chọn từ 1 đến ${MAX_FILES} tệp ảnh / video.`);
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("author", author);
      form.append("authorRole", role);
      form.append("caption", caption);
      form.append("mediaType", mediaType);
      form.append("title", title);
      form.append("year", `${y}`);
      form.append("month", `${m}`);
      if (isAdmin) {
        form.append("publishDirect", "true");
      }
      entries.forEach(({ file }) => form.append("files", file));
      const res = await fetch("/api/media", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || "Không gửi được media. Vui lòng thử lại.");
        return;
      }
      // Revoke preview URLs to free memory
      entries.forEach(({ previewUrl }) => previewUrl && URL.revokeObjectURL(previewUrl));
      setDone(data.message);
      if (onSuccess) onSuccess();
      setEntries([]);
      setCaption("");
      setTitle("");
      setYear("");
      setMonth("");
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="btn-lightship-soft rounded-[2rem] bg-white p-10 text-center">
        <span className="material-symbols-rounded text-6xl text-amber-500 icon-hover-morph">celebration</span>
        <h3 className="mt-4 text-2xl font-extrabold text-slate-900">
          {isAdmin ? "Đã đăng khoảnh khắc!" : "Đã gửi kỷ niệm!"}
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
          {done}{!isAdmin && " Sau khi được duyệt, kỷ niệm của bạn sẽ xuất hiện trong Tường ký ức và Timeline trường."}
        </p>
        <button
          type="button"
          onClick={() => setDone("")}
          className="btn-lightship mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1d4ed8] px-8 py-3 text-sm font-extrabold text-white"
        >
          <span className="material-symbols-rounded">upload</span> {isAdmin ? "Đăng thêm khoảnh khắc" : "Gửi thêm kỷ niệm khác"}
        </button>
      </div>
    );
  }

  const containerCls = isAdmin
    ? "" // Flat layout cho Admin
    : "text-left";

  return (
    <form onSubmit={submit} className={containerCls}>
      <h3 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
        <span className="material-symbols-rounded text-blue-600">upload</span> {isAdmin ? "Tải lên Khoảnh khắc mới" : "Gửi hình ảnh / tư liệu ngay"}
      </h3>
      <p className="mt-2 text-sm text-slate-500">
        {isAdmin ? "Đăng trực tiếp ảnh/video vào Tường ký ức. Tệp sẽ hiển thị ngay mà không cần duyệt." : ""}
      </p>

      {/* File picker */}
      <label className={labelCls} htmlFor="media-files">
        Chọn ảnh / video * (tối đa {MAX_FILES} tệp · ảnh gốc tới 50MB, tự động nén WebP ≤ 10MB · video ≤ 40MB)
      </label>
      <input
        ref={inputRef}
        id="media-files"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
        onChange={onPick}
        disabled={busy || optimizing}
        className="mt-2 w-full cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-[#1d4ed8] file:px-5 file:py-2 file:text-sm file:font-extrabold file:text-white disabled:opacity-50"
      />

      {/* Optimizing banner */}
      {optimizing && (
        <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-blue-50/80 border border-blue-200/60 px-4 py-3 text-xs font-bold text-blue-700">
          <span className="material-symbols-rounded animate-spin text-base text-blue-600">sync</span>
          <span>Đang tối ưu dung lượng và chuyển đổi ảnh sang WebP...</span>
        </div>
      )}

      {/* File list with previews and remove buttons */}
      {entries.length > 0 && (
        <ul className="mt-3 space-y-2">
          {entries.map(({ file, previewUrl, originalSize, isOptimized }, idx) => (
            <li
              key={`${file.name}-${file.size}-${idx}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2"
            >
              {/* Thumbnail / video icon */}
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="h-12 w-12 shrink-0 rounded-xl object-cover border border-slate-200"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-200">
                  <span className="material-symbols-rounded text-slate-500 text-2xl">movie</span>
                </div>
              )}

              {/* File info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-700">{file.name}</p>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] mt-0.5">
                  <span className="font-semibold text-slate-700">{prettySize(file.size)}</span>
                  {originalSize && originalSize > file.size && (
                    <span className="text-slate-400 line-through text-[10px]">
                      {prettySize(originalSize)}
                    </span>
                  )}
                  {isOptimized && (
                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/80">
                      WebP {originalSize ? `· Giảm ${Math.round((1 - file.size / originalSize) * 100)}%` : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeFile(idx)}
                disabled={busy || optimizing}
                title="Xóa tệp này"
                className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-rounded text-[18px]">close</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-x-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="media-type">
            Loại hình ảnh
          </label>
          <select
            id="media-type"
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value)}
            className={inputCls}
          >
            <option value="feed">Khoảnh khắc / Feed</option>
            <option value="post">Bài viết / Post</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="media-title">
            Tên Chủ đề / Album
          </label>
          <input
            id="media-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Lễ Khai Giảng 2026"
            className={inputCls}
            maxLength={100}
          />
        </div>
      </div>

      <label className={labelCls} htmlFor="media-caption">
        Chú thích (khoảnh khắc, năm tháng, người trong ảnh…)
      </label>
      <textarea
        id="media-caption"
        rows={5}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="VD: Lễ chào cờ đầu năm học 1998, trước sân trường cũ"
        className={inputCls}
        maxLength={300}
      />

      <div className="grid gap-x-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="media-year">
            Năm * <span className="text-slate-400">(dùng để sắp trên Timeline)</span>
          </label>
          <input
            id="media-year"
            type="number"
            min={1950}
            max={2100}
            inputMode="numeric"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="VD: 1998"
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="media-month">
            Tháng <span className="text-slate-400">(không bắt buộc)</span>
          </label>
          <select
            id="media-month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={inputCls}
          >
            <option value="">Không rõ</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((v) => (
              <option key={v} value={v}>
                Tháng {v}
              </option>
            ))}
          </select>
        </div>
      </div>

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
            {(isAdmin ? ADMIN_ROLES : ROLES).map((r) => (
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

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={busy || optimizing || entries.length === 0}
          className="btn-lightship flex w-full items-center justify-center gap-2 bg-[#1d4ed8] py-3.5 text-base font-extrabold text-white disabled:opacity-50 sm:w-auto sm:px-10"
        >
          {optimizing ? (
            <>
              <span className="material-symbols-rounded animate-spin">sync</span> Đang tối ưu ảnh…
            </>
          ) : busy ? (
            "Đang tải lên…"
          ) : (
            <>
              <span className="material-symbols-rounded">upload</span> {isAdmin ? "Đăng khoảnh khắc" : "Gửi kỷ niệm"}
            </>
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy || optimizing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3.5 text-base font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50 sm:w-auto sm:px-8"
          >
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}
