import type { Metadata } from "next";
import { Suspense } from "react";
import XacNhanDongGopContent from "./XacNhanDongGopContent";

export const metadata: Metadata = {
  title: "Xác nhận Đóng góp · Lễ kỷ niệm 40 năm THPT Nguyễn Công Trứ",
  description:
    "Xác nhận đóng góp tham dự Lễ kỷ niệm 40 năm thành lập trường THPT Nguyễn Công Trứ (1986 - 2026).",
  robots: "noindex",
};

export default function XacNhanDongGopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <XacNhanDongGopContent />
    </Suspense>
  );
}
