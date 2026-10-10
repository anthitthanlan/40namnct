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
  onClick,
  href,
}: MomentCardProps) {
  const content = (
    <>
      {kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity hover:opacity-100"
        />
      ) : (
        <video
          src={coverUrl}
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity hover:opacity-100"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

      <div className={`absolute bottom-0 left-0 right-0 pointer-events-none ${size === "sm" ? "p-4" : "p-5 sm:p-6"}`}>
        <span className={`mb-2 inline-block rounded-full bg-white/20 font-bold tracking-widest text-white backdrop-blur-md ${size === "sm" ? "px-2 py-0.5 text-[10px]" : "sm:mb-3 px-3 py-1 text-xs"}`}>
          {year}
        </span>
        <h3 className={`line-clamp-2 font-extrabold leading-snug text-white ${size === "sm" ? "text-sm" : "text-base sm:text-lg"}`}>
          {title}
        </h3>
        <p className={`mt-1 font-medium text-slate-300 ${size === "sm" ? "text-[11px]" : "sm:mt-2 text-xs sm:text-sm"}`}>
          {author} {role ? `· ${role}` : ""}
        </p>
      </div>
    </>
  );

  const containerClasses = `relative block aspect-[4/5] w-full overflow-hidden rounded-3xl bg-slate-900 shadow-sm transition-transform hover:scale-[1.02] ${
    onClick || href ? "cursor-pointer" : ""
  }`;

  if (href) {
    return (
      <Link href={href} className={containerClasses}>
        {content}
      </Link>
    );
  }

  return (
    <div
      onClick={onClick}
      className={containerClasses}
    >
      {content}
    </div>
  );
}
