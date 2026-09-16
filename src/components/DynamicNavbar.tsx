"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Giới thiệu" },
  { href: "/bai-viet", label: "Bài viết" },
  { href: "/timeline", label: "Lược sử 40 năm" },
  { href: "/tra-cuu", label: "Tra cứu vé" },
];

export default function DynamicNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    setActive(""); // Reset active state khi chuyển trang
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
      if (!href.startsWith("#") || href === "#") return;
      const el = document.querySelector(href);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [pathname]);

  const isHome = pathname === "/";
  // Luôn mở rộng navbar, không tự động thu gọn
  const isExpanded = true;

  const resolveHref = (href: string): string =>
    href.startsWith("#") && !isHome ? `/#${href.slice(1)}` : href;

  return (
    <nav className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          transition: "all 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className={`flex items-center rounded-full border border-white/60 p-1.5 shadow-lg shadow-slate-950/15 backdrop-blur-2xl ${scrolled ? "bg-white/90 shadow-slate-950/20" : "bg-white/75"
          } ${isExpanded ? "gap-1.5" : "justify-center ring-2 ring-white/50"}`}
      >
        {/* Logo trường và logo 40 năm - Luôn hiển thị, nhấp để về trang chủ */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-full p-1 transition-transform duration-[var(--duration-fast)] hover:scale-105 active:scale-95"
          title="Trường THPT Nguyễn Công Trứ - 40 Năm"
        >
          <Image
            src="/images/NCT.png"
            alt="Logo NCT"
            width={34}
            height={34}
            priority
            className="h-8 w-auto object-contain"
          />
          <Image
            src="/images/Logo_40th_NCT.png"
            alt="Logo 40 năm NCT"
            width={34}
            height={34}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>

        {/* Nội dung Menu - dùng max-width+opacity cho smooth animation */}
        <div
          aria-hidden={!isExpanded}
          style={{
            maxWidth: isExpanded ? "720px" : 0,
            opacity: isExpanded ? 1 : 0,
            overflow: isExpanded ? "visible" : "hidden",
            transition:
              "max-width 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: isExpanded ? undefined : "none",
          }}
          className="flex items-center"
        >
          <span className="mx-1 hidden h-5 w-px bg-slate-300 md:block" />

          {/* Links điều hướng kèm animation underline */}
          <div className="relative hidden items-center gap-1 md:flex">
            {links.map(({ href, label }) => {
              const isCurrent =
                (pathname === href && !href.startsWith("#")) ||
                (pathname.startsWith(href) && !href.startsWith("#") && href !== "/") ||
                (href.startsWith("#") && isHome && (active === href || (active === "" && href === "#gioi-thieu")));

              const content = (
                <>
                  <span>{label}</span>
                  {/* Animation Underline mượt mà */}
                  <span
                    className={`absolute bottom-1 left-3 right-3 h-[2.5px] rounded-full bg-[#1d4ed8] transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] ${isCurrent
                        ? "opacity-100 scale-x-100"
                        : "opacity-0 scale-x-0 group-hover/link:opacity-60 group-hover/link:scale-x-75"
                      }`}
                  />
                </>
              );

              const cls = `group/link relative z-10 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-all duration-[var(--duration-quick)] ${isCurrent
                  ? "text-[#1d4ed8] font-bold"
                  : "text-slate-600 hover:text-slate-900"
                }`;

              if (!href.startsWith("#") || !isHome) {
                return (
                  <Link key={href} href={resolveHref(href)} className={cls}>
                    {content}
                  </Link>
                );
              }
              return (
                <a key={href} href={href} className={cls}>
                  {content}
                </a>
              );
            })}
          </div>

          {/* Nút CTA đen: "Đăng ký tham gia" dẫn tới /dang-ky */}
          <Link
            href="/dang-ky"
            className={`group/btn ml-2 hidden shrink-0 rounded-full px-6 py-2.5 text-sm font-bold text-white whitespace-nowrap shadow-md transition-all duration-[var(--duration-fast)] active:scale-95 sm:inline-flex items-center justify-center ${
              pathname === "/dang-ky"
                ? "bg-live-gradient shadow-green-900/20 hover:shadow-yellow-500/40"
                : "bg-[#1d4ed8] hover:bg-live-gradient hover:shadow-yellow-500/30"
            }`}
          >
            <div className="relative flex flex-col items-center justify-center">
              <span className="relative z-10">Đăng ký tham gia</span>
              {/* Indicator */}
              <span
                className={`absolute -bottom-1 left-0 right-0 h-[2px] bg-white rounded-full transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] z-10 ${
                  pathname === "/dang-ky"
                    ? "opacity-100 scale-x-100"
                    : "opacity-0 scale-x-0 group-hover/btn:opacity-60 group-hover/btn:scale-x-75"
                }`}
              />
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
