import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import { canManageMedia } from "@/lib/admin";
import { setMediaStatus, updateMediaDetails, deleteMedia } from "@/lib/media";
import { logAction } from "@/lib/action-logs";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();
  if (!canManageMedia(admin.role)) {
    return NextResponse.json(
      { ok: false, message: "Bạn không có quyền quản lý khoảnh khắc." },
      { status: 403 }
    );
  }

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

  const token = req.cookies.get("nct_admin")?.value;
  const { status, title, caption } = body;

  let updated = null;
  let logDetail = "";

  if (title !== undefined || caption !== undefined) {
    updated = await updateMediaDetails(
      id,
      {
        title: typeof title === "string" ? title : undefined,
        caption: typeof caption === "string" ? caption : undefined,
        status: typeof status === "string" && ["approved", "rejected", "pending"].includes(status) ? (status as any) : undefined,
      },
      token
    );
    logDetail = `Cập nhật nội dung khoảnh khắc: ${title ? `tiêu đề "${title}"` : ""} ${caption ? `chú thích` : ""}`.trim();
  } else if (status) {
    if (status !== "approved" && status !== "rejected" && status !== "pending") {
      return NextResponse.json(
        { ok: false, message: "Trạng thái không hợp lệ." },
        { status: 400 }
      );
    }
    updated = await setMediaStatus(id, status, token);
    logDetail = `Cập nhật trạng thái thành ${status}`;
  } else {
    return NextResponse.json(
      { ok: false, message: "Không có dữ liệu cần cập nhật." },
      { status: 400 }
    );
  }

  if (!updated) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy khoảnh khắc hoặc cập nhật thất bại." },
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
    logDetail || "Cập nhật thông tin khoảnh khắc"
  );

  return NextResponse.json({ ok: true, media: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();
  if (!canManageMedia(admin.role)) {
    return NextResponse.json(
      { ok: false, message: "Bạn không có quyền xóa khoảnh khắc." },
      { status: 403 }
    );
  }

  const { id } = await params;

  const token = req.cookies.get("nct_admin")?.value;
  const success = await deleteMedia(id, token);
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
