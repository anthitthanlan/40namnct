import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasAdminCookie } from "@/lib/auth";
import {
  findPostAnyBySlug,
  formatDate,
  getPostBySlug,
  listPublished,
  sortPublic,
} from "@/lib/posts";
import Markdown from "@/components/Markdown";
import PostCard, { PostBadges } from "@/components/PostCard";
import Reveal from "@/components/Reveal";
import ShareButtons from "@/components/ShareButtons";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Không tìm thấy bài viết · THPT Nguyễn Công Trứ" };
  return {
    title: `${post.title} · 40 năm THPT Nguyễn Công Trứ`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
    },
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;
  let post = await getPostBySlug(slug);
  let preview = false;
  if (!post) {
    // Chưa xuất bản - chỉ Ban Biên tập (đang đăng nhập) xem được bản nháp/chờ duyệt
    const anyPost = await findPostAnyBySlug(slug);
    if (anyPost && (await hasAdminCookie())) {
      post = anyPost;
      preview = true;
    }
  }
  if (!post) notFound();

  const related = sortPublic(
    (await listPublished()).filter((p) => p.slug !== post.slug),
  ).slice(0, 3);
  const readingMinutes = Math.max(1, Math.round(post.content.length / 900));

  return (
    <main className="min-h-screen bg-white">
      <article className="mx-auto max-w-3xl px-6 pb-16 pt-32">
        <Link
          href="/bai-viet"
          className="text-sm font-bold text-[#1d4ed8] hover:underline"
        >
          ← Tất cả bài viết
        </Link>

        {preview && (
          <div className="mt-6 rounded-2xl bg-amber-100 px-5 py-3 text-sm font-extrabold text-amber-800">
            👁 Bản xem trước - bài viết chưa được xuất bản, chỉ Ban Biên tập
            nhìn thấy.
          </div>
        )}

        <div className="mt-6">
          <PostBadges post={post} />
        </div>

        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          {post.excerpt}
        </p>

        <div className="mt-8 flex items-center gap-4 border-y border-slate-100 py-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1d4ed8] text-lg font-extrabold text-white">
            {post.author.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-900">
              {post.author}
            </p>
            <p className="text-xs text-slate-500">
              {post.authorRole} · {formatDate(post.createdAt)} ·{" "}
              {readingMinutes} phút đọc
            </p>
          </div>
        </div>

        {post.cover && (
          <img
            src={post.cover}
            alt={post.title}
            className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover"
          />
        )}

        <div className="mt-6">
          <Markdown content={post.content} />
        </div>

        <div className="mt-10 border-t border-slate-100 pt-8">
          <ShareButtons title={post.title} />
        </div>
      </article>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="btn-lightship-soft rounded-[2rem] bg-white p-10 text-center">
            <span className="text-4xl">✍️</span>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
              Bạn cũng có một kỷ niệm với Trứ?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-600">
              Kể câu chuyện của bạn - sau khi Ban Biên tập duyệt, câu chuyện sẽ
              nằm cùng lớp với những trang ký ức này.
            </p>
            <Link
              href="/bai-viet/chia-se"
              className="btn-lightship mt-6 inline-block bg-[#16a34a] px-7 py-3.5 font-bold text-white"
            >
              Chia sẻ câu chuyện của bạn
            </Link>
          </div>

          {related.length > 0 && (
            <div className="mt-14">
              <h2 className="text-2xl font-extrabold text-slate-900">
                Bài viết khác
              </h2>
              <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p, i) => (
                  <Reveal key={p.id} delay={i * 90} className="h-full">
                    <PostCard post={p} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
