"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { buildEmvQrPayload } from "@/lib/emvqr";
import type { PayBankConfig } from "@/lib/emvqr";
import MobileUploadModal from "./MobileUploadModal";
import { SchoolBuildLoader } from "./SchoolBuildLoader";

// ============================================================
// Types
// ============================================================

type BankInfo = {
  bank: PayBankConfig;
  amount: number;
  addInfo: string;
  ticketCode: string;
  status: string;
};

type UploadState =
  | { phase: "idle" }
  | { phase: "preview"; file: File; objectUrl: string }
  | { phase: "uploading" }
  | { phase: "success"; confidence: "high" | "low"; message: string }
  | { phase: "mismatch"; message: string; canRetry: boolean; attemptsLeft: number }
  | { phase: "mismatch_fallback"; message: string }
  | { phase: "system_error"; message: string; attemptsLeft: number }
  | { phase: "error"; message: string };

// ============================================================
// Helpers
// ============================================================

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

function copyToClipboard(text: string, onCopied: () => void) {
  navigator.clipboard.writeText(text).then(onCopied).catch(() => {});
}

const SESSION_KEY = "nct40_xacnhan_ticketId";

// ============================================================
// Sub-components
// ============================================================

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        copyToClipboard(text, () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
      }
      className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors"
      style={
        copied
          ? { background: "#dcfce7", color: "#16a34a" }
          : { background: "#f1f5f9", color: "#475569" }
      }
    >
      {copied ? "Đã chép" : label ?? "Chép"}
    </button>
  );
}

function QrCanvas({
  amount,
  addInfo,
  bank,
}: {
  amount: number;
  addInfo: string;
  bank: PayBankConfig;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !addInfo || !bank.bin) return;
    const payload = buildEmvQrPayload(amount, addInfo, bank);
    QRCode.toCanvas(canvasRef.current, payload, {
      width: 220,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    }).catch(console.error);
  }, [amount, addInfo, bank]);

  return (
    <div className="relative flex items-center justify-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm w-fit mx-auto">
      <canvas ref={canvasRef} className="rounded-lg block" />
    </div>
  );
}

function UploadZone({
  onFileSelected,
  disabled,
}: {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (disabled) return;
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"].includes(file.type)) {
        alert("Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("Ảnh quá lớn. Vui lòng chọn ảnh dưới 10MB.");
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected, disabled],
  );

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 w-full min-h-[260px] cursor-pointer transition-all duration-200 select-none ${
        disabled
          ? "opacity-40 cursor-not-allowed border-gray-200 bg-gray-50"
          : dragging
            ? "border-blue-500 bg-blue-50/60 scale-[1.01]"
            : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 active:scale-[0.99]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
        disabled={disabled}
      />
      <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
      </div>
      <div className="text-center">
        <p className="font-semibold text-gray-800 text-sm">
          Tải ảnh biên lai chuyển khoản
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Kéo thả, bấm để chọn, hoặc{" "}
          <span className="text-blue-600 font-semibold">chụp từ camera</span>
        </p>
        <p className="text-[11px] text-gray-400 mt-1">JPEG · PNG · WebP · tối đa 10MB</p>
      </div>
    </div>
  );
}

// ============================================================
// Main Content
// ============================================================

export default function XacNhanDongGopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [ticketId, setTicketId] = useState<string>(() => {
    const fromUrl = searchParams.get("id") || "";
    if (fromUrl) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(SESSION_KEY, fromUrl);
      }
      return fromUrl;
    }
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(SESSION_KEY) || "";
    }
    return "";
  });

  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const [uploadState, setUploadState] = useState<UploadState>({ phase: "idle" });

  useEffect(() => {
    if (!ticketId) {
      setLoadError("Không tìm thấy mã phiếu đăng ký. Vui lòng quay lại trang đăng ký.");
      setLoading(false);
      return;
    }

    fetch(`/api/payment/bank-info?ticketId=${ticketId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          setLoadError(data.message || "Không tải được thông tin đóng góp.");
        } else {
          setBankInfo(data);
          if (ticketId !== "DEV") {
            if (data.status === "confirmed") {
              setUploadState({
                phase: "success",
                confidence: "high",
                message: "Thư mời của bạn đã được thanh toán và kích hoạt thành công!"
              });
            } else if (data.status === "pending_approval") {
              setUploadState({
                phase: "success",
                confidence: "low",
                message: "Giao dịch đã được đưa vào hàng chờ. Ban Tổ chức sẽ đối soát và xác nhận trong vòng 24 giờ."
              });
              setIsMobileModalOpen(true);
            }
          }
        }
      })
      .catch(() => setLoadError("Lỗi kết nối. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, [ticketId, router]);

  function handleFileSelected(file: File) {
    const objectUrl = URL.createObjectURL(file);
    setUploadState({ phase: "preview", file, objectUrl });
  }

  async function handleSubmit() {
    if (uploadState.phase !== "preview") return;
    const { file } = uploadState;

    setUploadState({ phase: "uploading" });

    try {
      const formData = new FormData();
      formData.append("receipt", file);
      formData.append("ticketId", ticketId);

      const res = await fetch("/api/payment/verify-receipt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.confidence === "system_error") {
          setUploadState({
            phase: "system_error",
            message: data.message,
            attemptsLeft: data.attemptsLeft || 0,
          });
        } else if (data.confidence === "mismatch_fallback") {
          setUploadState({
            phase: "mismatch_fallback",
            message: data.message,
          });
        } else if (data.confidence === "mismatch") {
          setUploadState({
            phase: "mismatch",
            message: data.message || "Không thể xác minh ảnh.",
            canRetry: data.canRetry !== false,
            attemptsLeft: data.attemptsLeft || 0,
          });
        } else {
          setUploadState({
            phase: "error",
            message: data.message || "Đã xảy ra lỗi hệ thống.",
          });
        }
        return;
      }

      setUploadState({
        phase: "success",
        confidence: data.confidence === "high" ? "high" : "low",
        message: data.message || (data.confidence === "high"
            ? "Biên lai hợp lệ, vé của bạn đã được kích hoạt!"
            : "Giao dịch đã được đưa vào hàng chờ. Ban Tổ chức sẽ đối soát và xác nhận trong vòng 24 giờ."),
      });
      
      // Auto redirect to ticket after 3 seconds on success (if not dev mode)
      if (ticketId !== "DEV" && data.confidence === "high") {
        setTimeout(() => {
          router.replace(`/thu-moi?id=${ticketId}`);
        }, 3000);
      }
    } catch (err) {
      setUploadState({
        phase: "error",
        message: "Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.",
      });
    }
  }

  function handleCancelPreview() {
    if (uploadState.phase === "preview") {
      URL.revokeObjectURL(uploadState.objectUrl);
    }
    setUploadState({ phase: "idle" });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 px-6">
        <p className="text-center text-gray-700 font-medium max-w-sm">{loadError}</p>
        <a
          href="/dang-ky"
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Quay lại đăng ký
        </a>
      </main>
    );
  }

  const info = bankInfo!;

  // Reusable Upload View content
  const uploadContent = (
    <div className="flex flex-col gap-4">
      <div className="hidden md:block mb-2">
        <h2 className="font-extrabold text-gray-900 text-xl">Xác nhận đóng góp</h2>
        <p className="text-sm text-gray-500 mt-1">
          Chụp hoặc chọn ảnh biên lai chuyển khoản từ app ngân hàng của bạn.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {uploadState.phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <UploadZone onFileSelected={handleFileSelected} />
          </motion.div>
        )}

        {uploadState.phase === "preview" && (
          <motion.div key="preview" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-100 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={uploadState.objectUrl} alt="Biên lai chuyển khoản" className="w-auto h-auto max-h-[40vh] md:max-h-80 object-contain" />
              <button
                type="button"
                onClick={handleCancelPreview}
                className="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full text-sm font-bold flex items-center justify-center hover:bg-black/70 backdrop-blur-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelPreview}
                className="flex-1 py-3.5 rounded-xl border-2 border-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Chọn lại
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 active:scale-[0.98] transition-all"
              >
                Xác nhận
              </button>
            </div>
          </motion.div>
        )}

        {uploadState.phase === "uploading" && (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-6 py-10">

            <div className="flex flex-col items-center gap-3">
              <SchoolBuildLoader size={40} color="#2563eb" className="mb-2" />
              <div className="text-center">
                <p className="font-bold text-gray-900">Hệ thống đang xác minh giao dịch…</p>
                <p className="text-[13px] text-gray-500 mt-1">Thường mất 10–30 giây</p>
              </div>
            </div>
          </motion.div>
        )}

        {uploadState.phase === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-3xl p-6 text-center space-y-4 bg-gray-50`}>
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center shadow-sm mb-2 ${
              uploadState.confidence === "high" ? "bg-gradient-to-tr from-green-600 to-green-400" : "bg-white"
            }`}>
              {uploadState.confidence === "high" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              )}
            </div>
            <h3 className="font-extrabold text-xl text-gray-900">
              {uploadState.confidence === "high" ? "Thành công!" : "Đã vào hàng chờ"}
            </h3>
            <p className="text-[15px] leading-relaxed text-gray-600">
              {uploadState.message}
            </p>
            <button
              onClick={() => {
                setIsMobileModalOpen(false);
                setIsExiting(true);
                router.push(`/thu-moi?id=${ticketId === "DEV" ? "sample" : ticketId}`);
              }}
              className="inline-block text-center mt-4 w-full py-3.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-black transition-colors"
            >
              Xem thư mời
            </button>
          </motion.div>
        )}

        {uploadState.phase === "mismatch" && (
          <motion.div key="mismatch" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl bg-gray-50 p-6 space-y-4">
            <div className="flex gap-4">
              <div className="mt-1 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">Chưa thể xác nhận</p>
                <p className="text-[14px] text-gray-600 mt-1.5 leading-relaxed">
                  {uploadState.message}
                </p>
              </div>
            </div>
            {uploadState.canRetry && (
              <button
                type="button"
                onClick={() => setUploadState({ phase: "idle" })}
                className="w-full mt-2 py-3.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-black transition-colors"
              >
                Tải ảnh lại (Còn {uploadState.attemptsLeft} lần)
              </button>
            )}
          </motion.div>
        )}

        {uploadState.phase === "system_error" && (
          <motion.div key="system_error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl p-6 text-center space-y-4 bg-gray-50">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-tr from-red-600 to-orange-400 shadow-sm mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <h3 className="font-extrabold text-xl text-gray-900">
              Lỗi hệ thống
            </h3>
            <p className="text-[15px] leading-relaxed text-gray-600">
              {uploadState.message}
            </p>
            <div className="flex gap-3 mt-4">
              {(ticketId === "DEV" || uploadState.attemptsLeft > 0) && (
                <button
                  type="button"
                  onClick={() => setUploadState({ phase: "idle" })}
                  className="flex-1 py-3.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-black transition-colors"
                >
                  Thử lại {ticketId !== "DEV" && `(Còn ${uploadState.attemptsLeft} lần)`}
                </button>
              )}
              <button
                onClick={() => {
                  setIsMobileModalOpen(false);
                  setIsExiting(true);
                  router.push(`/thu-moi?id=${ticketId === "DEV" ? "sample" : ticketId}`);
                }}
                className="flex-1 py-3.5 rounded-xl bg-gray-200 text-gray-800 font-bold hover:bg-gray-300 transition-colors flex items-center justify-center"
              >
                Xem thư mời
              </button>
            </div>
          </motion.div>
        )}

        {uploadState.phase === "mismatch_fallback" && (
          <motion.div key="mismatch_fallback" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl bg-gray-50 p-6 space-y-4">
            <div className="flex gap-4">
              <div className="mt-1 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">Chuyển duyệt thủ công</p>
                <p className="text-[14px] text-gray-600 mt-1.5 leading-relaxed">
                  {uploadState.message}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {uploadState.phase === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-3xl bg-gray-50 p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            </div>
            <p className="text-[15px] font-semibold text-gray-800">
              {uploadState.message}
            </p>
            <button
              type="button"
              onClick={() => setUploadState({ phase: "idle" })}
              className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-black transition-colors"
            >
              Thử lại
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const isConfirmed = ticketId !== "DEV" && bankInfo?.status === "confirmed";

  return (
    <main className="min-h-screen bg-gray-50 pt-24 pb-32 md:pb-24 px-4 md:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center md:text-left md:px-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Chuyển khoản Đóng góp
          </h1>
          <p className="text-gray-500 mt-1.5 text-sm font-medium">
            Mã phiếu: <span className="font-mono text-gray-900">{info.ticketCode}</span>
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row items-start gap-8">
          
          {/* Cột trái: Thông tin chuyển khoản */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="w-full md:w-1/2 flex flex-col gap-8"
          >
            {/* Box 1: QR Code & Header */}
            {!isConfirmed && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center">
                <QrCanvas amount={info.amount} addInfo={info.addInfo} bank={info.bank} />
                <p className="text-center text-[13px] text-slate-500 mt-5 font-semibold">
                  Quét QR bằng ứng dụng ngân hàng để đóng góp
                </p>
              </div>
            )}

            {/* Box 2: Thông tin chuyển khoản chi tiết */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="space-y-4">
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-[13px] text-gray-500 font-medium">Ngân hàng</span>
                  <span className="text-[15px] font-bold text-gray-900">{info.bank.shortName}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-[13px] text-gray-500 font-medium">Chủ tài khoản</span>
                  <span className="text-[15px] font-bold text-gray-900">{info.bank.accountName}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-[13px] text-gray-500 font-medium">Số tài khoản</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[16px] font-mono font-bold text-gray-900">{info.bank.account}</span>
                    <CopyButton text={info.bank.account} />
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-[13px] text-gray-500 font-medium">Số tiền (VND)</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[16px] font-bold text-blue-700">{formatVnd(info.amount)}</span>
                    <CopyButton text={String(info.amount)} />
                  </div>
                </div>
                
                <div className="pt-2 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-gray-500 font-medium">Nội dung chuyển khoản</span>
                    <CopyButton text={info.addInfo} />
                  </div>
                  <div className="bg-slate-50 border border-slate-100 text-slate-800 font-mono text-base font-bold p-4 rounded-xl text-center break-all">
                    {info.addInfo}
                  </div>
                </div>

              </div>

              <div className="mt-8 space-y-2">
                <p className="text-[12px] text-red-500 font-semibold leading-relaxed">
                  Bắt buộc ghi đúng Nội dung CK để hệ thống xác nhận tự động.
                </p>
                <p className="text-[12px] text-orange-500 font-semibold leading-relaxed">
                  Vui lòng KHÔNG DÙNG ví điện tử (Momo, ZaloPay...). Các giao dịch này sẽ phải chờ xét duyệt thủ công từ 1 đến 3 ngày.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Cột phải: Vùng Upload (Desktop only) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full md:w-1/2 hidden md:block bg-white rounded-3xl p-8 shadow-sm sticky top-28"
          >
            {uploadContent}
          </motion.div>

        </div>

      </div>

      {/* Mobile Modal (via Framer Motion Gooey transition) */}
      <MobileUploadModal 
        isOpen={isMobileModalOpen} 
        setIsOpen={setIsMobileModalOpen}
        isVisible={!isExiting}
        buttonText={isConfirmed ? "Xem thư mời" : "Xác minh đóng góp"}
        onButtonClick={
          isConfirmed 
            ? () => {
                setIsMobileModalOpen(false);
                setIsExiting(true);
                router.push(`/thu-moi?id=${ticketId}`);
              }
            : undefined
        }
      >
        {uploadContent}
      </MobileUploadModal>
    </main>
  );
}
