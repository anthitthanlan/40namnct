"use client";

import Link from "next/link";
import { type WallMemory } from "./TimelineWall";
import MomentCard from "./MomentCard";

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
              className="w-[280px] shrink-0 snap-center sm:w-[320px]"
            >
              <MomentCard
                coverUrl={cover || m.images[0]}
                title={m.title}
                author={m.author}
                role={m.isCommunity ? m.role : ""}
                year={m.year}
                kind={cover ? "image" : "video"}
                href={`/khoanh-khac?moment=${m.id}#moment-${m.id}`}
              />
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
