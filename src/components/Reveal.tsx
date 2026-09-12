"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Hiệu ứng: up (mặc định), left, right, zoom */
  variant?: "up" | "left" | "right" | "zoom";
  /** Độ trễ (ms) cho stagger */
  delay?: number;
  as?: "div" | "section" | "article" | "span";
};

export default function Reveal({
  children,
  className = "",
  variant = "up",
  delay = 0,
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as as "div";
  const variantClass =
    variant === "left"
      ? "reveal-left"
      : variant === "right"
        ? "reveal-right"
        : variant === "zoom"
          ? "reveal-zoom"
          : "";

  return (
    <Tag
      ref={ref}
      className={`reveal ${variantClass} ${visible ? "visible" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
