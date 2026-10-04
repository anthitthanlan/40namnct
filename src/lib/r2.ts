/**
 * Cloudflare R2 — Lưu trữ ảnh biên lai xác nhận đóng góp
 * R2 tương thích S3 API, dùng @aws-sdk/client-s3
 * Free tier: 10GB/tháng, zero egress fees
 */
import sharp from "sharp";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export type UploadResult =
  | { ok: true; url: string; key: string }
  | { ok: false; error: string };

// ============================================================
// Receipts (Biên lai) - BUCKET RIÊNG, KHÔNG PUBLIC
// ============================================================

export function receiptKey(invitationId: string, mimeType: string): string {
  // Now we always save as webp
  return `receipts/${invitationId}.webp`;
}

export async function uploadReceipt(
  invitationId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<UploadResult> {
  const bucketName = process.env.R2_BUCKET_RECEIPTS;
  if (!bucketName) return { ok: false, error: "Chưa cấu hình R2_BUCKET_RECEIPTS" };

  try {
    // Luôn convert sang WebP
    let processBuffer = buffer;
    if (mimeType.startsWith("image/")) {
      processBuffer = await sharp(buffer)
        .webp({ quality: 80 })
        .toBuffer();
    }
    const finalMimeType = "image/webp";
    const key = receiptKey(invitationId, finalMimeType);

    const input: PutObjectCommandInput = {
      Bucket: bucketName,
      Key: key,
      Body: processBuffer,
      ContentType: finalMimeType,
      Metadata: {
        "invitation-id": invitationId,
      },
    };

    const client = getR2Client();
    await client.send(new PutObjectCommand(input));
    // Đối với biên lai, không trả về URL public. Chỉ trả về key.
    return { ok: true, url: key, key };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[R2] Lỗi upload biên lai:", message);
    return { ok: false, error: message };
  }
}

/**
 * Lấy URL tạm thời (Presigned URL) có hiệu lực 1 giờ để Admin xem biên lai
 */
export async function getReceiptSignedUrl(key: string): Promise<string | null> {
  const bucketName = process.env.R2_BUCKET_RECEIPTS;
  if (!bucketName || !key) return null;
  try {
    const client = getR2Client();
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    // @ts-ignore - aws-sdk/client-s3 and aws-sdk/s3-request-presigner have a minor version mismatch in @smithy/types causing type errors but runtime is fine
    return await getSignedUrl(client, command, { expiresIn: 3600 });
  } catch {
    return null;
  }
}

// ============================================================
// Media (Khoảnh khắc / Post) - BUCKET PUBLIC
// ============================================================

export async function uploadMediaFile(
  name: string,
  buffer: Buffer,
  mimeType: string,
): Promise<UploadResult> {
  const bucketName = process.env.R2_BUCKET_MEDIA;
  const publicUrlBase = (process.env.R2_PUBLIC_URL_MEDIA || "").replace(/\/$/, "");
  
  if (!bucketName) return { ok: false, error: "Chưa cấu hình R2_BUCKET_MEDIA" };

  try {
    let processBuffer = buffer;
    let finalMimeType = mimeType;
    let finalName = name;

    // Chỉ convert ảnh (không convert video)
    if (mimeType.startsWith("image/") && mimeType !== "image/gif") {
      processBuffer = await sharp(buffer)
        .webp({ quality: 80 })
        .toBuffer();
      finalMimeType = "image/webp";
      // Đổi đuôi thành .webp
      finalName = name.replace(/\.[^/.]+$/, "") + ".webp";
    }

    const input: PutObjectCommandInput = {
      Bucket: bucketName,
      Key: finalName,
      Body: processBuffer,
      ContentType: finalMimeType,
    };

    const client = getR2Client();
    await client.send(new PutObjectCommand(input));
    
    // Nếu có R2_PUBLIC_URL_MEDIA (VD: https://media.nctitc.io.vn) thì dùng,
    // Không thì fallback về R2.dev (nếu bật)
    const url = publicUrlBase
      ? `${publicUrlBase}/${finalName}`
      : `https://pub-xxxxxx.r2.dev/${finalName}`; // Lưu ý: Cần cấu hình biến môi trường!
      
    return { ok: true, url, key: finalName };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[R2] Lỗi upload media:", message);
    return { ok: false, error: message };
  }
}
