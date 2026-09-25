"use client";

import Link from "next/link";
import { type WallMemory } from "./TimelineWall";

export default function MomentCarousel({ moments }: { moments: WallMemory[] }) {
  if (!moments || moments.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="mb-6 flex items-center justify-between px-6 md:px-0">
        <h2 className="text-xl font-extrabold text-slate-900">
          📸 Khoảnh khắc nổi bật
        </h2>
        <Link
          href="/khoanh-khac"
          className="text-sm font-bold text-[#1d4ed8] hover:underline"
        >
          Xem tất cả &rarr;
        </Link>
      </div>

      <div className="hide-scrollbar -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:mx-0 md:px-0">
        {moments.map((m) => {
          const cover = m.kind === "video" ? null : m.images[0];
          return (
            <div
              key={m.id}
              className="relative aspect-[4/5] w-[280px] shrink-0 snap-center overflow-hidden rounded-3xl bg-slate-900 shadow-sm sm:w-[320px]"
            >
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt={m.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-80"
                />
              ) : m.kind === "video" ? (
                <video
                  src={m.images[0]}
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover opacity-80"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-widest text-white backdrop-blur-md">
                  {m.year}
                </span>
                <h3 className="line-clamp-2 text-lg font-extrabold leading-snug text-white">
                  {m.title}
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-300">
                  {m.author} {m.isCommunity ? `· ${m.role}` : ""}
                </p>
              </div>
            </div>
          );
        })}

        <div className="flex aspect-[4/5] w-[160px] shrink-0 snap-center items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50">
          <Link
            href="/khoanh-khac"
            className="text-center text-sm font-extrabold text-slate-500 transition-colors hover:text-[#1d4ed8]"
          >
            Khám phá<br />thêm
          </Link>
        </div>
      </div>
    </div>
  );
}
