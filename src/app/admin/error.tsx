"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl bg-white p-8 text-center border border-slate-200 shadow-sm space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <span className="material-symbols-rounded text-2xl">warning</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Không thể tải trang Quản trị
        </h2>
        <p className="text-xs text-slate-500 font-mono bg-slate-50 p-3 rounded-xl border border-slate-100 break-words">
          {error?.message || "Đã xảy ra lỗi không xác định."}
        </p>
        <div className="flex gap-2 justify-center pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-[#1d4ed8] px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            Thử tải lại
          </button>
          <button
            type="button"
            onClick={() => window.location.href = "/admin"}
            className="rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Về trang chủ Admin
          </button>
        </div>
      </div>
    </div>
  );
}
