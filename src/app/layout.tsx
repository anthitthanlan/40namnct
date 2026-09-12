import type { Metadata } from "next";
import "./globals.css";
import DynamicNavbar from "@/components/DynamicNavbar";

export const metadata: Metadata = {
  title: "40 Năm THPT Nguyễn Công Trứ (1986 - 2026)",
  description:
    "Kỷ niệm 40 năm thành lập trường THPT Nguyễn Công Trứ - hành trình 40 năm trồng người.",
  icons: {
    icon: [{ url: "/images/logo_nct.png", type: "image/png" }],
    apple: [{ url: "/images/logo_nct.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="antialiased">
        <DynamicNavbar />
        {children}
        <footer className="mt-20 pb-10 text-center text-sm text-slate-500">
          © 1986 - 2026 Trường THPT Nguyễn Công Trứ · 40 năm trồng người
          <span className="mt-2 block text-xs text-slate-400">
            <a href="/dang-ky" className="hover:text-[#1d4ed8]">
              Đăng ký tham dự
            </a>
            {" · "}
            <a href="/bai-viet" className="hover:text-[#1d4ed8]">
              Bài viết
            </a>
            {" · "}
            <a href="/bai-viet/chia-se" className="hover:text-[#1d4ed8]">
              Chia sẻ câu chuyện
            </a>
            {" · "}
            <a href="/admin" className="hover:text-[#1d4ed8]">
              Quản trị
            </a>
          </span>
        </footer>
      </body>
    </html>
  );
}
