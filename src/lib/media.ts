import { randomUUID } from "node:crypto";
import { db } from "./firebase";
import { uploadMediaFile } from "./r2";

export type MediaStatus = "pending" | "approved" | "rejected";

export type MediaItem = {
  id: string;
  /** Tên file (R2 key) */
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
  const name = `${randomUUID()}.${ext}`;
  const mime = mimeForExt(ext) || "application/octet-stream";
  const result = await uploadMediaFile(name, buffer, mime);
  if (!result.ok) {
    throw new Error(`Upload to R2 failed: ${result.error}`);
  }
  // Return the R2 key
  return result.key;
}

async function readMedia(): Promise<MediaItem[]> {
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_SERVICE_ACCOUNT) return [];
  const snapshot = await db.collection("media").get();
  return snapshot.docs.map((doc) => normalizeMediaItem(doc.data() as MediaItem));
}

export async function addMediaItem(item: MediaItem): Promise<void> {
  await db.collection("media").doc(item.id).set(item);
}

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
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_SERVICE_ACCOUNT) return [];
  const snapshot = await db.collection("media").where("status", "==", "approved").get();
  const items = snapshot.docs.map((doc) => normalizeMediaItem(doc.data() as MediaItem));
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Danh sách media đã duyệt, sắp theo năm → tháng (cho Timeline tự động cuộn) */
export async function listApprovedMediaChronological(): Promise<MediaItem[]> {
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_SERVICE_ACCOUNT) return [];
  const snapshot = await db.collection("media").where("status", "==", "approved").get();
  const items = snapshot.docs.map((doc) => normalizeMediaItem(doc.data() as MediaItem));
  return items.sort(
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
  const docRef = db.collection("media").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return null;

  await docRef.update({ status });
  const updated = await docRef.get();
  return normalizeMediaItem(updated.data() as MediaItem);
}

export async function deleteMedia(id: string): Promise<boolean> {
  const docRef = db.collection("media").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;
  
  await docRef.delete();
  // We should ideally also delete the object from R2, but we don't have a delete function in r2.ts yet.
  // This is acceptable as a tradeoff for now, or we can add it later.
  return true;
}

export function mediaFileUrl(file: string): string {
  if (file.startsWith("http")) return file;
  const publicUrlBase = (process.env.R2_PUBLIC_URL_MEDIA || "").replace(/\/$/, "");
  if (publicUrlBase) return `${publicUrlBase}/${file}`;
  return `https://pub-xxxxxx.r2.dev/${file}`;
}
