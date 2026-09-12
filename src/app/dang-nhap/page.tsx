import type { Metadata } from "next";
import MemberLoginForm from "@/components/MemberLoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập · 40 năm THPT Nguyễn Công Trứ",
  description:
    "Đăng nhập bằng số điện thoại và mã định danh để quản lý vé tham dự Lễ kỷ niệm 40 năm thành lập trường (1986 - 2026).",
};

export default function DangNhapPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#16a34a] via-[#15803d] to-[#052e16] px-6 pb-20 pt-32">
      {/* Blobs trang trí - phong cách glassmorphic */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-14 h-80 w-80 rounded-full bg-lime-300/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-1/3 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-xl">
        <div className="text-center">
          <span className="inline-block rounded-full border border-white/40 bg-white/15 px-5 py-2 text-[11px] font-extrabold tracking-widest text-white backdrop-blur-md">
            🔐 ĐĂNG NHẬP TÀI KHOẢN CỦA BẠN
          </span>
          <h1 className="mt-5 text-3xl font-extrabold text-white sm:text-5xl">
            SĐT + Mã định danh
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-emerald-50/90 sm:text-base">
            Mã định danh được cấp khi đăng ký (dạng{" "}
            <span className="font-mono font-bold">NCT40-XXXXXX</span>) - cũng
            là vé duyệt vào cổng ngày 15/11/2026.
          </p>
        </div>

        <div className="mt-9">
          <MemberLoginForm />
        </div>
      </div>
    </main>
  );
}
