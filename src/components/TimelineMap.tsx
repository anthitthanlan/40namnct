"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

export type MapMilestone = {
  id: string;
  index: number;
  title: string;
  desc: string;
  icon: string;
  color: string;
  images: string[];
};

/** Đường bay uốn lượn (viewBox 1000x600) - giữ trong dải giữa màn hình (y ~265-470)
    để không đâm xuyên qua header phía trên */
const PATH_D =
  "M -60 350 C 80 265 180 435 320 380 C 460 325 430 245 565 280 C 700 315 675 470 812 455 C 950 440 980 320 1080 275";

export default function TimelineMap({
  milestones,
}: {
  milestones: MapMilestone[];
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [len, setLen] = useState(0);
  const [progress, setProgress] = useState(0);
  const [nodes, setNodes] = useState<
    Array<{ x: number; y: number } | null>
  >([]);

  // Vị trí các mốc dọc theo đường bay (bắt đầu lệch phải một chút để card không bị cắt mép trái)
  const ts = useMemo(
    () =>
      milestones.map(
        (_, i) => 0.12 + (0.76 * i) / Math.max(1, milestones.length - 1),
      ),
    [milestones],
  );

  // Tính tổng chiều dài path sau khi mount
  useEffect(() => {
    const path = pathRef.current;
    if (path) setLen(path.getTotalLength());
  }, []);

  // Tọa độ node khi đã có len
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

  // Scroll → target, lerp mượt như camera bay trong game
  useEffect(() => {
    let target = 0;
    let current = 0;
    let raf = 0;

    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const top = el.getBoundingClientRect().top;
      target = Math.min(1, Math.max(0, -top / total));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const loop = () => {
      current += (target - current) * 0.075;
      if (Math.abs(target - current) < 0.0004) current = target;
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
      cancelAnimationFrame(raf);
    };
  }, [len]);

  // Điểm camera hiện tại trên path
  const camera = useMemo(() => {
    const path = pathRef.current;
    if (!path || !len) return { x: -60, y: 350 };
    return path.getPointAtLength(len * progress);
  }, [progress, len]);

  const pctX = (x: number) => `${(x / 1000) * 100}%`;
  const pctY = (y: number) => `${(y / 600) * 100}%`;

  return (
    <div ref={wrapRef} style={{ height: `${(milestones.length + 1.2) * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Nền */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc] via-[#eef2f7] to-[#f8fafc]" />

        {/* Header mờ dần theo camera - đẩy xuống dưới navbar cố định */}
        <div
          className="absolute inset-x-0 top-[max(7rem,15vh)] z-20 text-center transition-opacity duration-300"
          style={{ opacity: Math.max(0, 1 - progress * 6) }}
        >
          <span className="btn-pop-soft inline-block rounded-2xl bg-white px-6 py-3 text-sm font-extrabold tracking-widest text-[#1d4ed8]">
            TIMELINE 2026
          </span>
          <h1 className="mt-4 text-4xl font-extrabold text-slate-900 sm:text-5xl">
            Lộ Trình 4 Chặng
          </h1>
        </div>

        {/* Sọc tiến trình % bên phải */}
        <div className="absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 md:block">
          <div className="h-40 w-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="w-full rounded-full bg-[#1d4ed8]"
              style={{ height: `${progress * 100}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs font-bold tabular-nums text-slate-500">
            {Math.round(progress * 100)}%
          </p>
        </div>

        {/* CTA tham gia ngày hội - nổi cố định ở đáy giữa, luôn sẵn sàng bấm */}
        <div className="absolute bottom-7 left-1/2 z-30 -translate-x-1/2">
          <a
            href="#"
            className="btn-pop inline-block whitespace-nowrap bg-white px-7 py-3.5 text-sm font-extrabold text-[#1d4ed8] sm:text-base"
          >
            🎉 Tham gia ngày hội
          </a>
        </div>

        {/* Map: path uốn lượn + camera + các mốc */}
        <div className="absolute inset-0">
          <svg
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            {/* Path nền mờ (toàn bộ lộ trình) */}
            <path
              d={PATH_D}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            {/* Path chấm vẽ dần theo scroll */}
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

          {/* Camera - chấm bay theo scroll */}
          <div
            className="absolute z-30 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-[#1d4ed8] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.25)]"
            style={{ left: pctX(camera.x), top: pctY(camera.y) }}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#1d4ed8]" />
          </div>

          {/* Các mốc: node icon + card nội dung hiện dần theo camera */}
          {milestones.map((m, i) => {
            const node = nodes[i];
            if (!node) return null;
            const t = ts[i];
            const visible = progress >= t - 0.005;
            const up = i % 2 === 0; // xen kẽ uốn lên / uốn xuống
            return (
              <div
                key={m.id}
                className="absolute z-10"
                style={{ left: pctX(node.x), top: pctY(node.y) }}
              >
                {/* Node icon squircle lệch bóng như mockup */}
                <div
                  className={`absolute left-1/2 top-1/2 z-10 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl text-xl shadow-[7px_7px_0_-1px_#0f172a,7px_7px_0_0_rgba(15,23,42,0.35),12px_14px_26px_rgba(15,23,42,0.25)] transition-all duration-500 ${m.color} ${
                    visible ? "scale-100 opacity-100" : "scale-50 opacity-0"
                  }`}
                >
                  {m.icon}
                </div>

                {/* Card nổi lên trên hoặc xuống dưới path */}
                <div
                  className={`absolute left-1/2 w-64 -translate-x-1/2 transition-all duration-700 md:w-80 ${
                    up ? "bottom-[calc(50%+3rem)]" : "top-[calc(50%+3rem)]"
                  } ${
                    visible
                      ? "translate-y-0 opacity-100"
                      : up
                        ? "-translate-y-4 opacity-0"
                        : "translate-y-4 opacity-0"
                  }`}
                >
                  <article className="btn-pop-soft bg-white p-4 md:p-5">
                    <span className="text-[11px] font-extrabold tracking-widest text-[#1d4ed8]">
                      MỐC {m.index}
                    </span>
                    <h2 className="mt-1 text-base font-extrabold text-slate-900 md:text-lg">
                      {m.title}
                    </h2>
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-600 md:text-sm">
                      {m.desc}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {m.images.slice(0, 3).map((src, j) => (
                        <div
                          key={src}
                          className="skeleton relative aspect-square overflow-hidden rounded-lg"
                        >
                          <Image
                            src={src}
                            alt={`${m.title} - ${j + 1}`}
                            fill
                            loading="lazy"
                            className="object-cover transition-transform duration-500 hover:scale-110"
                            sizes="110px"
                          />
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
