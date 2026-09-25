"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

// Thông tin cố định - sẽ đẩy lên database sau
import siteConfig from "../../data/site-config.json";

export default function SiteFooter() {
  const pathname = usePathname();
  // Trang Timeline full-screen tự động cuộn — không cần footer
  if (pathname.startsWith("/khoanh-khac")) return null;
  // Khu quản trị là màn hình riêng — không hiển thị footer công khai
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="relative mt-0 overflow-hidden border-t border-slate-200/60 bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-12">
          {/* Cột 1: Logo & thông tin trường */}
          <div className="md:col-span-5">
            <Link
              href="/"
              className="inline-flex items-center gap-3 transition-transform hover:scale-[1.02]"
            >
              <Image
                src="/images/NCT.webp"
                alt="Logo NCT"
                width={56}
                height={56}
                className="h-14 w-auto object-contain"
              />
              <Image
                src="/images/Logo_40th_NCT.webp"
                alt="Logo 40 năm NCT"
                width={56}
                height={56}
                className="h-14 w-auto object-contain"
              />
            </Link>
            <h3 className="mt-4 text-lg font-extrabold text-slate-900">
              {siteConfig.school.name}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              40 năm trồng người (1986 - 2026)
            </p>

            <div className="mt-5 space-y-2.5 text-sm text-slate-600">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-rounded mt-0.5 text-base text-slate-400">
                  location_on
                </span>
                <span>{siteConfig.school.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-rounded text-base text-slate-400">
                  call
                </span>
                <a
                  href={`tel:${siteConfig.school.phone.replace(/[^0-9]/g, "")}`}
                  className="hover:text-[#1d4ed8] transition-colors"
                >
                  {siteConfig.school.phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-rounded text-base text-slate-400">
                  mail
                </span>
                <a
                  href={`mailto:${siteConfig.school.email}`}
                  className="hover:text-[#1d4ed8] transition-colors"
                >
                  {siteConfig.school.email}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-rounded text-base text-slate-400">
                  language
                </span>
                <a
                  href={`https://${siteConfig.school.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1d4ed8] transition-colors"
                >
                  {siteConfig.school.website}
                </a>
              </div>
            </div>
          </div>

          {/* Cột 2: Liên kết nhanh */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Liên kết
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "/ngay-tro-ve", label: "Ngày Trở Về · 08/11/2026" },
                { href: "/dang-ky", label: "Đăng ký tham dự" },
                { href: "/tra-cuu", label: "Tra cứu vé" },
                { href: "/cau-chuyen", label: "Bài viết" },
                { href: "/gui-bai", label: "Gửi gắm kỷ niệm" },
                { href: "/khoanh-khac", label: "Lược sử 40 năm" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-600 transition-colors hover:text-[#1d4ed8]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 3: Đơn vị thực hiện & hỗ trợ */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Đơn vị thực hiện website
            </h4>
            <div className="mt-4 mb-3 flex items-center gap-3">
              <Image
                src="/images/Logo_CLB_Tin_Hoc.webp"
                alt="Logo CLB Tin học"
                width={72}
                height={72}
                className="h-[60px] w-auto object-contain opacity-90 grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {siteConfig.developer.name}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Trực thuộc {siteConfig.developer.organization}
            </p>

            <h4 className="mt-8 text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Liên hệ hỗ trợ
            </h4>
            <div className="mt-3 space-y-2.5 text-sm text-slate-600">
              <a
                href={siteConfig.developer.fanpage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 hover:text-[#1d4ed8] transition-colors"
              >
                <svg
                  className="h-5 w-5 shrink-0 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
                <span>Fanpage CLB Tin học THPT NCT</span>
              </a>
              <a
                href={`mailto:${siteConfig.developer.email}`}
                className="flex items-center gap-2.5 hover:text-[#1d4ed8] transition-colors"
              >
                <span className="material-symbols-rounded text-[20px] w-5 text-center shrink-0 text-slate-400">
                  mail
                </span>
                <span>{siteConfig.developer.email}</span>
              </a>
            </div>

            {/* Link quản trị (ẩn, chỉ dành cho admin) */}
            <div className="mt-6">
              <Link
                href="/admin"
                className="text-xs text-slate-400 transition-colors hover:text-[#1d4ed8]"
              >
                Quản trị
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-slate-200/60 pt-6 text-center">
          <p className="text-[11px] text-slate-400/80 leading-relaxed max-w-lg mx-auto mb-3">
            Đây là trang thông tin đăng ký nội bộ dành riêng cho Cựu học sinh THPT Nguyễn Công Trứ tham dự sự kiện Lễ kỷ niệm 40 năm thành lập trường (1986 - 2026). Mọi khoản đóng góp được sử dụng hoàn toàn cho công tác tổ chức sự kiện.
          </p>
          <p className="text-xs text-slate-400">
            © 1986 - 2026 {siteConfig.school.name} · 40 năm trồng người
          </p>
          <p className="mt-1 text-[11px] text-slate-400/70">
            Website kỉ niệm 40 năm được thực hiện bởi{" "}
            <a
              href={siteConfig.developer.fanpage}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-[#1d4ed8]"
            >
              {siteConfig.developer.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}