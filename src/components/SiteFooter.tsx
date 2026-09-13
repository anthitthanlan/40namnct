"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();
  // Trang Timeline full-screen tự động cuộn — không cần footer
  if (pathname.startsWith("/timeline")) return null;
  // Khu quản trị là màn hình riêng — không hiển thị footer công khai
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="mt-20 pb-10 text-center text-sm text-slate-500">
      © 1986 - 2026 Trường THPT Nguyễn Công Trứ · 40 năm trồng người
      <span className="mt-2 block text-xs text-slate-400">
        <Link href="/dang-ky" className="hover:text-[#1d4ed8]">
          Đăng ký tham dự
        </Link>
        {" · "}
        <Link href="/bai-viet" className="hover:text-[#1d4ed8]">
          Bài viết
        </Link>
        {" · "}
        <Link href="/bai-viet/chia-se" className="hover:text-[#1d4ed8]">
          Chia sẻ câu chuyện
        </Link>
        {" · "}
        <Link href="/admin" className="hover:text-[#1d4ed8]">
          Quản trị
        </Link>
      </span>
    </footer>
  );
}