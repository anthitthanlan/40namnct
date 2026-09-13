"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/Reveal";

type ContributionCounterProps = {
  /** Tổng tiền các đơn vé ĐÃ DUYỆT (status = confirmed) */
  totalAmount: number;
  /** Số đơn vé hợp lệ */
  orderCount: number;
  /** Tổng số suất tham dự của các vé hợp lệ */
  attendeeCount: number;
  /** Số thành viên đã có vé hợp lệ */
  memberCount: number;
};

/* Trời sao: vị trí sinh giả-ngẫu-nhiên nhưng TẤT ĐỊNH (LCG hằng số)
   => server và client render giống nhau, không lỗi hydration. */
const STARS = (() => {
  let seed = 20261115;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: 70 }, () => ({
    top: `${(rand() * 78).toFixed(2)}%`,
    left: `${(rand() * 100).toFixed(2)}%`,
    size: `${(1 + rand() * 2).toFixed(2)}px`,
    delay: `${(rand() * 3.4).toFixed(2)}s`,
    duration: `${(2.6 + rand() * 2.4).toFixed(2)}s`,
  }));
})();

/** Đếm tăng dần khi cuộn tới; tôn trọng prefers-reduced-motion
 *  Khởi tạo bằng `target` để HTML server-side in đúng số thật (SEO / không JS),
 *  chỉ đếm từ 0 khi section thực sự cuộn vào khung nhìn. */
function useCountUp(target: number, duration = 1800) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(target);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }

    let raf = 0;
    let start = 0;

    const step = (now: number) => {
      if (!start) start = now;
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic: bùng nổ nhanh rồi chậm dần
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            observer.unobserve(e.target);
            setValue(0); // bắt đầu lại từ 0 rồi đếm lên
            raf = requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.25 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, duration]);

  return { ref, value };
}

/* Định dạng số tiền có phân cách nghìn (vi-VN) - không kèm "đ" để tách riêng hậu tố */
function formatNumber(amount: number): string {
  return amount.toLocaleString("vi-VN");
}

export default function ContributionCounter({
  totalAmount,
  orderCount,
  attendeeCount,
  memberCount,
}: ContributionCounterProps) {
  const { ref, value } = useCountUp(totalAmount);

  const stats = [
    { value: orderCount, label: "Đơn vé hợp lệ", suffix: "" },
    { value: attendeeCount, label: "Suất tham dự", suffix: "" },
    { value: memberCount, label: "Thành viên đồng hành", suffix: "" },
  ];

  return (
    <section
      id="sao-ke"
      className="relative overflow-hidden bg-gradient-to-b from-[#041e22] via-[#06322f] to-[#041e22] py-24 text-white"
    >
      {/* Trời sao nhấp nháy */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="saoke-star"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          />
        ))}
      </div>
      {/* Hào quang xanh phía trên */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-emerald-400/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-3 text-xs font-extrabold tracking-widest text-emerald-300 sm:text-sm">
            <span className="h-0.5 w-6 rounded-full bg-emerald-400" />
            <span>🌱 SỔ SAO KÊ ĐÓNG GÓP</span>
            <span className="h-0.5 w-6 rounded-full bg-emerald-400" />
          </div>
        </Reveal>

        <Reveal delay={100}>
          <h2 className="mt-5 text-3xl font-extrabold sm:text-4xl">
            Cùng nhau gieo 40 năm yêu thương
          </h2>
        </Reveal>

        <Reveal delay={160}>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-emerald-100/80 sm:text-lg">
            Mỗi tấm vé là một nhành cây được trồng xuống cho hành trình 40 năm
            của mái trường Nguyễn Công Trứ. Cảm ơn bạn đã chung tay.
          </p>
        </Reveal>

        {/* Con số khổng lồ - đếm tăng dần khi cuộn tới */}
        <Reveal delay={220} variant="zoom">
          <div className="mt-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-emerald-200 ring-1 ring-emerald-400/30 backdrop-blur-sm sm:text-sm">
              Tổng đóng góp đã xác nhận
            </span>
            <p className="mt-6 flex flex-wrap items-end justify-center gap-2 leading-none">
              <span
                ref={ref}
                aria-label={`${formatNumber(totalAmount)} đồng`}
                className="text-5xl font-black tabular-nums tracking-tight text-white drop-shadow-[0_0_28px_rgba(52,211,153,0.35)] sm:text-7xl lg:text-8xl"
              >
                {formatNumber(value)}
              </span>
              <span className="pb-1 text-3xl font-black text-emerald-300 sm:pb-2 sm:text-5xl">
                đ
              </span>
            </p>
            <p className="mt-4 text-sm font-semibold text-emerald-100/70">
              200.000đ / suất · Chỉ tính các vé đã được Ban Tổ chức xác nhận
            </p>
          </div>
        </Reveal>

        {/* 3 thẻ số liệu */}
        <Reveal delay={280}>
          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="btn-pop-soft rounded-3xl bg-white/10 p-6 backdrop-blur-sm ring-1 ring-white/10"
              >
                <p className="text-3xl font-black tabular-nums text-white sm:text-4xl">
                  {s.value}
                  {s.suffix}
                </p>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-emerald-200/80">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal delay={340}>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link
              href="/dang-ky"
              className="btn-pop bg-emerald-400 px-7 py-3.5 text-base font-bold text-emerald-950 shadow-lg shadow-emerald-950/30"
            >
              🎟️ Đăng ký tham gia ngay
            </Link>
            <Link
              href="/tai-khoan"
              className="btn-pop-soft bg-white/10 px-7 py-3.5 text-base font-bold text-white ring-1 ring-white/20 backdrop-blur-sm"
            >
              📊 Xem sổ sao kê của tôi
            </Link>
          </div>
        </Reveal>

        {/* Logo nhỏ trang trí */}
        <Reveal delay={400}>
          <div className="mt-14 flex items-center justify-center gap-3 opacity-70">
            <Image
              src="/images/logo_nct.png"
              alt="Logo THPT Nguyễn Công Trứ"
              width={44}
              height={44}
              className="h-11 w-11 object-contain"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-200">
              40 năm · THPT Nguyễn Công Trứ
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
