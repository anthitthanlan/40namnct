import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type MediaStatus = "pending" | "approved" | "rejected";

export type MediaItem = {
  id: string;
  /** Tên file trong data/uploads - phục vụ qua /api/media/file/[name] */
  file: string;
  kind: "image" | "video";
  size: number;
  /** Năm & tháng khoác khúc - dùng để sắp xếp tự động trên Timeline */
  year: number;
  month: number;
  author: string;
  authorRole: string;
  caption: string;
  status: MediaStatus;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const MEDIA_FILE = path.join(DATA_DIR, "media.json");

let queue: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function readMedia(): Promise<MediaItem[]> {
  try {
    const raw = await fs.readFile(MEDIA_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return (parsed as MediaItem[]).map(normalizeMediaItem);
    }
  } catch {
    await withLock(async () => {
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(MEDIA_FILE, "[]", "utf8");
      } catch {
        /* no-op */
      }
    });
  }
  return [];
}

async function writeMedia(items: MediaItem[]): Promise<void> {
  await withLock(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(MEDIA_FILE, JSON.stringify(items, null, 2), "utf8");
  });
}

export const IMAGE_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export const VIDEO_MIME: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
};

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_BYTES = 40 * 1024 * 1024; // 40MB

export function extOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

export function mimeForExt(ext: string): string | null {
  return IMAGE_MIME[ext] ?? VIDEO_MIME[ext] ?? null;
}

export function kindForExt(ext: string): "image" | "video" | null {
  if (ext in IMAGE_MIME) return "image";
  if (ext in VIDEO_MIME) return "video";
  return null;
}

export async function saveUploadFile(
  buffer: Buffer,
  ext: string,
): Promise<string> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, name), buffer);
  return name;
}

export async function addMediaItem(item: MediaItem): Promise<void> {
  const items = await readMedia();
  items.push(item);
  await writeMedia(items);
}

/** Dữ data cố từ các item cữ (không có năm/tháng) → năm/tháng từ createdAt */
function normalizeMediaItem(item: MediaItem): MediaItem {
  const created = new Date(item.createdAt);
  const fallbackYear = Number.isNaN(created.getFullYear())
    ? 2026
    : created.getFullYear();
  const fallbackMonth = Number.isNaN(created.getMonth())
    ? 1
    : created.getMonth() + 1;
  const year =
    Number.isInteger(item.year) && item.year >= 1900 && item.year <= 2100
      ? item.year
      : fallbackYear;
  const month =
    Number.isInteger(item.month) && item.month >= 1 && item.month <= 12
      ? item.month
      : fallbackMonth;
  return { ...item, year, month };
}

export async function listApprovedMedia(): Promise<MediaItem[]> {
  return (await readMedia())
    .filter((m) => m.status === "approved")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Danh sách media đã duyệt, sắp theo năm → tháng (cho Timeline tự động cuộn) */
export async function listApprovedMediaChronological(): Promise<MediaItem[]> {
  return (await readMedia())
    .filter((m) => m.status === "approved")
    .sort(
      (a, b) =>
        a.year - b.year ||
        a.month - b.month ||
        b.createdAt.localeCompare(a.createdAt),
    );
}

export async function listAllMedia(): Promise<MediaItem[]> {
  const items = await readMedia();
  const order: Record<MediaStatus, number> = { pending: 0, approved: 1, rejected: 2 };
  return items.sort(
    (a, b) =>
      order[a.status] - order[b.status] ||
      b.createdAt.localeCompare(a.createdAt),
  );
}

export async function setMediaStatus(
  id: string,
  status: MediaStatus,
): Promise<MediaItem | null> {
  const items = await readMedia();
  const index = items.findIndex((m) => m.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], status };
  await writeMedia(items);
  return items[index];
}

export async function deleteMedia(id: string): Promise<boolean> {
  const items = await readMedia();
  const found = items.find((m) => m.id === id);
  if (!found) return false;
  await writeMedia(items.filter((m) => m.id !== id));
  try {
    await fs.unlink(path.join(UPLOADS_DIR, path.basename(found.file)));
  } catch {
    /* file có thể đã mất - bỏ qua */
  }
  return true;
}

const SAFE_FILE_RE =
  /^[a-f0-9-]{36}\.(jpg|jpeg|png|webp|gif|mp4|webm)$/i;

/** Đọc file upload để phục vụ - chặn path traversal */
export async function readUploadFile(
  name: string,
): Promise<{ buffer: Buffer; mime: string } | null> {
  const safe = path.basename(name);
  if (!SAFE_FILE_RE.test(safe)) return null;
  const ext = extOf(safe);
  const mime = mimeForExt(ext);
  if (!mime) return null;
  try {
    const buffer = await fs.readFile(path.join(UPLOADS_DIR, safe));
    return { buffer, mime };
  } catch {
    return null;
  }
}

export function mediaFileUrl(file: string): string {
  return `/api/media/file/${encodeURIComponent(file)}`;
}
