import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import { createPost, deriveExcerpt, listAll, sortAdmin } from "@/lib/posts";
import { logAction } from "@/lib/action-logs";

export const dynamic = "force-dynamic";

/** Danh sách toàn bộ bài viết mọi trạng thái (chỉ admin) */
export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();
  const posts = await listAll();
  return NextResponse.json({ ok: true, posts: sortAdmin(posts) });
}

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Admin viết bài mới - bài từ admin được đánh dấu huy hiệu "Ban Biên tập" */
export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Dữ liệu không hợp lệ." },
      { status: 400 },
    );
  }

  const title = str(body.title, 140);
  const content = str(body.content, 30000);
  if (title.length < 6) {
    return NextResponse.json(
      { ok: false, message: "Tiêu đề cần ít nhất 6 ký tự." },
      { status: 400 },
    );
  }
  if (content.length < 10) {
    return NextResponse.json(
      { ok: false, message: "Nội dung cần ít nhất 10 ký tự." },
      { status: 400 },
    );
  }

  const post = await createPost({
    title,
    excerpt: str(body.excerpt, 300) || deriveExcerpt(content),
    content,
    author: str(body.author, 80) || "Ban Biên tập",
    authorRole: str(body.authorRole, 120) || "Ban Tổ chức Lễ kỷ niệm 40 năm",
    source: "admin",
    status: body.status === "draft" ? "draft" : "published",
    pinned: body.pinned === true,
    cover: str(body.cover, 500) || null,
  });

  await logAction(
    "create_post",
    "posts",
    post.id,
    admin.fullName || admin.username,
    admin.username,
    admin.role,
    `Tạo bài viết mới: ${post.title}`,
  );

  return NextResponse.json({ ok: true, post }, { status: 201 });
}
