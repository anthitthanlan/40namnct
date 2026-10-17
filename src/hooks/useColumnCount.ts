"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Hook xác định số cột responsive đồng bộ theo chuẩn Unsplash / Pinterest.
 * Mobile (< 640px): 1 cột
 * Tablet (640px - 1024px): 2 cột
 * Desktop (>= 1024px): 3 cột
 */
export function useColumnCount(): number {
  const subscribe = useCallback((callback: () => void) => {
    const mqlDesktop = window.matchMedia("(min-width: 1024px)");
    const mqlTablet = window.matchMedia("(min-width: 640px)");
    mqlDesktop.addEventListener("change", callback);
    mqlTablet.addEventListener("change", callback);
    return () => {
      mqlDesktop.removeEventListener("change", callback);
      mqlTablet.removeEventListener("change", callback);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return 3;
    if (window.matchMedia("(min-width: 1024px)").matches) return 3;
    if (window.matchMedia("(min-width: 640px)").matches) return 2;
    return 1;
  }, []);

  const getServerSnapshot = useCallback(() => 3, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
