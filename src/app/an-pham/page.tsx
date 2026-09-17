import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ấn phẩm · Lễ kỷ niệm 40 năm THPT Nguyễn Công Trứ",
  description:
    "Ấn phẩm kỷ niệm 40 năm thành lập trường THPT Nguyễn Công Trứ — sẽ sớm ra mắt.",
};

export default function AnPhamPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div
          className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #fbbf24, #f59e0b)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[480px] h-[480px] rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #1d4ed8, #3b82f6)" }}
        />
      </div>

      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight">
          Ấn phẩm
        </h1>
        <p className="mt-4 text-2xl md:text-3xl font-semibold text-[#1d4ed8]">
          Coming soon
        </p>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
