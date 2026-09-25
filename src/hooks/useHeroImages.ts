"use client";

import { useEffect, useState } from "react";

export type HeroImage = {
  src: string;
  alt: string;
};

/** Fallback khi API chưa trả về (hoặc lỗi) */
const FALLBACK: HeroImage[] = [
  { src: "/hero_images/hero-1.webp", alt: "Trường THPT Nguyễn Công Trứ" },
];

export function useHeroImages() {
  const [images, setImages] = useState<HeroImage[]>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hero-images")
      .then((r) => r.json())
      .then((data: { images: string[] }) => {
        if (data.images?.length) {
          setImages(
            data.images.map((src, i) => ({
              src,
              alt: `Ảnh trường Nguyễn Công Trứ ${i + 1}`,
            })),
          );
        }
      })
      .catch(() => {/* giữ fallback */})
      .finally(() => setLoading(false));
  }, []);

  return { images, loading };
}
