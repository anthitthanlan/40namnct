"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "#gioi-thieu", label: "Giới thiệu" },
  { href: "/bai-viet", label: "Bài viết" },
  { href: "/timeline", label: "Timeline" },
  { href: "/dang-ky", label: "Đăng ký vé" },
  { href: "#dong-gop", label: "Đóng góp Media" },
];

export default function DynamicNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(`#${e.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    links.forEach(({ href }) => {
      // Chỉ quan sát anchor trên cùng trang - các route (/bai-viet, /timeline) bỏ qua
      if (!href.startsWith("#") || href === "#") return;
      const el = document.querySelector(href);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [pathname]);

  // Anchor (mục #gioi-thieu, #dong-gop…) chỉ tồn tại ở trang chủ -
  // ở trang khác điều hướng về "/" kèm hash để Next.js cuộn tới section.
  const isHome = pathname === "/";
  const resolveHref = (href: string): string =>
    href.startsWith("#") && !isHome ? `/#${href.slice(1)}` : href;

  return (
    <nav className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        className={`flex items-center gap-1 rounded-full border border-white/60 bg-white/70 p-1.5 shadow-lg shadow-slate-900/10 backdrop-blur-xl transition-all duration-500 ${
          scrolled ? "bg-white/85" : "bg-white/50"
        }`}
      >
        {/* Logo - về trang chủ */}
        <Link href="/" className="flex items-center pl-2 pr-1">
          <Image
            src="/images/logo_nct.png"
            alt="Logo NCT"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
        </Link>
        <span className="mx-1 hidden h-5 w-px bg-slate-300 md:block" />

        {/* Link islands - pill trượt theo section active */}
        <div className="relative hidden items-center md:flex">
          {links.map(({ href, label }) => {
            const cls = `relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ${
              active === href
                ? "text-[#1d4ed8]"
                : "text-slate-600 hover:text-slate-900"
            }`;
            // Anchor cùng trang: <a> thường; còn lại dùng Link để điều hướng
            if (!href.startsWith("#") || !isHome) {
              return (
                <Link key={href} href={resolveHref(href)} className={cls}>
                  {label}
                </Link>
              );
            }
            return (
              <a key={href} href={href} className={cls}>
                {label}
              </a>
            );
          })}
        </div>

        {/* CTA island - bo tròn gọn, không bóng lệch gây vỡ khung */}
        <Link
          href={isHome ? "#dong-gop" : "/#dong-gop"}
          className="ml-1 hidden rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#1d4ed8] sm:block"
        >
          Đóng góp Media
        </Link>
      </div>
    </nav>
  );
}
