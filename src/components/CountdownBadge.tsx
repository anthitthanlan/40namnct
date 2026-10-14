"use client";

import { useEffect, useState, useRef } from "react";
import { getRegistrationStatus, type RegStatusResult } from "@/lib/registration-config";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate?: Date): TimeLeft {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const difference = targetDate.getTime() - new Date().getTime();
  let timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  return timeLeft;
}

function AnimatedDigits({ value, className = "" }: { value: number; className?: string }) {
  const [animating, setAnimating] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), 350);
      return () => clearTimeout(t);
    }
  }, [value]);

  const str = String(value).padStart(2, "0");
  return (
    <span className={`t-digit-group ${animating ? "is-animating" : ""} ${className}`}>
      {str.split("").map((char, i) => (
        <span key={`${i}-${char}`} className="t-digit" data-stagger={i > 0 ? i : undefined}>
          {char}
        </span>
      ))}
    </span>
  );
}

export default function CountdownBadge() {
  const [statusInfo, setStatusInfo] = useState<RegStatusResult>(() => getRegistrationStatus());
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const initialStatus = getRegistrationStatus();
    setStatusInfo(initialStatus);
    setTimeLeft(calculateTimeLeft(initialStatus.targetDate));

    let timer: NodeJS.Timeout;

    const updateTimer = () => {
      const currentStatus = getRegistrationStatus();
      setStatusInfo(currentStatus);
      setTimeLeft(calculateTimeLeft(currentStatus.targetDate));
    };

    const startTimer = () => {
      clearInterval(timer);
      timer = setInterval(() => {
        if (!document.hidden) {
          updateTimer();
        }
      }, 1000);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(timer);
      } else {
        updateTimer();
        startTimer();
      }
    };

    startTimer();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  if (!isClient) return null;

  const isCountdownActive =
    statusInfo.targetDate &&
    (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0);

  // Nếu không còn đếm ngược (đã hết hạn hoặc hết slot)
  if (!isCountdownActive) {
    return (
      <div className="flex flex-col items-start justify-center space-y-3 text-left">
        <div className="flex items-start space-x-2 text-rose-600 font-bold tracking-wide text-left">
          <span className="material-symbols-rounded text-xl shrink-0 mt-0.5">event_busy</span>
          <span className="text-left leading-snug">{statusInfo.title.toUpperCase()}</span>
        </div>
        <div className="text-[13px] sm:text-sm font-medium text-slate-600 bg-slate-100/90 px-4 py-2.5 rounded-xl border border-slate-200 leading-relaxed text-left">
          {statusInfo.badgeText}
        </div>
      </div>
    );
  }

  const isPreOpen = statusInfo.status === "NOT_OPEN_YET";
  const themeColorClass = isPreOpen ? "text-blue-600" : "text-emerald-600";
  const subColorClass = isPreOpen ? "text-blue-600/70" : "text-emerald-600/70";

  return (
    <div className="flex flex-col items-start justify-center space-y-4 text-left">
      <div className={`flex items-start space-x-2 ${themeColorClass} font-bold tracking-wide mb-2 text-left`}>
        <span className="material-symbols-rounded text-xl shrink-0 mt-0.5">
          {isPreOpen ? "hourglass_top" : "schedule"}
        </span>
        <span className="text-left leading-snug">{statusInfo.countdownLabel || "ĐẾM NGƯỢC"}</span>
      </div>
      <div className="flex gap-2 sm:gap-6 text-center">
        <div className="flex flex-col items-center">
          <AnimatedDigits value={timeLeft.days} className="text-4xl sm:text-5xl font-black text-slate-800" />
          <div className="text-xs sm:text-sm font-semibold uppercase text-slate-500 mt-1">Ngày</div>
        </div>
        <div className="text-3xl sm:text-4xl font-black text-slate-300 mt-1">:</div>
        <div className="flex flex-col items-center">
          <AnimatedDigits value={timeLeft.hours} className="text-4xl sm:text-5xl font-black text-slate-800" />
          <div className="text-xs sm:text-sm font-semibold uppercase text-slate-500 mt-1">Giờ</div>
        </div>
        <div className="text-3xl sm:text-4xl font-black text-slate-300 mt-1">:</div>
        <div className="flex flex-col items-center">
          <AnimatedDigits value={timeLeft.minutes} className="text-4xl sm:text-5xl font-black text-slate-800" />
          <div className="text-xs sm:text-sm font-semibold uppercase text-slate-500 mt-1">Phút</div>
        </div>
        <div className="text-3xl sm:text-4xl font-black text-slate-300 mt-1">:</div>
        <div className="flex flex-col items-center">
          <AnimatedDigits value={timeLeft.seconds} className={`text-4xl sm:text-5xl font-black ${themeColorClass}`} />
          <div className={`text-xs sm:text-sm font-semibold uppercase ${subColorClass} mt-1`}>Giây</div>
        </div>
      </div>
      <div className="mt-4 text-[13px] sm:text-sm font-medium text-slate-600 bg-slate-100/80 px-4 py-2.5 rounded-xl border border-slate-200 text-left">
        {statusInfo.badgeText}
      </div>
    </div>
  );
}

