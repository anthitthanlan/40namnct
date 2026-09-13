"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  PAY_BANK,
  SESSION_DURATION_MS,
  buildEmvQrPayload,
  createPaymentSession,
  getVietQrFallbackUrl,
  type PaymentSession,
} from "@/lib/emvqr";
import { formatVnd } from "@/lib/ticket-view";

export default function TransferQr({
  amount,
  memberCode,
  ticketId,
  size = 180,
  admin = false,
  onClaimed,
}: {
  amount: number;
  memberCode: string;
  ticketId?: string;
  size?: number;
  admin?: boolean;
  onClaimed?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [session, setSession] = useState<PaymentSession>(() =>
    createPaymentSession(memberCode || "NCT40"),
  );
  const [now, setNow] = useState<number>(() => Date.now());
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");

  // Cập nhật đồng hồ mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const remainingSeconds = Math.max(
    0,
    Math.ceil((session.expiresAt - now) / 1000),
  );
  const isExpired = remainingSeconds === 0;

  // Dựng payload EMVCo hợp chuẩn quốc tế
  const payload =
    !memberCode || amount <= 0
      ? ""
      : buildEmvQrPayload(amount, session.content);

  // Vẽ QR code lên canvas
  useEffect(() => {
    if (!payload || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, payload, {
      width: size,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    }).catch((err) => {
      console.error("Lỗi vẽ QR:", err);
    });
  }, [payload, size, session]);

  function renewSession() {
    setSession(createPaymentSession(memberCode || "NCT40"));
    setNow(Date.now());
    setClaimMessage("");
  }

  async function copyToClipboard(text: string, isAccount = false) {
    try {
      await navigator.clipboard.writeText(text);
      if (isAccount) {
        setCopiedAccount(true);
        setTimeout(() => setCopiedAccount(false), 2000);
      } else {
        setCopiedContent(true);
        setTimeout(() => setCopiedContent(false), 2000);
      }
    } catch {
      /* clipboard API fallback */
    }
  }

  async function handleClaimPayment() {
    if (!ticketId) {
      setClaimMessage("Đã ghi nhận thanh toán cho mã phiên: " + session.sessionId);
      return;
    }
    setClaiming(true);
    setClaimMessage("");
    try {
      const res = await fetch("/api/tickets/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          sessionId: session.sessionId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setClaimSuccess(true);
        setClaimMessage(data.message);
        onClaimed?.();
      } else {
        setClaimMessage(data.message || "Gửi yêu cầu không thành công.");
      }
    } catch {
      setClaimMessage("Có lỗi mạng, vui lòng thử lại.");
    } finally {
      setClaiming(false);
    }
  }

  if (claimSuccess) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50/90 p-5 text-center text-blue-900 shadow-sm">
        <span className="text-3xl">⏳</span>
        <h4 className="mt-2 text-sm font-extrabold">Đã gửi yêu cầu xác nhận</h4>
        <p className="mt-1 text-xs text-blue-700 leading-relaxed">
          {claimMessage || "Vé của bạn đang ở trạng thái chờ cấp trong 24 giờ. Sau khi Admin đối soát sao kê với ngân hàng, vé điện tử chính thức sẽ được kích hoạt!"}
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl border border-slate-200 bg-slate-50/80 p-5 text-center shadow-md backdrop-blur-sm sm:p-6 max-w-sm mx-auto">
      {/* Header thanh toán */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="text-left">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            QR Napas 247 · Sacombank
          </p>
          <p className="text-sm font-black text-slate-900">
            {formatVnd(amount)}
          </p>
        </div>

        {/* Đồng hồ đếm ngược 2 phút */}
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${
            isExpired
              ? "bg-rose-100 text-rose-700 border border-rose-200"
              : remainingSeconds <= 30
                ? "bg-amber-100 text-amber-700 border border-amber-200"
                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
          }`}
        >
          <span>{isExpired ? "🔒 Hết hạn" : "⏱"}</span>
          <span>{remainingSeconds}s</span>
        </div>
      </div>

      {/* Khung Canvas QR & Lớp phủ khóa khi hết 2 phút */}
      <div className="relative mx-auto mt-4 flex items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-2.5 shadow-xs w-fit">
        <canvas
          ref={canvasRef}
          className={`block rounded-lg transition-all duration-300 ${
            isExpired ? "blur-sm opacity-25" : "opacity-100"
          }`}
        />

        {/* Khi hết 2 phút: Khóa mã và hiện thông báo renew */}
        {isExpired && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 p-3 text-white rounded-lg backdrop-blur-xs">
            <span className="text-2xl">🔒</span>
            <p className="mt-1 text-[11px] font-bold text-slate-200 text-center leading-tight">
              QR chuyển khoản đã hết hiệu lực
            </p>
            <button
              type="button"
              onClick={renewSession}
              className="mt-2.5 rounded-full bg-[#1d4ed8] px-3.5 py-1.5 text-[11px] font-extrabold text-white shadow-md hover:bg-blue-600 active:scale-95 transition"
            >
              🔄 Renew QR mới
            </button>
          </div>
        )}
      </div>

      {/* Thông tin số tài khoản & Nội dung chuyển khoản kèm Session ID */}
      <div className="mt-4 space-y-2 text-left text-xs">
        <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-slate-200">
          <div>
            <span className="block text-[10px] font-bold text-slate-400">
              STK Sacombank ({PAY_BANK.accountName})
            </span>
            <span className="font-mono font-extrabold text-slate-900">
              {PAY_BANK.account}
            </span>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(PAY_BANK.account, true)}
            className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200"
          >
            {copiedAccount ? "✅ Đã chép" : "📋 Chép"}
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-slate-200">
          <div>
            <span className="block text-[10px] font-bold text-slate-400">
              Nội dung CK (Session: {session.sessionId})
            </span>
            <span className="font-mono font-extrabold text-[#1d4ed8]">
              {session.content}
            </span>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(session.content, false)}
            className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#1d4ed8] hover:bg-blue-100"
          >
            {copiedContent ? "✅ Đã chép" : "📋 Chép"}
          </button>
        </div>
      </div>

      {/* Hành động xác nhận chuyển khoản */}
      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={handleClaimPayment}
          disabled={claiming}
          className="w-full rounded-2xl bg-[#16a34a] py-3 text-xs font-black text-white shadow-md hover:bg-emerald-700 active:scale-98 transition disabled:opacity-50"
        >
          {claiming ? "Đang gửi xác nhận…" : "✅ Tôi đã chuyển khoản xong"}
        </button>

        {isExpired ? (
          <p className="text-[11px] text-amber-700 font-semibold leading-relaxed">
            💡 Nếu bạn đã chuyển khoản trước khi QR hết hạn, đừng bấm Renew mà hãy
            bấm <strong>&ldquo;Tôi đã chuyển khoản xong&rdquo;</strong> để Ban Tổ chức duyệt vé.
          </p>
        ) : (
          <button
            type="button"
            onClick={renewSession}
            className="text-[11px] text-slate-500 font-semibold hover:text-slate-800 transition"
          >
            🔄 Đổi mã phiên khác (Renew)
          </button>
        )}

        {claimMessage && (
          <p className="mt-2 text-xs font-semibold text-rose-600">
            {claimMessage}
          </p>
        )}
      </div>
    </div>
  );
}
