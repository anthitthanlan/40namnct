"use client";

import { useEffect, type RefObject } from "react";

// Biến đếm số lượng modal đang mở đồng thời (để tránh race condition khi nhiều modal xếp chồng)
let lockCount = 0;
let originalHtmlOverflow = "";
let originalBodyOverflow = "";
let originalBodyPaddingRight = "";

/**
 * Hook khóa cuộn trang (body & html scroll lock) tuyệt đối:
 * 1. Khóa cả documentElement (html) lẫn body (loại bỏ triệt để cuộn nền trên Desktop Chrome/Edge/Firefox).
 * 2. Bù trừ độ rộng thanh cuộn desktop để tránh giật giao diện (layout shift).
 * 3. Chặn triệt để sự kiện wheel & touchmove bên ngoài vùng modal content (ngăn cuộn nền trên iOS Safari & trackpad).
 * 4. Quản lý lockCount an toàn khi nhiều modal mở cùng lúc.
 */
export function useBodyScrollLock(
  isLocked: boolean,
  contentRef?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!isLocked || typeof document === "undefined") return;

    lockCount++;

    if (lockCount === 1) {
      originalHtmlOverflow = document.documentElement.style.overflow;
      originalBodyOverflow = document.body.style.overflow;
      originalBodyPaddingRight = document.body.style.paddingRight;

      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      // Khóa cả HTML và BODY
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }

    // Chặn sự kiện lăn chuột (wheel) và vuốt cảm ứng (touchmove) trên nền backdrop
    const handleWheel = (e: WheelEvent) => {
      if (contentRef?.current && contentRef.current.contains(e.target as Node)) {
        return; // Cho phép cuộn bên trong nội dung modal
      }
      e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (contentRef?.current && contentRef.current.contains(e.target as Node)) {
        return; // Cho phép vuốt cuộn bên trong nội dung modal
      }
      e.preventDefault();
    };

    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("touchmove", handleTouchMove);

      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = originalBodyPaddingRight;
      }
    };
  }, [isLocked, contentRef]);
}
