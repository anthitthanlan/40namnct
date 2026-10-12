"use client";

import React from "react";
import Link from "next/link";

type MomentCardProps = {
  coverUrl: string;
  title: string;
  caption?: string;
  author: string;
  role: string;
  year: number | string;
  kind?: "image" | "video";
  size?: "sm" | "md";
  aspect?: "natural" | "fixed";
  onClick?: () => void;
  href?: string;
};

/** Lấy chữ cái đầu tiên của tên tác giả (chuẩn tên Việt: lấy chữ cái đầu của tên chính) */
function getInitial(name?: string): string {
  if (!name || !name.trim()) return "N";
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1];
  return last ? last[0].toUpperCase() : "N";
}

export default function MomentCard({
  coverUrl,
  title,
  caption,
  author,
  role,
  year,
  kind = "image",
  size = "md",
  aspect = "natural",
  onClick,
  href,
}: MomentCardProps) {
  const isFixed = aspect === "fixed";

  const content = (
    <>
      {/* ── MOBILE HEADER (Tác giả & Năm để trực tiếp trên nền, không bỏ vào khung) ── */}
      {!isFixed && (
        <div className="flex sm:hidden items-center justify-between gap-3 px-1 pt-0.5 pb-2.5 bg-transparent">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-200/60 text-xs font-bold text-[#1d4ed8] shadow-sm">
              {getInitial(author)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold leading-tight text-slate-900">
                {author || "Thành viên NCT"}
              </p>
              {role && (
                <p className="truncate text-[11px] font-medium leading-tight text-slate-500">
                  {role}
                </p>
              )}
            </div>
          </div>
          {year ? (
            <span className="shrink-0 rounded-full bg-slate-200/70 border border-slate-300/60 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
              {year}
            </span>
          ) : null}
        </div>
      )}

      {/* ── KHỐI MEDIA (Ảnh hiển thị trong khung bo tròn nhẹ) ── */}
      <div
        className={`relative ${
          isFixed
            ? "h-full w-full overflow-hidden"
            : "w-full rounded-2xl sm:rounded-none overflow-hidden border border-slate-200/70 sm:border-0 shadow-sm sm:shadow-none bg-slate-200/50"
        }`}
      >
        {kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={title}
            loading="lazy"
            className={`${
              isFixed
                ? "absolute inset-0 h-full w-full object-cover"
                : "w-full h-auto min-h-[180px] sm:min-h-[190px] max-h-[600px] object-cover block"
            } transition-transform duration-500 ease-out group-hover:scale-[1.03]`}
          />
        ) : (
          <video
            src={coverUrl}
            preload="metadata"
            className={`${
              isFixed
                ? "absolute inset-0 h-full w-full object-cover"
                : "w-full h-auto min-h-[180px] sm:min-h-[190px] max-h-[600px] object-cover block"
            } transition-transform duration-500 ease-out group-hover:scale-[1.03]`}
          />
        )}

        {/* Desktop Overlay Badges: Badge năm ở góc trên trái (chỉ hiện trên Desktop hoặc khi Fixed aspect) */}
        <div
          className={`absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 pointer-events-none ${
            isFixed ? "flex" : "hidden sm:flex"
          } items-center gap-1.5`}
        >
          {year ? (
            <span className="rounded-full bg-black/45 backdrop-blur-md border border-white/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold tracking-wider text-white shadow-sm">
              {year}
            </span>
          ) : null}
        </div>

        {kind === "video" && (
          <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 pointer-events-none">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 shadow-sm">
              <span className="material-symbols-rounded text-xs">play_arrow</span>
            </span>
          </div>
        )}

        {/* Desktop Bottom Scrim Gradient (Ẩn trên Mobile khi hiển thị Feed tự nhiên) */}
        <div
          className={`absolute inset-x-0 bottom-0 h-28 sm:h-32 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none ${
            isFixed ? "block" : "hidden sm:block"
          }`}
        />

        {/* Desktop Bottom Metadata (Ẩn trên Mobile khi hiển thị Feed tự nhiên) */}
        <div
          className={`absolute inset-x-0 bottom-0 z-10 pointer-events-none p-2.5 sm:p-3.5 ${
            isFixed ? "block" : "hidden sm:block"
          }`}
        >
          <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold leading-snug text-white drop-shadow-sm transition-colors group-hover:text-blue-100">
            {title}
          </h3>
          {(author || role) && (
            <p className="mt-0.5 sm:mt-1 truncate text-[10px] sm:text-[11px] font-normal text-slate-200/90 drop-shadow-sm">
              {author}
              {role ? ` · ${role}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* ── MOBILE FOOTER (Tiêu đề & Chú thích để trực tiếp trên nền, không bỏ vào khung) ── */}
      {!isFixed && (
        <div className="block sm:hidden px-1 pt-2.5 pb-1 bg-transparent">
          <h3 className="text-[14px] font-bold leading-snug text-slate-900">
            {title}
          </h3>
          {caption && caption !== title && (
            <p className="mt-1 text-xs text-slate-600 line-clamp-3 leading-relaxed">
              {caption}
            </p>
          )}
          <div className="mt-2.5 flex items-center justify-between pt-1 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <span className="material-symbols-rounded text-sm text-slate-400">photo_camera</span>
              Kỷ niệm 40 năm
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#1d4ed8]">
              Phóng to
              <span className="material-symbols-rounded text-sm">open_in_full</span>
            </span>
          </div>
        </div>
      )}
    </>
  );

  const containerClasses = `group relative block w-full transition-all duration-300 ${
    isFixed
      ? "aspect-[4/5] rounded-2xl sm:rounded-3xl bg-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.015] overflow-hidden"
      : "bg-transparent sm:bg-slate-100 sm:rounded-3xl sm:border sm:border-transparent sm:shadow-sm sm:overflow-hidden sm:hover:shadow-xl sm:hover:scale-[1.015]"
  } ${onClick || href ? "cursor-pointer" : ""}`;

  if (href) {
    return (
      <Link href={href} className={containerClasses}>
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={containerClasses}>
      {content}
    </div>
  );
}
