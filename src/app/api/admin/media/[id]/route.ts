import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import { setMediaStatus, deleteMedia } from "@/lib/media";
import { logAction } from "@/lib/action-logs";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Dữ liệu không hợp lệ." },
      { status: 400 }
    );
  }

  const { status } = body;
  if (status !== "approved" && status !== "rejected" && status !== "pending") {
    return NextResponse.json(
      { ok: false, message: "Trạng thái không hợp lệ." },
      { status: 400 }
    );
  }

  const updated = await setMediaStatus(id, status);
  if (!updated) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy khoảnh khắc." },
      { status: 404 }
    );
  }

  await logAction(
    "update_media",
    "media",
    id,
    admin.fullName,
    admin.username,
    admin.role,
    `Cập nhật trạng thái thành ${status}`
  );

  return NextResponse.json({ ok: true, media: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();

  const { id } = await params;

  const success = await deleteMedia(id);
  if (!success) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy khoảnh khắc để xóa." },
      { status: 404 }
    );
  }

  await logAction(
    "delete_media",
    "media",
    id,
    admin.fullName,
    admin.username,
    admin.role,
    "Đã xoá khoảnh khắc"
  );

  return NextResponse.json({ ok: true });
}
