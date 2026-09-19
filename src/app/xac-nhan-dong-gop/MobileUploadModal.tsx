"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileUploadModal({
  isOpen,
  setIsOpen,
  children,
  buttonText = "Xác minh đóng góp",
  onButtonClick,
  isVisible = true,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  children: React.ReactNode;
  buttonText?: string;
  onButtonClick?: () => void;
  isVisible?: boolean;
}) {
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // ResizeObserver gắn vào state ref thay vì useRef.
  // Như vậy mỗi khi component bên trong render lại (đổi phase), ref thay đổi, Effect sẽ chạy lại 
  // và bắt đúng sự thay đổi chiều cao của tấm ảnh/nội dung mới!
  useEffect(() => {
    if (contentElement && isOpen) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setContentHeight(entry.target.getBoundingClientRect().height);
        }
      });
      observer.observe(contentElement);
      return () => observer.disconnect();
    }
  }, [contentElement, isOpen]);

  // Chiều cao bằng ĐÚNG chiều cao nội dung, không cộng thêm khoảng trắng thừa.
  const finalHeight = contentHeight > 0 ? contentHeight : 400;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/40 z-[50] backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Bottom gradient blur behind the pill button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-0 h-32 pointer-events-none z-[40] md:hidden"
            style={{
              background: "linear-gradient(to top, rgba(249,250,251,1) 0%, rgba(249,250,251,0) 100%)",
              backdropFilter: "blur(2px)",
              WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 100%)",
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
            className="fixed inset-x-0 bottom-0 z-[60] pointer-events-none md:hidden flex justify-center"
          >
        {/* SVG Defs for Gooey effect + Shadow */}
        <svg className="absolute w-0 h-0">
          <defs>
            <filter id="goo-bottom">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
              <feDropShadow in="goo" dx="0" dy="10" stdDeviation="15" floodOpacity="0.15" result="shadowWithGoo" />
              <feComposite in="SourceGraphic" in2="shadowWithGoo" operator="atop" />
            </filter>
          </defs>
        </svg>

        {/* Gooey Background Layer */}
        <div
          className="absolute inset-x-0 bottom-0 flex justify-center items-end pb-8 px-4"
          style={{ filter: "url(#goo-bottom)" }}
        >
          <motion.div
            initial={false}
            animate={{
              width: isOpen ? "100%" : "220px",
              height: isOpen ? finalHeight : "56px",
              borderRadius: isOpen ? "32px" : "28px",
              y: isOpen ? -8 : 0, 
            }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
            className="bg-white origin-bottom w-full max-w-lg"
          />
        </div>

        {/* Foreground Content Layer (No filter applied) */}
        <div className="relative w-full max-w-lg flex flex-col items-center justify-end pointer-events-auto pb-8 px-4 z-10">
          <AnimatePresence mode="wait">
            {!isOpen ? (
              <motion.button
                key="pill"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                onClick={() => {
                  if (onButtonClick) {
                    onButtonClick();
                  } else {
                    setIsOpen(true);
                  }
                }}
                className="w-[220px] h-[56px] mx-auto flex items-center justify-center font-bold text-blue-600 text-[15px] outline-none"
              >
                {buttonText}
              </motion.button>
            ) : (
              <motion.div
                key="modal"
                ref={setContentElement}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: -8 }} 
                exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
                transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] as const }}
                // Padding đều 16px (p-4). Riêng pb cộng thêm safe-area.
                className="w-full p-4 pb-[calc(1rem+env(safe-area-inset-bottom,16px))]"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
