/**
 * Cloudflare R2 — Lưu trữ ảnh biên lai xác nhận đóng góp
 * R2 tương thích S3 API, dùng @aws-sdk/client-s3
 * Free tier: 10GB/tháng, zero egress fees
 */
import {
  S3Client,
  PutObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";

// ============================================================
// Config
// ============================================================

function getR2Config() {
  return {
    accountId: process.env.R2_ACCOUNT_ID || "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    bucketName: process.env.R2_BUCKET_NAME || "",
    publicUrl: (process.env.R2_PUBLIC_URL || "").replace(/\/$/, ""),
  };
}

function isR2Configured(): boolean {
  const cfg = getR2Config();
  return !!(cfg.accountId && cfg.accessKeyId && cfg.secretAccessKey);
}

function getS3Client(): S3Client {
  const cfg = getR2Config();
  return new S3Client({
    region: "auto",
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
}

// ============================================================
// Helpers
// ============================================================

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export function receiptKey(invitationId: string, mimeType: string): string {
  const ext = MIME_TO_EXT[mimeType] || "jpg";
  return `receipts/${invitationId}.${ext}`;
}

// ============================================================
// Upload
// ============================================================

export type UploadResult =
  | { ok: true; url: string; key: string }
  | { ok: false; error: string };

/**
 * Upload ảnh biên lai lên Cloudflare R2
 * @param invitationId - ID vé (dùng làm tên file)
 * @param buffer - Buffer ảnh
 * @param mimeType - MIME type (image/jpeg, image/png, image/webp)
 * @returns URL public của ảnh, hoặc lỗi nếu R2 chưa cấu hình
 */
export async function uploadReceipt(
  invitationId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<UploadResult> {
  if (!isR2Configured()) {
    // Chế độ fallback: Khi R2 chưa được cấu hình, lưu local
    return uploadReceiptLocal(invitationId, buffer, mimeType);
  }

  const cfg = getR2Config();
  const key = receiptKey(invitationId, mimeType);

  const input: PutObjectCommandInput = {
    Bucket: cfg.bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    // Metadata để dễ tìm kiếm sau này
    Metadata: {
      "invitation-id": invitationId,
      "uploaded-at": new Date().toISOString(),
    },
  };

  try {
    const client = getS3Client();
    await client.send(new PutObjectCommand(input));

    // Build public URL
    const url = cfg.publicUrl
      ? `${cfg.publicUrl}/${key}`
      : `https://${cfg.accountId}.r2.cloudflarestorage.com/${cfg.bucketName}/${key}`;

    return { ok: true, url, key };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[R2] Upload failed:", message);
    return { ok: false, error: message };
  }
}

// ============================================================
// Local Fallback (khi R2 chưa cấu hình — dùng trong dev/test)
// ============================================================

import fs from "node:fs/promises";
import path from "node:path";

const LOCAL_RECEIPTS_DIR = path.join(process.cwd(), "data", "receipts");

async function uploadReceiptLocal(
  invitationId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<UploadResult> {
  try {
    await fs.mkdir(LOCAL_RECEIPTS_DIR, { recursive: true });
    const ext = MIME_TO_EXT[mimeType] || "jpg";
    const filename = `${invitationId}.${ext}`;
    const filepath = path.join(LOCAL_RECEIPTS_DIR, filename);
    await fs.writeFile(filepath, buffer);
    // URL cục bộ — serve qua API route /api/admin/receipt/[invitationId]
    const url = `/api/admin/receipt/${invitationId}`;
    return { ok: true, url, key: `local/${filename}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

/**
 * Đọc ảnh biên lai local (dùng cho admin API route khi R2 chưa cấu hình)
 */
export async function getLocalReceiptBuffer(
  invitationId: string,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const exts = ["jpg", "png", "webp", "heic", "heif"];
  for (const ext of exts) {
    const filepath = path.join(LOCAL_RECEIPTS_DIR, `${invitationId}.${ext}`);
    try {
      const buffer = await fs.readFile(filepath);
      const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
      return { buffer, mimeType: mime };
    } catch {
      // Thử ext tiếp theo
    }
  }
  return null;
}
