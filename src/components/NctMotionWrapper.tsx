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
        .orientation-warning {
          display: none;
        }
        @media (max-width: 600px) and (orientation: portrait) {
          .orientation-warning {
            display: flex;
            position: fixed;
            inset: 0;
            background: #03050b;
            color: #dfe8ff;
            z-index: 9999;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 24px;
            font-family: system-ui, sans-serif;
          }
          .nct-stage, #nct-hint {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="orientation-warning">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: 16 }}>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
          <polyline points="16 6 12 2 8 6"></polyline>
          <line x1="12" y1="2" x2="12" y2="15"></line>
        </svg>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "1.2rem" }}>Vui lòng xoay ngang thiết bị</h2>
        <p style={{ margin: 0, opacity: 0.7, fontSize: "0.9rem" }}>
          Trải nghiệm Logo Breakdown được thiết kế tối ưu nhất khi xem ở chế độ màn hình ngang.
        </p>
      </div>

      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: "28px",
          transform: "translateX(-50%)",
          font: "600 13px/1.5 system-ui",
          letterSpacing: ".1em",
          textTransform: "uppercase",
          opacity: 0.7,
          pointerEvents: "none",
          zIndex: 5,
          color: "#dfe8ff",
          textAlign: "center",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px"
        }}
        id="nct-hint"
      >
        <div>Cuộn hoặc nhấn giữ phím XUỐNG<br />để khám phá</div>
        <span className="material-symbols-rounded" style={{ fontSize: "24px" }}>arrow_downward</span>
      </div>
      <div ref={containerRef} />
    </div>
  );
}
