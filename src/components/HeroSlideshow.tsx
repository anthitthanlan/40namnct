"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";

type Slide = { src: string; alt: string };

const FALLBACK: Slide[] = [
  { src: "/hero_images/hero_0.webp", alt: "Học sinh trường THPT Nguyễn Công Trứ" },
];

const DURATION = 6000;

export default function HeroSlideshow() {
  const [slides, setSlides] = useState<Slide[]>(FALLBACK);
  const [current, setCurrent] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  // Skeleton: ảnh chưa load xong thì hiện shimmer
  const [loaded, setLoaded] = useState<boolean[]>(() => FALLBACK.map(() => false));

  // Tự động quét ảnh từ thư mục hero_images qua API
  useEffect(() => {
    fetch("/api/hero-images")
      .then((r) => r.json())
      .then((data: { images: string[] }) => {
        if (data.images?.length) {
          const mapped: Slide[] = data.images.map((src, i) => ({
            src,
            alt: `Kỷ niệm 40 năm Nguyễn Công Trứ - ảnh ${i + 1}`,
          }));
          setSlides(mapped);
          setLoaded(mapped.map(() => false));
        }
      })
      .catch(() => {/* giữ fallback */});
  }, []);

  useEffect(() => {
    setCurrent(0);
    setPrevIndex(null);
  }, [slides]);

  // Dọn dẹp prevIndex sau khi CSS transition (1.4s) hoàn tất
  useEffect(() => {
    if (prevIndex === null) return;
    const t = setTimeout(() => {
      setPrevIndex(null);
    }, 1500);
    return () => clearTimeout(t);
  }, [prevIndex]);

  const headerRef = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(true);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const goToSlide = useCallback((newIdx: number) => {
    setCurrent((c) => {
      if (c !== newIdx) {
        setPrevIndex(c);
      }
      return newIdx;
    });
  }, []);

  const next = useCallback(() => {
    setCurrent((c) => {
      const nextIdx = (c + 1) % slides.length;
      setPrevIndex(c);
      return nextIdx;
    });
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((c) => {
      const prevIdx = (c - 1 + slides.length) % slides.length;
      setPrevIndex(c);
      return prevIdx;
    });
  }, [slides.length]);

  // Auto-play timer with reset capability
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isInView || slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      if (!document.hidden) {
        next();
      }
    }, DURATION);
  }, [isInView, next, slides.length]);

  useEffect(() => {
    resetTimer();

    const handleVisibility = () => {
      if (document.hidden) {
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        resetTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [resetTimer]);

  // Swipe / Drag handling (Desktop & Mobile)
  const isPointerDown = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    isPointerDown.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startTime.current = Date.now();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    const elapsed = Date.now() - startTime.current;

    if (Math.abs(dx) > Math.abs(dy)) {
      const isFlick = Math.abs(dx) > 25 && elapsed < 350;
      const isSwipe = Math.abs(dx) > 45;
      if (isFlick || isSwipe) {
        if (dx < 0) {
          next();
        } else {
          prev();
        }
        resetTimer();
      }
    }
  };

  const handlePointerCancel = () => {
    isPointerDown.current = false;
  };

  return (
    <header
      ref={headerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onDragStart={(e) => e.preventDefault()}
      className="group relative h-screen min-h-[600px] w-full overflow-hidden bg-slate-950 select-none cursor-grab active:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
    >
      {/* Slideshow - top 52vh on mobile with feather mask, full width/height on desktop/tablet */}
      {/* Chỉ render slide đang chiếu, slide vừa chiếu (để fade out), và slide liền kề (để preload) */}
      {slides.map((slide, i) => {
        const isCurrent = i === current;
        const isPrev = i === prevIndex;
        const isNext = i === (current + 1) % slides.length;
        const isBefore = i === (current - 1 + slides.length) % slides.length;
        
        // Chỉ giữ tối đa 3-4 slides trong DOM thay vì cả 17 slides
        if (slides.length > 3 && !isCurrent && !isPrev && !isNext && !isBefore) {
          return null;
        }

        return (
          <div
            key={slide.src}
            className={`hero-slide hero-slide-mobile-feather overflow-hidden !bottom-auto !top-0 !h-[52vh] md:!top-0 md:!bottom-0 md:!h-full ${
              isCurrent ? "active" : ""
            }`}
          >
            <div
              className={`skeleton-pulse absolute inset-0 rounded-none transition-opacity duration-[var(--duration-very-slow)] ${
                loaded[i] ? "opacity-0" : "opacity-100"
              }`}
            />
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0 || isCurrent}
              onLoad={() =>
                setLoaded((arr) => {
                  if (arr[i]) return arr;
                  const next = [...arr];
                  next[i] = true;
                  return next;
                })
              }
              className="object-cover select-none pointer-events-none"
              sizes="100vw"
              draggable={false}
            />
          </div>
        );
      })}

      {/* Top blur edge (overlay nhẹ tinh tế cho navbar không lấn át ảnh) */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/80 via-slate-950/30 to-transparent pointer-events-none z-[3]" />
      {/* Bottom blur edge gọn gàng ở mép dưới ảnh, không kéo dài che khuất chi tiết */}
      <div className="absolute inset-x-0 top-[40vh] h-[14vh] bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950 md:hidden pointer-events-none z-[3]" />
      {/* Gradient nhẹ bên trái để text đọc được trên desktop/tablet */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent hidden md:block pointer-events-none z-[3]" />
      
      {/* Ánh sáng glow mờ dưới đáy cho mobile bớt đơn điệu */}
      <div className="absolute inset-x-0 bottom-0 h-[50vh] bg-[radial-gradient(ellipse_at_bottom,rgba(30,58,138,0.3),transparent_70%)] md:hidden pointer-events-none" />

      {/* Nội dung */}
      <div className="relative z-10 flex h-full flex-col items-center justify-end pb-[15vh] px-6 text-center text-white md:items-start md:justify-center md:pb-0 md:text-left md:max-w-[55%] md:pl-16 xl:pl-24 pointer-events-none">
        <div className="mb-6 animate-hero-fade" style={{ animationDelay: "100ms" }}>
          <div className="floaty btn-lightship-soft inline-block max-w-full rounded-full bg-white px-5 py-2 font-bold tracking-wide text-[#1d4ed8] text-center whitespace-nowrap text-[clamp(0.6rem,3.5vw,0.875rem)] pointer-events-auto">
            1986 - 2026 · 40 NĂM TRỒNG NGƯỜI
          </div>
        </div>
        <div className="animate-hero-fade" style={{ animationDelay: "200ms" }}>
          <h1 className="flex flex-col items-center lg:items-start gap-1 font-extrabold leading-tight drop-shadow-lg">
            <span className="whitespace-nowrap text-[clamp(1.25rem,5.5vw,2.75rem)]">40 Năm Trường THPT</span>
            <span className="whitespace-nowrap text-[clamp(1.6rem,8vw,3.75rem)]">Nguyễn Công Trứ</span>
          </h1>
        </div>
        <div className="animate-hero-fade" style={{ animationDelay: "300ms" }}>
          <p className="mt-5 max-w-xl text-base text-slate-100 sm:text-lg drop-shadow">
            Hành trình 40 năm kiên trì sự nghiệp &ldquo;trồng người&rdquo; - nơi
            ươm mầm những thế hệ học trò hiếu học, nhân ái, giàu ý chí.
          </p>
        </div>
      </div>

      {/* Desktop Prev / Next Buttons */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
              resetTimer();
            }}
            className="absolute left-5 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-95"
            aria-label="Ảnh trước"
          >
            <span className="material-symbols-rounded text-2xl">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
              resetTimer();
            }}
            className="absolute right-5 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-95"
            aria-label="Ảnh kế tiếp"
          >
            <span className="material-symbols-rounded text-2xl">chevron_right</span>
          </button>
        </>
      )}

      {/* Chấm điều hướng + progress (Chỉ hiện trên Desktop/Tablet, mobile ẩn vì vướng audio widget) */}
      <div className="absolute bottom-8 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-3 md:flex">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Ảnh ${i + 1}`}
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(i);
              resetTimer();
            }}
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
