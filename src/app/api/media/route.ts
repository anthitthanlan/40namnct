import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { isAdminRequest } from "@/lib/auth";
import {
  addMediaItem,
  extOf,
  kindForExt,
  listAllMedia,
  listApprovedMedia,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  mediaFileUrl,
  saveUploadFile,
} from "@/lib/media";

export const dynamic = "force-dynamic";

const MAX_FILES = 8;

function str(v: FormDataEntryValue | null, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Danh sách media: công khai chỉ thấy mục đã duyệt, admin thấy tất cả */
export async function GET(req: NextRequest) {
  const items = isAdminRequest(req)
    ? await listAllMedia()
    : await listApprovedMedia();
  return NextResponse.json({
    ok: true,
    media: items.map((m) => ({ ...m, url: mediaFileUrl(m.file) })),
  });
}

/** Upload media từ cộng đồng → vào hàng chờ Ban Biên tập duyệt */
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  const files = form
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  const author = str(form.get("author"), 80);
  const authorRole = str(form.get("authorRole"), 120) || "Cộng đồng Trứ";
  const caption = str(form.get("caption"), 300);
  const year = parseInt(str(form.get("year"), 8), 10);
  const month = parseInt(str(form.get("month"), 8), 10);

  if (author.length < 2) {
    return NextResponse.json(
      { ok: false, message: "Vui lòng nhập họ tên của bạn." },
      { status: 400 },
    );
  }
  if (Number.isNaN(year) || year < 1900 || year > 2100) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Vui lòng nhập năm (1900 - 2100) - năm dùng để sắp trên Timeline.",
      },
      { status: 400 },
    );
  }
  if (Number.isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Vui lòng chọn tháng (1 - 12) - tháng dùng để sắp trên Timeline.",
      },
      { status: 400 },
    );
  }
  if (files.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Vui lòng chọn ít nhất một tệp ảnh / video." },
      { status: 400 },
    );
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { ok: false, message: `Tối đa ${MAX_FILES} tệp mỗi lần gửi.` },
      { status: 400 },
    );
  }
  for (const file of files) {
    const ext = extOf(file.name);
    const kind = kindForExt(ext);
    if (!kind) {
      return NextResponse.json(
        {
          ok: false,
          message: `Tệp "${file.name}" không đúng định dạng (chọn ảnh jpg/png/webp/gif hoặc video mp4/webm).`,
        },
        { status: 400 },
      );
    }
    const limit = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (file.size > limit) {
      return NextResponse.json(
        {
          ok: false,
          message: `Tệp "${file.name}" vượt quá ${Math.round(limit / 1024 / 1024)}MB.`,
        },
        { status: 400 },
      );
    }
  }

  for (const file of files) {
    const ext = extOf(file.name);
    const kind = kindForExt(ext) as "image" | "video";
    const buffer = Buffer.from(await file.arrayBuffer());
    const name = await saveUploadFile(buffer, ext);
    await addMediaItem({
      id: randomUUID(),
      file: name,
      kind,
      size: file.size,
      year,
      month,
      author,
      authorRole,
      caption,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  }

  return NextResponse.json(
    {
      ok: true,
      count: files.length,
      message:
        "Cảm ơn bạn! Kỷ niệm của bạn đã được gửi và đang chờ Ban Biên tập duyệt.",
    },
    { status: 201 },
  );
}
