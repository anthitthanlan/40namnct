"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  PAY_BACKGROUNDS,
  PAY_BANK,
  TRANSFER_WINDOW_MS,
  buildEmvQrPayload,
  expectedTransferContents,
  transferContent,
} from "@/lib/emvqr";
import { formatVnd } from "@/lib/ticket-view";

/**
 * QR chuyển khoản chuẩn EMVCo (VietQR / Napas 247) - quét được bằng mọi
 * app ngân hàng. Nội dung CK = mã định danh + mã xoay đổi mỗi 2 phút;
 * component tự vẽ lại QR khi mã đổi và đếm ngược thời gian còn lại.
 */
export default function TransferQr({
  amount,
  memberCode,
  size = 176,
  admin = false,
}: {
  amount: number;
  memberCode: string;
  size?: number;
  /** Admin: kèm danh sách nội dung CK dự kiến (hiện tại + vừa qua) để duyệt */
  admin?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState("");
  // Ảnh nền thẻ chuyển tiền - chọn ngẫu nhiên từ danh sách public/bg.
  // Thêm ảnh mới: bỏ file vào public/bg rồi khai báo trong PAY_BACKGROUNDS.
  const [bg] = useState(
    () =>
      PAY_BACKGROUNDS[Math.floor(Math.random() * PAY_BACKGROUNDS.length)] ?? "",
  );

  const bgLayer = bg ? (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.16]"
      style={{
        backgroundImage: `url('${bg}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  ) : null;

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const content = now === null ? "" : transferContent(memberCode, now);
  const payload =
    now === null || !memberCode || amount <= 0
      ? ""
      : buildEmvQrPayload(amount, content);

  useEffect(() => {
    if (!payload || !canvasRef.current) return;
    let cancelled = false;
    QRCode.toCanvas(canvasRef.current, payload, {
      width: size,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(() => {
        if (!cancelled) setQrError("");
      })
      .catch(() => {
        if (!cancelled) setQrError("Không tạo được ảnh QR.");
      });
    return () => {
      cancelled = true;
    };
  }, [payload, size]);

  async function copyContent() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* không hỗ trợ clipboard - bỏ qua */
    }
  }

  if (!memberCode) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-slate-50 p-4 text-center text-xs font-semibold text-slate-500">
        {bgLayer}
        <p className="relative">
          Không tìm thấy mã định danh - vui lòng đăng nhập lại.
        </p>
      </div>
    );
  }

  if (now === null) {
    return (
      <div className="relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl bg-slate-50 p-4">
        {bgLayer}
        <div
          className="relative animate-pulse rounded-xl bg-slate-200"
          style={{ width: size, height: size }}
        />
        <p className="relative text-xs font-semibold text-slate-400">
          Đang tạo QR…
        </p>
      </div>
    );
  }

  const secondsLeft = Math.ceil(
    (TRANSFER_WINDOW_MS - (now % TRANSFER_WINDOW_MS)) / 1000,
  );
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const expected = admin ? expectedTransferContents(memberCode, now) : [];

  const qrBox = (
    <div className="flex flex-col items-center gap-1.5">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-xl bg-white"
      />
      {qrError && (
        <p className="text-center text-[11px] font-bold text-rose-600">
          {qrError}
        </p>
      )}
      <p className="text-center text-xs font-extrabold text-slate-700">
        Quét QR chuyển {formatVnd(amount)}
      </p>
      <p className="text-center text-[11px] leading-relaxed text-slate-500">
        {PAY_BANK.shortName} · STK {PAY_BANK.account}
        <br />
        {PAY_BANK.accountNameDisplay}
      </p>
    </div>
  );

  const contentBox = (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-center text-[11px] leading-relaxed text-slate-500">
        Nội dung CK (<span className="font-extrabold">tự đổi mỗi 2 phút</span>
        ):
        <br />
        <span className="font-mono text-sm font-extrabold text-slate-800">
          {content}
        </span>
      </p>
      <button
        type="button"
        onClick={copyContent}
        className="rounded-full bg-slate-100 px-4 py-2 text-xs font-extrabold text-slate-600 transition hover:bg-slate-200"
      >
        {copied ? "✅ Đã sao chép!" : "📋 Sao chép nội dung CK"}
      </button>
      <p className="text-center text-[11px] font-bold text-amber-600">
        ⏱ Mã mới sau {mm}:{ss} - quét lại QR nếu quá hạn
      </p>
    </div>
  );

  if (admin) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-slate-50 p-4">
        {bgLayer}
        <div className="relative flex flex-wrap items-start gap-5">
          {qrBox}
          <div className="min-w-[250px] flex-1">
            <p className="text-xs font-extrabold text-slate-700">
              Nội dung CK dự kiến - đối chiếu thông báo ngân hàng:
            </p>
            <ul className="mt-2 space-y-1">
              {expected.map((c, i) => (
                <li
                  key={c}
                  className="font-mono text-sm font-extrabold text-slate-800"
                >
                  {i === 0 ? "🟢 Đang hiệu lực: " : "🟡 Vừa qua (chấp nhận): "}
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Mã xoay mỗi 2 phút, luôn chứa mã định danh - dán nội dung CK từ
              thông báo ngân hàng vào ô tìm kiếm phía trên để lọc vé.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-50 p-4">
      {bgLayer}
      <div className="relative flex flex-col items-center gap-2">
        {qrBox}
        {contentBox}
      </div>
    </div>
  );
}
