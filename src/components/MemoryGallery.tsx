"use client";

import { useEffect, useState } from "react";

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
};

export default function MemoryGallery() {
  const [items, setItems] = useState<MediaRow[] | null>(null);
  const [zoom, setZoom] = useState<MediaRow | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/media", { cache: "no-store" });
        const data = await res.json();
        if (data.ok) setItems(data.media as MediaRow[]);
        else setItems([]);
      } catch {
        setItems([]);
      }
    })();
  }, []);

  if (items === null) {
    return (
      <div className="rounded-3xl bg-white/10 p-8 text-center text-sm font-semibold text-slate-200">
        Đang tải tường ký ức…
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
    <>
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        {items.map((m) => (
          <figure
            key={m.id}
            className="btn-lightship-soft overflow-hidden rounded-3xl bg-white"
          >
            {m.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.url}
                alt={m.caption || `Kỷ niệm gửi bởi ${m.author}`}
                loading="lazy"
                className="h-56 w-full cursor-zoom-in object-cover"
                onClick={() => setZoom(m)}
              />
            ) : (
              <video
                src={m.url}
                controls
                preload="metadata"
                className="h-56 w-full bg-slate-900 object-cover"
              />
            )}
            <figcaption className="p-4">
              <p className="line-clamp-2 text-sm font-bold text-slate-800">
                {m.caption || "Kỷ niệm dưới mái trường Trứ"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                🧡 {m.author} · {m.authorRole}
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-slate-400">
                📅 {String(m.month).padStart(2, "0")}.{m.year}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>

      {zoom && zoom.kind === "image" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-6"
          onClick={() => setZoom(null)}
        >
          <div
            className="max-h-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoom.url}
              alt={zoom.caption || "Kỷ niệm"}
              className="max-h-[78vh] w-auto rounded-2xl"
            />
            <p className="mt-4 text-center text-sm font-semibold text-slate-200">
              {zoom.caption} - 🧡 {zoom.author}
            </p>
            <button
              type="button"
              onClick={() => setZoom(null)}
              className="mx-auto mt-4 block rounded-full bg-white px-6 py-2 text-sm font-extrabold text-slate-900"
            >
              ✕ Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
}
