import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasAdminCookie } from "@/lib/auth";
import {
  formatDate,
  getPostBySlug,
  listPublished,
  sortPublic,
  extractFirstImage,
} from "@/lib/posts";
import Markdown from "@/components/Markdown";
import PostCard, { PostBadges } from "@/components/PostCard";
import Reveal from "@/components/Reveal";
import { getCategory } from "@/lib/categories";
import { NewsRail, NewsShare } from "@/components/NewsRail";

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
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const category = post.categoryId ? await getCategory(post.categoryId) : null;

  const related = sortPublic(
    (await listPublished()).filter((p) => p.slug !== post.slug),
  ).slice(0, 3);
  const readingMinutes = Math.max(1, Math.round(post.content.length / 900));

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex max-w-[860px] gap-10 px-6 pb-12 pt-32">
        <aside className="hidden shrink-0 lg:block">
          <NewsRail />
        </aside>

        <article className="min-w-0 flex-1 max-w-[700px]">
          <nav className="flex items-center gap-2 text-sm font-semibold text-[#454545]">
            <Link href="/cau-chuyen" className="hover:text-[#0098d1]">
              Câu chuyện
            </Link>
            <span className="h-1 w-1 rounded-full bg-[#656565]" />
            <PostBadges post={post} categoryName={category?.name} />
          </nav>

          <h1 className="news-title mt-3 mb-4">{post.title}</h1>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1d4ed8] text-sm font-semibold text-white">
                {post.author.charAt(0).toUpperCase()}
              </span>
              <div className="font-[Inter] leading-tight">
                <p className="text-[13px] font-semibold text-[#454545]">
                  {post.author}
                </p>
                <p className="text-[12px] text-[#8b8b8b]">{post.authorRole}</p>
              </div>
            </div>
            <p className="font-[Inter] text-[13px] text-[#454545]">
              {formatDate(post.createdAt)} · {readingMinutes} phút đọc
            </p>
          </div>

          <div className="mt-4">
            <NewsShare title={post.title} />
          </div>

          {post.cover && post.cover !== extractFirstImage(post.content) && (
            <img
              src={post.cover}
              alt={post.title}
              className="mb-6 mt-2 h-auto w-full"
            />
          )}

          <div
            className="news-content mt-4"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-8 border-t border-[#ebebeb] pt-6">
            <NewsShare title={post.title} />
          </div>
        </article>
      </div>

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
              <h2 className="news-title inline-block border-b-2 border-[#0098d1] pb-1 text-[18px]">
                Đọc thêm
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