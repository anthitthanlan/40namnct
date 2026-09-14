"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "#gioi-thieu", label: "Giới thiệu" },
  { href: "#sao-ke", label: "Sao kê" },
  { href: "/bai-viet", label: "Bài viết" },
  { href: "/timeline", label: "Timeline" },
  { href: "/dang-ky", label: "Đăng ký vé" },
];

export default function DynamicNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
        className={`flex items-center rounded-full border border-white/60 p-1.5 shadow-lg shadow-slate-950/15 backdrop-blur-2xl ${
          scrolled ? "bg-white/90 shadow-slate-950/20" : "bg-white/75"
        } ${isExpanded ? "gap-1.5" : "justify-center ring-2 ring-white/50"}`}
      >
        {/* Logo trường và logo 40 năm - Luôn hiển thị, nhấp để về trang chủ */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-full p-1 transition-transform duration-300 hover:scale-105 active:scale-95"
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
            overflow: "hidden",
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
                active === href ||
                (pathname === href && !isHome) ||
                (href.startsWith("#") && isHome && active === href);

              const content = (
                <>
                  <span>{label}</span>
                  {/* Animation Underline mượt mà */}
                  <span
                    className={`absolute bottom-1 left-3 right-3 h-[2.5px] rounded-full bg-[#1d4ed8] transition-all duration-300 ease-out ${
                      isCurrent
                        ? "opacity-100 scale-x-100"
                        : "opacity-0 scale-x-0 group-hover/link:opacity-60 group-hover/link:scale-x-75"
                    }`}
                  />
                </>
              );

              const cls = `group/link relative z-10 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                isCurrent
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
            className="ml-2 hidden shrink-0 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white whitespace-nowrap shadow-md transition-all duration-300 hover:bg-[#1d4ed8] hover:shadow-blue-900/30 active:scale-95 sm:inline-flex items-center gap-1.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              width={14}
              height={14}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 110 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 110-4V6z" />
            </svg>
            <span>Đăng ký tham gia</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
