import type { Metadata } from "next";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import Reveal from "@/components/Reveal";
import MomentCarousel from "@/components/MomentCarousel";
import { listPublished } from "@/lib/posts";
import { listCategories } from "@/lib/categories";
import { listApprovedMediaChronological, mediaFileUrl } from "@/lib/media";
import { WallMemory } from "@/components/TimelineWall";
import { BreadcrumbJsonLd } from "@/components/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = "https://40namnctru.nctitc.io.vn";

export const metadata: Metadata = {
  title: "Câu Chuyện & Ký Ức 40 Năm",
  description:
    "Tổng hợp bài viết, ký ức và câu chuyện của các thế hệ Thầy và Trò Nguyễn Công Trứ nhân kỷ niệm 40 năm thành lập trường (1986 - 2026).",
  alternates: {
    canonical: `${SITE_URL}/cau-chuyen`,
  },
  openGraph: {
    title: "Câu Chuyện & Ký Ức 40 Năm",
    description:
      "Tổng hợp bài viết, ký ức và câu chuyện của các thế hệ Thầy và Trò Nguyễn Công Trứ nhân kỷ niệm 40 năm thành lập trường (1986 - 2026).",
    url: `${SITE_URL}/cau-chuyen`,
    siteName: "40 Năm THPT Nguyễn Công Trứ",
    images: [
      {
        url: "/images/og-share.png",
        width: 1200,
        height: 630,
        alt: "Câu chuyện & Ký ức 40 năm THPT Nguyễn Công Trứ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Câu chuyện & Ký ức 40 năm THPT Nguyễn Công Trứ",
    description:
      "Tổng hợp bài viết, ký ức và câu chuyện của các thế hệ Thầy và Trò Nguyễn Công Trứ nhân kỷ niệm 40 năm thành lập trường (1986 - 2026).",
    images: ["/images/og-share.png"],
  },
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
  const syntheticMotionPost = {
    id: "nct-motion-breakdown",
    slug: "NCTru-breakdown",
    title: "Logo Breakdown - 40 năm Nguyễn Công Trứ",
    excerpt: "Trải nghiệm tương tác: Phân rã và khám phá ý nghĩa các biểu tượng cấu thành nên logo THPT Nguyễn Công Trứ qua thao tác cuộn (scroll).",
    author: "Ban Tổ chức",
    authorRole: "Motion Graphic",
    source: "admin",
    status: "published",
    pinned: false,
    cover: null, // Sẽ được xử lý đặc biệt trong PostCard để render CSS animation
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as const;

  const otherPinned = pinnedPosts.filter((p) => p.id !== featured?.id);
  // 2 bài phụ xếp cạnh bài nổi bật trong cụm Bento Hero
  const heroSidePosts = otherPinned.length > 0
    ? otherPinned.slice(0, 2)
    : rest.filter((p) => p.id !== syntheticMotionPost.id).slice(0, 2);
  const heroSideIds = new Set(heroSidePosts.map((p) => p.id));
  const remainingPinned = otherPinned.filter((p) => !heroSideIds.has(p.id));

  const thanhXuanCat = categories.find(
    (c) => c.slug === "cau-chuyen-thanh-xuan" || c.name.toLowerCase().includes("thanh xuân")
  );

  const adminPosts = [syntheticMotionPost as any, ...rest.filter((p) => p.source === "admin" && !p.pinned && !heroSideIds.has(p.id))];
  const communityPosts = rest.filter(
    (p) => !p.pinned && !heroSideIds.has(p.id) && (
      (thanhXuanCat && p.categoryId === thanhXuanCat.id) ||
      p.source !== "admin"
    )
  );

  const allMedia = await listApprovedMediaChronological();
  const validMoments = (allMedia || []).filter(
    (m) => m && m.mediaType !== "post" && (m.caption || m.author || m.mediaType === "feed")
  );
  const shuffled = validMoments.sort(() => 0.5 - Math.random()).slice(0, 5);
  const carouselMoments: WallMemory[] = shuffled.map((m) => ({
    id: m.id,
    title: m.title?.trim() || m.caption?.trim() || "Kỷ niệm dưới mái trường Trứ",
    caption: m.title?.trim() ? (m.caption?.trim() || "") : "",
    icon: "",
    author: m.author || "",
    role: m.authorRole || "",
    year: m.year || 2026,
    month: m.month || 1,
    kind: m.kind || "image",
    images: [mediaFileUrl(m.file)],
    isCommunity: true,
  }));

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <BreadcrumbJsonLd
        items={[
          { name: "Trang chủ", url: "/" },
          { name: "Câu chuyện", url: "/cau-chuyen" },
        ]}
      />
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

      {/* ══════════ CATEGORY TABS (STICKY PILLS) ══════════ */}
      <section className="sticky top-[68px] sm:top-[72px] md:top-[76px] z-30 pointer-events-none py-2 transition-all">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pointer-events-auto">
          <div className="flex overflow-x-auto py-1 no-scrollbar items-center gap-2">
            <Link
              href="/cau-chuyen"
              className="whitespace-nowrap rounded-full bg-slate-900 px-4 py-1.5 text-xs sm:text-sm font-bold text-white shadow-md transition-colors"
            >
              Tất cả
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/cau-chuyen/danh-muc/${c.slug}`}
                className="whitespace-nowrap rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 px-4 py-1.5 text-xs sm:text-sm font-bold text-slate-700 shadow-sm hover:border-[#1d4ed8]/40 hover:text-[#1d4ed8] hover:shadow-md transition-all active:scale-95"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ MOMENT CAROUSEL ══════════ */}
      {carouselMoments.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 sm:pt-12">
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
          {/* ══════════ SECTION: BÀI NỔI BẬT & TIÊU ĐIỂM (BENTO EDITORIAL) ══════════ */}
          <section className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
            <Reveal>
              <div className="mb-5 sm:mb-6 flex items-center gap-4">
                <div className="h-6 w-1 shrink-0 rounded-full bg-[#1d4ed8]" />
                <h2 className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#1d4ed8]">
                  Tiêu điểm hôm nay
                </h2>
                <div className="flex-1 border-t border-slate-200" />
              </div>
            </Reveal>

            {heroSidePosts.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
                <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
                  <Reveal className="h-full">
                    <PostCard
                      post={featured}
                      variant="featured"
                      categoryName={featured.categoryId ? catMap[featured.categoryId] : undefined}
                      className="h-full"
                    />
                  </Reveal>
                </div>
                <div className="lg:col-span-5 xl:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5">
                  {heroSidePosts.map((p, idx) => (
                    <Reveal key={p.id} delay={idx * 80} className="h-full">
                      <PostCard
                        post={p}
                        variant="compact"
                        categoryName={p.categoryId ? catMap[p.categoryId] : undefined}
                        className="h-full"
                      />
                    </Reveal>
                  ))}
                </div>
              </div>
            ) : (
              <Reveal>
                <PostCard
                  post={featured}
                  variant="featured"
                  categoryName={featured.categoryId ? catMap[featured.categoryId] : undefined}
                />
              </Reveal>
            )}
          </section>

          {/* ══════════ SECTION: ĐƯỢC GHIM (NẾU CÒN) ══════════ */}
          {remainingPinned.length > 0 && (
            <section className="border-t border-slate-200 bg-amber-50/40 py-8 sm:py-10">
              <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <Reveal>
                  <div className="mb-6 flex items-center gap-4">
                    <div className="h-6 w-1 shrink-0 rounded-full bg-amber-500" />
                    <h2 className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-700">
                      📌 Được ghim
                    </h2>
                    <div className="flex-1 border-t border-amber-200" />
                  </div>
                </Reveal>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {remainingPinned.map((post, i) => (
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

          {/* ══════════ SECTION: CÂU CHUYỆN THANH XUÂN ══════════ */}
          {communityPosts.length > 0 && (
            <section className="border-t border-slate-200 bg-emerald-50/40 py-10">
              <div className="mx-auto max-w-6xl px-6">
                <Reveal>
                  <div className="mb-7 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-1 shrink-0 rounded-full bg-emerald-600" />
                      <h2 className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                        🌿 Danh mục: Câu chuyện thanh xuân
                      </h2>
                    </div>
                    {thanhXuanCat && (
                      <Link
                        href={`/cau-chuyen/danh-muc/${thanhXuanCat.slug}`}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline shrink-0"
                      >
                        Xem tất cả ({communityPosts.length}) →
                      </Link>
                    )}
                  </div>
                </Reveal>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {communityPosts.map((post, i) => (
                    <Reveal key={post.id} delay={(i % 3) * 80} className="h-full">
                      <PostCard post={post} categoryName={post.categoryId ? catMap[post.categoryId] : (thanhXuanCat?.name || "Câu chuyện thanh xuân")} />
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
