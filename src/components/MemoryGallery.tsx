"use client";

import { useEffect, useState } from "react";
import SkeletonBlock from "@/components/SkeletonBlock";
import MomentCard from "./MomentCard";

type MediaRow = {
  id: string;
  kind: "image" | "video";
  year: number;
  month: number;
  author: string;
  authorRole: string;
  caption: string;
  url: string;
  createdAt: string;
  mediaType?: string;
};

export default function MemoryGallery() {
  const [items, setItems] = useState<MediaRow[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/media", { cache: "no-store" });
        const data = await res.json();
        if (data.ok) {
          const allMedia = data.media as MediaRow[];
          const filtered = allMedia.filter(
            (m) => m.caption || m.author || m.mediaType === "feed"
          );
          setItems(filtered);
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      }
    })();
  }, []);

  if (items === null) {
    return (
      <div className="w-full min-w-0 max-w-full">
        {/* Mobile skeleton: hàng ngang tương thích với carousel */}
        <div className="flex md:hidden gap-4 overflow-hidden -mx-4 px-4 sm:-mx-6 sm:px-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="w-[78vw] max-w-[320px] shrink-0 overflow-hidden rounded-2xl bg-white/10 aspect-[4/5]">
              <SkeletonBlock className="h-full w-full rounded-none opacity-60" />
            </div>
          ))}
        </div>

        {/* Desktop skeleton: lưới 3 cột */}
        <div className="hidden md:grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl bg-white/10">
              <SkeletonBlock className="h-56 w-full rounded-none opacity-60" />
              <div className="space-y-2 p-4">
                <SkeletonBlock className="h-4 w-3/4 opacity-50" />
                <SkeletonBlock className="h-3 w-1/2 opacity-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-white/10 p-8 text-center text-sm font-semibold text-slate-200">
        🖼 Tường ký ức đang chờ những mảnh ghép đầu tiên - hãy là người đầu
        tiên gửi kỷ niệm của bạn!
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full">
      {/* Mobile view: Auto-snapping carousel */}
      <div
        className="flex md:hidden snap-x snap-mandatory overflow-x-auto gap-4 pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 hide-scrollbar overscroll-x-contain touch-pan-x"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
      >
        {items.map((m) => (
          <div key={m.id} className="w-[78vw] max-w-[320px] shrink-0 snap-start">
            <MomentCard
              size="sm"
              coverUrl={m.url}
              title={m.caption || "Kỷ niệm dưới mái trường Trứ"}
              author={m.author}
              role={m.authorRole}
              year={m.year}
              kind={m.kind}
              aspect="fixed"
              href={`/khoanh-khac?moment=${m.id}#moment-${m.id}`}
            />
          </div>
        ))}
      </div>

      {/* Desktop view: Masonry */}
      <div className="hidden md:block columns-2 lg:columns-3 gap-5 space-y-5">
        {items.map((m) => (
          <div key={m.id} className="break-inside-avoid">
            <MomentCard
              size="sm"
              coverUrl={m.url}
              title={m.caption || "Kỷ niệm dưới mái trường Trứ"}
              author={m.author}
              role={m.authorRole}
              year={m.year}
              kind={m.kind}
              href={`/khoanh-khac?moment=${m.id}#moment-${m.id}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
