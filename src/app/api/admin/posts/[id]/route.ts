import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import { deletePost, updatePost, type PostStatus } from "@/lib/posts";
import { logAction } from "@/lib/action-logs";

export const dynamic = "force-dynamic";

const STATUSES: PostStatus[] = ["published", "pending", "rejected", "draft"];

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Duyệt / từ chối / ghim / sửa bài viết */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
      { status: 400 },
    );
  }

  const patch: Parameters<typeof updatePost>[1] = {};
  if (typeof body.title === "string") {
    const title = str(body.title, 140);
    if (title.length < 6) {
      return NextResponse.json(
        { ok: false, message: "Tiêu đề cần ít nhất 6 ký tự." },
        { status: 400 },
      );
    }
    patch.title = title;
  }
  if (typeof body.excerpt === "string") patch.excerpt = str(body.excerpt, 300);
  if (typeof body.content === "string") patch.content = body.content.slice(0, 30000);
  if (typeof body.author === "string") patch.author = str(body.author, 80);
  if (typeof body.authorRole === "string") patch.authorRole = str(body.authorRole, 120);
  if (typeof body.cover === "string") patch.cover = str(body.cover, 500) || null;
  if (typeof body.pinned === "boolean") patch.pinned = body.pinned;
  if (
    typeof body.status === "string" &&
    STATUSES.includes(body.status as PostStatus)
  ) {
    patch.status = body.status as PostStatus;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { ok: false, message: "Không có thay đổi nào được gửi." },
      { status: 400 },
    );
  }

  const post = await updatePost(id, patch);
  if (!post) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy bài viết." },
      { status: 404 },
    );
  }

  await logAction(
    "update_post",
    "posts",
    id,
    admin.fullName || admin.username,
    admin.username,
    admin.role,
    `Cập nhật bài viết: ${post.title}`,
  );

  return NextResponse.json({ ok: true, post });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();
  const { id } = await params;
  const deleted = await deletePost(id);
  if (!deleted) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy bài viết." },
      { status: 404 },
    );
  }

  await logAction(
    "delete_post",
    "posts",
    id,
    admin.fullName || admin.username,
    admin.username,
    admin.role,
    `Xóa bài viết ID: ${id}`,
  );

  return NextResponse.json({ ok: true });
}
