"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import PostCard from "@/components/PostCard";
import type { Post } from "@/lib/posts";
import type { Category } from "@/lib/categories";

type PostCarouselProps = {
  posts: Post[];
  categories: Category[];
};

export default function PostCarousel({ posts, categories }: PostCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isPointerDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasMoved = useRef(false);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      map.set(c.id, c.name);
    }
    return map;
  }, [categories]);

  // Cập nhật trạng thái biên cuộn & chỉ số active dot
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    const atStart = scrollLeft <= 24;
    const atEnd = scrollLeft >= maxScroll - 24;

    setCanScrollLeft(!atStart);
    setCanScrollRight(maxScroll > 24 && !atEnd);

    // Xác định thẻ gần tâm (center) của khung nhìn nhất để đồng bộ active dot
    const cards = Array.from(el.children) as HTMLElement[];
    if (cards.length > 0) {
      const containerCenter = scrollLeft + clientWidth / 2;
      let closestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < cards.length; i++) {
        const cardCenter = cards[i].offsetLeft + cards[i].offsetWidth / 2;
        const dist = Math.abs(containerCenter - cardCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }
      setActiveIndex(closestIdx);
    }
  }, []);

  // Cuộn tới đúng thẻ và căn giữa (center)
  const scrollToIdx = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];
    const targetCard = cards[idx];
    if (targetCard) {
      const targetScroll =
        targetCard.offsetLeft - (el.clientWidth - targetCard.offsetWidth) / 2;
      el.scrollTo({ left: Math.max(0, targetScroll), behavior: "smooth" });
    }
  }, []);

  // Cuộn tới/lùi 1 thẻ
  const scrollByCard = useCallback((dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];
    if (cards.length === 0) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (dir === 1 && el.scrollLeft >= maxScroll - 24) {
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (dir === -1 && el.scrollLeft <= 24) {
      el.scrollTo({ left: maxScroll, behavior: "smooth" });
      return;
    }

    const cardStep = cards[0].offsetWidth + 24;
    el.scrollBy({ left: dir * cardStep, behavior: "smooth" });
  }, []);

  // Tự động chuyển bài viết, dừng khi hover
  useEffect(() => {
    if (!posts || posts.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      if (document.hidden) return;
      scrollByCard(1);
    }, 5500);

    return () => clearInterval(timer);
  }, [posts, isHovered, scrollByCard]);

  useEffect(() => {
    if (!posts || posts.length === 0) return;
    const raf = requestAnimationFrame(() => {
      updateScrollState();
    });
    return () => cancelAnimationFrame(raf);
  }, [posts, updateScrollState]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  // Viền mờ tự nhiên bằng CSS Alpha Mask (không màu đục)
  const maskStyle = useMemo(() => {
    if (!posts || posts.length <= 1) return {};

    const left = canScrollLeft ? "transparent 0px, black 28px" : "black 0px";
    const right = canScrollRight ? "black calc(100% - 28px), transparent 100%" : "black 100%";
    const grad = `linear-gradient(to right, ${left}, ${right})`;

    return {
      maskImage: grad,
      WebkitMaskImage: grad,
    };
  }, [canScrollLeft, canScrollRight, posts]);

  // Kéo chuột hoặc vuốt chạm
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    isPointerDown.current = true;
    startX.current = e.clientX;
    scrollLeftStart.current = scrollRef.current ? scrollRef.current.scrollLeft : 0;
    hasMoved.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown.current || !scrollRef.current) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 5) {
      hasMoved.current = true;
      scrollRef.current.scrollLeft = scrollLeftStart.current - dx;
    }
  };

  const handlePointerUp = () => {
    isPointerDown.current = false;
    setTimeout(() => {
      hasMoved.current = false;
    }, 60);
  };

  if (posts.length === 0) return null;

  return (
    <div
      className="relative w-full min-w-0 max-w-full group/carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Nút lùi (Prev) */}
      {posts.length > 1 && (
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-label="Bài viết trước"
          className={`hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/95 hover:bg-[#1d4ed8] text-slate-800 hover:text-white backdrop-blur-md border border-slate-200 shadow-xl transition-all duration-200 active:scale-95 hover:scale-105 ${
            canScrollLeft ? "opacity-90 hover:opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <span className="material-symbols-rounded text-xl">chevron_left</span>
        </button>
      )}

      {/* Nút tiến (Next) */}
      {posts.length > 1 && (
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          aria-label="Bài viết tiếp theo"
          className={`hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/95 hover:bg-[#1d4ed8] text-slate-800 hover:text-white backdrop-blur-md border border-slate-200 shadow-xl transition-all duration-200 active:scale-95 hover:scale-105 ${
            canScrollRight ? "opacity-90 hover:opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <span className="material-symbols-rounded text-xl">chevron_right</span>
        </button>
      )}

      {/* Băng chuyền cuộn ngang - Snap center trên mobile */}
      <div
        ref={scrollRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex snap-x snap-mandatory overflow-x-auto gap-6 pb-4 pt-1 -mx-6 px-[9vw] sm:mx-0 sm:px-0 hide-scrollbar overscroll-x-contain touch-pan-x cursor-grab active:cursor-grabbing select-none"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollBehavior: "smooth",
          ...maskStyle,
        }}
      >
        {posts.map((post) => (
          <div
            key={post.id}
            className="w-[82vw] max-w-[340px] sm:w-[320px] md:w-[340px] shrink-0 snap-center sm:snap-start flex flex-col"
            onClickCapture={(e) => {
              if (hasMoved.current) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <PostCard
              post={post}
              categoryName={post.categoryId ? categoryMap.get(post.categoryId) : undefined}
            />
          </div>
        ))}
      </div>

      {/* Chỉ báo Dots phân trang cho băng chuyền */}
      {posts.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-4">
          {posts.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToIdx(idx)}
              aria-label={`Đi tới bài viết số ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === idx
                  ? "w-6 bg-[#1d4ed8] shadow-sm"
                  : "w-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
