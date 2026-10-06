"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
// @ts-ignore
import { createNctMotion } from "./nct-motion";

export default function NctMotionWrapper() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    let isUnmounted = false;
    let motionInstance: any;

    createNctMotion(containerRef.current, {
      gsap,
      ScrollTrigger,
      assetBase: "/nct-motion",
      scrollPerSecond: 2000,
      quality: 0.75,
      scrub: true
    }).then((instance: any) => {
      if (isUnmounted) {
        instance.destroy();
      } else {
        motionInstance = instance;
      }
    });

    const hintTween = gsap.to("#nct-hint", { opacity: 0, scrollTrigger: { start: 40, end: 200, scrub: true } });

    return () => {
      isUnmounted = true;
      if (motionInstance) {
        motionInstance.destroy();
      }
      if (hintTween.scrollTrigger) hintTween.scrollTrigger.kill();
      hintTween.kill();
    };
  }, []);

  return (
    <div style={{ background: "#03050b", width: "100%", position: "relative" }}>
      <style>{`
        html, body {
          background: #03050b;
        }
        .nct-stage {
          position: sticky;
          top: 0;
          height: 100vh;
          width: 100%;
          background: #03050b;
          overflow: hidden;
        }
        .nct-canvas {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: "28px",
          transform: "translateX(-50%)",
          font: "600 13px/1 system-ui",
          letterSpacing: ".3em",
          textTransform: "uppercase",
          opacity: 0.7,
          pointerEvents: "none",
          zIndex: 5,
          color: "#dfe8ff"
        }}
        id="nct-hint"
      >
        Cuộn để khám phá ↓
      </div>
      <div ref={containerRef} />
    </div>
  );
}
