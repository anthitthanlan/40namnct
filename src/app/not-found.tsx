import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 · Không tìm thấy trang · THPT Nguyễn Công Trứ",
  description: "Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.",
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f8fafc] px-6 py-32 text-center">
      {/* Decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[#1d4ed8]/8 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 h-[400px] w-[400px] rounded-full bg-emerald-400/10 blur-3xl"
      />

      {/* 404 display */}
      <div className="relative select-none">
        {/* Visible gradient 404 */}
        <span
          aria-hidden
          className="block font-title font-extrabold leading-none"
          style={{
            fontSize: "clamp(120px, 25vw, 220px)",
            background: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 40%, #94a3b8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </span>
        {/* Floating school icon overtop */}
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-[#1d4ed8]/10 p-5"
          aria-hidden
          style={{ animation: "float404 3s ease-in-out infinite" }}
        >
          <span
            className="material-symbols-rounded text-[#1d4ed8]"
            style={{ fontSize: "clamp(40px, 7vw, 64px)", fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}
          >
            school
          </span>
        </span>
      </div>

      {/* Text */}
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
        Trang không tồn tại
      </h1>
      <p className="mx-auto mt-3 max-w-md text-slate-500">
        Có vẻ như trang bạn đang tìm đã rời khỏi mái trường Trứ rồi. Hãy
        quay lại trang chủ hoặc khám phá những nội dung khác bên dưới.
      </p>

      {/* Primary CTA */}
      <Link
        href="/"
        className="btn-lightship mt-8 inline-flex items-center gap-2 bg-[#1d4ed8] px-7 py-3.5 text-base font-bold text-white"
      >
        <span className="material-symbols-rounded text-[1.1em]">home</span>
        Về trang chủ
      </Link>

      {/* Quick nav links */}
      <nav aria-label="Gợi ý trang" className="mt-10 flex flex-wrap justify-center gap-3">
        {[
          { href: "/cau-chuyen", label: "Câu chuyện", icon: "menu_book" },
          { href: "/khoanh-khac", label: "Khoảnh khắc", icon: "photo_library" },
          { href: "/thu-ngo", label: "Thư ngỏ", icon: "mail" },
          { href: "/an-pham", label: "Ấn phẩm", icon: "auto_stories" },
          { href: "/gui-bai", label: "Gửi bài", icon: "edit_note" },
          { href: "/tra-cuu", label: "Tra cứu", icon: "search" },
        ].map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#1d4ed8]/30 hover:text-[#1d4ed8] hover:shadow-md"
          >
            <span className="material-symbols-rounded text-[1.1em]">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      <style>{`
        @keyframes float404 {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-12px); }
        }
      `}</style>
    </main>
  );
}
