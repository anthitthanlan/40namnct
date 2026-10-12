"use client";

import { useState, useCallback, useRef } from "react";
import Modal from "./modal/Modal";

export type ConfirmOptions = {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
};

export function useConfirm() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    message: string;
    title: string;
    confirmText: string;
    cancelText: string;
    variant: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    message: "",
    title: "Xác nhận thao tác",
    confirmText: "Tiếp tục",
    cancelText: "Huỷ",
    variant: "danger",
  });

  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((message: string, options?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setModalState({
        isOpen: true,
        message,
        title: options?.title || "Xác nhận thao tác",
        confirmText: options?.confirmText || "Tiếp tục",
        cancelText: options?.cancelText || "Huỷ",
        variant: options?.variant || "danger",
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolver.current?.(true);
    resolver.current = null;
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolver.current?.(false);
    resolver.current = null;
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const ConfirmElement = (
    <Modal
      isOpen={modalState.isOpen}
      onClose={handleCancel}
      size="sm"
      zIndex={9999}
      showCloseButton={false}
      closeOnOverlayClick={false}
      bodyClassName="p-5 sm:p-6"
    >
      <div className="text-center pt-1">
        {/* Icon status */}
        <div
          className={`mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl ${
            modalState.variant === "danger"
              ? "bg-rose-50 text-rose-600 border border-rose-100"
              : modalState.variant === "warning"
              ? "bg-amber-50 text-amber-600 border border-amber-100"
              : "bg-blue-50 text-blue-600 border border-blue-100"
          }`}
        >
          <span className="material-symbols-rounded text-2xl">
            {modalState.variant === "danger"
              ? "warning"
              : modalState.variant === "warning"
              ? "priority_high"
              : "info"}
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-900 leading-snug">
          {modalState.title}
        </h3>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed font-normal">
          {modalState.message}
        </p>

        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-2xs"
          >
            {modalState.cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold text-white transition-colors shadow-2xs ${
              modalState.variant === "danger"
                ? "bg-rose-600 hover:bg-rose-700 active:bg-rose-800"
                : modalState.variant === "warning"
                ? "bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            }`}
          >
            {modalState.confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );

  return { confirm, ConfirmElement };
}
