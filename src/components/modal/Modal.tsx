"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useBodyScrollLock } from "./useBodyScrollLock";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  backdropClassName?: string;
  zIndex?: number;
  unstyled?: boolean;
};

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-4xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  size = "md",
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
  backdropClassName = "bg-slate-900/40 backdrop-blur-sm",
  zIndex = 100,
  unstyled = false,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Khóa cuộn trang tuyệt đối và chặn wheel/touch trên backdrop
  useBodyScrollLock(isOpen, modalRef);

  // Xử lý phím Escape
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ zIndex }}
          className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 overscroll-contain"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={() => {
              if (closeOnOverlayClick) onClose();
            }}
            className={`absolute inset-0 ${backdropClassName} touch-none overscroll-contain`}
          />

          {/* Modal Container */}
          {unstyled ? (
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`relative z-10 overscroll-contain ${className}`}
            >
              {children}
            </motion.div>
          ) : (
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`relative z-10 w-full ${SIZE_CLASSES[size]} overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200/80 flex flex-col max-h-[90vh] overscroll-contain ${className}`}
            >
              {/* Header (nếu có title hoặc showCloseButton) */}
              {(title || showCloseButton) && (
                <div
                  className={`flex items-start justify-between border-b border-slate-100 px-5 py-4 shrink-0 ${headerClassName}`}
                >
                  <div className="flex items-start gap-3 min-w-0 pr-3">
                    {icon && (
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                        <span className="material-symbols-rounded text-xl">{icon}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      {title && (
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug truncate">
                          {title}
                        </h3>
                      )}
                      {subtitle && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0 -mr-1"
                      aria-label="Đóng"
                    >
                      <span className="material-symbols-rounded block text-xl">close</span>
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div
                className={`overflow-y-auto p-5 text-slate-700 overscroll-contain ${bodyClassName}`}
              >
                {children}
              </div>

              {/* Footer (nếu có) */}
              {footer && (
                <div
                  className={`flex items-center justify-end gap-2.5 border-t border-slate-100 px-5 py-3.5 bg-slate-50/60 shrink-0 ${footerClassName}`}
                >
                  {footer}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
