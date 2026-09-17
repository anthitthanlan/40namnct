"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";

const slides = [
  { src: "/images/hero-1.jpg", alt: "Học sinh trường THPT Nguyễn Công Trứ" },
  { src: "/images/hero-2.jpg", alt: "Khuôn viên trường Nguyễn Công Trứ" },
  { src: "/images/hero-3.webp", alt: "Thầy trò Nguyễn Công Trứ" },
  { src: "/images/hero-4.webp", alt: "Trường THPT Nguyễn Công Trứ" },
  { src: "/images/hero-5.jpg", alt: "Kỷ niệm 40 năm Nguyễn Công Trứ" },
];

const DURATION = 6000;

export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  // Skeleton: ảnh chưa load xong thì hiện shimmer
  const [loaded, setLoaded] = useState<boolean[]>(() => slides.map(() => false));

  useEffect(() => {
    const id = setInterval(
      () => setCurrent((c) => (c + 1) % slides.length),
      DURATION,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <header className="relative h-screen min-h-[600px] w-full overflow-hidden">
      {/* Slideshow */}
      {slides.map((slide, i) => (
        <div key={slide.src} className={`hero-slide ${i === current ? "active" : ""}`}>
          {/* Skeleton shimmer nằm dưới ảnh, biến mất khi load xong */}
          <div
            className={`skeleton absolute inset-0 transition-opacity duration-[var(--duration-very-slow)] ${
              loaded[i] ? "opacity-0" : "opacity-100"
            }`}
          />
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            onLoad={() =>
              setLoaded((arr) => {
                if (arr[i]) return arr;
                const next = [...arr];
                next[i] = true;
                return next;
              })
            }
            className="object-cover"
            sizes="100vw"
          />
        </div>
      ))}

      {/* Overlay gradient - tối trên cho navbar, trắng ở đáy để gợi cuộn */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/30 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent" />

      {/* Nội dung */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <Reveal className="mb-6">
          <span className="floaty btn-lightship-soft rounded-full bg-white px-5 py-2 text-sm font-bold tracking-wide text-[#1d4ed8]">
            1986 - 2026 · 40 NĂM TRỒNG NGƯỜI
          </span>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="flex flex-col items-center gap-1 font-extrabold leading-tight drop-shadow-lg">
            <span className="whitespace-nowrap text-[clamp(1.25rem,5.5vw,2.75rem)]">40 Năm Trường THPT</span>
            <span className="whitespace-nowrap text-[clamp(1.6rem,8vw,3.75rem)]">Nguyễn Công Trứ</span>
          </h1>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-5 max-w-2xl text-base text-slate-100 sm:text-lg">
            Hành trình 40 năm kiên trì sự nghiệp &ldquo;trồng người&rdquo; - nơi
            ươm mầm những thế hệ học trò hiếu học, nhân ái, giàu ý chí.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/timeline"
              className="group/btn relative overflow-hidden rounded-[1.25rem] bg-[#1d4ed8] px-7 py-3.5 text-base font-bold text-white shadow-md transition-all duration-300 active:scale-95 hover:shadow-yellow-500/30"
            >
              <div className="absolute inset-0 bg-live-gradient opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 ease-in-out pointer-events-none"></div>
              <span className="relative z-10">Khám phá hành trình 40 năm</span>
            </Link>
            <a
              href="#gioi-thieu"
              className="btn-lightship-soft bg-white px-7 py-3.5 text-base font-bold text-slate-900"
            >
              Về ngôi trường
            </a>
          </div>
        </Reveal>
      </div>

      {/* Chấm điều hướng + progress */}
      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Ảnh ${i + 1}`}
            onClick={() => setCurrent(i)}
            className={`h-2.5 rounded-full transition-all duration-[var(--duration-slow)] ${
              i === current
                ? "w-9 bg-white"
                : "w-2.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </header>
  );
}
