import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasAdminCookie } from "@/lib/auth";
import { findPostAnyBySlug } from "@/lib/posts";

export const dynamic = "force-dynamic";

/** Đọc một bài viết - bài chưa xuất bản chỉ admin (đang đăng nhập) xem được */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = await findPostAnyBySlug(slug);
  const visible =
    post !== null && (post.status === "published" || (await hasAdminCookie()));
  if (!visible) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy bài viết." },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, post });
}
