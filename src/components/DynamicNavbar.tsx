"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MobileNavMorph from "./MobileNavMorph";

const links = [
  { href: "/", label: "Giới thiệu" },
  { href: "/bai-viet", label: "Bài viết" },
  { href: "/timeline", label: "Lược sử 40 năm" },
  { href: "/tra-cuu", label: "Tra cứu vé" },
  { href: "/an-pham", label: "Ấn phẩm", comingSoon: true },
];

const CTA_LABEL = "Đăng kí tham dự";

export default function DynamicNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  // default true để SSR/hydration không flash desktop nav trên mobile
  const [isMobileNav, setIsMobileNav] = useState(true);

  // Probe div: luôn render đầy đủ nội dung desktop, đặt ngoài viewport để đo natural width
  const probeRef = useRef<HTMLDivElement>(null);
  // Lưu threshold vào ref để resize listener không bị stale closure
  const thresholdRef = useRef<number>(900);

  // Effect 1: Đo natural width MỘT LẦN sau khi mount, rồi lắng nghe resize
  useEffect(() => {
    const measure = () => {
      if (probeRef.current) {
        // scrollWidth của probe = chiều rộng tự nhiên của full desktop nav
        thresholdRef.current = probeRef.current.scrollWidth + 32; // 32px outer padding
      }
    };

    const checkWidth = () => {
      setIsMobileNav(window.innerWidth < thresholdRef.current);
    };

    measure();
    checkWidth();

    window.addEventListener("resize", checkWidth, { passive: true });
    return () => window.removeEventListener("resize", checkWidth);
  }, []); // chỉ chạy một lần sau mount

  // Effect 2: Scroll indicator + section tracking (phụ thuộc pathname)
  useEffect(() => {
    setActive("");
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

  const resolveHref = (href: string): string =>
    href.startsWith("#") && !isHome ? `/#${href.slice(1)}` : href;

  return (
    <>
      {/* ── Probe div: đo chiều rộng tự nhiên của full nav, ẩn ngoài viewport ── */}
      <div
        ref={probeRef}
        aria-hidden="true"
        className="fixed -left-[9999px] top-0 flex items-center gap-1.5 p-1.5 opacity-0 pointer-events-none whitespace-nowrap"
      >
        {/* Logo placeholder */}
        <div className="flex items-center gap-2 rounded-full p-1">
          <div className="h-8 w-8" />
          <div className="h-8 w-8" />
        </div>
        {/* Divider */}
        <span className="mx-1 h-5 w-px" />
        {/* Links */}
        {links.map(({ label }) => (
          <span key={label} className="px-3.5 py-2 text-sm font-medium">
            {label}
          </span>
        ))}
        {/* CTA */}
        <span className="ml-2 px-6 py-2.5 text-sm font-bold">{CTA_LABEL}</span>
      </div>

      {/* ── Navbar thật ── */}
      <nav
        className={`fixed inset-x-0 top-4 z-50 flex items-center pointer-events-none px-4 ${
          isMobileNav ? "justify-between" : "justify-center"
        }`}
      >
        {/* Hamburger (Mobile - Bên trái) */}
        <div
          className={`pointer-events-auto w-[48px] h-[48px] relative ${
            isMobileNav ? "block" : "hidden"
          }`}
        >
          <MobileNavMorph />
        </div>

        {/* Pill */}
        <div
          style={{ transition: "background 0.45s cubic-bezier(0.4,0,0.2,1)" }}
          className={`pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/60 p-1.5 shadow-lg shadow-slate-950/15 backdrop-blur-2xl ${
            scrolled ? "bg-white/90 shadow-slate-950/20" : "bg-white/75"
          }`}
        >
          {/* Logo */}
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

          {/* Desktop nav content */}
          {!isMobileNav && (
            <>
              <span className="mx-1 block h-5 w-px bg-slate-300" />

              {/* Links */}
              <div className="relative flex items-center gap-1">
                {links.map(({ href, label }) => {
                  const isCurrent =
                    (pathname === href && !href.startsWith("#")) ||
                    (pathname.startsWith(href) && !href.startsWith("#") && href !== "/") ||
                    (href.startsWith("#") && isHome && (active === href || (active === "" && href === "#gioi-thieu")));

                  const content = (
                    <>
                      <span>{label}</span>
                      <span
                        className={`absolute bottom-1 left-3 right-3 h-[2.5px] rounded-full bg-[#1d4ed8] transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] ${
                          isCurrent
                            ? "opacity-100 scale-x-100"
                            : "opacity-0 scale-x-0 group-hover/link:opacity-60 group-hover/link:scale-x-75"
                        }`}
                      />
                    </>
                  );

                  const cls = `group/link relative z-10 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-all duration-[var(--duration-quick)] flex items-center ${
                    isCurrent ? "text-[#1d4ed8] font-bold" : "text-slate-600 hover:text-slate-900"
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

              {/* CTA desktop */}
              <Link
                href="/dang-ky"
                className={`group/btn relative ml-2 shrink-0 rounded-full px-6 py-2.5 text-sm font-bold text-white whitespace-nowrap shadow-md transition-all duration-[var(--duration-fast)] active:scale-95 inline-flex items-center justify-center bg-[#1d4ed8] overflow-hidden ${
                  pathname === "/dang-ky" ? "shadow-green-900/20" : "hover:shadow-yellow-500/30"
                }`}
              >
                <div
                  className={`absolute inset-0 rounded-full bg-live-gradient transition-opacity duration-300 ease-in-out pointer-events-none ${
                    pathname === "/dang-ky" ? "opacity-100" : "opacity-0 group-hover/btn:opacity-100"
                  }`}
                />
                <div className="relative flex flex-col items-center justify-center z-10">
                  <span className="relative z-10">{CTA_LABEL}</span>
                  <span
                    className={`absolute -bottom-1 left-0 right-0 h-[2px] bg-white rounded-full transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] z-10 ${
                      pathname === "/dang-ky"
                        ? "opacity-100 scale-x-100"
                        : "opacity-0 scale-x-0 group-hover/btn:opacity-60 group-hover/btn:scale-x-75"
                    }`}
                  />
                </div>
              </Link>
            </>
          )}
        </div>

        {/* Nút Đăng kí ngay cho Mobile (Bên phải) */}
        <div
          className={`pointer-events-auto ${isMobileNav ? "block" : "hidden"}`}
        >
          <Link
            href="/dang-ky"
            className="group/btnmobile flex h-12 items-center justify-center rounded-full px-5 text-sm font-bold text-white shadow-md transition-all active:scale-95 bg-live-gradient shadow-green-900/20 hover:shadow-yellow-500/40"
          >
            <div className="relative flex flex-col items-center justify-center">
              <span className="relative z-10">Đăng kí ngay</span>
              <span
                className={`absolute -bottom-1 left-0 right-0 h-[2px] bg-white rounded-full transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] z-10 ${
                  pathname === "/dang-ky"
                    ? "opacity-100 scale-x-100"
                    : "opacity-0 scale-x-0 group-hover/btnmobile:opacity-60 group-hover/btnmobile:scale-x-75"
                }`}
              />
            </div>
          </Link>
        </div>
      </nav>
    </>
  );
}
