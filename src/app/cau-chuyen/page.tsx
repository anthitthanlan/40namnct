import type { Metadata } from "next";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import Reveal from "@/components/Reveal";
import MomentCarousel from "@/components/MomentCarousel";
import { listPublished } from "@/lib/posts";
import { listCategories } from "@/lib/categories";
import { listApprovedMediaChronological, mediaFileUrl } from "@/lib/media";
import { WallMemory } from "@/components/TimelineWall";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bài viết · Câu chuyện 40 năm THPT Nguyễn Công Trứ",
  description:
    "Tổng hợp bài viết, ký ức và câu chuyện của các thế hệ Thầy trò Nguyễn Công Trứ nhân kỷ niệm 40 năm thành lập trường (1986-2026).",
};


export default async function BaiVietPage() {
  const posts = await listPublished();
  const categories = await listCategories();
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const pinnedPosts = posts.filter((p) => p.pinned);
  
  // Nổi bật là bài được ghim đầu tiên, hoặc bài mới nhất nếu không ghim bài nào
  const featured = pinnedPosts.length > 0 ? pinnedPosts[0] : posts[0];
  
  // Những bài còn lại
  const rest = posts.filter((p) => p.id !== featured?.id);
  const adminPosts = rest.filter((p) => p.source === "admin" && !p.pinned);
  const communityPosts = rest.filter((p) => p.source !== "admin" && !p.pinned);

  const allMedia = await listApprovedMediaChronological();
  const shuffled = allMedia.sort(() => 0.5 - Math.random()).slice(0, 5);
  const carouselMoments: WallMemory[] = shuffled.map((m) => ({
    id: m.id,
    title: m.caption || "Kỷ niệm dưới mái trường Trứ",
    caption: m.caption,
    icon: "",
    author: m.author,
    role: m.authorRole,
    year: m.year,
    month: m.month,
    kind: m.kind,
    images: [mediaFileUrl(m.file)],
    isCommunity: true,
  }));

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
              Câu chuyện từ mái trường Trứ
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="mx-auto mt-3 max-w-2xl text-slate-200 sm:text-lg">
              Những bài viết, ký ức và lời nhắn của các thế hệ Thầy trò Nguyễn
              Công Trứ — được lưu giữ và viết tiếp mỗi ngày.
            </p>
          </Reveal>

        </div>
      </section>

      {/* ══════════ CATEGORY TABS ══════════ */}
      <section className="pt-6">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex overflow-x-auto py-3 no-scrollbar items-center gap-2">
            <Link
              href="/cau-chuyen"
              className="whitespace-nowrap rounded-full bg-slate-900 px-4 py-1.5 text-sm font-bold text-white transition-colors"
            >
              Tất cả
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/cau-chuyen/danh-muc/${c.slug}`}
                className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ MOMENT CAROUSEL ══════════ */}
      {carouselMoments.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-12">
          <Reveal>
            <MomentCarousel moments={carouselMoments} />
          </Reveal>
        </section>
      )}

      {!featured ? (
        /* ── EMPTY STATE ── */
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <Reveal>
            <div className="btn-lightship-soft rounded-[2rem] bg-white p-6 sm:p-8">
              <span className="text-5xl">🌱</span>
              <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
                Chưa có bài viết nào
              </h2>
              <p className="mx-auto mt-3 max-w-md text-slate-600">
                Hãy là người đầu tiên kể câu chuyện của mình dưới mái trường
                Nguyễn Công Trứ!
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
          {/* ══════════ SECTION: BÀI NỔI BẬT ══════════ */}
          <section className="mx-auto max-w-6xl px-6 py-10">
            <Reveal>
              <div className="mb-7 flex items-center gap-4">
                <div className="h-7 w-1 shrink-0 rounded-full bg-[#1d4ed8]" />
                <h2 className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#1d4ed8]">
                  Bài nổi bật
                </h2>
                <div className="flex-1 border-t border-slate-200" />
              </div>
            </Reveal>
            <Reveal>
              <PostCard post={featured} featured categoryName={featured.categoryId ? catMap[featured.categoryId] : undefined} />
            </Reveal>
          </section>

          {/* ══════════ SECTION: ĐƯỢC GHIM ══════════ */}
          {pinnedPosts.filter((p) => p.id !== featured.id).length > 0 && (
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
                  {pinnedPosts
                    .filter((p) => p.id !== featured.id)
                    .map((post, i) => (
                      <Reveal key={post.id} delay={(i % 3) * 80} className="h-full">
                        <PostCard post={post} categoryName={post.categoryId ? catMap[post.categoryId] : undefined} />
                      </Reveal>
                    ))}
                </div>
              </div>
            </section>
          )}

          {/* ══════════ SECTION: BAN BIÊN TẬP ══════════ */}
          {adminPosts.length > 0 && (
            <section className="border-t border-slate-200 py-10">
              <div className="mx-auto max-w-6xl px-6">
                <Reveal>
                  <div className="mb-7 flex items-center gap-4">
                    <div className="h-7 w-1 shrink-0 rounded-full bg-[#1d4ed8]" />
                    <h2 className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#1d4ed8]">
                      ✦ Ban Biên tập
                    </h2>
                    <div className="flex-1 border-t border-slate-200" />
                  </div>
                </Reveal>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {adminPosts.map((post, i) => (
                    <Reveal key={post.id} delay={(i % 3) * 80} className="h-full">
                      <PostCard post={post} categoryName={post.categoryId ? catMap[post.categoryId] : undefined} />
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ══════════ SECTION: CÂU CHUYỆN CỘNG ĐỒNG ══════════ */}
          {communityPosts.length > 0 && (
            <section className="border-t border-slate-200 bg-emerald-50/40 py-10">
              <div className="mx-auto max-w-6xl px-6">
                <Reveal>
                  <div className="mb-7 flex items-center gap-4">
                    <div className="h-7 w-1 shrink-0 rounded-full bg-emerald-600" />
                    <h2 className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                      🗣 Câu chuyện cộng đồng
                    </h2>
                    <div className="flex-1 border-t border-emerald-200" />
                  </div>
                </Reveal>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {communityPosts.map((post, i) => (
                    <Reveal key={post.id} delay={(i % 3) * 80} className="h-full">
                      <PostCard post={post} categoryName={post.categoryId ? catMap[post.categoryId] : undefined} />
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ══════════ CTA CUỐI TRANG ══════════ */}
          <section className="border-t border-slate-200 py-16">
            <div className="mx-auto max-w-3xl px-6">
              <Reveal>
                <div className="btn-lightship-soft rounded-[2rem] border-2 border-dashed border-[#1d4ed8]/30 bg-white p-10 text-center">
                  <span className="text-4xl">✍️</span>
                  <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
                    Bạn có câu chuyện riêng với Trứ?
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-slate-600">
                    Dù là một mùa phượng nở, một vở ghi đầy chữ phê của cô giáo, hay
                    lời dặn của thầy dạy Toán năm nào… hãy kể lại để câu chuyện của
                    bạn trở thành một mảnh ghép của Triển lãm 40 năm.
                  </p>
                  <Link
                    href="/gui-bai?tab=cau-chuyen"
                    className="btn-lightship mt-7 inline-block bg-[#16a34a] px-7 py-3.5 text-base font-bold text-white"
                  >
                    Kể câu chuyện của bạn
                  </Link>
                  <p className="mt-4 text-xs text-slate-400">
                    Bài chia sẻ sẽ hiển thị sau khi Ban Biên tập duyệt nội dung.
                  </p>
                </div>
              </Reveal>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
