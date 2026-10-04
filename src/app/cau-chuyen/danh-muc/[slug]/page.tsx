import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "@/components/PostCard";
import Reveal from "@/components/Reveal";
import { listPublished } from "@/lib/posts";
import { listCategories, getCategoryBySlug } from "@/lib/categories";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Không tìm thấy danh mục" };

  return {
    title: `${category.name} · Câu chuyện 40 năm THPT Nguyễn Công Trứ`,
    description: category.description || `Danh sách bài viết thuộc danh mục ${category.name}`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  
  if (!category) {
    notFound();
  }

  const allPosts = await listPublished();
  const categories = await listCategories();
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  // Lọc bài viết theo danh mục
  const posts = allPosts.filter((p) => p.categoryId === category.id);
  const pinnedPosts = posts.filter((p) => p.pinned);
  const normalPosts = posts.filter((p) => !p.pinned);

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      {/* ══════════ PAGE HEADER ══════════ */}
      <section className="relative overflow-hidden pb-16 pt-32 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero_images/hero_3.webp')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950/95" />
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <Reveal delay={100}>
            <h1 className="mt-4 text-3xl font-extrabold sm:text-5xl">
              {category.name}
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="mx-auto mt-3 max-w-2xl text-slate-200 sm:text-lg">
              {category.description || "Danh sách bài viết"}
            </p>
          </Reveal>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Reveal delay={250}>
              <Link
                href="/gui-bai?tab=cau-chuyen"
                className="inline-flex items-center rounded-full bg-[#1d4ed8] px-6 py-3 text-sm font-bold text-white transition-all hover:scale-105 hover:bg-blue-800"
              >
                ✍️ Kể câu chuyện của bạn
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════ CATEGORY TABS ══════════ */}
      <section className="pt-6">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex overflow-x-auto py-3 no-scrollbar items-center gap-2">
            <Link
              href="/cau-chuyen"
              className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Tất cả
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/cau-chuyen/danh-muc/${c.slug}`}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                  c.id === category.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {posts.length === 0 ? (
        /* ── EMPTY STATE ── */
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <Reveal>
            <div className="btn-lightship-soft rounded-[2rem] bg-white p-6 sm:p-8">
              <span className="text-5xl">🌱</span>
              <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
                Chưa có bài viết nào
              </h2>
              <p className="mx-auto mt-3 max-w-md text-slate-600">
                Hãy là người đầu tiên kể câu chuyện của mình trong danh mục này!
              </p>
              <Link
                href="/gui-bai?tab=cau-chuyen"
                className="group relative mt-7 inline-block font-bold text-[#1d4ed8] transition-colors hover:text-blue-800"
              >
                ✍️ Kể câu chuyện của bạn
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 rounded-full bg-[#1d4ed8] transition-all duration-300 group-hover:w-full" />
              </Link>
            </div>
          </Reveal>
        </section>
      ) : (
        <>
          {/* ══════════ SECTION: ĐƯỢC GHIM ══════════ */}
          {pinnedPosts.length > 0 && (
            <section className="border-t border-slate-200 bg-amber-50/50 py-10">
              <div className="mx-auto max-w-6xl px-6">
                <Reveal>
                  <div className="mb-7 flex items-center gap-4">
                    <div className="h-7 w-1 shrink-0 rounded-full bg-amber-500" />
                    <h2 className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-700">
                      📌 Được ghim
                    </h2>
                    <div className="flex-1 border-t border-amber-200" />
                  </div>
                </Reveal>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {pinnedPosts.map((post, i) => (
                    <Reveal key={post.id} delay={(i % 3) * 80} className="h-full">
                      <PostCard post={post} categoryName={catMap[post.categoryId || ""]} />
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ══════════ SECTION: DANH SÁCH BÀI ══════════ */}
          {normalPosts.length > 0 && (
            <section className="py-12 md:py-16">
              <div className="mx-auto max-w-6xl px-6">
                <Reveal>
                  <div className="mb-7 flex items-center gap-4">
                    <div className="h-7 w-1 shrink-0 rounded-full bg-slate-900" />
                    <h2 className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                      Bài viết
                    </h2>
                    <div className="flex-1 border-t border-slate-200" />
                  </div>
                </Reveal>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {normalPosts.map((post, i) => (
                    <Reveal key={post.id} delay={(i % 3) * 80} className="h-full">
                      <PostCard post={post} categoryName={catMap[post.categoryId || ""]} />
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ══════════ FOOTER CALL TO ACTION ══════════ */}
      <section className="bg-slate-900 py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal>
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Bạn có câu chuyện muốn kể?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">
              Hãy chia sẻ những kỷ niệm đẹp dưới mái trường Nguyễn Công Trứ. Ban Biên
              tập luôn sẵn lòng lắng nghe.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/gui-bai"
                className="rounded-full bg-white px-8 py-3.5 font-bold text-slate-900 transition-all hover:scale-105"
              >
                Gửi bài viết mới
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
