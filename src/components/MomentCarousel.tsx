"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { type WallMemory } from "./TimelineWall";
import MomentCard from "./MomentCard";

export default function MomentCarousel({ moments }: { moments: WallMemory[] }) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isPointerDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasMoved = useRef(false);

  // Cập nhật trạng thái biên cuộn
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    const atStart = scrollLeft <= 16;
    const atEnd = scrollLeft >= maxScroll - 16;

    setCanScrollLeft(!atStart);
    setCanScrollRight(maxScroll > 16 && !atEnd);
  }, []);

  // Cuộn tới/lùi 1 thẻ
  const scrollByCard = useCallback((dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];
    if (cards.length === 0) return;

    const cardStep = cards[0].offsetWidth + 16;
    el.scrollBy({ left: dir * cardStep, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!moments || moments.length === 0) return;
    const raf = requestAnimationFrame(() => {
      updateScrollState();
    });
    return () => cancelAnimationFrame(raf);
  }, [moments, updateScrollState]);

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

  // Viền mờ tự nhiên bằng CSS Alpha Mask (tương tự trang chủ)
  const maskStyle = useMemo(() => {
    if (!moments || moments.length <= 1) return {};

    const left = canScrollLeft ? "transparent 0px, black 36px" : "black 0px";
    const right = canScrollRight ? "black calc(100% - 36px), transparent 100%" : "black 100%";
    const grad = `linear-gradient(to right, ${left}, ${right})`;

    return {
      maskImage: grad,
      WebkitMaskImage: grad,
    };
  }, [canScrollLeft, canScrollRight, moments]);

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

  if (!moments || moments.length === 0) return null;

  return (
    <div className="mb-12 relative group/moment">
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3 px-0">
        <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span>📸</span>
          <span className="whitespace-nowrap">Khoảnh khắc nổi bật</span>
        </h2>
        <Link
          href="/khoanh-khac"
          className="group/link text-xs sm:text-sm font-bold text-[#1d4ed8] hover:underline whitespace-nowrap shrink-0 inline-flex items-center gap-1"
        >
          <span>Xem tất cả</span>
          <span aria-hidden className="inline-block transition-transform duration-200 group-hover/link:translate-x-0.5">&rarr;</span>
        </Link>
      </div>

      <div className="relative">
        {/* Nút lùi (Prev) */}
        {moments.length > 2 && (
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Khoảnh khắc trước"
            className={`hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/95 hover:bg-[#1d4ed8] text-slate-800 hover:text-white backdrop-blur-md border border-slate-200 shadow-xl transition-all duration-200 active:scale-95 hover:scale-105 ${
              canScrollLeft ? "opacity-90 hover:opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <span className="material-symbols-rounded text-xl">chevron_left</span>
          </button>
        )}

        {/* Nút tiến (Next) */}
        {moments.length > 2 && (
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Khoảnh khắc tiếp theo"
            className={`hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/95 hover:bg-[#1d4ed8] text-slate-800 hover:text-white backdrop-blur-md border border-slate-200 shadow-xl transition-all duration-200 active:scale-95 hover:scale-105 ${
              canScrollRight ? "opacity-90 hover:opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <span className="material-symbols-rounded text-xl">chevron_right</span>
          </button>
        )}

        {/* Băng chuyền cuộn ngang có Alpha Mask viền mờ */}
        <div
          ref={scrollRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="hide-scrollbar -mx-4 sm:-mx-6 flex snap-x snap-mandatory gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-6 pb-4 md:mx-0 md:px-0 cursor-grab active:cursor-grabbing select-none"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollBehavior: "smooth",
            ...maskStyle,
          }}
        >
          {moments.map((m) => {
            const cover = m.kind === "video" ? null : m.images[0];
            return (
              <div
                key={m.id}
                className="w-[260px] sm:w-[300px] md:w-[320px] shrink-0 snap-center"
                onClickCapture={(e) => {
                  if (hasMoved.current) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                <MomentCard
                  coverUrl={cover || m.images[0]}
                  title={m.title}
                  author={m.author}
                  role={m.isCommunity ? m.role : ""}
                  year={m.year}
                  kind={cover ? "image" : "video"}
                  aspect="fixed"
                  href={`/khoanh-khac?moment=${m.id}#moment-${m.id}`}
                />
              </div>
            );
          })}

          <div className="flex aspect-[4/5] w-[160px] shrink-0 snap-center items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50">
            <Link
              href="/khoanh-khac"
              className="text-center text-sm font-extrabold text-slate-500 transition-colors hover:text-[#1d4ed8]"
            >
              Khám phá<br />thêm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
