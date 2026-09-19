"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const links = [
  { href: "/", label: "Giới thiệu" },
  { href: "/bai-viet", label: "Bài viết" },
  { href: "/timeline", label: "Lược sử 40 năm" },
  { href: "/tra-cuu", label: "Tra cứu vé" },
  { href: "/dang-ky", label: "Đăng kí tham gia" },
  { href: "/an-pham", label: "Ấn phẩm", comingSoon: true },
];

export default function MobileNavMorph() {
  const [isOpen, setIsOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const resolveHref = (href: string) => 
    href.startsWith("#") && pathname !== "/" && !pathname.startsWith("/admin") ? `/#${href.slice(1)}` : href;

  const isAdmin = pathname.startsWith("/admin");
  const adminGroups = [
    {
      title: "Quản lý bài đăng",
      items: [
        { href: "/admin?tab=pending", label: "Bài viết chờ duyệt" },
        { href: "/admin?tab=published", label: "Bài đã đăng" },
        { href: "/admin?tab=all", label: "Tất cả bài viết" },
      ],
    },
    {
      title: "Hệ thống",
      items: [
        { href: "/admin?tab=tickets", label: "Thư mời" },
        { href: "/admin?tab=media", label: "Media cộng đồng" },
        { href: "/admin?tab=accounts", label: "Quản lý tài khoản" },
      ],
    },
  ];

  const handleLogout = () => {
    document.cookie = "nct_admin=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.reload();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (contentRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setContentHeight(entry.target.getBoundingClientRect().height);
        }
      });
      observer.observe(contentRef.current);
      return () => observer.disconnect();
    }
  }, []);

  const topVariants = { closed: { rotate: 0, y: 0 }, open: { rotate: 45, y: 6 } };
  const centerVariants = { closed: { opacity: 1 }, open: { opacity: 0 } };
  const bottomVariants = { closed: { rotate: 0, y: 0 }, open: { rotate: -45, y: -6 } };

  // Adjust content height to ensure we have a valid number even before first measure
  const finalMenuHeight = contentHeight > 0 ? contentHeight + 10 : 360;

  return (
    <div className="relative" ref={navRef}>
      
      {/* Lớp SVG nền với hiệu ứng Gooey (Liquid Split) & Glassmorphism */}
      <div className="absolute inset-0 z-0 pointer-events-none w-[360px] h-[600px] -left-[20px] -top-[20px]">
        
        <svg width="100%" height="100%" className="overflow-visible absolute inset-0">
          <defs>
            {/* 1. Filter tạo hình Gooey để dùng cho Mask (không có shadow) */}
            <filter id="goo-shape" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            </filter>

            {/* 2. Mask: Cắt div HTML mờ theo đúng hình giọt nước Gooey */}
            <mask id="goo-mask">
              <g filter="url(#goo-shape)" fill="#ffffff">
                <motion.rect x={20} y={20} width={48} height={48} rx={24} />
                <motion.rect
                  initial={false}
                  animate={{
                    x: 20,
                    y: isOpen ? 20 + 64 : 20,
                    width: isOpen ? 280 : 48,
                    height: isOpen ? finalMenuHeight : 48,
                    rx: 24
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </g>
            </mask>

            {/* 3. Filter Đổ bóng độc lập: Tạo bóng nhưng khoét rỗng ruột để không che Div kính */}
            <filter id="goo-shadow-only" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
              <feDropShadow in="goo" dx="0" dy="10" stdDeviation="15" floodColor="#020617" floodOpacity="0.15" result="shadowWithGoo" />
              <feComposite in="shadowWithGoo" in2="goo" operator="out" />
            </filter>
          </defs>

          {/* Lớp Render Đổ bóng của hình Gooey */}
          <g filter="url(#goo-shadow-only)" fill="#ffffff">
            <motion.rect x={20} y={20} width={48} height={48} rx={24} />
            <motion.rect
              initial={false}
              animate={{
                x: 20,
                y: isOpen ? 20 + 64 : 20,
                width: isOpen ? 280 : 48,
                height: isOpen ? finalMenuHeight : 48,
                rx: 24
              }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </g>
        </svg>

        {/* Lớp HTML tạo kính mờ (Frosted Glass), bị cắt theo hình Gooey */}
        <div 
          className="absolute inset-0 bg-white/70 backdrop-blur-xl"
          style={{
            WebkitMask: "url(#goo-mask)",
            mask: "url(#goo-mask)",
          }}
        ></div>
      </div>

      {/* Nút Hamburger thật (chỉ chứa Icon, nền trong suốt) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-[48px] h-[48px] rounded-full flex flex-col justify-center items-center gap-[4px] z-[60] relative focus:outline-none"
        aria-label="Toggle menu"
      >
        <motion.span variants={topVariants} animate={isOpen ? "open" : "closed"} transition={{ duration: 0.3 }} className="block w-5 h-[2px] bg-slate-800 rounded-full" />
        <motion.span variants={centerVariants} animate={isOpen ? "open" : "closed"} transition={{ duration: 0.3 }} className="block w-5 h-[2px] bg-slate-800 rounded-full" />
        <motion.span variants={bottomVariants} animate={isOpen ? "open" : "closed"} transition={{ duration: 0.3 }} className="block w-5 h-[2px] bg-slate-800 rounded-full" />
      </button>

      {/* Nội dung Menu thật (nền trong suốt, chỉ hiện chữ) */}
      <div
        className="absolute top-[64px] left-0 overflow-hidden z-50 origin-top-left flex flex-col"
        style={{
          width: 280,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        <motion.div 
          ref={contentRef} 
          className="p-6 pb-10 w-[280px]"
          initial={false}
          animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -20, scale: isOpen ? 1 : 0.95 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: isOpen ? 0.05 : 0 }}
          style={{ transformOrigin: "top left" }}
        >
          <div className="mb-4">
            <h2 className="text-[22px] font-extrabold text-slate-900 leading-tight">NCT 40th anniversary</h2>
            <p className="text-[15px] text-green-600 font-bold mt-1">Ngày trở về - 8/11/2026</p>
          </div>
          <div className="border-t-2 border-dashed border-gray-200 w-full mb-4"></div>
          <nav className="flex flex-col gap-4">
            {!isAdmin ? (
              links.map((link) => {
                const isCurrent = pathname === link.href || (pathname === "/" && link.href === "/");
                return (
                  <Link 
                    key={link.href} 
                    href={resolveHref(link.href)}
                    onClick={() => setIsOpen(false)}
                    className={`group relative w-fit text-[17px] font-semibold transition-colors flex items-center gap-2 ${
                      isCurrent ? "text-[#1d4ed8]" : "text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <span>{link.label}</span>
                    <span
                      className={`absolute -bottom-1 left-0 right-0 h-[2.5px] rounded-full bg-[#1d4ed8] transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] ${
                        isCurrent
                          ? "opacity-100 scale-x-100"
                          : "opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-75"
                      }`}
                    />
                  </Link>
                );
              })
            ) : (
              <div className="flex flex-col gap-6">
                {adminGroups.map((group) => (
                  <div key={group.title} className="flex flex-col gap-3">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {group.title}
                    </h3>
                    <div className="flex flex-col gap-3">
                      {group.items.map((link) => {
                        const isCurrent = typeof window !== "undefined" && window.location.search.includes(link.href.split("?")[1]);
                        return (
                          <Link 
                            key={link.href} 
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className={`group relative w-fit text-[15px] font-extrabold transition-colors flex items-center gap-2 ${
                              isCurrent ? "text-[#1d4ed8]" : "text-slate-700 hover:text-slate-900"
                            }`}
                          >
                            <span>{link.label}</span>
                            <span
                              className={`absolute -bottom-1 left-0 right-0 h-[2.5px] rounded-full bg-[#1d4ed8] transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] ${
                                isCurrent
                                  ? "opacity-100 scale-x-100"
                                  : "opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-75"
                              }`}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {isAdmin && (
              <div className="mt-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-fit text-left text-[15px] font-extrabold text-rose-500 hover:text-rose-700 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </nav>
        </motion.div>
      </div>
    </div>
  );
}
