"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type WallMemory = {
  id: string;
  title: string;
  caption: string;
  icon: string;
  author: string;
  role: string;
  year: number;
  month: number;
  kind: "image" | "video" | "album";
  images: string[];
  isCommunity: boolean;
};

/** Đường bay uốn lượn (viewBox 1000x600) - giữ trong dải giữa màn (không đâm xuyên header) */
const PATH_D =
  "M -60 350 C 80 265 180 435 320 380 C 460 325 430 245 565 280 C 700 315 675 470 812 455 C 950 440 980 320 1080 275";

/** Tốsự tự động cuộn "luôn": vừng 1 chu (~16s) cùng 1 chu khi người dùng idle */
const AUTO_SPEED = 1 / 16000;
const IDLE_MS = 2000;
const END_HOLD_MS = 1800;

function mm(month: number): string {
  return String(month).padStart(2, "0");
}

export default function TimelineWall({
  memories,
}: {
  memories: WallMemory[];
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [len, setLen] = useState(0);
  const [progress, setProgress] = useState(0);
  const [nodes, setNodes] = useState<Array<{ x: number; y: number } | null>>([]);

  /** Vị trí hodograf theo thứ thương niên - không có mốc, mả một dải liên */
  const ts = useMemo(
    () =>
      memories.map(
        (_, i) => 0.1 + (0.8 * i) / Math.max(1, memories.length - 1),
      ),
    [memories],
  );

  useEffect(() => {
    const path = pathRef.current;
    if (path) setLen(path.getTotalLength());
  }, []);

  useEffect(() => {
    const path = pathRef.current;
    if (!path || !len) return;
    setNodes(
      ts.map((t) => {
        const pt = path.getPointAtLength(len * t);
        return { x: pt.x, y: pt.y };
      }),
    );
  }, [len, ts]);

  // Camera: cuộn người dùng → target. Idle > IDLE_MS → tự động cuộn luôn (loop).
  useEffect(() => {
    let target = 0;
    let current = 0;
    let raf = 0;
    let prev = performance.now();
    let lastScroll = performance.now();
    let holdEnd: number | null = null;

    const clamp = (v: number) => Math.min(1, Math.max(0, v));

    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const total = Math.max(1, el.offsetHeight - window.innerHeight);
      const top = el.getBoundingClientRect().top;
      target = clamp(-top / total);
      lastScroll = performance.now();
      holdEnd = null;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("wheel", onScroll, { passive: true });

    const loop = (now: number) => {
      const dt = Math.min(64, now - prev);
      prev = now;

      if (now - lastScroll > IDLE_MS) {
        target += dt * AUTO_SPEED;
        if (target >= 1) {
          target = 1;
          holdEnd ??= now;
          if (now - holdEnd >= END_HOLD_MS) {
            target = 0;
            holdEnd = null;
          }
        }
      }

      current += (target - current) * Math.min(1, dt * 0.0042);
      if (Math.abs(target - current) < 0.00035) current = target;

      const path = pathRef.current;
      if (path && len) {
        path.style.strokeDashoffset = `${len * (1 - current)}`;
      }
      setProgress(current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [len]);

  const camera = useMemo(() => {
    const path = pathRef.current;
    if (!path || !len) return { x: -60, y: 350 };
    const t = Math.min(1, Math.max(0, progress));
    return path.getPointAtLength(len * t);
  }, [progress, len]);

  const pctX = (x: number) => `${(x / 1000) * 100}%`;
  const pctY = (y: number) => `${(y / 600) * 100}%`;

  if (memories.length === 0) {
    return (
      <section className="grid min-h-screen place-items-center px-6 text-center">
        <div className="btn-lightship-soft max-w-lg bg-white p-8">
          <span className="text-4xl">🗓</span>
          <h1 className="mt-3 text-xl font-extrabold text-slate-900">
            Timeline 40 Năm
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Chưa có kỷ niệm trên Timeline. Gửi ảng / video cùng năm & tháng
            khoác khúc từ trang chủ - sau duyệt tự động xuất hiện ở dải này.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div ref={wrapRef} style={{ height: `${(memories.length + 1.5) * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Nền */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc] via-[#eef2f7] to-[#f8fafc]" />

        {/* Header - chỉ bắt đầu, mờ khi camera đi */}
        <div
          className="absolute inset-x-0 top-[max(7rem,16vh)] z-20 text-center transition-opacity duration-300"
          style={{ opacity: Math.max(0, 1 - progress * 6) }}
        >
          <span className="btn-lightship-soft inline-block rounded-2xl bg-white px-6 py-3 text-sm font-extrabold tracking-widest text-[#1d4ed8]">
            TIMELINE 40 NĂM
          </span>
          <h1 className="mt-4 text-4xl font-extrabold text-slate-900 sm:text-5xl">
            Tường Ký ức Trông Người
          </h1>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            ✨ tự động cuộn luôn · không có mốc · chỉ kỷ niệm của chúng tất
          </p>
        </div>

        {/* Sọc dòng theo camera */}
        <div className="absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 md:block">
          <div className="h-40 w-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="w-full rounded-full bg-[#1d4ed8]"
              style={{ height: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs font-bold tabular-nums text-slate-500">
            {Math.round(progress * 100)}%
          </p>
        </div>

        {/* CTA tham gia ngày hội */}
        <div className="absolute bottom-7 left-1/2 z-30 -translate-x-1/2">
          <a
            href="#"
            className="btn-lightship inline-block whitespace-nowrap bg-white px-7 py-3.5 text-sm font-extrabold text-[#1d4ed8] sm:text-base"
          >
            🎉 Tham gia ngày hội
          </a>
        </div>

        {/* Dải bay: path + tường ký ức (không có mốc) */}
        <div className="absolute inset-0">
          <svg
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <path
              d={PATH_D}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <path
              ref={pathRef}
              d={PATH_D}
              fill="none"
              stroke="#64748b"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="0.1 14"
              style={{ strokeDashoffset: len }}
            />
          </svg>

          {/* Camera - chấm bồi tự động cuộn */}
          <div
            className="absolute z-30 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-[#1d4ed8] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.25)]"
            style={{ left: pctX(camera.x), top: pctY(camera.y) }}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#1d4ed8]" />
          </div>

          {/* Tường ký ức: mỗi kỷ niệm = card theo năm·tháng, luôn xu hiện */}
          {memories.map((m, i) => {
            const node = nodes[i];
            if (!node) return null;
            const up = i % 2 === 0;
            const thumbs = m.kind === "video" ? [] : m.images.slice(0, 3);
            const extra = m.images.length - 3;
            return (
              <div
                key={m.id}
                className="absolute z-10"
                style={{ left: pctX(node.x), top: pctY(node.y) }}
              >
                <article
                  className={`absolute left-1/2 w-60 -translate-x-1/2 md:w-72 ${
                    up ? "bottom-[calc(50%+3rem)]" : "top-[calc(50%+3rem)]"
                  } btn-lightship-soft bg-white p-4`}
                >
                  <span className="absolute -top-3 right-3 z-10 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold tracking-wider text-[#1d4ed8] shadow-md shadow-slate-900/10">
                    📅 {mm(m.month)}.{m.year}
                  </span>

                  {m.kind === "video" ? (
                    <video
                      src={m.images[0]}
                      controls
                      preload="metadata"
                      className="mt-1 aspect-video w-full rounded-lg bg-slate-900 object-cover"
                    />
                  ) : (
                    <div className="mt-1 grid grid-cols-3 gap-1.5">
                      {thumbs.map((src, j) => (
                        <div
                          key={`${m.id}-${j}`}
                          className="skeleton relative aspect-square overflow-hidden rounded-lg"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt={`${m.title} - ${j + 1}`}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                          />
                          {j === thumbs.length - 1 && extra > 0 && (
                            <span className="absolute inset-0 grid place-items-center bg-slate-950/55 text-sm font-extrabold text-white">
                              +{extra}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <h3 className="mt-2 text-sm font-extrabold text-slate-900 md:text-base">
                    <span className="mr-1">{m.icon}</span>
                    {m.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-600 md:text-xs">
                    {m.caption}
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold text-slate-400">
                    🧡 {m.author}
                    {m.isCommunity ? ` · ${m.role}` : ""}
                  </p>
                </article>
              </div>
            );
          })}

          {/* Gợ thị idle: tự động chạy luôn, cuộn để đi chuyển */}
          <div className="absolute bottom-24 left-4 z-30 hidden items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-slate-500 shadow-md shadow-slate-900/5 md:flex">
            ✦ Cuộn để đi chuyển · tự động chạy luôn
          </div>
        </div>
      </div>
    </div>
  );
}
