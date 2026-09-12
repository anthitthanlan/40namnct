import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/auth";
import { deleteMedia, setMediaStatus, type MediaStatus } from "@/lib/media";

export const dynamic = "force-dynamic";

const ALLOWED: MediaStatus[] = ["pending", "approved", "rejected"];

/** Admin: duyệt / từ chối / hoàn tác trạng thái media */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminRequest(req)) return unauthorized();
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }
  const status = body.status as MediaStatus;
  if (!ALLOWED.includes(status)) {
    return NextResponse.json(
      { ok: false, message: "Trạng thái không hợp lệ." },
      { status: 400 },
    );
  }
  const item = await setMediaStatus(id, status);
  if (!item) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy media." },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, item });
}

/** Admin: xoá media (cả tệp trên đĩa) */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminRequest(req)) return unauthorized();
  const { id } = await params;
  const removed = await deleteMedia(id);
  if (!removed) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy media." },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}
