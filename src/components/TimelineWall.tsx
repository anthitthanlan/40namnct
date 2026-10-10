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
  const [lightboxItem, setLightboxItem] = useState<{ src: string; item: FeedItem } | null>(null);

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
      <div id="timeline-feed-start" className="sticky top-[84px] z-40 mx-auto mb-8 w-max rounded-full border border-white/60 bg-white/90 px-4 py-2 shadow-lg shadow-slate-950/10 backdrop-blur-xl transition-all">
        <button
          onClick={() => setShowFilterModal(true)}
          className="flex items-center gap-2 text-sm font-extrabold text-slate-700 hover:text-[#1d4ed8]"
        >
          <span className="material-symbols-rounded text-lg">filter_list</span>
          {activeYear === "all" ? "Tất cả các năm" : `Năm ${activeYear}`}
        </button>
      </div>

      {/* ═══════════ FEED ═══════════ */}
      <div className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <div className="mb-5 flex items-baseline gap-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {activeYear === "all" ? "Tất cả khoảnh khắc" : activeYear}
          </h2>
          {currentItems.length > 0 && (
            <span className="text-sm font-medium text-slate-400">
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
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
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
                      className={`break-inside-avoid scroll-mt-32 rounded-3xl transition-all duration-500 ${
                        isTarget
                          ? "ring-4 ring-[#1d4ed8] ring-offset-4 ring-offset-[#f8fafc] scale-[1.03] shadow-2xl relative z-10"
                          : ""
                      }`}
                    >
                      <MomentCard
                        coverUrl={src}
                        title={m.title}
                        author={m.author}
                        role={m.isCommunity ? m.role : ""}
                        year={m.year}
                        kind={isVideo ? "video" : "image"}
                        onClick={() => {
                          if (!isVideo) setLightboxItem({ src, item });
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
                      className={`break-inside-avoid scroll-mt-32 rounded-3xl transition-all duration-500 ${
                        isTarget
                          ? "ring-4 ring-[#1d4ed8] ring-offset-4 ring-offset-[#f8fafc] scale-[1.03] shadow-2xl relative z-10"
                          : ""
                      }`}
                    >
                      <MomentCard
                        coverUrl={p.cover!}
                        title={p.title}
                        author={p.author}
                        role="Câu chuyện"
                        year={new Date(p.createdAt).getFullYear()}
                        kind="image"
                        onClick={() => {
                          setLightboxItem({ src: p.cover!, item });
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
        {lightboxItem && (
          <Lightbox
            item={lightboxItem.item}
            src={lightboxItem.src}
            onClose={() => setLightboxItem(null)}
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
  
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 4000);
    return () => clearInterval(id);
  }, [slides.length, current]);

  if (slides.length === 0) return null;

  const slide = slides[current];
  const prev = () => setCurrent((i) => (i > 0 ? i - 1 : slides.length - 1));
  const next = () => setCurrent((i) => (i < slides.length - 1 ? i + 1 : 0));

  return (
    <div className="relative h-screen overflow-hidden bg-slate-900">
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.src} alt={s.title} decoding="async" {...(i === 0 ? { fetchPriority: "high" } : { loading: "lazy" })} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent hidden lg:block" />
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-0 px-6 pb-28 md:px-16 md:pb-36 lg:px-24">
        <span className="btn-lightship-soft inline-flex rounded-full bg-white px-4 py-1.5 text-xs font-bold tracking-widest text-[#1d4ed8]">
          {slide.year}
        </span>
        <h2 className="mt-5 line-clamp-2 max-w-4xl text-4xl font-extrabold leading-tight text-white drop-shadow-lg md:text-5xl lg:text-6xl">
          {slide.title}
        </h2>
        <p className="mt-4 flex items-center gap-2 text-base font-medium text-slate-100/90 drop-shadow md:text-xl">
          <span className="material-symbols-rounded text-[1.2em]">person</span>
          {slide.author}
        </p>
      </div>

      <button
        onClick={prev}
        className="absolute left-5 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/30 p-3 text-white backdrop-blur-sm hover:bg-black/50 md:flex"
      >
        <span className="material-symbols-rounded text-3xl">chevron_left</span>
      </button>
      <button
        onClick={next}
        className="absolute right-5 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/30 p-3 text-white backdrop-blur-sm hover:bg-black/50 md:flex"
      >
        <span className="material-symbols-rounded text-3xl">chevron_right</span>
      </button>

      <div className="absolute bottom-14 left-6 flex items-center gap-2 md:bottom-16 md:left-16 lg:left-24">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "h-2.5 w-8 bg-white shadow-sm"
                : "h-2.5 w-2.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
        <span className="ml-2 text-xs font-bold tracking-widest text-white/60">
          {current + 1} / {slides.length}
        </span>
      </div>

      <button
        onClick={() => {
          const feedStart = document.getElementById("timeline-feed-start");
          if (feedStart) {
            const y = feedStart.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top: y, behavior: "smooth" });
          } else {
            window.scrollBy({ top: window.innerHeight - 80, behavior: "smooth" });
          }
        }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/90 transition-all hover:text-white hover:scale-110 active:scale-95"
        style={{ animation: "scrollPulse 2.5s ease-in-out infinite" }}
        aria-label="Cuộn xuống xem nội dung"
      >
        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] drop-shadow-md">Xem tiếp</span>
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.3)] backdrop-blur-md">
          <span className="material-symbols-rounded text-2xl font-light">
            keyboard_arrow_down
          </span>
        </div>
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   LIGHTBOX WITH PINCH-TO-ZOOM
══════════════════════════════════════════ */
function Lightbox({ item, src, onClose }: { item: FeedItem, src: string, onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showInfo, setShowInfo] = useState(true);

  // Touch handlers for pinch-to-zoom
  const touchStartRef = useRef<{ dist: number, scale: number, x: number, y: number, px: number, py: number } | null>(null);

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touches: React.TouchList) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchStartRef.current = {
        dist: getDistance(e.touches),
        scale: scale,
        x: getCenter(e.touches).x,
        y: getCenter(e.touches).y,
        px: position.x,
        py: position.y
      };
    } else if (e.touches.length === 1) {
      touchStartRef.current = {
        dist: 0,
        scale: scale,
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        px: position.x,
        py: position.y
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    if (e.touches.length === 2 && touchStartRef.current.dist > 0) {
      const newDist = getDistance(e.touches);
      const newScale = Math.max(1, Math.min(touchStartRef.current.scale * (newDist / touchStartRef.current.dist), 5));
      setScale(newScale);
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      setPosition({
        x: touchStartRef.current.px + dx,
        y: touchStartRef.current.py + dy
      });
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    touchStartRef.current = null;
    if (e.touches.length === 0 && scale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = `nct-moment-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const info = item.type === "memory" 
    ? { title: item.data.title, caption: item.data.caption, author: item.data.author, role: item.data.role }
    : { title: item.data.title, caption: item.data.excerpt, author: item.data.author, role: "Câu chuyện", slug: item.data.slug };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black/96 backdrop-blur-xl"
      onClick={() => onClose()}
    >
      <div className="absolute top-0 inset-x-0 p-4 z-[110] flex justify-between items-start pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          {/* Desktop Zoom/Download Buttons */}
          <div className="hidden md:flex gap-2 bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10">
            <button
              onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(s + 0.5, 5)); }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
              title="Zoom In"
            >
              <span className="material-symbols-rounded text-xl">zoom_in</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(s - 0.5, 1)); if(scale-0.5 <= 1) setPosition({x:0, y:0}); }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
              title="Zoom Out"
            >
              <span className="material-symbols-rounded text-xl">zoom_out</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
              title="Download"
            >
              <span className="material-symbols-rounded text-xl">download</span>
            </button>
          </div>
        </div>
        
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors pointer-events-auto"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          <span className="material-symbols-rounded text-xl">close</span>
        </button>
      </div>

      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden touch-none"
        onClick={(e) => {
          e.stopPropagation();
          setShowInfo(!showInfo);
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={(e) => {
          if (e.deltaY < 0) {
            setScale(s => Math.min(s + 0.1, 5));
          } else {
            setScale(s => Math.max(s - 0.1, 1));
            if (scale - 0.1 <= 1) setPosition({ x: 0, y: 0 });
          }
        }}
      >
        <motion.img
          src={src}
          alt=""
          className="max-h-full max-w-full object-contain pointer-events-auto"
          draggable={false}
          animate={{ scale, x: position.x, y: position.y }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        />
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="z-[110] border-t border-white/10 bg-black/70 backdrop-blur-md" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full items-center justify-between px-5 py-3.5 text-left">
              <div className="flex min-w-0 items-center gap-3">
                <span className="material-symbols-rounded shrink-0 text-slate-400">person</span>
                <span className="truncate text-sm font-semibold text-white">{info.author}</span>
                {info.role && (
                  <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    {info.role}
                  </span>
                )}
              </div>
            </div>
            <div className="border-t border-white/10 px-5 pb-6 pt-3 text-sm text-slate-300 space-y-1">
              {info.title && <p className="font-extrabold text-white text-base">{info.title}</p>}
              {info.caption && info.caption !== info.title && (
                <p className="leading-relaxed max-h-32 overflow-y-auto hide-scrollbar">{info.caption}</p>
              )}
              {info.slug && (
                <Link
                  href={`/cau-chuyen/${info.slug}`}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-600 transition-colors"
                  onClick={() => onClose()}
                >
                  Đọc bài đầy đủ
                  <span className="material-symbols-rounded text-[1em]">arrow_forward</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
