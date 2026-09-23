import type { Metadata } from "next";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import Reveal from "@/components/Reveal";
import MomentCarousel from "@/components/MomentCarousel";
import { listPublished } from "@/lib/posts";
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
  const [featured, ...rest] = posts;
  const pinnedCount = posts.filter((p) => p.pinned).length;

  const allMedia = await listApprovedMediaChronological();
  // shuffle and pick 5
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
    <main className="min-h-screen">
      {/* Header nhỏ gọn với ảnh trường nền */}
      <section className="relative overflow-hidden pb-14 pt-32 text-white">
        {/* Background ảnh trường */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/bg/hero-3.webp')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950/90" />

        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-extrabold uppercase tracking-widest text-white backdrop-blur-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                width={14}
                height={14}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.396 0 2.703.432 3.75 1.17A7.97 7.97 0 0112.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0012.5 4c-1.396 0-2.703.432-3.75 1.17A7.97 7.97 0 009 4.804z" />
              </svg>
              Bài viết
            </span>
          </Reveal>
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
          <Reveal delay={260}>
            <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm font-bold">
              <span className="rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm">
                ✍️ {posts.length} bài viết
              </span>
              {pinnedCount > 0 && (
                <span className="rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm">
                  📌 {pinnedCount} bài được ghim
                </span>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <MomentCarousel moments={carouselMoments} />
        </Reveal>

        {!featured ? (
          <div className="btn-lightship-soft rounded-[2rem] bg-white p-12 text-center">
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
              className="btn-lightship mt-7 inline-block bg-[#16a34a] px-7 py-3.5 font-bold text-white"
            >
              ✍️ Kể câu chuyện của bạn
            </Link>
          </div>
        ) : (
          <>
            <Reveal>
              <PostCard post={featured} featured />
            </Reveal>
            {rest.length > 0 && (
              <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post, i) => (
                  <Reveal key={post.id} delay={(i % 3) * 90} className="h-full">
                    <PostCard post={post} />
                  </Reveal>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24">
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
      </section>
    </main>
  );
}
