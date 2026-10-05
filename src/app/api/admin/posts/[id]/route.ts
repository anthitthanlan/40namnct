import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import { updatePost, deletePost } from "@/lib/posts";
import { logAction } from "@/lib/action-logs";

export const dynamic = "force-dynamic";

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Cập nhật bài viết theo id */
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
      { status: 400 },
    );
  }

  const patch: Record<string, any> = {};

  if (typeof body.title === "string") {
    patch.title = str(body.title, 140);
    if (patch.title.length < 6) {
      return NextResponse.json(
        { ok: false, message: "Tiêu đề cần ít nhất 6 ký tự." },
        { status: 400 },
      );
    }
  }
  if (typeof body.content === "string") {
    patch.content = str(body.content, 30000);
    if (patch.content.length < 10) {
      return NextResponse.json(
        { ok: false, message: "Nội dung cần ít nhất 10 ký tự." },
        { status: 400 },
      );
    }
  }
  if (typeof body.excerpt === "string") {
    patch.excerpt = str(body.excerpt, 300);
  }
  if (typeof body.author === "string") {
    patch.author = str(body.author, 80);
  }
  if (typeof body.authorRole === "string") {
    patch.authorRole = str(body.authorRole, 120);
  }
  if (typeof body.status === "string") {
    if (["published", "pending", "rejected", "draft"].includes(body.status)) {
      patch.status = body.status;
    }
  }
  if (typeof body.pinned === "boolean") {
    patch.pinned = body.pinned;
  }
  if (typeof body.cover === "string" || body.cover === null) {
    patch.cover = body.cover ? str(body.cover, 500) : null;
  }
  if (body.categoryId !== undefined) {
    patch.categoryId = body.categoryId === null ? null : str(body.categoryId as string, 100);
  }

  const token = req.cookies.get("nct_admin")?.value;
  const post = await updatePost(id, patch, token);
  if (!post) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy bài viết." },
      { status: 404 },
    );
  }

  await logAction(
    "update_post",
    "posts",
    post.id,
    admin.fullName || admin.username,
    admin.username,
    admin.role,
    `Cập nhật bài viết: ${post.title}`,
  );

  return NextResponse.json({ ok: true, post });
}

/** Xóa bài viết theo id */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();

  const { id } = await params;

  // Ideally we should get the post title before deleting for the log
  // But deletePost just returns boolean. If needed, we'd fetch it first.

  const token = req.cookies.get("nct_admin")?.value;
  const success = await deletePost(id, token);
  if (!success) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy bài viết để xóa." },
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
