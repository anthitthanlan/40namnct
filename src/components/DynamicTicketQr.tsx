"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { getDynamicTicketPayload } from "@/lib/ticket-view";

export default function DynamicTicketQr({
  ticketId,
  ticketCode,
  attendeeName,
}: {
  ticketId: string;
  ticketCode: string;
  attendeeName?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { payload, remainingSeconds } = getDynamicTicketPayload(
    ticketId,
    ticketCode,
    now,
  );

  useEffect(() => {
    if (!canvasRef.current || !payload) return;
    QRCode.toCanvas(canvasRef.current, payload, {
      width: 200,
      margin: 1,
      color: {
        dark: "#090d16",
        light: "#ffffff",
      },
    }).catch((err) => {
      console.error("Lỗi vẽ QR vé:", err);
    });
  }, [payload]);

  const progressPercent = Math.max(0, Math.min(100, (remainingSeconds / 30) * 100));

  return (
    <div className="flex flex-col items-center rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-center shadow-lg backdrop-blur-md">
      {/* Header bảo mật */}
      <div className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        QR Động · Bảo Mật 30s
      </div>

      {attendeeName && (
        <p className="mt-2 text-sm font-extrabold text-white">
          {attendeeName}
        </p>
      )}

      {/* Khung Canvas QR */}
      <div className="relative mt-3.5 overflow-hidden rounded-2xl border-2 border-emerald-400/50 bg-white p-2.5 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
        <canvas ref={canvasRef} className="block rounded-lg" />
      </div>

      {/* Thanh đếm ngược 30 giây */}
      <div className="mt-3.5 w-full max-w-[200px]">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
          <span>Tự làm mới sau:</span>
          <span className="font-mono text-emerald-300">{remainingSeconds}s</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <p className="mt-3 max-w-[240px] text-[11px] leading-relaxed text-slate-400">
        🔒 Mã bảo mật tự động đổi mỗi 30s để chống chụp màn hình. Ban Tổ chức sẽ
        quét mã này tại cổng ngày 15/11/2026.
      </p>
    </div>
  );
}
