"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const BG_IMAGES = [
  {
    src: "/bg/hero-1.webp",
    alt: "Học sinh trường THPT Nguyễn Công Trứ",
    caption: "Học sinh Nguyễn Công Trứ",
  },
  {
    src: "/bg/hero-2.webp",
    alt: "Khuôn viên sân trường Nguyễn Công Trứ",
    caption: "Khuôn viên sân trường",
  },
  {
    src: "/bg/hero-3.webp",
    alt: "Thầy trò dưới mái trường Nguyễn Công Trứ",
    caption: "Thầy trò Nguyễn Công Trứ",
  },
  {
    src: "/bg/hero-4.webp",
    alt: "Cổng trường THPT Nguyễn Công Trứ",
    caption: "Cổng trường THPT Nguyễn Công Trứ",
  },
  {
    src: "/bg/hero-5.webp",
    alt: "Hoạt động kỷ niệm THPT Nguyễn Công Trứ",
    caption: "Lễ hội & Ngày trở về",
  },
];

const SLIDE_DURATION = 6500;

export default function SchoolAnimatedBg() {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>(() =>
    BG_IMAGES.map(() => false),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % BG_IMAGES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Slideshow background trường */}
      {BG_IMAGES.map((img, index) => {
        const isActive = index === current;
        return (
          <div
            key={img.src}
            className={`absolute inset-0 transition-opacity duration-[var(--duration-very-slow)] ease-[var(--ease-in-out)] ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className={`absolute inset-0 h-full w-full transition-transform duration-[7000ms] ease-[var(--ease-smooth-out)] ${
                isActive ? "scale-110 translate-x-1" : "scale-100 translate-x-0"
              }`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                priority={index === 0}
                className="object-cover object-center"
                sizes="100vw"
                onLoad={() =>
                  setLoaded((arr) => {
                    if (arr[index]) return arr;
                    const next = [...arr];
                    next[index] = true;
                    return next;
                  })
                }
              />
            </div>
          </div>
        );
      })}

      {/* Lớp phủ làm mờ và kính tối (smoky blur backdrop) */}
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[6px]" />

      {/* Gradient ánh sáng viền & chiều sâu điện ảnh */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-slate-950/50 to-slate-950/80" />

      {/* Hiệu ứng đốm sáng trường học (School ambiance ambient glows) */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-[100px]" />
      <div className="absolute -right-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-emerald-500/15 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-500/20 blur-[100px]" />

      {/* Caption nhỏ góc phải bên dưới hiển thị góc chụp trường */}
      <div className="pointer-events-auto absolute bottom-4 right-6 hidden items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3.5 py-1.5 text-xs text-slate-300 backdrop-blur-md sm:flex">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
        <span className="font-medium">
          {BG_IMAGES[current].caption} ({current + 1}/{BG_IMAGES.length})
        </span>
      </div>
    </div>
  );
}
