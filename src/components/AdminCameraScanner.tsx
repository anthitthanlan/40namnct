"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import { type InvitationView, formatVnd, sizesLabel } from "@/lib/invitation-view";

type ScanMode = "checkin" | "shirt" | "info";

type ScanHistoryEntry = {
  id: string;
  ok: boolean;
  mode: ScanMode;
  message: string;
  invitation?: InvitationView;
  time: string;
};

export default function AdminCameraScanner({
  onCheckInSuccess,
}: {
  onCheckInSuccess?: (invitation: InvitationView) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [active, setActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [busy, setBusy] = useState(false);
  
  // Danh sách camera và camera hiện tại
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIdx, setCurrentCameraIdx] = useState(0);

  // Kết quả sau khi quét (chưa thực hiện action)
  const [scannedPayload, setScannedPayload] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    ok: boolean;
    message: string;
    invitation?: InvitationView;
  } | null>(null);
  
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);
  
  const isScanningRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Âm thanh beep
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
      // bỏ qua
    }
  }

  // Lấy danh sách camera
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setCameras(videoDevices);
    }).catch(console.error);
  }, []);

  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    setActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");
    setScanResult(null);
    setScannedPayload(null);
    isProcessingRef.current = false; // Reset processing state
    
    try {
      let constraints: MediaStreamConstraints = {
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      };
      
      // Nếu có nhiều camera và đã chọn index
      if (cameras.length > 0) {
        const deviceId = cameras[currentCameraIdx].deviceId;
        if (deviceId) {
          constraints = {
            video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          };
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
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
  }, [cameras, currentCameraIdx]);

  function switchCamera() {
    stopCamera();
    setCurrentCameraIdx((prev) => (prev + 1) % cameras.length);
  }

  // Khởi động lại camera nếu index thay đổi
  useEffect(() => {
    if (active) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCameraIdx]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  async function handleAction(mode: "checkin" | "shirt") {
    if (!scannedPayload) return;
    setBusy(true);
    const now = Date.now();
    try {
      const res = await fetch("/api/admin/invitations/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: scannedPayload, mode }),
      });
      const data = await res.json();
      
      if (res.ok && data.ok) {
        playBeep(true);
        // Cập nhật lại kết quả hiển thị với thông tin vé mới nhất
        setScanResult({
          ok: true,
          message: data.message,
          invitation: data.invitation,
        });
        
        if (mode === "checkin" && onCheckInSuccess && data.invitation) {
          onCheckInSuccess(data.invitation);
        }
      } else {
        playBeep(false);
        alert(data.message || "Có lỗi xảy ra khi thực hiện hành động.");
      }

      if (res.ok && data.ok) {
        setScanHistory((prev) => [
          {
            id: `${now}-${Math.random().toString(36).slice(2, 6)}`,
            ok: true,
            mode: mode,
            message: data.message || "Thành công",
            invitation: data.invitation || scanResult?.invitation,
            time: new Date().toLocaleTimeString("vi-VN"),
          },
          ...prev,
        ].slice(0, 10));
      }

    } catch (err) {
      playBeep(false);
      alert("Lỗi kết nối máy chủ.");
    } finally {
      setBusy(false);
    }
  }

  async function fetchQrInfo(codePayload: string) {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/invitations/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: codePayload, mode: "info" }),
      });
      const data = await res.json();
      
      if (res.ok && data.ok) {
        playBeep(true);
        setScannedPayload(codePayload);
        setScanResult({
          ok: true,
          message: "Lấy thông tin thành công. Chọn hành động bên dưới.",
          invitation: data.invitation,
        });
        stopCamera(); // Tắt camera sau khi quét thành công
      } else {
        playBeep(false);
        setScanResult({
          ok: false,
          message: data.message || "Mã QR không hợp lệ",
        });
        // Lỗi QR (không hợp lệ, etc.) => Có thể quét tiếp mã khác sau 1.5s
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1500);
      }
    } catch {
      playBeep(false);
      setScanResult({
        ok: false,
        message: "Lỗi kết nối máy chủ.",
      });
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1500);
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
        if (code && code.data && !isProcessingRef.current) {
          fetchQrInfo(code.data);
        }
      }
    }
    if (isScanningRef.current) {
      requestAnimationFrame(tick);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="material-symbols-rounded inline-block align-middle text-[1em]">qr_code_scanner</span>
              <span>Quét QR Sự kiện 08/11</span>
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Hướng camera vào mã để xem thông tin trước khi thực hiện Check-in / Trao áo.
            </p>
          </div>

          <div className="flex gap-2">
            {!active && !scanResult ? (
              <button
                type="button"
                onClick={startCamera}
                className="btn-lightship rounded-xl bg-slate-800 hover:bg-slate-900 px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all"
              >
                <span className="material-symbols-rounded inline-block align-middle text-[1em]">videocam</span> Bật Camera
              </button>
            ) : null}
            
            {active && (
              <>
                {cameras.length > 1 && (
                  <button
                    type="button"
                    onClick={switchCamera}
                    className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition-all"
                  >
                    <span className="material-symbols-rounded inline-block align-middle text-[1em]">cameraswitch</span> Đổi Cam
                  </button>
                )}
                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2.5 text-xs font-bold transition-all"
                >
                  <span className="material-symbols-rounded inline-block align-middle text-[1em]">stop_circle</span> Tắt Camera
                </button>
              </>
            )}
            
            {scanResult && !active && (
              <button
                type="button"
                onClick={startCamera}
                className="btn-lightship rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all"
              >
                <span className="material-symbols-rounded inline-block align-middle text-[1em]">qr_code_scanner</span> Quét mã khác
              </button>
            )}
          </div>
        </div>
      </div>

      {cameraError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <span className="material-symbols-rounded inline-block align-middle text-[1em]">warning</span> {cameraError}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] items-start">
        {/* Cột trái: Máy ảnh và Kết quả */}
        <div className="flex flex-col gap-6">
          {/* Khung máy ảnh */}
          <div className={`${scanResult ? 'hidden' : 'flex'} relative overflow-hidden rounded-2xl bg-black aspect-video items-center justify-center border-2 shadow-inner border-slate-800`}>
            <video
              ref={videoRef}
              className={`h-full w-full object-cover ${active ? "block" : "hidden"}`}
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />

            {active ? (
              <>
                {/* Khung ngắm quét QR */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-48 w-48 rounded-2xl border-2 border-indigo-400/80 shadow-[0_0_30px_rgba(79,70,229,0.3)]">
                    <span className="absolute -left-1 -top-1 h-5 w-5 border-l-4 border-t-4 border-indigo-400" />
                    <span className="absolute -right-1 -top-1 h-5 w-5 border-r-4 border-t-4 border-indigo-400" />
                    <span className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-indigo-400" />
                    <span className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-indigo-400" />
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-bounce" />
                  </div>
                </div>

                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs text-white text-xs font-extrabold">
                    <span className="material-symbols-rounded inline-block align-middle text-[1em]">hourglass_empty</span> Đang đọc mã…
                  </div>
                )}
              </>
            ) : !scanResult && (
              <div className="flex flex-col items-center justify-center text-slate-500 gap-3">
                <span className="material-symbols-rounded text-4xl opacity-50">qr_code_scanner</span>
                <p className="text-sm font-medium">Bật camera để bắt đầu quét</p>
              </div>
            )}
          </div>

          {/* Kết quả scan nằm dưới camera */}
          {scanResult && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              {!scanResult.ok ? (
                <div className="flex flex-col items-center justify-center text-center text-rose-600 py-8">
                  <span className="material-symbols-rounded text-5xl mb-2">error</span>
                  <p className="font-bold text-lg">{scanResult.message}</p>
                </div>
              ) : scanResult.invitation ? (
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-rounded text-2xl">person</span>
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-slate-900">
                        {scanResult.invitation.attendeeName || "Theo đoàn"}
                      </h4>
                      <p className="text-sm font-mono text-slate-500">
                        {scanResult.invitation.code}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Loại vé</p>
                      <p className="font-bold text-slate-800 mt-1 text-sm">
                        {scanResult.invitation.type === "group"
                          ? `Tập thể (${scanResult.invitation.quantity} suất)`
                          : "Cá nhân"}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Áo & F&B</p>
                      <p className="font-bold text-slate-800 mt-1 text-sm">
                        {sizesLabel(
                          scanResult.invitation.type,
                          scanResult.invitation.size,
                          scanResult.invitation.sizes,
                        ) || "Không áo"}
                        <span className="mx-1 text-slate-300">|</span>
                        {scanResult.invitation.snacks} F&B
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 rounded-xl p-4 mb-6 border border-amber-100/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Đóng góp</p>
                        <p className="font-bold text-amber-700 mt-1 text-sm">{formatVnd(scanResult.invitation.amount)}</p>
                      </div>
                      {scanResult.invitation.nienKhoa && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Niên khóa / Lớp</p>
                          <p className="font-bold text-slate-700 mt-1 text-sm">{scanResult.invitation.nienKhoa}</p>
                        </div>
                      )}
                      {(scanResult.invitation as any).memberPhone && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Số điện thoại</p>
                          <p className="font-bold text-slate-700 mt-1 text-sm">{(scanResult.invitation as any).memberPhone}</p>
                        </div>
                      )}
                      {(scanResult.invitation as any).memberEmail && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Email</p>
                          <p className="font-bold text-slate-700 mt-1 text-sm">{(scanResult.invitation as any).memberEmail}</p>
                        </div>
                      )}
                    </div>
                    {scanResult.invitation.note && (
                      <div className="mt-4 pt-4 border-t border-amber-100/50">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Ghi chú</p>
                        <p className="font-medium text-slate-700 mt-1 text-[13px]">{scanResult.invitation.note}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleAction("checkin")}
                      disabled={busy || scanResult.invitation?.checkedIn}
                      className={`flex-1 rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        scanResult.invitation?.checkedIn
                          ? "bg-gradient-to-tr from-emerald-100 to-emerald-50 text-emerald-600 border border-emerald-200 cursor-not-allowed"
                          : "bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white hover:from-emerald-800 hover:to-emerald-600 shadow-md hover:shadow-lg"
                      }`}
                    >
                      <span className="material-symbols-rounded text-[18px]">
                        {scanResult.invitation?.checkedIn ? "check_circle" : "gps_fixed"}
                      </span>
                      {scanResult.invitation?.checkedIn ? "Đã Check-in" : "Check-in"}
                    </button>
                    
                    <button
                      onClick={() => handleAction("shirt")}
                      disabled={busy || scanResult.invitation?.shirtReceived}
                      className={`flex-1 rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        scanResult.invitation?.shirtReceived
                          ? "bg-gradient-to-tr from-orange-50 to-red-50 text-red-600 border border-red-200 cursor-not-allowed"
                          : "bg-gradient-to-tr from-orange-600 to-red-500 text-white hover:from-orange-700 hover:to-red-600 shadow-md hover:shadow-lg"
                      }`}
                    >
                      <span className="material-symbols-rounded text-[18px]">
                        {scanResult.invitation?.shirtReceived ? "check_circle" : "checkroom"}
                      </span>
                      {scanResult.invitation?.shirtReceived ? "Đã trao áo" : "Trao áo"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Lịch sử hành động */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 min-h-[300px]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-rounded text-[14px]">history</span>
                Lịch sử hành động
              </h4>
              {scanHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setScanHistory([])}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Xoá
                </button>
              )}
            </div>
            
            {scanHistory.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-xs text-slate-400 italic">
                Chưa có dữ liệu lịch sử
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {scanHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-start gap-2 rounded-xl px-2 py-1.5 text-[11px] ${
                      entry.ok
                        ? entry.mode === "shirt"
                          ? "bg-gradient-to-tr from-orange-50 to-red-50 border border-red-100"
                          : "bg-gradient-to-tr from-emerald-100 to-emerald-50 border border-emerald-200"
                        : "bg-rose-50 border border-rose-100"
                    }`}
                  >
                    <span className={`material-symbols-rounded text-[14px] mt-0.5 shrink-0 ${
                      entry.ok
                        ? entry.mode === "shirt" ? "text-red-600" : "text-emerald-700"
                        : "text-rose-500"
                    }`}>
                      {entry.ok ? "check_circle" : "cancel"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {entry.invitation?.attendeeName || entry.invitation?.code || "—"}
                      </p>
                      <p className="text-slate-500 text-[10px] leading-relaxed break-words">{entry.message}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{entry.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
