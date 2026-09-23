"use client";

import { useEffect, useState } from "react";

export default function DemoWarning() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        setShow(true);
      }
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] flex flex-col sm:flex-row items-center justify-center gap-3 bg-red-600 px-4 py-4 text-white shadow-2xl">
      <span className="material-symbols-rounded text-4xl font-black animate-pulse text-yellow-300">warning</span>
      <p className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-center sm:text-left leading-relaxed pointer-events-none">
        DEMO ONLY! KHÔNG CHIA SẺ WEBSITE NÀY VÀ KHÔNG THỰC HIỆN BẤT KÌ TÍNH NĂNG NÀO KHI THÔNG BÁO NÀY CÒN XUẤT HIỆN.
      </p>
    </div>
  );
}
