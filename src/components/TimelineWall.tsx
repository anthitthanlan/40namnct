"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Post } from "@/lib/posts";
import MomentCard from "./MomentCard";

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

type FeedItem =
  | { type: "memory"; data: WallMemory; imageIndex: number }
  | { type: "post"; data: Post };

type CarouselSlide = {
  src: string;
  title: string;
  author: string;
  year: number;
  slug?: string;
};

type Props = {
  memories: WallMemory[];
  posts?: Post[];
};

const YEARS: number[] = [];
for (let i = 1986; i <= 2026; i++) YEARS.push(i);

/** Deterministic hash shuffle */
function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  return [...arr].sort((a, b) => {
    const ha = JSON.stringify(a).split("").reduce((s, c) => s + c.charCodeAt(0), 0);
    const hb = JSON.stringify(b).split("").reduce((s, c) => s + c.charCodeAt(0), 0);
    return ((ha * seed) % 1) - ((hb * seed) % 1);
  });
}

const ITEMS_PER_PAGE = 15;

export default function TimelineWall({ memories, posts = [] }: Props) {
  const [seed] = useState(() => Math.random());
  
  /* ─── Build year → items map ─── */
  const itemsByYear = useMemo(() => {
    const map = new Map<number | "all", FeedItem[]>();
    map.set("all", []);
    YEARS.forEach((y) => map.set(y, []));

    memories.forEach((m) => {
      // Split into multiple FeedItems if it has multiple images
      if (m.kind === "video") {
        const item: FeedItem = { type: "memory", data: m, imageIndex: 0 };
        map.get("all")!.push(item);
        if (map.has(m.year)) map.get(m.year)!.push(item);
      } else {
        m.images.forEach((_, i) => {
          const item: FeedItem = { type: "memory", data: m, imageIndex: i };
          map.get("all")!.push(item);
          if (map.has(m.year)) map.get(m.year)!.push(item);
        });
      }
    });

    posts.forEach((p) => {
      if (!p.cover) return;
      const y = new Date(p.createdAt).getFullYear();
      const item: FeedItem = { type: "post", data: p };
      map.get("all")!.push(item);
      if (map.has(y)) map.get(y)!.push(item);
    });

    map.forEach((items, y) => {
      map.set(y, shuffleWithSeed(items, seed));
    });
    return map;
  }, [memories, posts, seed]);

  /* ─── Carousel slides: random selection from all items ─── */
  const carouselSlides = useMemo((): CarouselSlide[] => {
    const slides: CarouselSlide[] = [];
    memories.forEach((m) => {
      if (m.kind !== "video" && m.images.length > 0)
        slides.push({ src: m.images[0], title: m.title, author: m.author, year: m.year });
    });
    posts.forEach((p) => {
      if (p.cover)
        slides.push({ src: p.cover, title: p.title, author: p.author, year: new Date(p.createdAt).getFullYear(), slug: p.slug });
    });
    return shuffleWithSeed(slides, seed).slice(0, 8);
  }, [memories, posts, seed]);

  /* ─── Filter State ─── */
  const [activeYear, setActiveYear] = useState<number | "all">("all");
  const [showFilterModal, setShowFilterModal] = useState(false);

  /* ─── Lazy Loading State ─── */
  const currentItems = itemsByYear.get(activeYear) ?? [];
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
    setLightboxIndex(null);
  }, [activeYear]);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < currentItems.length) {
          setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [visibleCount, currentItems.length]);

  const visibleItems = currentItems.slice(0, visibleCount);

  /* ─── Lightbox ─── */
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  /* ─── Target Moment & Highlight from URL ─── */
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const targetMomentId =
      params.get("moment") ||
      (window.location.hash.startsWith("#moment-")
        ? window.location.hash.replace("#moment-", "")
        : "");

    if (!targetMomentId) return;

    // Check where this item is in the current items list
    const allItems = itemsByYear.get(activeYear) ?? [];
    const targetIndex = allItems.findIndex((it) => {
      if (it.type === "memory") return String(it.data.id) === targetMomentId;
      if (it.type === "post") return String(it.data.id) === targetMomentId;
      return false;
    });

    if (targetIndex !== -1 && targetIndex >= visibleCount) {
      setVisibleCount(targetIndex + 5);
    }

    setHighlightId(targetMomentId);

    // Scroll to target element with retry to accommodate delayed page mount / transition
    const scrollToTarget = () => {
      const el = document.getElementById(`moment-${targetMomentId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return true;
      }
      return false;
    };

    const timers = [100, 300, 600, 900, 1200].map((delay) =>
      setTimeout(scrollToTarget, delay)
    );

    // Fade out highlight ring after 4 seconds
    const clearHighlightTimer = setTimeout(() => {
      setHighlightId(null);
    }, 4000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(clearHighlightTimer);
    };
  }, [itemsByYear, activeYear, visibleCount]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ═══════════ HERO CAROUSEL ═══════════ */}
      <HeroCarousel slides={carouselSlides} />

      {/* ═══════════ FILTER BUTTON ═══════════ */}
      <div id="timeline-feed-start" className="sticky top-[84px] z-40 mx-auto mb-8 w-max transition-all">
        <button
          onClick={() => setShowFilterModal(true)}
          className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-md shadow-slate-900/5 backdrop-blur-xl transition-all hover:border-[#1d4ed8]/40 hover:text-[#1d4ed8] hover:shadow-lg active:scale-95"
        >
          <span className="material-symbols-rounded text-base sm:text-lg text-[#1d4ed8]">calendar_month</span>
          <span>{activeYear === "all" ? "Tất cả các năm" : `Năm ${activeYear}`}</span>
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            {activeYear === "all" ? "1986–2026" : `${itemsByYear.get(activeYear)?.length || 0}`}
          </span>
        </button>
      </div>

      {/* ═══════════ FEED ═══════════ */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4 pb-36 sm:pb-44 md:px-8">
        <div className="mb-5 flex items-baseline gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {activeYear === "all" ? "Tất cả khoảnh khắc" : activeYear}
          </h2>
          {currentItems.length > 0 && (
            <span className="text-xs sm:text-sm font-medium text-slate-400">
              {currentItems.length} mục
            </span>
          )}
        </div>

        {currentItems.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
            <span className="material-symbols-rounded mb-4 text-6xl text-slate-200">photo_album</span>
            <p className="mb-1 text-lg font-bold text-slate-500">Khu vực này còn trống</p>
            <p className="mb-8 text-sm text-slate-400">Bạn có kỷ niệm nào muốn chia sẻ không?</p>
            <Link
              href="/gui-bai"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1d4ed8] px-6 py-3 text-sm font-extrabold text-white shadow-sm transition-transform hover:scale-105"
            >
              <span className="material-symbols-rounded text-[1.1em]">add_photo_alternate</span>
              Đăng khoảnh khắc
            </Link>
          </div>
        ) : (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-4 lg:gap-5">
              {visibleItems.map((item, idx) => {
                if (item.type === "memory") {
                  const m = item.data;
                  const src = m.images[item.imageIndex];
                  const isVideo = m.kind === "video";
                  const isTarget = highlightId === String(m.id);
                  return (
                    <div
                      key={`${m.id}-${item.imageIndex}`}
                      id={item.imageIndex === 0 ? `moment-${m.id}` : undefined}
                      className={`break-inside-avoid mb-14 sm:mb-4 lg:mb-5 scroll-mt-32 rounded-2xl sm:rounded-3xl transition-all duration-500 ${
                        isTarget
                          ? "ring-4 ring-[#1d4ed8] ring-offset-4 ring-offset-[#f8fafc] scale-[1.02] shadow-2xl relative z-10"
                          : ""
                      }`}
                    >
                      <MomentCard
                        coverUrl={src}
                        title={m.title}
                        caption={m.caption}
                        author={m.author}
                        role={m.isCommunity ? m.role : ""}
                        year={m.year}
                        kind={isVideo ? "video" : "image"}
                        onClick={() => {
                          setLightboxIndex(idx);
                        }}
                      />
                    </div>
                  );
                } else {
                  const p = item.data;
                  const isTarget = highlightId === String(p.id);
                  return (
                    <div
                      key={`post-${p.id}`}
                      id={`moment-${p.id}`}
                      className={`break-inside-avoid mb-14 sm:mb-4 lg:mb-5 scroll-mt-32 rounded-2xl sm:rounded-3xl transition-all duration-500 ${
                        isTarget
                          ? "ring-4 ring-[#1d4ed8] ring-offset-4 ring-offset-[#f8fafc] scale-[1.02] shadow-2xl relative z-10"
                          : ""
                      }`}
                    >
                      <MomentCard
                        coverUrl={p.cover!}
                        title={p.title}
                        caption={p.excerpt}
                        author={p.author}
                        role="Câu chuyện"
                        year={new Date(p.createdAt).getFullYear()}
                        kind="image"
                        onClick={() => {
                          setLightboxIndex(idx);
                        }}
                      />
                    </div>
                  );
                }
              })}
            </div>
            {/* Lazy Load Observer */}
            {visibleCount < currentItems.length && (
              <div ref={loadMoreRef} className="h-20 w-full flex items-center justify-center mt-4">
                <span className="text-slate-400 font-medium">Đang tải thêm...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══════════ LIGHTBOX ═══════════ */}
      <AnimatePresence>
        {lightboxIndex !== null && currentItems[lightboxIndex] && (
          <Lightbox
            items={currentItems}
            currentIndex={lightboxIndex}
            onIndexChange={(nextIdx) => {
              setLightboxIndex(nextIdx);
              if (nextIdx >= visibleCount - 2) {
                setVisibleCount((prev) => Math.max(prev, nextIdx + 5));
              }
            }}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>

      {/* ═══════════ FILTER MODAL ═══════════ */}
      <AnimatePresence>
        {showFilterModal && (
          <FilterModal
            currentYear={activeYear}
            onSelect={(y) => {
              setActiveYear(y);
              setShowFilterModal(false);
            }}
            onClose={() => setShowFilterModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════
   FILTER MODAL WITH WHEEL PICKER
══════════════════════════════════════════ */
function FilterModal({ currentYear, onSelect, onClose }: { currentYear: number | "all", onSelect: (y: number | "all") => void, onClose: () => void }) {
  const [inputValue, setInputValue] = useState(currentYear === "all" ? "" : currentYear.toString());
  const listRef = useRef<HTMLDivElement>(null);
  
  const ITEM_HEIGHT = 48; // h-12 = 48px
  const items = useMemo(() => ["all" as const, ...YEARS], []);

  const initialIndex = useMemo(() => {
    return currentYear === "all" ? 0 : YEARS.indexOf(currentYear) + 1;
  }, [currentYear]);

  const [scrollTop, setScrollTop] = useState(initialIndex >= 0 ? initialIndex * ITEM_HEIGHT : 0);

  useEffect(() => {
    if (listRef.current && initialIndex >= 0) {
      listRef.current.scrollTop = initialIndex * ITEM_HEIGHT;
      setScrollTop(initialIndex * ITEM_HEIGHT);
    }
  }, [initialIndex]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.toLowerCase() === "all" || inputValue === "") {
      onSelect("all");
    } else {
      const parsed = parseInt(inputValue, 10);
      if (!isNaN(parsed) && YEARS.includes(parsed)) {
        onSelect(parsed);
      } else {
        alert("Năm không hợp lệ hoặc không có trong danh sách.");
      }
    }
  };

  const handleItemClick = (item: number | "all", index: number) => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: "smooth" });
    }
    onSelect(item);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          onClick={onClose}
        >
          <span className="material-symbols-rounded text-lg">close</span>
        </button>

        <h3 className="mb-4 text-center text-lg font-extrabold text-slate-900">
          Chọn năm kỷ niệm
        </h3>

        <form onSubmit={handleManualSubmit} className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder="Nhập năm (VD: 1999)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#1d4ed8] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            Tìm
          </button>
        </form>

        {/* Wheel Selector container */}
        <div className="relative h-64 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50">
          {/* Top Edge Gradient Overlay (nhẹ nhàng ở sát mép trên) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-11 bg-gradient-to-b from-white/95 via-white/70 to-transparent" />

          {/* Bottom Edge Gradient Overlay (nhẹ nhàng ở sát mép dưới) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-11 bg-gradient-to-t from-white/95 via-white/70 to-transparent" />

          {/* Wheel Selector scroll list */}
          <div
            ref={listRef}
            className="h-full overflow-y-auto snap-y snap-mandatory hide-scrollbar relative select-none"
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
            style={{
              maskImage: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
            }}
          >
            {/* Pad top to center the first item (256/2 - 48/2 = 104px) */}
            <div className="h-[104px]" />

            {items.map((item, idx) => {
              const distance = Math.abs((scrollTop / ITEM_HEIGHT) - idx);
              const isCenter = distance < 0.5;
              // Giảm cường độ giảm opacity: số kế bên (distance=1) đạt ~0.72 vẫn rất rõ nét
              const opacity = Math.max(0.2, 1 - Math.min(distance * 0.28, 0.8));
              const scale = Math.max(0.88, 1.08 - Math.min(distance * 0.07, 0.2));

              return (
                <button
                  key={item}
                  onClick={() => handleItemClick(item, idx)}
                  style={{
                    opacity,
                    transform: `scale(${scale})`,
                  }}
                  className={`snap-center flex h-12 w-full items-center justify-center text-lg transition-all duration-150 ${
                    isCenter
                      ? "font-extrabold text-[#1d4ed8]"
                      : "font-bold text-slate-700 hover:text-slate-900"
                  }`}
                >
                  {item === "all" ? "Tất cả" : item}
                </button>
              );
            })}

            {/* Pad bottom to center the last item */}
            <div className="h-[104px]" />
          </div>
        </div>
        
        <p className="mt-4 text-center text-xs text-slate-400">
          * Cuộn hoặc click vào số để chọn
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   HERO CAROUSEL
══════════════════════════════════════════ */
function HeroCarousel({ slides }: { slides: CarouselSlide[] }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      if (!document.hidden) {
        setCurrent((c) => (c + 1) % slides.length);
      }
    }, 5500);
  }, [slides.length]);

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

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onDragStart={(e) => e.preventDefault()}
      className="group relative h-screen min-h-[600px] w-full overflow-hidden bg-slate-950 select-none cursor-grab active:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
    >
      {/* Slideshow - top 45vh on mobile, full width/height on desktop/tablet */}
      {slides.map((s, i) => (
        <div
          key={i}
          className={`hero-slide overflow-hidden !bottom-auto !h-[45vh] md:!bottom-0 md:!h-full ${i === current ? "active" : ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.src}
            alt={s.title}
            decoding="async"
            draggable={false}
            {...(i === 0 ? { fetchPriority: "high" } : { loading: "lazy" })}
            className="h-full w-full object-cover select-none pointer-events-none"
          />
        </div>
      ))}

      {/* Top blur edge (overlay tối trên cho navbar và làm mờ viền trên) */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />
      {/* Bottom blur edge cho mobile để fade phần rìa dưới của ảnh vào nền đen */}
      <div className="absolute inset-x-0 top-[20vh] h-[26vh] bg-gradient-to-t from-slate-950 from-5% to-transparent md:hidden pointer-events-none" />

      {/* Gradient tối ở đáy & bên trái cho desktop để text ở góc dưới bên trái đọc cực rõ và không che mặt người ở giữa */}
      <div className="absolute inset-x-0 bottom-0 h-72 md:h-80 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-slate-950/60 via-slate-950/20 to-transparent hidden md:block pointer-events-none" />

      {/* Ánh sáng glow mờ dưới đáy cho mobile bớt đơn điệu */}
      <div className="absolute inset-x-0 bottom-0 h-[50vh] bg-[radial-gradient(ellipse_at_bottom,rgba(30,58,138,0.3),transparent_70%)] md:hidden pointer-events-none" />

      {/* Nội dung (Bottom-Left Align: Căn góc dưới bên trái) */}
      <div className="relative z-10 flex h-full flex-col items-start justify-end pb-20 sm:pb-24 md:pb-24 lg:pb-28 px-6 sm:px-10 md:pl-16 xl:pl-24 md:max-w-[65%] text-left text-white pointer-events-none">
        <div className="mb-3.5 floaty btn-lightship-soft inline-block max-w-full rounded-full bg-white px-4 py-1.5 font-bold tracking-wide text-[#1d4ed8] text-left whitespace-nowrap text-[clamp(0.65rem,3.5vw,0.85rem)] shadow-lg pointer-events-auto">
          {slide.year ? `1986 - 2026 · KỶ NIỆM NĂM ${slide.year}` : "1986 - 2026 · 40 NĂM TRỒNG NGƯỜI"}
        </div>
        <h1 className="line-clamp-2 max-w-4xl font-extrabold leading-tight text-white drop-shadow-lg text-[clamp(1.4rem,5.5vw,3.25rem)] pointer-events-auto">
          {slide.title}
        </h1>
        <p className="mt-3 flex items-center gap-2 text-sm sm:text-base md:text-lg font-medium text-slate-200/90 drop-shadow pointer-events-auto">
          <span className="material-symbols-rounded text-[1.1em] text-blue-400">person</span>
          <span>{slide.author || "Thành viên NCT"}</span>
          {slide.slug && (
            <Link
              href={`/cau-chuyen/${slide.slug}`}
              className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-600/70 hover:bg-blue-600 px-3 py-0.5 text-xs font-bold text-white transition-colors"
            >
              Đọc bài
              <span className="material-symbols-rounded text-xs">arrow_forward</span>
            </Link>
          )}
        </p>
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
            className="absolute left-5 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-95 pointer-events-auto"
            aria-label="Slide trước"
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
            className="absolute right-5 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-95 pointer-events-auto"
            aria-label="Slide kế tiếp"
          >
            <span className="material-symbols-rounded text-2xl">chevron_right</span>
          </button>
        </>
      )}

      {/* Chấm điều hướng + progress trên Desktop */}
      <div className="absolute bottom-8 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2.5 md:flex pointer-events-auto">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1}`}
            onClick={(e) => {
              e.stopPropagation();
              setCurrent(i);
              resetTimer();
            }}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === current
                ? "w-8 bg-white shadow-sm"
                : "w-2.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* Nút Xem tiếp cuộn xuống feed */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          const feedStart = document.getElementById("timeline-feed-start");
          if (feedStart) {
            const y = feedStart.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top: y, behavior: "smooth" });
          } else {
            window.scrollBy({ top: window.innerHeight - 80, behavior: "smooth" });
          }
        }}
        className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 flex md:hidden flex-col items-center gap-1 text-white/80 transition-all hover:text-white hover:scale-105 active:scale-95 pointer-events-auto"
        style={{ animation: "scrollPulse 2.5s ease-in-out infinite" }}
        aria-label="Cuộn xuống xem nội dung"
      >
        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] drop-shadow-md">Xem tiếp</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/20 shadow-md backdrop-blur-md">
          <span className="material-symbols-rounded text-lg font-light">keyboard_arrow_down</span>
        </div>
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   LIGHTBOX WITH PINCH-TO-ZOOM, NAVIGATION & TOUCH SWIPE
══════════════════════════════════════════ */
function getInitial(name?: string): string {
  if (!name || !name.trim()) return "N";
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1];
  return last ? last[0].toUpperCase() : "N";
}

type LightboxProps = {
  items: FeedItem[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

function Lightbox({ items, currentIndex, onIndexChange, onClose }: LightboxProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showInfo, setShowInfo] = useState(true);
  const [direction, setDirection] = useState<number>(0);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);

  const total = items.length;
  const currentItem = items[currentIndex];

  const goToNext = useCallback(() => {
    if (total <= 1) return;
    setDirection(1);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setSwipeOffset(0);
    const next = currentIndex < total - 1 ? currentIndex + 1 : 0;
    onIndexChange(next);
  }, [currentIndex, total, onIndexChange]);

  const goToPrev = useCallback(() => {
    if (total <= 1) return;
    setDirection(-1);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setSwipeOffset(0);
    const prev = currentIndex > 0 ? currentIndex - 1 : total - 1;
    onIndexChange(prev);
  }, [currentIndex, total, onIndexChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  // Touch handlers for pinch-to-zoom & swipe
  const touchStartRef = useRef<{
    isPinching: boolean;
    dist: number;
    scale: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    startTime: number;
    px: number;
    py: number;
  } | null>(null);

  const justSwipedRef = useRef(false);

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touches: React.TouchList) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchStartRef.current = {
        isPinching: true,
        dist: getDistance(e.touches),
        scale: scale,
        startX: getCenter(e.touches).x,
        startY: getCenter(e.touches).y,
        lastX: getCenter(e.touches).x,
        lastY: getCenter(e.touches).y,
        startTime: Date.now(),
        px: position.x,
        py: position.y,
      };
    } else if (e.touches.length === 1) {
      touchStartRef.current = {
        isPinching: false,
        dist: 0,
        scale: scale,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        lastX: e.touches[0].clientX,
        lastY: e.touches[0].clientY,
        startTime: Date.now(),
        px: position.x,
        py: position.y,
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    if (e.touches.length === 2 && touchStartRef.current.isPinching) {
      const newDist = getDistance(e.touches);
      if (touchStartRef.current.dist > 0) {
        const newScale = Math.max(
          1,
          Math.min(touchStartRef.current.scale * (newDist / touchStartRef.current.dist), 5)
        );
        setScale(newScale);
      }
    } else if (e.touches.length === 1) {
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const dx = curX - touchStartRef.current.startX;
      const dy = curY - touchStartRef.current.startY;
      touchStartRef.current.lastX = curX;
      touchStartRef.current.lastY = curY;

      if (scale > 1.05) {
        // Pan
        setPosition({
          x: touchStartRef.current.px + dx,
          y: touchStartRef.current.py + dy,
        });
      } else {
        // Swipe gesture preview
        if (Math.abs(dx) > Math.abs(dy)) {
          setSwipeOffset(dx * 0.7);
        }
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const { startX, lastX, startTime } = touchStartRef.current;
    touchStartRef.current = null;

    if (scale <= 1.05) {
      setSwipeOffset(0);
      const deltaX = lastX - startX;
      const elapsed = Date.now() - startTime;
      const isFlick = Math.abs(deltaX) > 30 && elapsed < 350;
      const isLongSwipe = Math.abs(deltaX) > 60;

      if (isFlick || isLongSwipe) {
        justSwipedRef.current = true;
        setTimeout(() => {
          justSwipedRef.current = false;
        }, 300);

        if (deltaX < 0) {
          goToNext();
        } else {
          goToPrev();
        }
        return;
      }

      setPosition({ x: 0, y: 0 });
    } else if (scale <= 1) {
      setPosition({ x: 0, y: 0 });
      setScale(1);
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (justSwipedRef.current) return;
    setShowInfo((prev) => !prev);
  };

  if (!currentItem) return null;

  const isVideo = currentItem.type === "memory" && currentItem.data.kind === "video";
  const src =
    currentItem.type === "memory"
      ? currentItem.data.images[currentItem.imageIndex] || ""
      : currentItem.data.cover || "";

  const info =
    currentItem.type === "memory"
      ? {
          title: currentItem.data.title,
          caption: currentItem.data.caption,
          author: currentItem.data.author,
          role: currentItem.data.isCommunity ? currentItem.data.role : "",
          year: currentItem.data.year,
          slug: undefined,
        }
      : {
          title: currentItem.data.title,
          caption: currentItem.data.excerpt,
          author: currentItem.data.author,
          role: "Câu chuyện",
          year: new Date(currentItem.data.createdAt).getFullYear(),
          slug: currentItem.data.slug,
        };

  const handleDownload = () => {
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = `nct-moment-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black/96 backdrop-blur-xl select-none"
      onClick={() => onClose()}
    >
      {/* ── TOP CONTROL BAR ── */}
      <div className="absolute top-0 inset-x-0 p-3 sm:p-4 z-[120] flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Slide counter */}
          <span className="rounded-full bg-black/50 backdrop-blur-md border border-white/15 px-3 py-1 text-xs font-bold text-white shadow-sm">
            {currentIndex + 1} / {total}
          </span>

          {/* Desktop Zoom/Download */}
          <div className="hidden md:flex gap-1.5 bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setScale((s) => Math.min(s + 0.5, 5));
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
              title="Phóng to"
            >
              <span className="material-symbols-rounded text-lg">zoom_in</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setScale((s) => Math.max(s - 0.5, 1));
                if (scale - 0.5 <= 1) setPosition({ x: 0, y: 0 });
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
              title="Thu nhỏ"
            >
              <span className="material-symbols-rounded text-lg">zoom_out</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
              title="Tải ảnh về"
            >
              <span className="material-symbols-rounded text-lg">download</span>
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors border border-white/15 pointer-events-auto shadow-md active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Đóng"
        >
          <span className="material-symbols-rounded text-xl">close</span>
        </button>
      </div>

      {/* ── PREV BUTTON ── */}
      {total > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-[115] flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 shadow-xl transition-all active:scale-90 pointer-events-auto"
          aria-label="Khoảnh khắc trước"
          title="Khoảnh khắc trước (Phím mũi tên trái)"
        >
          <span className="material-symbols-rounded text-2xl sm:text-3xl">chevron_left</span>
        </button>
      )}

      {/* ── NEXT BUTTON ── */}
      {total > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-[115] flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 shadow-xl transition-all active:scale-90 pointer-events-auto"
          aria-label="Khoảnh khắc tiếp theo"
          title="Khoảnh khắc tiếp theo (Phím mũi tên phải)"
        >
          <span className="material-symbols-rounded text-2xl sm:text-3xl">chevron_right</span>
        </button>
      )}

      {/* ── MEDIA VIEWPORT (Hỗ trợ vuốt trái/phải & pinch zoom) ── */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden touch-none"
        onClick={handleContainerClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={(e) => {
          if (e.deltaY < 0) {
            setScale((s) => Math.min(s + 0.15, 5));
          } else {
            setScale((s) => Math.max(s - 0.15, 1));
            if (scale - 0.15 <= 1) setPosition({ x: 0, y: 0 });
          }
        }}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={{
              enter: (dir: number) => ({
                x: dir > 0 ? 80 : -80,
                opacity: 0,
              }),
              center: {
                x: 0,
                opacity: 1,
                transition: { duration: 0.22, ease: "easeOut" },
              },
              exit: (dir: number) => ({
                x: dir < 0 ? 80 : -80,
                opacity: 0,
                transition: { duration: 0.18, ease: "easeIn" },
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex h-full w-full items-center justify-center p-2 sm:p-6"
          >
            <motion.div
              animate={{
                scale,
                x: position.x + swipeOffset,
                y: position.y,
              }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="flex max-h-full max-w-full items-center justify-center"
            >
              {isVideo ? (
                <video
                  src={src}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={info.title || ""}
                  className="max-h-[85vh] max-w-full object-contain select-none shadow-2xl pointer-events-auto rounded-lg"
                  draggable={false}
                />
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── BOTTOM INFO SHEET (Author, Title, Caption) ── */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="z-[120] border-t border-white/10 bg-black/80 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Author bar */}
            <div className="flex w-full items-center justify-between px-5 py-3 text-left">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-bold text-blue-300">
                  {getInitial(info.author)}
                </div>
                <span className="truncate text-sm font-semibold text-white">
                  {info.author || "Thành viên NCT"}
                </span>
                {info.role && (
                  <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    {info.role}
                  </span>
                )}
              </div>
              {info.year ? (
                <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-slate-200">
                  {info.year}
                </span>
              ) : null}
            </div>

            {/* Title & Caption */}
            <div className="border-t border-white/10 px-5 pb-6 pt-3 text-sm text-slate-300 space-y-1.5">
              {info.title && (
                <p className="font-extrabold text-white text-base leading-snug">
                  {info.title}
                </p>
              )}
              {info.caption && info.caption !== info.title && (
                <p className="leading-relaxed text-xs sm:text-sm text-slate-300 max-h-28 overflow-y-auto hide-scrollbar">
                  {info.caption}
                </p>
              )}
              {info.slug && (
                <div className="pt-2">
                  <Link
                    href={`/cau-chuyen/${info.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-600 transition-colors shadow-md"
                    onClick={() => onClose()}
                  >
                    Đọc bài đầy đủ
                    <span className="material-symbols-rounded text-sm">arrow_forward</span>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
