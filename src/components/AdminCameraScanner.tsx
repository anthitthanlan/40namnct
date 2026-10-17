"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import toast from "react-hot-toast";
import { type InvitationView, formatVnd, sizesLabel } from "@/lib/invitation-view";
import { type AdminRole, canCheckIn as checkCanCheckIn, canDistributeShirt as checkCanDistributeShirt } from "@/lib/admin";

type ScanHistoryEntry = {
  id: string;
  ok: boolean;
  message: string;
  invitation?: InvitationView;
  time: string;
};

export default function AdminCameraScanner({
  adminRole,
  onCheckInSuccess,
}: {
  adminRole?: AdminRole;
  onCheckInSuccess?: (invitation: InvitationView) => void;
}) {
  const role = adminRole || "super_admin";
  const userCanCheckIn = checkCanCheckIn(role);
  const userCanDistributeShirt = checkCanDistributeShirt(role);

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

  // Trạng thái tạm thời trước khi Submit (0 lên 1, 1 không thể về 0)
  const [pendingCheckIn, setPendingCheckIn] = useState(false);
  const [pendingShirt, setPendingShirt] = useState(false);
  const [groupAttendeeName, setGroupAttendeeName] = useState("");
  const [submitError, setSubmitError] = useState("");

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
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setCameras(videoDevices);
      })
      .catch(console.error);
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

  const tick = useCallback(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");
    setScanResult(null);
    setScannedPayload(null);
    setPendingCheckIn(false);
    setPendingShirt(false);
    setGroupAttendeeName("");
    setSubmitError("");
    isProcessingRef.current = false;

    try {
      let constraints: MediaStreamConstraints = {
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      };

      if (cameras.length > 0) {
        const deviceId = cameras[currentCameraIdx]?.deviceId;
        if (deviceId) {
          constraints = {
            video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
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
  }, [cameras, currentCameraIdx, tick]);

  function switchCamera() {
    stopCamera();
    setCurrentCameraIdx((prev) => (prev + 1) % cameras.length);
  }

  useEffect(() => {
    if (active) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCameraIdx]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

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
        const inv: InvitationView = data.invitation;
        setScanResult({
          ok: true,
          message: "Lấy thông tin thành công.",
          invitation: inv,
        });

        // Thiết lập trạng thái ban đầu:
        // Với vé cá nhân: nếu đã checkin thì khoá, nếu chưa thì mặc định là false
        // Với vé tập thể: nếu đã đủ số lượng thì khoá, nếu chưa đủ thì mặc định là false
        setPendingCheckIn(inv.type === "group" ? false : Boolean(inv.checkedIn));
        setPendingShirt(Boolean(inv.shirtReceived));
        setGroupAttendeeName("");
        setSubmitError("");

        stopCamera(); // Tắt camera sau khi quét thành công
      } else {
        playBeep(false);
        setScanResult({
          ok: false,
          message: data.message || "Mã QR không hợp lệ",
        });
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

  async function handleSubmitAction() {
    if (!scannedPayload || !scanResult?.invitation) return;
    const inv = scanResult.invitation;
    setSubmitError("");

    const isGroup = inv.type === "group";
    const entries = inv.checkinEntries || [];
    const maxQty = inv.quantity || 1;
    const isGroupFull = entries.length >= maxQty;

    // Validate check-in tập thể: bắt buộc nhập tên
    if (isGroup && pendingCheckIn && !isGroupFull) {
      if (!groupAttendeeName.trim()) {
        const errMsg = "Vui lòng nhập họ và tên của người tham dự cho lượt check-in này.";
        setSubmitError(errMsg);
        toast.error(errMsg);
        return;
      }
    }

    // Tính toán cờ hành động
    // Riêng trang quét QR: 0 có thể lên 1, 1 không thể về 0
    const doCheckIn = isGroup
      ? pendingCheckIn && !isGroupFull
      : pendingCheckIn && !inv.checkedIn;
    const doShirt = pendingShirt && !inv.shirtReceived;

    setBusy(true);
    const now = Date.now();

    try {
      const res = await fetch("/api/admin/invitations/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: scannedPayload,
          mode: "submit",
          doCheckIn,
          attendeeName: isGroup ? groupAttendeeName.trim() : undefined,
          doShirt,
        }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        playBeep(true);
        toast.success(data.message || "Đã lưu thành công!");

        if (onCheckInSuccess && data.invitation) {
          onCheckInSuccess(data.invitation);
        }

        // Thêm vào lịch sử
        setScanHistory((prev) => [
          {
            id: `${now}-${Math.random().toString(36).slice(2, 6)}`,
            ok: true,
            message: data.message || "Hoàn tất thao tác",
            invitation: data.invitation || inv,
            time: new Date().toLocaleTimeString("vi-VN"),
          },
          ...prev,
        ].slice(0, 10));

        // Tự động bật lại camera để quét mã tiếp theo
        await startCamera();
      } else {
        playBeep(false);
        const errMsg = data.message || "Có lỗi xảy ra khi lưu thay đổi.";
        setSubmitError(errMsg);
        toast.error(errMsg);

        setScanHistory((prev) => [
          {
            id: `${now}-${Math.random().toString(36).slice(2, 6)}`,
            ok: false,
            message: errMsg,
            invitation: inv,
            time: new Date().toLocaleTimeString("vi-VN"),
          },
          ...prev,
        ].slice(0, 10));
      }
    } catch {
      playBeep(false);
      setSubmitError("Lỗi kết nối máy chủ khi lưu thông tin.");
      toast.error("Lỗi kết nối máy chủ.");
    } finally {
      setBusy(false);
    }
  }

  const currentInv = scanResult?.invitation;
  const isGroup = currentInv?.type === "group";
  const groupEntries = currentInv?.checkinEntries || [];
  const groupMax = currentInv?.quantity || 1;
  const isGroupFull = isGroup && groupEntries.length >= groupMax;

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
              Quét mã thư mời · Tương tác lựa chọn Check-in / Trao áo · Nhấn Submit để lưu và tự động mở camera quét lượt tiếp theo.
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
          </div>
        </div>
      </div>

      {cameraError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <span className="material-symbols-rounded text-lg">warning</span> {cameraError}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] items-start">
        {/* Cột trái: Máy ảnh và Chi tiết vé đang quét */}
        <div className="flex flex-col gap-6">
          {/* Khung máy ảnh */}
          <div className={`${scanResult ? "hidden" : "flex"} relative overflow-hidden rounded-2xl bg-black aspect-video items-center justify-center border-2 shadow-inner border-slate-800`}>
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
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs text-white text-xs font-extrabold gap-2">
                    <span className="material-symbols-rounded animate-spin">progress_activity</span> Đang đọc mã…
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

          {/* Chi tiết vé sau khi quét */}
          {scanResult && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              {!scanResult.ok ? (
                <div className="flex flex-col items-center justify-center text-center text-rose-600 py-8">
                  <span className="material-symbols-rounded text-5xl mb-2">error</span>
                  <p className="font-bold text-lg">{scanResult.message}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="mt-4 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all"
                  >
                    Quét lại
                  </button>
                </div>
              ) : currentInv ? (
                <div className="flex flex-col">
                  {/* Người đại diện & Mã vé */}
                  <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-rounded text-2xl">
                        {isGroup ? "groups" : "person"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-xl text-slate-900 truncate">
                        {currentInv.attendeeName || "Theo đoàn"}
                      </h4>
                      <p className="text-sm font-mono text-slate-500 flex items-center gap-2">
                        <span>{currentInv.code}</span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isGroup ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {isGroup ? `Tập thể (${groupMax} suất)` : "Cá nhân"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Thông tin vé cơ bản */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Áo & F&B</p>
                      <p className="font-bold text-slate-800 mt-1 text-sm">
                        {sizesLabel(
                          currentInv.type,
                          currentInv.size,
                          currentInv.sizes,
                        ) || "Không áo"}
                        <span className="mx-1 text-slate-300">|</span>
                        {currentInv.snacks} F&B
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Đóng góp</p>
                      <p className="font-bold text-amber-700 mt-1 text-sm">{formatVnd(currentInv.amount)}</p>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 rounded-xl p-4 mb-6 border border-amber-100/50 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentInv.nienKhoa && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Niên khóa / Lớp</p>
                          <p className="font-bold text-slate-700 mt-0.5">{currentInv.nienKhoa}</p>
                        </div>
                      )}
                      {(currentInv as any).memberPhone && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Số điện thoại</p>
                          <p className="font-bold text-slate-700 mt-0.5">{(currentInv as any).memberPhone}</p>
                        </div>
                      )}
                      {(currentInv as any).memberEmail && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Email</p>
                          <p className="font-bold text-slate-700 mt-0.5">{(currentInv as any).memberEmail}</p>
                        </div>
                      )}
                    </div>
                    {currentInv.note && (
                      <div className="mt-3 pt-3 border-t border-amber-100/50">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Ghi chú</p>
                        <p className="font-medium text-slate-700 mt-0.5">{currentInv.note}</p>
                      </div>
                    )}
                  </div>

                  {/* KHU VỰC THAO TÁC (TICK CHỌN & NHẬP LIỆU) */}
                  <div className="space-y-5 rounded-2xl border-2 border-indigo-100 bg-indigo-50/30 p-5 mb-6">
                    <h5 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <span className="material-symbols-rounded text-[18px]">checklist</span>
                      Thao tác xử lý thư mời
                    </h5>

                    {/* 1. Phần Check-in */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                          <span className="material-symbols-rounded text-emerald-600">gps_fixed</span>
                          Check-in vào cổng
                        </span>

                        {isGroup ? (
                          <span className="text-xs font-extrabold text-slate-600">
                            Đã check-in: <strong className="text-emerald-700">{groupEntries.length}</strong> / {groupMax}
                          </span>
                        ) : currentInv.checkedIn ? (
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <span className="material-symbols-rounded text-[14px]">check_circle</span>
                            Đã Check-in
                          </span>
                        ) : null}
                      </div>

                      {/* Danh sách người trong đoàn đã check-in trước đó (nếu là tập thể) */}
                      {isGroup && groupEntries.length > 0 && (
                        <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-xs space-y-1.5 max-h-36 overflow-y-auto">
                          <p className="text-[11px] font-bold text-slate-400 uppercase">Danh sách người đã check-in trong đoàn:</p>
                          {groupEntries.map((entry, idx) => (
                            <div key={idx} className="flex items-center justify-between text-slate-700 py-0.5 border-b border-slate-100 last:border-0">
                              <span className="font-semibold">{idx + 1}. {entry.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(entry.time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Danh sách thành viên đăng ký trước (nếu có) */}
                      {isGroup && Array.isArray(currentInv.attendees) && currentInv.attendees.length > 0 && (
                        <div className="rounded-xl bg-indigo-50/60 p-3 border border-indigo-100 text-xs space-y-2">
                          <p className="text-[11px] font-extrabold text-indigo-900 uppercase flex items-center gap-1.5">
                            <span className="material-symbols-rounded text-sm text-indigo-600">groups</span>
                            Danh sách thành viên đăng ký trước:
                          </p>
                          <div className="space-y-1.5 max-h-44 overflow-y-auto">
                            {currentInv.attendees.map((att, idx) => {
                              const checkedEntry = groupEntries.find(
                                (e) => e.name.trim().toLowerCase() === att.name.trim().toLowerCase()
                              );
                              const isChecked = Boolean(checkedEntry);
                              const isSelectingThis = groupAttendeeName.trim().toLowerCase() === att.name.trim().toLowerCase();

                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                                    isChecked
                                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                                      : isSelectingThis
                                        ? "bg-indigo-100/80 border-indigo-300 text-indigo-950 ring-1 ring-indigo-400"
                                        : "bg-white border-indigo-100 text-slate-800"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[11px] font-mono text-slate-400">{idx + 1}.</span>
                                    <span className="font-bold truncate">{att.name}</span>
                                    {att.isLeader && (
                                      <span className="text-[9px] uppercase font-extrabold bg-indigo-200 text-indigo-800 px-1.5 py-0.2 rounded shrink-0">
                                        Trưởng đoàn
                                      </span>
                                    )}
                                  </div>

                                  {isChecked ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 shrink-0">
                                      <span className="material-symbols-rounded text-sm">check_circle</span>
                                      Đã vào
                                    </span>
                                  ) : !isGroupFull && userCanCheckIn ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setGroupAttendeeName(att.name);
                                        setPendingCheckIn(true);
                                      }}
                                      className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
                                    >
                                      <span>Chọn check-in</span>
                                      <span className="material-symbols-rounded text-xs">arrow_forward</span>
                                    </button>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Input check-in cho tập thể */}
                      {isGroup ? (
                        isGroupFull ? (
                          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
                            <span className="material-symbols-rounded text-base">check_circle</span>
                            Đoàn đã check-in đủ tất cả {groupMax} suất tham dự.
                          </div>
                        ) : (
                          <div className="space-y-3 pt-2 border-t border-slate-100">
                            <label className={`flex items-center gap-3 cursor-pointer select-none ${!userCanCheckIn ? "opacity-50 pointer-events-none" : ""}`}>
                              <input
                                type="checkbox"
                                checked={pendingCheckIn}
                                disabled={!userCanCheckIn}
                                onChange={(e) => setPendingCheckIn(e.target.checked)}
                                className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-xs font-extrabold text-slate-800">
                                Check-in lượt tiếp theo (Lượt {groupEntries.length + 1}/{groupMax})
                              </span>
                              {!userCanCheckIn && (
                                <span className="text-[11px] text-rose-500 font-bold">(Chỉ bộ phận check-in)</span>
                              )}
                            </label>

                            {pendingCheckIn && (
                              <div className="space-y-1.5 pl-8">
                                <label className="block text-[11px] font-bold uppercase text-slate-500">
                                  Họ và tên người tham dự lượt này <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={groupAttendeeName}
                                  onChange={(e) => setGroupAttendeeName(e.target.value)}
                                  placeholder="Nhập tên người tham dự trong đoàn..."
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                        )
                      ) : (
                        /* Toggle cho vé cá nhân: 0 có thể lên 1, 1 không thể về 0 */
                        <div className="pt-1">
                          <label className={`flex items-center gap-3 select-none ${
                            currentInv.checkedIn
                              ? "cursor-not-allowed opacity-80"
                              : !userCanCheckIn
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer"
                          }`}>
                            <input
                              type="checkbox"
                              checked={pendingCheckIn}
                              disabled={currentInv.checkedIn || !userCanCheckIn}
                              onChange={(e) => {
                                // 1 không thể về 0 trên trang QR
                                if (currentInv.checkedIn) return;
                                setPendingCheckIn(e.target.checked);
                              }}
                              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-75"
                            />
                            <span className="text-xs font-extrabold text-slate-800">
                              {currentInv.checkedIn ? "Đã Check-in vào cổng (Đã lưu)" : "Xác nhận Check-in vào cổng"}
                            </span>
                            {!userCanCheckIn && !currentInv.checkedIn && (
                              <span className="text-[11px] text-rose-500 font-bold">(Chỉ bộ phận check-in)</span>
                            )}
                          </label>
                        </div>
                      )}
                    </div>

                    {/* 2. Phần Trao áo: 0 có thể lên 1, 1 không thể về 0 */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                          <span className="material-symbols-rounded text-orange-600">checkroom</span>
                          Trao áo kỷ niệm & Quà
                        </span>

                        {currentInv.shirtReceived ? (
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                            <span className="material-symbols-rounded text-[14px]">check_circle</span>
                            Đã trao áo
                          </span>
                        ) : null}
                      </div>

                      <div className="pt-1">
                        <label className={`flex items-center gap-3 select-none ${
                          currentInv.shirtReceived
                            ? "cursor-not-allowed opacity-80"
                            : !userCanDistributeShirt
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer"
                        }`}>
                          <input
                            type="checkbox"
                            checked={pendingShirt}
                            disabled={currentInv.shirtReceived || !userCanDistributeShirt}
                            onChange={(e) => {
                              // 1 không thể về 0 trên trang QR
                              if (currentInv.shirtReceived) return;
                              setPendingShirt(e.target.checked);
                            }}
                            className="h-5 w-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 disabled:opacity-75"
                          />
                          <span className="text-xs font-extrabold text-slate-800">
                            {currentInv.shirtReceived ? "Đã trao áo (Đã lưu)" : "Xác nhận Trao áo & vật phẩm"}
                          </span>
                          {!userCanDistributeShirt && !currentInv.shirtReceived && (
                            <span className="text-[11px] text-rose-500 font-bold">(Không có quyền trao áo)</span>
                          )}
                        </label>
                      </div>
                    </div>

                    {submitError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
                        <span className="material-symbols-rounded text-base">error</span>
                        {submitError}
                      </div>
                    )}
                  </div>

                  {/* NÚT SUBMIT DUY NHẤT */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleSubmitAction}
                      className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 py-3.5 px-6 font-black text-sm text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {busy ? (
                        <>
                          <span className="material-symbols-rounded animate-spin">progress_activity</span>
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-rounded">task_alt</span>
                          <span>Xác nhận & Hoàn tất (Submit)</span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-center text-slate-400 font-medium">
                      Nhấn Submit để lưu trạng thái và tự động mở lại camera quét thư mời tiếp theo.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Cột phải: Lịch sử hành động */}
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
              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                {scanHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-start gap-2 rounded-xl px-2.5 py-2 text-[11px] ${
                      entry.ok
                        ? "bg-white border border-slate-200/80 shadow-xs"
                        : "bg-rose-50 border border-rose-100"
                    }`}
                  >
                    <span
                      className={`material-symbols-rounded text-[16px] mt-0.5 shrink-0 ${
                        entry.ok ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
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
