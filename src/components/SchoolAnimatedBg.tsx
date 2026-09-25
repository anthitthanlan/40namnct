"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type BgImage = { src: string; alt: string; caption: string };

const FALLBACK: BgImage[] = [
  {
    src: "/hero_images/hero-1.webp",
    alt: "Trường THPT Nguyễn Công Trứ",
    caption: "Trường THPT Nguyễn Công Trứ",
  },
];

const SLIDE_DURATION = 6500;

export default function SchoolAnimatedBg() {
  const [images, setImages] = useState<BgImage[]>(FALLBACK);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>(() =>
    FALLBACK.map(() => false),
  );

  // Tự động quét ảnh từ thư mục hero_images qua API
  useEffect(() => {
    fetch("/api/hero-images")
      .then((r) => r.json())
      .then((data: { images: string[] }) => {
        if (data.images?.length) {
          const mapped: BgImage[] = data.images.map((src, i) => ({
            src,
            alt: `Khoảnh khắc trường Nguyễn Công Trứ ${i + 1}`,
            caption: `Ảnh ${i + 1}`,
          }));
          setImages(mapped);
          setLoaded(mapped.map(() => false));
        }
      })
      .catch(() => {/* giữ fallback */});
  }, []);

  useEffect(() => {
    setCurrent(0);
  }, [images]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Slideshow background trường */}
      {images.map((img, index) => {
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
          {images[current]?.caption} ({current + 1}/{images.length})
        </span>
      </div>
    </div>
  );
}
