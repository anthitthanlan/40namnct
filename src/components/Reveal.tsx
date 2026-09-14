"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

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
  // Config variants for framer-motion
  const variants = {
    hidden: {
      opacity: 0,
      y: variant === "up" ? 28 : 0,
      x: variant === "left" ? -32 : variant === "right" ? 32 : 0,
      scale: variant === "zoom" ? 0.92 : 1,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 70,
        damping: 15,
        mass: 0.8,
        delay: delay / 1000,
      },
    },
  };

  const MotionTag = (motion as any)[as] || motion.div;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -8% 0px", amount: 0.12 }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}
