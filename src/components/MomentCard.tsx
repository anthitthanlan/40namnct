"use client";

import React from "react";
import Link from "next/link";

type MomentCardProps = {
  coverUrl: string;
  title: string;
  author: string;
  role: string;
  year: number | string;
  kind?: "image" | "video";
  size?: "sm" | "md";
  aspect?: "natural" | "fixed";
  onClick?: () => void;
  href?: string;
};

export default function MomentCard({
  coverUrl,
  title,
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
      {kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={title}
          loading="lazy"
          className={`${
            isFixed
              ? "absolute inset-0 h-full w-full object-cover"
              : "w-full h-auto min-h-[160px] sm:min-h-[190px] max-h-[580px] object-cover block"
          } transition-transform duration-500 ease-out group-hover:scale-[1.03]`}
        />
      ) : (
        <video
          src={coverUrl}
          preload="metadata"
          className={`${
            isFixed
              ? "absolute inset-0 h-full w-full object-cover"
              : "w-full h-auto min-h-[160px] sm:min-h-[190px] max-h-[580px] object-cover block"
          } transition-transform duration-500 ease-out group-hover:scale-[1.03]`}
        />
      )}

      {/* Top Badges: Year Badge at Top-Left, Media Type at Top-Right */}
      <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 pointer-events-none flex items-center gap-1.5">
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

      {/* Subtle Micro Scrim Gradient at Bottom only (leaves top 70% of image 100% clean and bright) */}
      <div className="absolute inset-x-0 bottom-0 h-28 sm:h-32 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

      {/* Bottom Metadata: Compact & Elegant Typography */}
      <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none p-2.5 sm:p-3.5">
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
    </>
  );

  const containerClasses = `group relative block w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.015] ${
    isFixed ? "aspect-[4/5]" : ""
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
