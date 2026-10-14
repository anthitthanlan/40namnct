"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import SkeletonBlock from "@/components/SkeletonBlock";
import MomentCard from "./MomentCard";

type MediaRow = {
  id: string;
  kind: "image" | "video";
  year: number;
  month: number;
  author: string;
  authorRole: string;
  caption: string;
  url: string;
  createdAt: string;
  mediaType?: string;
  status?: string;
};

export default function MemoryGallery() {
  const [items, setItems] = useState<MediaRow[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isPointerDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasMoved = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/media?status=approved", { cache: "no-store" });
        const data = await res.json();
        if (data.ok && Array.isArray(data.media)) {
          const allMedia = data.media as MediaRow[];

          // 1. Chỉ lấy các feed ĐÃ ĐƯỢC DUYỆT (status === "approved")
          // 2. Không lấy các ảnh đính kèm bài viết (mediaType !== "post")
          // 3. Phải có nội dung feed hợp lệ
          const approvedFeeds = allMedia.filter(
            (m) =>
              m.status === "approved" &&
              m.mediaType !== "post" &&
              (Boolean(m.caption) || Boolean(m.author) || m.mediaType === "feed")
          );

          // Xáo trộn ngẫu nhiên (Fisher-Yates) và giới hạn đúng 10 feed
          const shuffled = [...approvedFeeds];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          const random10 = shuffled.slice(0, 10);
          setItems(random10);
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      }
    })();
  }, []);

  const scrollByCard = useCallback((dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 16
      : 286;
    const maxScroll = el.scrollWidth - el.clientWidth;

    if (dir === 1 && el.scrollLeft >= maxScroll - 16) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else if (dir === -1 && el.scrollLeft <= 16) {
      el.scrollTo({ left: maxScroll, behavior: "smooth" });
    } else {
      el.scrollBy({ left: dir * cardWidth, behavior: "smooth" });
    }
  }, []);

  // Tự động chuyển slide (Băng chuyền tự động lăn mượt mà, dừng khi hover)
  useEffect(() => {
    if (!items || items.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      if (document.hidden) return;
      scrollByCard(1);
    }, 4500);

    return () => clearInterval(timer);
  }, [items, isHovered, scrollByCard]);

  // Cập nhật chỉ số active indicator và trạng thái biên cuộn
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

  // Đo đạc trạng thái biên khi items tải xong hoặc resize
  useEffect(() => {
    if (!items || items.length === 0) return;
    const raf = requestAnimationFrame(() => {
      updateScrollState();
    });
    return () => cancelAnimationFrame(raf);
  }, [items, updateScrollState]);

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

  // Viền mờ tự nhiên bằng CSS Alpha Mask (KHÔNG dùng màu đục, không làm ố ảnh)
  const maskStyle = useMemo(() => {
    if (!items || items.length <= 1) return {};

    const left = canScrollLeft ? "transparent 0px, black 28px" : "black 0px";
    const right = canScrollRight ? "black calc(100% - 28px), transparent 100%" : "black 100%";
    const grad = `linear-gradient(to right, ${left}, ${right})`;

    return {
      maskImage: grad,
      WebkitMaskImage: grad,
    };
  }, [canScrollLeft, canScrollRight, items]);

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

  if (items === null) {
    return (
      <div className="w-full min-w-0 max-w-full">
        <div className="flex gap-4 overflow-hidden -mx-4 px-[11vw] sm:mx-0 sm:px-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-[78vw] max-w-[300px] sm:w-[260px] md:w-[270px] shrink-0 aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden bg-white/10"
            >
              <SkeletonBlock className="h-full w-full rounded-none opacity-60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-white/10 p-8 text-center text-sm font-semibold text-slate-200">
        🖼 Tường ký ức đang chờ những mảnh ghép đầu tiên - hãy là người đầu
        tiên gửi kỷ niệm của bạn!
      </div>
    );
  }

  return (
    <div
      className="relative w-full min-w-0 max-w-full group/carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Nút lùi (Prev) - Ẩn khi ở đầu danh sách để ảnh đầu luôn trọn vẹn */}
      {items.length > 1 && (
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-label="Kỷ niệm trước"
          className={`hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 hover:bg-[#1d4ed8] text-white backdrop-blur-md border border-white/20 shadow-xl transition-all duration-200 active:scale-95 hover:scale-105 ${
            canScrollLeft ? "opacity-85 hover:opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <span className="material-symbols-rounded text-xl">chevron_left</span>
        </button>
      )}

      {/* Nút tiến (Next) - Ẩn khi ở cuối danh sách */}
      {items.length > 1 && (
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          aria-label="Kỷ niệm tiếp theo"
          className={`hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 hover:bg-[#1d4ed8] text-white backdrop-blur-md border border-white/20 shadow-xl transition-all duration-200 active:scale-95 hover:scale-105 ${
            canScrollRight ? "opacity-85 hover:opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <span className="material-symbols-rounded text-xl">chevron_right</span>
        </button>
      )}

      {/* Băng chuyền cuộn ngang mượt mà - Snap center trên mobile */}
      <div
        ref={scrollRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex snap-x snap-mandatory overflow-x-auto gap-4 pb-2 -mx-4 px-[11vw] sm:mx-0 sm:px-0 hide-scrollbar overscroll-x-contain touch-pan-x cursor-grab active:cursor-grabbing select-none"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollBehavior: "smooth",
          ...maskStyle,
        }}
      >
        {items.map((m) => (
          <div
            key={m.id}
            className="w-[78vw] max-w-[300px] sm:w-[260px] md:w-[270px] shrink-0 snap-center sm:snap-start"
            onClickCapture={(e) => {
              if (hasMoved.current) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <MomentCard
              size="sm"
              coverUrl={m.url}
              title={m.caption || "Kỷ niệm dưới mái trường Trứ"}
              author={m.author}
              role={m.authorRole}
              year={m.year}
              kind={m.kind}
              aspect="fixed"
              href={`/khoanh-khac?moment=${m.id}#moment-${m.id}`}
            />
          </div>
        ))}
      </div>

      {/* Chỉ báo Dots phân trang cho băng chuyền */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-4">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToIdx(idx)}
              aria-label={`Đi tới kỷ niệm số ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === idx
                  ? "w-6 bg-white shadow-sm"
                  : "w-1.5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
