"use client";

import Link from "next/link";
import type { Post } from "@/lib/posts";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return iso;
  }
}

/** Huy hiệu nguồn bài: ✦ Ban Biên tập (admin) hay 🌿 Ký ức thành viên */
export function PostBadges({
  post,
  categoryName,
  compact = false,
}: {
  post: Post;
  categoryName?: string;
  compact?: boolean;
}) {
  const displayCategory = categoryName || (post.source === "user" ? "Ký ức" : "Tin tức");

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-bold text-[#1d4ed8] uppercase tracking-wider">
          {displayCategory}
        </span>
        {post.pinned && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            📌 Ghim
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="rounded-full bg-[#1d4ed8] px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white">
        {displayCategory}
      </span>
      {post.pinned && (
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-amber-700">
          📌 Ghim
        </span>
      )}
      {post.source === "admin" ? (
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-[#1d4ed8]">
          ✦ Ban Biên tập
        </span>
      ) : (
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-emerald-700">
          🌱 Ký ức
        </span>
      )}
    </div>
  );
}

/**
 * Ảnh bìa bài viết — Hiển thị ngay lập tức (không kẹt skeleton vô tận)
 * Tăng tốc GPU hardware acceleration để zoom mượt mà 60fps, không giật cục on hover
 */
export function PostCover({
  post,
  className = "",
  priority = false,
}: {
  post: Post;
  className?: string;
  priority?: boolean;
}) {
  if (post.id === "nct-motion-breakdown") {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#03050b] flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_10%,_rgba(3,5,11,1)_100%)] z-10" />
        <div className="relative z-20 w-24 h-24 md:w-32 md:h-32 transition-transform duration-700 ease-out transform-gpu group-hover:scale-110">
          <div className="absolute inset-0 rounded-full bg-yellow-500/30 blur-2xl animate-pulse" />
          <img
            src="/images/NCT.webp"
            alt="NCT Logo"
            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]"
          />
        </div>
      </div>
    );
  }

  if (post.cover) {
    return (
      <div className="relative w-full h-full bg-slate-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.cover}
          alt={post.title}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={`w-full h-full object-cover transform-gpu backface-hidden transition-transform duration-700 ease-out ${className}`}
          style={{
            willChange: "transform",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "translate3d(0, 0, 0)",
          }}
        />
      </div>
    );
  }

  // Fallback bài viết: Hiển thị logo trường có màu chính thức (vàng, xanh, đỏ, xanh lá), nổi bật trên đĩa tròn trắng trang trọng
  return (
    <div
      aria-hidden
      className="relative w-full h-full overflow-hidden bg-gradient-to-br from-blue-50/80 via-slate-50 to-indigo-50/60 flex items-center justify-center border-b border-slate-100/80"
    >
      <div className="relative flex items-center justify-center">
        {/* Vầng sáng dịu nhẹ tôn vinh logo */}
        <div className="absolute -inset-3 rounded-full bg-blue-400/15 blur-xl pointer-events-none" />

        {/* Khung tròn trắng trang trọng giúp logo màu nổi bật 100%, không bị chìm hay biến sắc */}
        <div className="relative z-10 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full bg-white shadow-[0_4px_16px_rgba(29,78,216,0.12)] border border-blue-100/90 p-2 sm:p-2.5 transition-transform duration-500 ease-out transform-gpu group-hover:scale-110">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/NCT.webp"
            alt="Logo Trường THPT Nguyễn Công Trứ"
            className="w-full h-full object-contain select-none"
          />
        </div>
      </div>
    </div>
  );
}

export type PostCardVariant = "featured" | "grid" | "horizontal" | "compact";

export interface PostCardProps {
  post: Post;
  featured?: boolean;
  variant?: PostCardVariant;
  categoryName?: string;
  className?: string;
}

export default function PostCard({
  post,
  featured = false,
  variant,
  categoryName,
  className = "",
}: PostCardProps) {
  const href = `/cau-chuyen/${post.slug}`;
  const activeVariant: PostCardVariant = variant || (featured ? "featured" : "grid");

  // 1. Biến thể Bài nổi bật / Tiêu điểm (Featured)
  if (activeVariant === "featured") {
    return (
      <article
        className={`group flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-300 ${className}`}
      >
        <Link href={href} className="block overflow-hidden relative aspect-[16/9] w-full bg-slate-100">
          <PostCover
            post={post}
            priority
            className="group-hover:scale-[1.04]"
          />
        </Link>
        <div className="flex flex-col flex-1 p-5 sm:p-6 lg:p-7">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wider">
              {categoryName || (post.source === "user" ? "Ký ức" : "Tin tiêu điểm")}
            </span>
            {post.pinned && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                📌 Ghim
              </span>
            )}
            {post.source === "admin" && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#1d4ed8]">
                ✦ Ban Biên tập
              </span>
            )}
          </div>
          
          <h2 className="!font-news mt-2.5 text-lg sm:text-xl lg:text-[23px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#1d4ed8]">
            <Link href={href} className="hover:underline line-clamp-3">
              {post.title}
            </Link>
          </h2>

          {post.excerpt && (
            <p className="mt-2.5 text-xs sm:text-sm lg:text-[15px] text-slate-600 line-clamp-3 lg:line-clamp-4 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* mt-auto neo chặt footer xuống đáy, triệt tiêu khoảng trắng thừa */}
          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="truncate pr-2 font-medium text-slate-500">
              {post.author || "Thành viên NCT"} · {formatDate(post.createdAt)}
            </span>
            <Link
              href={href}
              className="inline-flex items-center gap-1 font-bold text-[#1d4ed8] hover:underline shrink-0"
            >
              Đọc tiếp →
            </Link>
          </div>
        </div>
      </article>
    );
  }

  // 2. Biến thể Compact cho Bento Hero (Cột bên phải: Tối ưu chiều cao ảnh max-h-44 để cân xứng cột trái)
  if (activeVariant === "compact") {
    return (
      <article
        className={`group flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-300 ${className}`}
      >
        <Link href={href} className="block overflow-hidden relative aspect-[16/9] max-h-40 sm:max-h-44 lg:max-h-44 w-full bg-slate-100">
          <PostCover
            post={post}
            className="group-hover:scale-[1.04]"
          />
        </Link>
        <div className="flex flex-col flex-1 p-3.5 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#1d4ed8] uppercase tracking-wider">
              {categoryName || (post.source === "user" ? "Ký ức" : "Tin tức")}
            </span>
            {post.pinned && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                📌 Ghim
              </span>
            )}
          </div>
          <h3 className="!font-news mt-1.5 text-sm sm:text-[15px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#1d4ed8]">
            <Link href={href} className="line-clamp-2 hover:underline">
              {post.title}
            </Link>
          </h3>
          <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 gap-2">
            <span className="truncate font-medium text-slate-600">
              {post.author || "Thành viên NCT"}
            </span>
            <span className="shrink-0 text-slate-400">
              {formatDate(post.createdAt)}
            </span>
          </div>
        </div>
      </article>
    );
  }

  // 3. Biến thể Dạng hàng ngang (Media Object)
  if (activeVariant === "horizontal") {
    return (
      <article
        className={`group flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-200 transition-all hover:shadow-xs ${className}`}
      >
        <Link
          href={href}
          className="shrink-0 w-28 sm:w-36 md:w-44 overflow-hidden rounded-xl bg-slate-100 aspect-[16/10] sm:aspect-[16/9] block"
        >
          <PostCover
            post={post}
            className="group-hover:scale-105"
          />
        </Link>
        <div className="flex flex-1 min-w-0 flex-col py-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#1d4ed8] uppercase tracking-wider">
              {categoryName || (post.source === "user" ? "Ký ức" : "Tin tức")}
            </span>
            {post.pinned && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                📌 Ghim
              </span>
            )}
          </div>
          <h3 className="!font-news mt-1 text-[14px] sm:text-[16px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#1d4ed8]">
            <Link href={href} className="line-clamp-2 hover:underline">
              {post.title}
            </Link>
          </h3>
          {post.excerpt && (
            <p className="hidden sm:block mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="truncate font-medium text-slate-600">
              {post.author || "Thành viên NCT"}
            </span>
            <span className="text-slate-300">·</span>
            <span className="shrink-0 text-slate-400">
              {formatDate(post.createdAt)}
            </span>
          </div>
        </div>
      </article>
    );
  }

  // 4. Biến thể Grid tiêu chuẩn (dùng cho 3 cột / Carousel)
  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl bg-white border border-slate-200/90 hover:border-blue-200 transition-all duration-300 hover:shadow-md ${className}`}
    >
      <Link href={href} className="block overflow-hidden aspect-[16/9] w-full bg-slate-100 relative">
        <PostCover
          post={post}
          className="group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <PostBadges post={post} categoryName={categoryName} compact />
        <h3 className="!font-news mt-2.5 flex-1 text-[15px] sm:text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#1d4ed8]">
          <Link href={href} className="line-clamp-2 hover:underline">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && (
          <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto pt-3.5 flex items-center justify-between border-t border-slate-100 text-[11px] text-slate-500">
          <span className="truncate pr-2 font-medium text-slate-600">
            {post.author || "Thành viên NCT"}
          </span>
          <span className="shrink-0 text-slate-400">
            {formatDate(post.createdAt)}
          </span>
        </div>
      </div>
    </article>
  );
}
