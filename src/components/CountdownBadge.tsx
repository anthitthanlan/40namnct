"use client";

import { useEffect, useState } from "react";

const EVENT_DATE = new Date("2026-11-15T00:00:00+07:00");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const difference = EVENT_DATE.getTime() - new Date().getTime();
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

export default function CountdownBadge() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isClient) return null;
  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) return null;

  return (
    <div className="flex flex-col items-start justify-center space-y-4">
      <div className="flex items-center space-x-2 text-emerald-600 font-bold tracking-wide mb-2">
        <span className="material-symbols-rounded text-xl">schedule</span>
        <span>CHỈ CÒN</span>
      </div>
      <div className="flex gap-4 sm:gap-6 text-center">
        <div className="flex flex-col items-center">
          <div className="text-4xl sm:text-5xl font-black text-slate-800">{String(timeLeft.days).padStart(2, '0')}</div>
          <div className="text-xs sm:text-sm font-semibold uppercase text-slate-500 mt-1">Ngày</div>
        </div>
        <div className="text-3xl sm:text-4xl font-black text-slate-300 mt-1">:</div>
        <div className="flex flex-col items-center">
          <div className="text-4xl sm:text-5xl font-black text-slate-800">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-xs sm:text-sm font-semibold uppercase text-slate-500 mt-1">Giờ</div>
        </div>
        <div className="text-3xl sm:text-4xl font-black text-slate-300 mt-1">:</div>
        <div className="flex flex-col items-center">
          <div className="text-4xl sm:text-5xl font-black text-slate-800">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-xs sm:text-sm font-semibold uppercase text-slate-500 mt-1">Phút</div>
        </div>
        <div className="text-3xl sm:text-4xl font-black text-slate-300 mt-1 hidden sm:block">:</div>
        <div className="flex flex-col items-center hidden sm:flex">
          <div className="text-4xl sm:text-5xl font-black text-emerald-600">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-xs sm:text-sm font-semibold uppercase text-emerald-600/70 mt-1">Giây</div>
        </div>
      </div>
    </div>
  );
}
