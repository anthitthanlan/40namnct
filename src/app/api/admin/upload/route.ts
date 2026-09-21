import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { extOf, kindForExt, MAX_IMAGE_BYTES, mediaFileUrl, saveUploadFile } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role === "anon") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, message: "No file provided" }, { status: 400 });
  }

  const ext = extOf(file.name);
  const kind = kindForExt(ext);
  if (kind !== "image") {
    return NextResponse.json({ ok: false, message: "Only image files are allowed for editor upload" }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ ok: false, message: "File is too large" }, { status: 400 });
  }

  try {
    const filename = await saveUploadFile(file);
    const url = mediaFileUrl(filename);
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ ok: false, message: "Upload failed" }, { status: 500 });
  }
}
