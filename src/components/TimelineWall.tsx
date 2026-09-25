"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/lib/posts";

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
  | { type: "memory"; data: WallMemory }
  | { type: "post"; data: Post };

type LightboxState = {
  images: string[];
  index: number;
  info: { title: string; caption: string; author: string; role: string; slug?: string } | null;
  showInfo: boolean;
};

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

export default function TimelineWall({ memories, posts = [] }: Props) {
  const yearBarRef = useRef<HTMLDivElement>(null);
  const [seed] = useState(() => Math.random());

  /* ─── Build year → items map ─── */
  const itemsByYear = useMemo(() => {
    const map = new Map<number, FeedItem[]>();
    YEARS.forEach((y) => map.set(y, []));

    memories.forEach((m) => {
      if (map.has(m.year)) map.get(m.year)!.push({ type: "memory", data: m });
    });
    posts.forEach((p) => {
      if (!p.cover) return;
      const y = new Date(p.createdAt).getFullYear();
      if (map.has(y)) map.get(y)!.push({ type: "post", data: p });
    });

    map.forEach((items, y) => {
      map.set(y, shuffleWithSeed(items, seed));
    });
    return map;
  }, [memories, posts, seed]);

  const yearsWithContent = useMemo(
    () => YEARS.filter((y) => (itemsByYear.get(y)?.length ?? 0) > 0),
    [itemsByYear],
  );

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

  /* ─── Active year ─── */
  const [activeYear, setActiveYear] = useState<number>(2026);
  useEffect(() => {
    if (yearsWithContent.length > 0) {
      setActiveYear(yearsWithContent[Math.floor(Math.random() * yearsWithContent.length)]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Auto-scroll year bar to keep active year centred ─── */
  useEffect(() => {
    const bar = yearBarRef.current;
    if (!bar) return;
    const btn = bar.querySelector<HTMLElement>(`[data-year="${activeYear}"]`);
    if (!btn) return;
    const barRect = bar.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    bar.scrollTo({
      left: bar.scrollLeft + (btnRect.left - barRect.left) - barRect.width / 2 + btnRect.width / 2,
      behavior: "smooth",
    });
  }, [activeYear]);

  /* ─── Year Bar Wheel Scroll ─── */
  useEffect(() => {
    const bar = yearBarRef.current;
    if (!bar) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        bar.scrollLeft += e.deltaY;
      }
    };
    bar.addEventListener("wheel", handleWheel, { passive: false });
    return () => bar.removeEventListener("wheel", handleWheel);
  }, []);


  /* ─── Lightbox ─── */
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft")
        setLightbox((lb) => lb ? { ...lb, index: lb.index > 0 ? lb.index - 1 : lb.images.length - 1 } : null);
      if (e.key === "ArrowRight")
        setLightbox((lb) => lb ? { ...lb, index: lb.index < lb.images.length - 1 ? lb.index + 1 : 0 } : null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [lightbox]);

  const openMemory = (m: WallMemory) => {
    if (m.kind === "video") return;
    setLightbox({ images: m.images, index: 0, info: { title: m.title, caption: m.caption, author: m.author, role: m.role }, showInfo: true });
  };
  const openPost = (p: Post) => {
    if (!p.cover) return;
    setLightbox({ images: [p.cover], index: 0, info: { title: p.title, caption: p.excerpt ?? "", author: p.author, role: "Câu chuyện", slug: p.slug }, showInfo: true });
  };

  const currentItems = itemsByYear.get(activeYear) ?? [];

  /* ─── Remove bentoSpan ─── */

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* ═══════════ HERO CAROUSEL ═══════════ */}
      <HeroCarousel slides={carouselSlides} />

      {/* ═══════════ YEAR BAR ═══════════
          top-[84px] = below the floating navbar */}
      <div className="sticky top-[84px] z-40 mx-auto mb-8 w-max max-w-[calc(100vw-2rem)] rounded-full border border-white/60 bg-white/80 p-1.5 shadow-lg shadow-slate-950/10 backdrop-blur-xl transition-all">
        <div ref={yearBarRef} className="flex items-center gap-1 overflow-x-auto px-1 hide-scrollbar">
          {YEARS.map((y) => {
            const has = (itemsByYear.get(y)?.length ?? 0) > 0;
            const active = activeYear === y;
            return (
              <button
                key={y}
                data-year={y}
                onClick={() => has && setActiveYear(y)}
                disabled={!has}
                className={`shrink-0 rounded-full px-3.5 py-1 text-sm font-bold transition-all duration-200 ${
                  active
                    ? "bg-[#1d4ed8] text-white shadow-md scale-105"
                    : has
                    ? "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    : "cursor-default select-none text-slate-300"
                }`}
              >
                {y}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════ FEED ═══════════ */}
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:px-8">
        <div className="mb-5 flex items-baseline gap-3">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">{activeYear}</h2>
          {currentItems.length > 0 && (
            <span className="text-sm font-medium text-slate-400">
              {currentItems.length} khoảnh khắc
            </span>
          )}
        </div>

        {currentItems.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
            <span className="material-symbols-rounded mb-4 text-6xl text-slate-200">photo_album</span>
            <p className="mb-1 text-lg font-bold text-slate-500">Năm {activeYear} còn trống</p>
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
            {/* Mobile — single col */}
            <div className="flex flex-col gap-4 md:hidden">
              {currentItems.map((item) =>
                item.type === "memory" ? (
                  <MemoryCard key={item.data.id} memory={item.data} onClick={() => openMemory(item.data)} />
                ) : (
                  <PostFeedCard key={item.data.id} post={item.data} onClick={() => openPost(item.data)} />
                ),
              )}
            </div>

            {/* Desktop — Masonry CSS Columns */}
            <div className="hidden md:block columns-2 lg:columns-3 gap-5 space-y-5">
              {currentItems.map((item) =>
                item.type === "memory" ? (
                  <MemoryCard key={item.data.id} memory={item.data} onClick={() => openMemory(item.data)} />
                ) : (
                  <PostFeedCard key={item.data.id} post={item.data} onClick={() => openPost(item.data)} />
                ),
              )}
            </div>
          </>
        )}
      </div>

      {/* ═══════════ LIGHTBOX ═══════════ */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/96 backdrop-blur-xl"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-4 top-4 z-[110] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
          >
            <span className="material-symbols-rounded text-xl">close</span>
          </button>

          {/* Mobile view: vertical scroll of all images */}
          <div
            className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden md:hidden hide-scrollbar"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((lb) => lb ? { ...lb, showInfo: !lb.showInfo } : null);
            }}
          >
            {lightbox.images.map((src, i) => (
              <div key={i} className="w-full flex-shrink-0 bg-black mb-1 last:mb-0 relative">
                <img src={src} alt="" loading="lazy" decoding="async" className="w-full h-auto object-contain" draggable={false} />
              </div>
            ))}
          </div>

          {/* Desktop view: single image with navigation */}
          <div
            className="relative hidden md:flex flex-1 items-center justify-center overflow-hidden cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((lb) => lb ? { ...lb, showInfo: !lb.showInfo } : null);
            }}
          >
            {lightbox.images.length > 1 && (
              <button
                className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((lb) => lb ? { ...lb, index: lb.index > 0 ? lb.index - 1 : lb.images.length - 1 } : null);
                }}
              >
                <span className="material-symbols-rounded text-2xl">chevron_left</span>
              </button>
            )}
            
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.images[lightbox.index]} alt="" className="max-h-full max-w-full object-contain" draggable={false} />
            
            {lightbox.images.length > 1 && (
              <button
                className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((lb) => lb ? { ...lb, index: lb.index < lb.images.length - 1 ? lb.index + 1 : 0 } : null);
                }}
              >
                <span className="material-symbols-rounded text-2xl">chevron_right</span>
              </button>
            )}
            
            {lightbox.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-bold tracking-widest text-white/70">
                {lightbox.index + 1} / {lightbox.images.length}
              </div>
            )}
          </div>

          {lightbox.info && (
            <div className="z-[110] border-t border-white/10 bg-black/70 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
              <div className="flex w-full items-center justify-between px-5 py-3.5 text-left">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="material-symbols-rounded shrink-0 text-slate-400">person</span>
                  <span className="truncate text-sm font-semibold text-white">{lightbox.info.author}</span>
                  {lightbox.info.role && (
                    <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      {lightbox.info.role}
                    </span>
                  )}
                </div>
              </div>
              {lightbox.showInfo && (
                <div className="border-t border-white/10 px-5 pb-6 pt-3 text-sm text-slate-300 space-y-1">
                  {lightbox.info.title && <p className="font-extrabold text-white">{lightbox.info.title}</p>}
                  {lightbox.info.caption && lightbox.info.caption !== lightbox.info.title && (
                    <p className="leading-relaxed">{lightbox.info.caption}</p>
                  )}
                  {lightbox.info.slug && (
                    <Link
                      href={`/cau-chuyen/${lightbox.info.slug}`}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-600 transition-colors"
                      onClick={() => setLightbox(null)}
                    >
                      Đọc bài đầy đủ
                      <span className="material-symbols-rounded text-[1em]">arrow_forward</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
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
    <div
      className="relative h-screen overflow-hidden bg-slate-900"
    >
      {/* Stacked images with cross-fade */}
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.src} alt={s.title} decoding="async" {...(i === 0 ? { fetchPriority: "high" } : { loading: "lazy" })} className="h-full w-full object-cover" />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        </div>
      ))}

      {/* Text overlay */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-12 md:px-10 md:pb-14">
        <span className="inline-block rounded-full bg-white/10 px-3 py-0.5 text-xs font-bold tracking-widest text-white/70 backdrop-blur-sm">
          {slide.year}
        </span>
        <h2 className="mt-2 line-clamp-2 text-xl font-extrabold leading-tight text-white drop-shadow md:text-3xl">
          {slide.title}
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
          <span className="material-symbols-rounded text-[0.9em]">person</span>
          {slide.author}
        </p>
      </div>

      {/* Arrows (desktop only) */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/30 p-2 text-white hover:bg-black/50 md:flex"
      >
        <span className="material-symbols-rounded text-2xl">chevron_left</span>
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/30 p-2 text-white hover:bg-black/50 md:flex"
      >
        <span className="material-symbols-rounded text-2xl">chevron_right</span>
      </button>

      {/* Progress dots */}
      <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-5 bg-white" : "w-1.5 bg-white/35 hover:bg-white/60"
            }`}
          />
        ))}
      </div>

      {/* Scroll-down pulse indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none"
           style={{ animation: "scrollPulse 1.8s ease-in-out infinite" }}>
        <svg width="20" height="28" viewBox="0 0 20 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="3,2 10,9 17,2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
          <polyline points="3,10 10,17 17,10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"/>
          <polyline points="3,18 10,25 17,18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.25"/>
        </svg>
      </div>
    </div>


  );
}

/* ══════════════════════════════════════════
   MEMORY CARD
══════════════════════════════════════════ */
function MemoryCard({ memory: m, onClick }: { memory: WallMemory; onClick: () => void }) {
  const isVideo = m.kind === "video";
  const thumbs = isVideo ? [] : m.images;

  return (
    <article
      className={`group break-inside-avoid mb-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 transition-all ${
        isVideo ? "" : "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
      }`}
      onClick={isVideo ? undefined : onClick}
    >
      {isVideo ? (
        <video src={m.images[0]} controls preload="none" className="w-full bg-slate-900" onClick={(e) => e.stopPropagation()} />
      ) : thumbs.length === 1 ? (
        <img src={thumbs[0]} alt={m.title} loading="lazy" decoding="async" className="w-full object-cover max-h-[500px]" />
      ) : (
        <div className={`grid gap-px ${thumbs.length >= 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {thumbs.slice(0, 4).map((src, idx) => (
            <div key={idx} className={`relative overflow-hidden bg-slate-100 ${thumbs.length === 3 && idx === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"}`}>
              <Image src={src} alt={m.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
              {idx === 3 && thumbs.length > 4 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-extrabold text-white">
                  +{thumbs.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="px-4 py-3.5 md:px-5">
        <p className="mb-0.5 text-sm font-extrabold leading-snug text-slate-900 line-clamp-2">{m.title}</p>
        {m.caption && m.caption !== m.title && (
          <p className="mb-2 text-xs leading-relaxed text-slate-500 line-clamp-2">{m.caption}</p>
        )}
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <span className="material-symbols-rounded text-[0.85em]">person</span>
          <span className="truncate">{m.author}</span>
          {m.isCommunity && m.role && (
            <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {m.role}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/* ══════════════════════════════════════════
   POST FEED CARD
══════════════════════════════════════════ */
function PostFeedCard({ post: p, onClick }: { post: Post; onClick: () => void }) {
  return (
    <article
      className="group break-inside-avoid mb-5 cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#1d4ed8]/15 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      onClick={onClick}
    >
      {p.cover && (
        <img src={p.cover} alt={p.title} loading="lazy" decoding="async" className="w-full object-cover max-h-[400px]" />
      )}
      <div className="px-4 py-3.5 md:px-5">
        <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[#1d4ed8]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1d4ed8]">
          <span className="material-symbols-rounded text-[0.8em]">article</span>
          Câu chuyện
        </span>
        <p className="mb-3 text-sm font-extrabold leading-snug text-slate-900 line-clamp-2">{p.title}</p>
        <div className="flex items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1 text-[11px] font-semibold text-slate-400">
            <span className="material-symbols-rounded text-[0.85em]">person</span>
            <span className="truncate">{p.author}</span>
          </p>
          <Link
            href={`/cau-chuyen/${p.slug}`}
            className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-[#1d4ed8] px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-blue-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Xem bài
            <span className="material-symbols-rounded text-[0.85em]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
