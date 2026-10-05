export type MediaStatus = "pending" | "approved" | "rejected";

export type MediaItem = {
  id: string;
  file: string;
  url?: string;
  kind: "image" | "video";
  size: number;
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nctitc.io.vn";

function getHeaders(token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export function extOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

export function kindForExt(ext: string): "image" | "video" | null {
  if (ext in IMAGE_MIME) return "image";
  if (ext in VIDEO_MIME) return "video";
  return null;
}

export async function saveUploadFile(
  buffer: Buffer,
  ext: string,
  options?: {
    mediaType?: string;
    title?: string;
    uploadIndex?: number;
    year?: number;
    month?: number;
    author?: string;
    authorRole?: string;
    caption?: string;
  }
): Promise<string> {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(buffer)], { type: "application/octet-stream" }),
    `upload.${ext}`
  );

  if (options) {
    if (options.mediaType) formData.append("mediaType", options.mediaType);
    if (options.title) formData.append("title", options.title);
    if (options.uploadIndex !== undefined) formData.append("uploadIndex", String(options.uploadIndex));
    if (options.year !== undefined) formData.append("year", String(options.year));
    if (options.month !== undefined) formData.append("month", String(options.month));
    if (options.author) formData.append("author", options.author);
    if (options.authorRole) formData.append("authorRole", options.authorRole);
    if (options.caption) formData.append("caption", options.caption);
  } else {
    // Default metadata from old logic
    formData.append("year", "2026");
    formData.append("month", "11");
    formData.append("author", "");
    formData.append("authorRole", "");
    formData.append("caption", "");
  }

  const res = await fetch(`${API_URL}/api/media/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.statusText}`);
  }

  const result = await res.json();
  return result.filename || result.file;
}

export async function addMediaItem(item: MediaItem): Promise<void> {
  // FastAPI handles adding the record during upload for now.
  // Or we might need to send an update if necessary.
  // Since FastAPI /api/media/upload already creates the record, this might be a no-op 
  // or we might have to patch it if they want to update details.
  return;
}

export async function listApprovedMedia(): Promise<MediaItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/media?status=approved`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const items = await res.json();
    return items.sort((a: MediaItem, b: MediaItem) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  } catch {
    return [];
  }
}

export async function listApprovedMediaChronological(): Promise<MediaItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/media?status=approved`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const items = await res.json();
    return items.sort(
      (a: MediaItem, b: MediaItem) =>
        a.year - b.year ||
        a.month - b.month ||
        b.createdAt.localeCompare(a.createdAt),
    );
  } catch {
    return [];
  }
}

export async function listAllMedia(token?: string): Promise<MediaItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/media?status=all`, {
      headers: getHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const items = await res.json();
    const order: Record<MediaStatus, number> = { pending: 0, approved: 1, rejected: 2 };
    return items.sort(
      (a: MediaItem, b: MediaItem) =>
        order[a.status] - order[b.status] ||
        b.createdAt.localeCompare(a.createdAt),
    );
  } catch {
    return [];
  }
}

export async function setMediaStatus(
  id: string,
  status: MediaStatus,
  token?: string,
): Promise<MediaItem | null> {
  const formData = new URLSearchParams();
  formData.append("status", status);

  const res = await fetch(`${API_URL}/api/media/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) return null;
  return await res.json();
}

export async function deleteMedia(id: string, token?: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/media/${id}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  return res.ok;
}

const R2_PUBLIC_URL_MEDIA = process.env.NEXT_PUBLIC_R2_URL || "https://media-r2.nct40.poln.id.vn";

export function mediaFileUrl(file: string): string {
  if (file.startsWith("http")) return file;
  return `${R2_PUBLIC_URL_MEDIA}/${file}`;
}
