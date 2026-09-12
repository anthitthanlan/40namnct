import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createPost, deriveExcerpt, listPublished, sortPublic } from "@/lib/posts";

export const dynamic = "force-dynamic";

/** Danh sách bài viết công khai - bài ghim đứng trước */
export async function GET() {
  const posts = await listPublished();
  return NextResponse.json({ ok: true, posts: sortPublic(posts) });
}

type Body = Record<string, unknown>;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Người dùng gửi câu chuyện riêng với Trứ → vào hàng chờ duyệt */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  const author = str(body.author, 80);
  const title = str(body.title, 140);
  const content = str(body.content, 12000);
  const authorRole = str(body.authorRole, 120) || "Cộng đồng Trứ";

  if (author.length < 2) {
    return NextResponse.json(
      { ok: false, message: "Vui lòng nhập họ tên của bạn (tối thiểu 2 ký tự)." },
      { status: 400 },
    );
  }
  if (title.length < 6) {
    return NextResponse.json(
      { ok: false, message: "Tiêu đề câu chuyện cần ít nhất 6 ký tự." },
      { status: 400 },
    );
  }
  if (content.length < 30) {
    return NextResponse.json(
      { ok: false, message: "Nội dung câu chuyện cần ít nhất 30 ký tự." },
      { status: 400 },
    );
  }

  const post = await createPost({
    title,
    excerpt: deriveExcerpt(content),
    content,
    author,
    authorRole,
    source: "user",
    status: "pending",
    pinned: false,
    cover: null,
  });

  return NextResponse.json(
    {
      ok: true,
      message:
        "Cảm ơn bạn! Câu chuyện đã được gửi và đang chờ Ban Biên tập duyệt.",
      post,
    },
    { status: 201 },
  );
}
