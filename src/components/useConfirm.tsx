"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export function useConfirm() {
  const [modal, setModal] = useState<{
    message: string;
    isOpen: boolean;
  } | null>(null);
  
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setModal({ message, isOpen: true });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolver.current?.(true);
    setModal(null);
  }, []);

  const handleCancel = useCallback(() => {
    resolver.current?.(false);
    setModal(null);
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ConfirmElement = mounted && modal?.isOpen ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 p-4 animate-in fade-in duration-200">
      <div 
        className="relative bg-[#ececec]/95 shadow-2xl rounded-[18px] w-full max-w-[320px] p-5 pt-6 text-center border border-white/50 animate-in fade-in zoom-in-95 duration-200"
        style={{ backdropFilter: "blur(40px)" }}
      >
        {/* Help icon top right */}
        <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-black/10 text-xs font-bold text-black/40">
          ?
        </div>
        
        {/* Warning Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-rose-500 shadow-sm">
          <span className="material-symbols-rounded text-3xl text-white">
            warning
          </span>
        </div>

        <h3 className="mb-2 text-[15px] font-bold leading-snug text-slate-900 px-2">
          {modal.message}
        </h3>
        
        <p className="mb-6 text-[13px] font-medium leading-relaxed text-slate-500">
          Thao tác này sẽ xoá vĩnh viễn dữ liệu và không thể khôi phục lại.
        </p>

        <div className="flex gap-2 px-1">
          <button 
            onClick={handleCancel} 
            className="flex-1 rounded-[8px] bg-[#d1d1d6] py-1.5 text-[14px] font-medium text-slate-900 transition-colors hover:bg-[#c1c1c6] active:bg-[#b1b1b6]"
          >
            Huỷ
          </button>
          <button 
            onClick={handleConfirm} 
            className="flex-1 rounded-[8px] bg-[#007aff] py-1.5 text-[14px] font-medium text-white transition-colors hover:bg-[#0062cc] active:bg-[#005bb5]"
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return { confirm, ConfirmElement };
}
