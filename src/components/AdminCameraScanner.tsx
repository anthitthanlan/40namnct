"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { type TicketView, formatVnd, sizesLabel } from "@/lib/ticket-view";

export default function AdminCameraScanner({
  onCheckInSuccess,
}: {
  onCheckInSuccess?: (ticket: TicketView) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [active, setActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanResult, setScanResult] = useState<{
    ok: boolean;
    message: string;
    ticket?: TicketView;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const isScanningRef = useRef(false);
  const lastScannedPayload = useRef<string>("");
  const lastScannedTime = useRef<number>(0);

  // Âm thanh beep phản hồi
  function playBeep(success = true) {
    try {
      const ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = success ? "sine" : "sawtooth";
      osc.frequency.setValueAtTime(success ? 880 : 220, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + (success ? 0.15 : 0.4));
    } catch {
      /* Audio context không khả dụng - bỏ qua */
    }
  }

  async function startCamera() {
    setCameraError("");
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setActive(true);
        isScanningRef.current = true;
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        "Không thể mở Camera. Vui lòng cấp quyền truy cập máy ảnh cho trình duyệt.",
      );
    }
  }

  function stopCamera() {
    isScanningRef.current = false;
    setActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  }

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  async function handleQrCode(codePayload: string) {
    // Chống quét trùng lặp liên tục cùng 1 mã trong 4 giây
    const now = Date.now();
    if (
      codePayload === lastScannedPayload.current &&
      now - lastScannedTime.current < 4000
    ) {
      return;
    }
    lastScannedPayload.current = codePayload;
    lastScannedTime.current = now;

    setBusy(true);
    try {
      const res = await fetch("/api/admin/tickets/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: codePayload }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        playBeep(true);
        setScanResult({
          ok: true,
          message: data.message,
          ticket: data.ticket,
        });
        onCheckInSuccess?.(data.ticket);
      } else {
        playBeep(false);
        setScanResult({
          ok: false,
          message: data.message || "Mã vé không hợp lệ!",
          ticket: data.ticket,
        });
      }
    } catch {
      playBeep(false);
      setScanResult({
        ok: false,
        message: "Lỗi kết nối máy chủ khi kiểm tra vé.",
      });
    } finally {
      setBusy(false);
    }
  }

  function tick() {
    if (!isScanningRef.current || !videoRef.current) return;
    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code && code.data && !busy) {
          handleQrCode(code.data);
        }
      }
    }
    requestAnimationFrame(tick);
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>📷</span>
            <span>Duyệt Vé Bằng Camera (Check-in 15/11)</span>
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Quét mã QR bảo mật động (xoay 30s) trên điện thoại người tham dự để
            duyệt vào cổng.
          </p>
        </div>

        <div>
          {!active ? (
            <button
              type="button"
              onClick={startCamera}
              className="btn-pop rounded-xl bg-[#16a34a] px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-emerald-700"
            >
              🎥 Bật Camera Quét Vé
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-900"
            >
              ⏹ Tắt Camera
            </button>
          )}
        </div>
      </div>

      {cameraError && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          ⚠️ {cameraError}
        </div>
      )}

      {active && (
        <div className="mt-4 grid gap-6 md:grid-cols-[1.4fr_1fr] items-start">
          {/* Khung máy ảnh */}
          <div className="relative overflow-hidden rounded-2xl bg-black aspect-video flex items-center justify-center border-2 border-slate-900 shadow-inner">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Khung ngắm quét QR */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-48 w-48 rounded-2xl border-2 border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                {/* 4 góc viền ngắm */}
                <span className="absolute -left-1 -top-1 h-5 w-5 border-l-4 border-t-4 border-emerald-400" />
                <span className="absolute -right-1 -top-1 h-5 w-5 border-r-4 border-t-4 border-emerald-400" />
                <span className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-emerald-400" />
                <span className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-emerald-400" />
                {/* Đường quét laser chạy lên xuống */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce" />
              </div>
            </div>

            {busy && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs text-white text-xs font-extrabold">
                ⏳ Đang xác thực mã…
              </div>
            )}
          </div>

          {/* Kết quả quét gần nhất */}
          <div className="space-y-4">
            {scanResult ? (
              <div
                className={`rounded-2xl p-5 border ${
                  scanResult.ok
                    ? "border-emerald-300 bg-emerald-50/90 text-emerald-900"
                    : "border-rose-300 bg-rose-50/90 text-rose-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {scanResult.ok ? "✅" : "❌"}
                  </span>
                  <p className="text-sm font-black">
                    {scanResult.ok
                      ? "VÉ HỢP LỆ - ĐÃ VÀO CỔNG"
                      : "TỪ CHỐI DUYỆT VÉ"}
                  </p>
                </div>
                <p className="mt-2 text-xs font-semibold leading-relaxed">
                  {scanResult.message}
                </p>

                {scanResult.ticket && (
                  <div className="mt-3.5 space-y-1.5 rounded-xl bg-white/80 p-3 text-xs text-slate-800 shadow-xs">
                    <p>
                      <strong className="text-slate-500">Mã vé:</strong>{" "}
                      <span className="font-mono font-bold">
                        {scanResult.ticket.code}
                      </span>
                    </p>
                    <p>
                      <strong className="text-slate-500">Người dự:</strong>{" "}
                      <span className="font-bold">
                        {scanResult.ticket.attendeeName || "Theo đoàn"}
                      </span>
                    </p>
                    <p>
                      <strong className="text-slate-500">Loại vé:</strong>{" "}
                      <span>
                        {scanResult.ticket.type === "group"
                          ? `Tập thể (${scanResult.ticket.quantity} suất)`
                          : "Cá nhân"}
                      </span>
                    </p>
                    <p>
                      <strong className="text-slate-500">Áo kỷ niệm:</strong>{" "}
                      <span>
                        {sizesLabel(
                          scanResult.ticket.type,
                          scanResult.ticket.size,
                          scanResult.ticket.sizes,
                        )}
                      </span>
                    </p>
                    <p>
                      <strong className="text-slate-500">Thành tiền:</strong>{" "}
                      <span>{formatVnd(scanResult.ticket.amount)}</span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                Hướng camera vào mã QR vé của người tham dự để kiểm tra tính hợp lệ và check-in vào cổng.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
