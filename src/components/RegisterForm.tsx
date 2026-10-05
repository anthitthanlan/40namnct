"use client";

import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const SIZES = ["S", "M", "L", "XL", "XXL", "NC1", "NC2", "NC3"] as const;
type Size = (typeof SIZES)[number];

// Custom Animated Checkbox Component based on Transitions.dev
const CustomCheckbox = ({ checked, onChange, className = "" }: { checked: boolean; onChange: (v: boolean) => void; className?: string }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={(e) => {
      e.stopPropagation();
      onChange(!checked);
    }}
    className={`t-check relative flex-shrink-0 flex items-center justify-center rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${checked ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300 text-transparent"
      } ${className}`}
  >
    <svg viewBox="0 0 10.1668 10.1668" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3/4 h-3/4">
      <path d="M1 5.52L3.92 9.17L9.17 1" />
    </svg>
  </button>
);

const AnimatedNumber = ({ value }: { value: number | string }) => {
  const [animatingKey, setAnimatingKey] = useState(0);
  const prev = useRef(value);

  useEffect(() => {
    if (value !== prev.current) {
      setAnimatingKey(k => k + 1);
      prev.current = value;
    }
  }, [value]);

  const str = String(value);
  return (
    <span key={animatingKey} className="t-digit-group is-animating inline-flex items-baseline">
      {str.split("").map((char, i) => {
        const stagger = i % 3;
        return (
          <span key={i} className="t-digit" data-stagger={stagger > 0 ? String(stagger) : undefined}>
            {char}
          </span>
        );
      })}
    </span>
  );
};

export default function RegisterForm() {
  // Common
  const [name, setName] = useState("");
  const [nienKhoa, setNienKhoa] = useState("");
  const [lop, setLop] = useState("");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState("");

  const handleNienKhoaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prevRaw = nienKhoa.replace(/\D/g, "");
    let val = e.target.value.replace(/\D/g, "");
    
    if (val.length >= 4) {
      let startYear = parseInt(val.slice(0, 4), 10);
      
      // Validate Min/Max (Khóa đầu tiên 1986, tương lai tối đa 2026)
      if (startYear < 1986) startYear = 1986;
      if (startYear > 2026) startYear = 2026;
      
      const rest = val.slice(4, 8);
      
      // Nếu vừa gõ đủ 4 số đầu tiên (chưa có phần sau), tự động tính năm kết thúc (+3)
      if (val.length === 4 && prevRaw.length < 4) {
        val = `${startYear} - ${startYear + 3}`;
      } else if (val.length > 4) {
        val = `${startYear} - ${rest}`;
      } else if (val.length === 4 && !nienKhoa.endsWith(" - ")) {
        // Cho trường hợp xóa lùi về 4 số mà không muốn auto-fill nữa
        val = `${startYear} - `;
      } else {
        val = `${startYear}`;
      }
    }
    
    setNienKhoa(val);
  };
  const [email, setEmail] = useState("");
  const [readNote, setReadNote] = useState(false);
  const [subscribeNews, setSubscribeNews] = useState(false);

  // Combo & Lock State
  const [buyCombo, setBuyCombo] = useState(false);
  const [isInfoLocked, setIsInfoLocked] = useState(false);
  const [type, setType] = useState<"individual" | "group">("individual");

  // Individual Combo
  const [size, setSize] = useState<Size>("M");
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false);

  // Group Combo
  const [quantity, setQuantity] = useState(1);
  const [comboCount, setComboCount] = useState(0);
  const [sizes, setSizes] = useState<Record<string, number>>({});

  // Status
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState("");
  const [showSizeModal, setShowSizeModal] = useState(false);
  const sizeChartRef = useRef<HTMLDivElement>(null);
  
  const handleDownloadPNG = async () => {
    // Load fonts to match website rendering exactly
    // Unbounded (titles) — static weight 700 woff2
    // Google Sans (body text) — use Roboto as fallback since Google Sans isn't on gstatic directly
    const loadFont = async (name: string, url: string, descriptors?: FontFaceDescriptors) => {
      try {
        if ([...document.fonts].some(f => f.family === name && f.status === 'loaded')) return;
        const f = new FontFace(name, `url(${url})`, descriptors);
        await f.load();
        document.fonts.add(f);
      } catch { /* fallback */ }
    };

    await Promise.all([
      // Unbounded Bold 700 for section titles
      loadFont('Unbounded', 'https://fonts.gstatic.com/s/unbounded/v6/cY9ffjeOW0NHpmOQXranrbDnrjeRdlWL.woff2', { weight: '700' }),
      // Unbounded Regular 400 for size labels in header
      loadFont('Unbounded', 'https://fonts.gstatic.com/s/unbounded/v6/cY9ffjeOW0NHpmOQXranrbDnrjeRdlWL.woff2', { weight: '400' }),
      // Google Sans — served via fonts.gstatic as "Product Sans" variant
      loadFont('Google Sans', 'https://fonts.gstatic.com/s/googlesans/v58/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3wGpZszs.woff2', { weight: '400' }),
      loadFont('Google Sans', 'https://fonts.gstatic.com/s/googlesans/v58/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3wGpZszs.woff2', { weight: '500' }),
    ]);

    const BODY_FONT = "'Google Sans', 'Helvetica Neue', Arial, sans-serif";
    const TITLE_FONT = "'Unbounded', 'Google Sans', sans-serif";


    const DPR = 2; // Retina quality
    const W = 960;
    const PADDING = 32;
    const COL_LABEL_W = 160;
    const DATA_COLS = SIZES.length; // 8 cols
    const COL_W = (W - PADDING * 2 - COL_LABEL_W) / DATA_COLS;
    const ROW_H = 44;
    const HEADER_H = 52;
    const SECTION_GAP = 48;
    const TITLE_H = 40;
    const ROWS = ['Chiều cao (cm)', 'Cân nặng (kg)', 'Ngang ngực (cm)', 'Dài áo (cm)'];

    const maleSizes: string[][] = [
      ['<160', '160-165', '165-170', '170-175', '175-180', '>175', '>175', '>175'],
      ['45-55', '55-62', '63-69', '70-75', '76-82', '82-90', '90-110', '110-130'],
      ['46', '48', '50', '52', '54', '55', '61', '67'],
      ['64', '66', '68', '70', '72', '73', '75', '76'],
    ];
    const femaleSizes: string[][] = [
      ['145-150', '150-155', '155-160', '160-165', '165-170', '>165', '>165', '>165'],
      ['38-42', '42-46', '47-53', '54-59', '60-65', '65-75', '75-85', '85-95'],
      ['41', '43', '45', '47', '49', '50', '54', '58'],
      ['57.5', '59.5', '61.5', '63', '64.5', '65.5', '68.5', '71.5'],
    ];

    const tableH = HEADER_H + ROWS.length * ROW_H;
    const totalH = PADDING + TITLE_H + tableH + SECTION_GAP + TITLE_H + tableH + PADDING;

    const canvas = document.createElement('canvas');
    canvas.width = W * DPR;
    canvas.height = totalH * DPR;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(DPR, DPR);

    const drawTable = (offsetY: number, title: string, titleColor: string, headerBg: string, altRowBg: string, data: string[][]) => {
      // Title — Unbounded matches website headings
      ctx.fillStyle = titleColor;
      ctx.font = `700 15px ${TITLE_FONT}`;
      ctx.fillText(title, PADDING, offsetY + 24);
      offsetY += TITLE_H;

      const tableX = PADDING;
      const tableW = W - PADDING * 2;

      // Header row bg
      ctx.fillStyle = headerBg;
      ctx.beginPath();
      ctx.roundRect(tableX, offsetY, tableW, HEADER_H, [6, 6, 0, 0]);
      ctx.fill();

      // Header text — Unbounded for SIZE labels
      ctx.fillStyle = titleColor;
      ctx.font = `700 13px ${TITLE_FONT}`;
      ctx.fillText('SIZE', tableX + 12, offsetY + 32);
      SIZES.forEach((s, i) => {
        const cx = tableX + COL_LABEL_W + i * COL_W + COL_W / 2;
        ctx.textAlign = 'center';
        ctx.fillText(s, cx, offsetY + 32);
      });
      ctx.textAlign = 'left';

      // Data rows — Google Sans matches website body
      ROWS.forEach((label, ri) => {
        const rowY = offsetY + HEADER_H + ri * ROW_H;
        if (ri % 2 === 1) {
          ctx.fillStyle = altRowBg;
          ctx.fillRect(tableX, rowY, tableW, ROW_H);
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(tableX, rowY, tableW, ROW_H);
        }
        ctx.fillStyle = '#374151';
        ctx.font = `500 14px ${BODY_FONT}`;
        ctx.fillText(label, tableX + 12, rowY + 28);
        data[ri].forEach((val, ci) => {
          const cx = tableX + COL_LABEL_W + ci * COL_W + COL_W / 2;
          ctx.textAlign = 'center';
          ctx.fillText(val, cx, rowY + 28);
        });
        ctx.textAlign = 'left';
      });

      // Table border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tableX, offsetY, tableW, HEADER_H + ROWS.length * ROW_H, 6);
      ctx.stroke();

      // Row dividers
      for (let ri = 0; ri < ROWS.length; ri++) {
        const divY = offsetY + HEADER_H + ri * ROW_H;
        ctx.beginPath();
        ctx.moveTo(tableX + 1, divY);
        ctx.lineTo(tableX + tableW - 1, divY);
        ctx.stroke();
      }

      // Label/data column divider
      ctx.beginPath();
      ctx.moveTo(tableX + COL_LABEL_W, offsetY + HEADER_H);
      ctx.lineTo(tableX + COL_LABEL_W, offsetY + HEADER_H + ROWS.length * ROW_H);
      ctx.stroke();
    };

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, totalH);

    drawTable(PADDING, 'BẢNG THÔNG SỐ CHỌN SIZE ÁO POLO NAM', '#1e40af', '#eff6ff', '#f9fafb', maleSizes);
    drawTable(PADDING + TITLE_H + tableH + SECTION_GAP, 'BẢNG THÔNG SỐ CHỌN SIZE ÁO POLO NỮ', '#9d174d', '#fdf2f8', '#f9fafb', femaleSizes);

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'Bang_Size_Ao_NCT.png';
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, 'image/png');
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Refs
  const rightBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (buyCombo && rightBoxRef.current) {
      setTimeout(() => {
        if (window.innerWidth < 768) {
          rightBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [buyCombo]);

  const updateSizeCount = (s: string, delta: number) => {
    setSizes((prev) => {
      const current = prev[s] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [s]: next };
    });
  };

  const currentTotalSizes = Object.values(sizes).reduce((sum, n) => sum + (n || 0), 0);
  const amount = buyCombo
    ? type === "individual"
      ? 500000
      : comboCount * 500000
    : 0;

  const validateStep1 = () => {
    const newFieldErrors: Record<string, boolean> = {};
    const errorMsgs: string[] = [];
    let hasMissingRequired = false;

    if (name.trim().length < 2) {
      newFieldErrors["name"] = true;
      hasMissingRequired = true;
    }
    if (nienKhoa.replace(/\D/g, "").length < 4) {
      newFieldErrors["nienKhoa"] = true;
      hasMissingRequired = true;
    }
    if (lop.trim().length < 1) {
      newFieldErrors["lop"] = true;
      hasMissingRequired = true;
    }
    
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length === 0) {
      newFieldErrors["phone"] = true;
      hasMissingRequired = true;
    } else if (phoneDigits.length < 9) {
      newFieldErrors["phone"] = true;
      errorMsgs.push("Vui lòng nhập số điện thoại hợp lệ (VD: 0912345678).");
    }

    if (email && !email.includes("@")) {
      newFieldErrors["email"] = true;
      errorMsgs.push("Vui lòng nhập địa chỉ email hợp lệ.");
    }
    
    if (!readNote) {
      newFieldErrors["readNote"] = true;
      hasMissingRequired = true;
    }

    if (hasMissingRequired) {
      errorMsgs.unshift("Vui lòng hoàn thành các phần bắt buộc trước khi tiếp tục.");
    }

    return { isValid: errorMsgs.length === 0, newFieldErrors, errorMsgs };
  };

  const handleContinue = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    const { isValid, newFieldErrors, errorMsgs } = validateStep1();
    if (!isValid) {
      setError(errorMsgs.join("\n"));
      setFieldErrors({});
      setTimeout(() => {
        setFieldErrors(newFieldErrors);
        setTimeout(() => {
          const firstErrNode = document.querySelector(".shake-error");
          if (firstErrNode) {
            firstErrNode.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 50);
      }, 10);
      return;
    }

    setIsInfoLocked(true);
    setBuyCombo(true);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!isInfoLocked) {
      handleContinue(e);
      return;
    }

    const { isValid: step1Valid, newFieldErrors, errorMsgs } = validateStep1();
    if (!step1Valid) {
      setIsInfoLocked(false);
      setError(errorMsgs.join("\n"));
      setFieldErrors({});
      setTimeout(() => {
        setFieldErrors(newFieldErrors);
      }, 10);
      return;
    }

    if (type === "group") {
      if (comboCount < 2) {
        newFieldErrors["comboCount"] = true;
        errorMsgs.push("Đăng ký tập thể vui lòng chọn số lượng tối thiểu là 2.");
      }
      if (comboCount >= 2 && currentTotalSizes !== comboCount) {
        newFieldErrors["sizes"] = true;
        errorMsgs.push(`Vui lòng phân bổ chính xác ${comboCount} áo vào các size (đang chọn ${currentTotalSizes}).`);
      }
    }

    if (errorMsgs.length > 0) {
      setError(errorMsgs.join("\n"));
      setFieldErrors({}); // Clear to restart animation
      setTimeout(() => {
        setFieldErrors(newFieldErrors);
        setTimeout(() => {
          const firstErrNode = document.querySelector(".shake-error");
          if (firstErrNode) {
            firstErrNode.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 50);
      }, 10);
      return;
    }

    setBusy(true);
    try {
      const payload = {
        type: buyCombo ? type : "individual",
        name,
        nienKhoa,
        lop,
        note,
        phone,
        email,
        subscribeNews, // add subscribeNews state to payload
        ...(buyCombo
          ? type === "individual"
            ? { size, comboCount: 1, quantity: 1 }
            : { quantity: comboCount, comboCount, sizes }
          : { size: null, comboCount: 0, quantity: 1 }),
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data;
      try {
        data = await res.json();
      } catch (err) {
        setError("Lỗi máy chủ (Không thể đọc phản hồi). Vui lòng thử lại.");
        return;
      }

      if (data.isFallback) {
        console.warn("⚠️ [FALLBACK_ACTIVATED] Máy chủ AI FastAPI không phản hồi. Hệ thống đang sử dụng AI xử lý nội bộ!");
      }

      if (!res.ok || !data.ok) {
        setError(data.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
        return;
      }
      if (amount > 0) {
        window.location.href = `/xac-nhan-dong-gop?id=${data.invitationId}`;
      } else {
        window.location.href = `/thu-moi?id=${data.invitationId}`;
      }
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const SubmitButtonSection = () => (
    <>
      {error && error.split("\n").map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-3 font-medium shadow-sm"
        >
          <div className="w-6 h-6 shrink-0 bg-red-100 text-red-500 rounded-full flex items-center justify-center mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span>{msg}</span>
        </motion.div>
      ))}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-xl transition-all shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
      >
        {busy ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Đang xử lý...
          </>
        ) : (
          <>
            {amount > 0
              ? `Đăng ký & Xác nhận đóng góp ${(amount).toLocaleString("vi-VN")}đ`
              : "Xác nhận Đăng ký"}
          </>
        )}
      </button>
    </>
  );

  // Transition parameters for Framer Motion matching CSS Transitions.dev
  const modalEase = [0.22, 1, 0.36, 1] as [number, number, number, number];
  const boxTransition = { duration: 0.4, ease: modalEase };

  return (
    <>
      <AnimatePresence mode="wait">
        {!code ? (
          <motion.form
            key="form"
            layout
            onSubmit={submit}
            noValidate
          >
            {/* Parent Container WITHOUT gap. Gap is handled by padding on the sliding child. */}
            <motion.div layout transition={boxTransition} className="flex flex-col md:flex-row items-start justify-center">

              {/* CỘT TRÁI (BOX 1): THÔNG TIN CƠ BẢN */}
              <motion.div
                layout
                transition={boxTransition}
                className="w-full md:w-[36rem] flex-shrink-0 bg-white p-5 sm:p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6"
              >
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {buyCombo && type === "group"
                      ? "Họ và Tên (Đại diện)"
                      : "Họ và Tên"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    disabled={isInfoLocked}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Auto-capitalize: viết hoa chữ cái đầu của mỗi từ (hỗ trợ cả tiếng Việt có dấu)
                      setName(val.replace(/(^|\s)\S/g, l => l.toUpperCase()));
                    }}
                    placeholder="Nguyễn Văn A"
                    required
                    className={`w-full px-4 py-3 rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100/90 disabled:text-gray-600 disabled:border-gray-200 disabled:cursor-not-allowed ${
                      fieldErrors["name"] ? "shake-error border-red-500 bg-red-50/50" : "border-gray-200"
                    }`}
                  />
                </div>

                {/* Niên khóa & Lớp */}
                <div className="grid grid-cols-5 gap-3 sm:gap-4">
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Niên khóa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nienKhoa}
                      disabled={isInfoLocked}
                      onChange={handleNienKhoaChange}
                      placeholder="VD: 1986 - 1989"
                      className={`w-full px-4 py-3 rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100/90 disabled:text-gray-600 disabled:border-gray-200 disabled:cursor-not-allowed ${
                        fieldErrors["nienKhoa"] ? "shake-error border-red-500 bg-red-50/50" : "border-gray-200"
                      }`}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lớp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lop}
                      disabled={isInfoLocked}
                      onChange={(e) => setLop(e.target.value)}
                      placeholder="VD: 12A1"
                      className={`w-full px-4 py-3 rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100/90 disabled:text-gray-600 disabled:border-gray-200 disabled:cursor-not-allowed ${
                        fieldErrors["lop"] ? "shake-error border-red-500 bg-red-50/50" : "border-gray-200"
                      }`}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    disabled={isInfoLocked}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    required
                    className={`w-full px-4 py-3 rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100/90 disabled:text-gray-600 disabled:border-gray-200 disabled:cursor-not-allowed ${
                      fieldErrors["phone"] ? "shake-error border-red-500 bg-red-50/50" : "border-gray-200"
                    }`}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled={isInfoLocked}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className={`w-full px-4 py-3 rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100/90 disabled:text-gray-600 disabled:border-gray-200 disabled:cursor-not-allowed ${
                      fieldErrors["email"] ? "shake-error border-red-500 bg-red-50/50" : "border-gray-200"
                    }`}
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lời nhắn (không bắt buộc)
                  </label>
                  <textarea
                    value={note}
                    disabled={isInfoLocked}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Bạn có muốn gửi gắm điều gì cho BTC chương trình không?"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-y disabled:bg-gray-100/90 disabled:text-gray-600 disabled:border-gray-200 disabled:cursor-not-allowed"
                    maxLength={500}
                    rows={3}
                  />
                </div>

                {/* Notice and Checkboxes */}
                <div className="mt-2">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      <span className="text-amber-600 font-medium">Lưu ý:</span> Bạn có thể nhập email để hệ thống tự động gửi Phiếu đăng kí, hoặc tải về thủ công sau khi hoàn tất.
                      <strong className="font-semibold text-gray-900 block mt-1">Mã QR này sẽ được dùng để kiểm tra nhận áo và check-in vào ngày 08/11.</strong>
                    </p>

                    <div className="flex flex-col gap-3 mt-4">
                      <div
                        className={`flex items-center gap-3 w-fit rounded-lg p-1 -ml-1 transition-all ${
                          isInfoLocked ? "opacity-70 cursor-not-allowed" : "cursor-pointer group"
                        } ${
                          fieldErrors["readNote"] ? "shake-error ring-2 ring-red-500/50 bg-red-50" : ""
                        }`}
                        onClick={() => !isInfoLocked && setReadNote(!readNote)}
                      >
                        <CustomCheckbox
                          checked={readNote}
                          onChange={(val) => !isInfoLocked && setReadNote(val)}
                          className={`w-5 h-5 ${isInfoLocked ? "" : "group-hover:border-blue-400"} ${fieldErrors["readNote"] ? "border-red-500" : ""}`}
                        />
                        <span className="text-sm font-medium text-gray-800 select-none group-hover:text-blue-900 transition-colors">
                          Tôi đã đọc và hiểu rõ thông tin trên <span className="text-red-500">*</span>
                        </span>
                      </div>

                      <div
                        className={`flex items-center gap-3 w-fit rounded-lg p-1 -ml-1 transition-all ${
                          isInfoLocked ? "opacity-70 cursor-not-allowed" : "cursor-pointer group"
                        }`}
                        onClick={() => !isInfoLocked && setSubscribeNews(!subscribeNews)}
                      >
                        <CustomCheckbox
                          checked={subscribeNews}
                          onChange={(val) => !isInfoLocked && setSubscribeNews(val)}
                          className={`w-5 h-5 ${isInfoLocked ? "" : "group-hover:border-blue-400"}`}
                        />
                        <span className="text-sm font-medium text-gray-700 select-none group-hover:text-gray-900 transition-colors">
                          Đăng ký nhận thông báo qua email về chương trình
                        </span>
                      </div>
                    </div>
                  </div>

                {/* Section Tiếp tục hoặc Đã khóa thông tin */}
                <motion.div layout className="flex flex-col pt-3 border-t border-gray-100">
                  {/* Hiển thị lỗi nếu có khi chưa khóa thông tin */}
                  {!isInfoLocked && error && (
                    <div className="mb-3 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-medium space-y-1">
                      {error.split("\n").map((msg, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-red-500 font-bold">•</span>
                          <span>{msg}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isInfoLocked ? (
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-6 rounded-xl transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 group text-base cursor-pointer"
                    >
                      <span>Tiếp tục</span>
                      <svg
                        className="w-5 h-5 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between p-3.5 bg-blue-50 border border-blue-200/80 rounded-xl text-blue-900 text-sm">
                      <div className="flex items-center gap-2.5 font-semibold">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs shrink-0">
                          ✓
                        </div>
                        <span>Đã xác nhận thông tin cơ bản</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsInfoLocked(false);
                          setBuyCombo(false);
                        }}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 underline underline-offset-2 transition-colors ml-2 cursor-pointer"
                      >
                        Chỉnh sửa lại
                      </button>
                    </div>
                  )}
                </motion.div>
              </motion.div>

              {/* CỘT PHẢI (BOX 2): BOX CHỌN COMBO */}
              <AnimatePresence>
                {buyCombo && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.96, overflow: "hidden", ...(isMobile ? { height: 0 } : { width: 0 }) }}
                    animate={{ opacity: 1, scale: 1, overflow: "visible", ...(isMobile ? { height: "auto" } : { width: "auto" }) }}
                    exit={{ opacity: 0, scale: 0.96, overflow: "hidden", ...(isMobile ? { height: 0 } : { width: 0 }) }}
                    transition={{
                      duration: 0.4,
                      ease: modalEase
                    }}
                    className="w-full md:w-auto flex-shrink-0 origin-top md:origin-left"
                  >
                    {/* Padding thay cho Gap để chống nhảy giật layout khi unmount */}
                  <div className="pt-6 pb-2 pr-2 md:pt-2 md:pb-2 md:pr-2 md:pl-8 h-full">
                      <motion.div
                        ref={rightBoxRef}
                        initial={{ scale: 0.96 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.96 }}
                        transition={{
                          duration: 0.4,
                          ease: modalEase
                        }}
                        className="origin-left w-full md:w-[28rem] bg-white p-5 sm:p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"
                      >
                        <div className="space-y-6">
                          {/* Placeholder Áo */}
                          <div className="flex flex-col items-center justify-center p-4">
                            <div className="relative w-32 h-32 opacity-80 mix-blend-multiply rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100">
                              <Image
                                src="/images/logo_nct.webp"
                                alt="Áo kỷ niệm NCT"
                                width={96}
                                height={96}
                                className="object-contain drop-shadow-md"
                              />
                            </div>
                            <p className="mt-3 text-sm font-medium text-gray-500">
                              Áo Kỷ Niệm 40 Năm
                            </p>
                          </div>

                          {/* Toggle Cá Nhân / Tập Thể */}
                          <div className="flex rounded-xl bg-gray-100 p-1 mb-4">
                            {[
                              { id: "individual", label: "Cá nhân" },
                              { id: "group", label: "Tập thể" },
                            ].map((tab) => (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setType(tab.id as "individual" | "group")}
                                className={`relative flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                                  type === tab.id ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                                }`}
                              >
                                <span className="relative z-10">{tab.label}</span>
                                {type === tab.id && (
                                  <motion.div
                                    layoutId="type-toggle-pill"
                                    className="absolute inset-0 bg-white rounded-lg shadow-sm"
                                    transition={{ duration: 0.4, ease: modalEase }}
                                  />
                                )}
                              </button>
                            ))}
                          </div>

                          {/* Form Chi Tiết Combo */}
                          <AnimatePresence mode="wait" initial={false}>
                            {type === "individual" ? (
                                <motion.div
                                  key="individual-options"
                                  initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                                  animate={{ opacity: 1, height: "auto", overflow: "visible" }}
                                  exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                                  transition={{ duration: 0.4, ease: modalEase }}
                                >
                                <div className="py-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                      Chọn size áo của bạn
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => setShowSizeModal(true)}
                                      className="group/link relative z-10 rounded-full px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap"
                                    >
                                      <span>Xem bảng size</span>
                                      <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-blue-600 opacity-0 scale-x-0 transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/link:opacity-60 group-hover/link:scale-x-100" />
                                    </button>
                                  </div>
                                  {isMobile ? (
                                    <select
                                      title="Chọn size áo của bạn"
                                      value={size}
                                      onChange={(e) => setSize(e.target.value as Size)}
                                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-colors text-gray-900"
                                    >
                                      {SIZES.map((s) => (
                                        <option key={s} value={s}>
                                          Size {s}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <div
                                      className="relative"
                                      tabIndex={-1}
                                      onBlur={(e) => {
                                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                          setSizeDropdownOpen(false);
                                        }
                                      }}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => setSizeDropdownOpen(!sizeDropdownOpen)}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-colors text-gray-900"
                                      >
                                        <span>Size {size}</span>
                                        <svg className={`w-5 h-5 text-gray-500 transition-transform ${sizeDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>
                                      <AnimatePresence>
                                        {sizeDropdownOpen && (
                                          <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden flex flex-col"
                                          >
                                            {SIZES.map((s) => (
                                              <button
                                                key={s}
                                                type="button"
                                                onClick={() => {
                                                  setSize(s);
                                                  setSizeDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${size === s ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"}`}
                                              >
                                                Size {s}
                                              </button>
                                            ))}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="group-options"
                                initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                                transition={{ duration: 0.4, ease: modalEase }}
                              >
                                <div className="space-y-4 pt-2 pb-1">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Số lượng áo kỉ niệm muốn mua
                                    </label>
                                    <input
                                      type="number"
                                      value={comboCount}
                                      onWheel={(e) => (e.target as HTMLElement).blur()}
                                      onChange={(e) =>
                                        setComboCount(
                                          Math.max(0, parseInt(e.target.value) || 0),
                                        )
                                      }
                                      min={0}
                                      className={`w-full px-4 py-3 rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-colors text-gray-900 ${
                                        fieldErrors["comboCount"] ? "shake-error border-red-500 bg-red-50" : "border-gray-200 bg-white"
                                      }`}
                                    />
                                  </div>

                                  {/* Bảng phân bổ size */}
                                  <div className="border-t border-gray-100 pt-4 mt-2">
                                    <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                                      <div className="flex items-center gap-3">
                                        <label className="text-sm font-medium text-gray-700">
                                          Phân bổ Size áo
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => setShowSizeModal(true)}
                                          className="group/link relative z-10 rounded-full px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap"
                                        >
                                          <span>Xem bảng size</span>
                                          <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-blue-600 opacity-0 scale-x-0 transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/link:opacity-60 group-hover/link:scale-x-100" />
                                        </button>
                                      </div>
                                      <span
                                        className={`text-sm font-bold ${currentTotalSizes === comboCount
                                            ? "text-green-600"
                                            : "text-amber-600"
                                          }`}
                                      >
                                        Đã chọn: <AnimatedNumber value={currentTotalSizes} /> / <AnimatedNumber value={comboCount} />
                                      </span>
                                    </div>
                                    <div className="space-y-5">
                                      {([
                                        { g: "Nam", title: "Áo Nam", color: "text-blue-700", bar: "bg-blue-50 border-blue-100" },
                                        { g: "Nữ", title: "Áo Nữ", color: "text-pink-700", bar: "bg-pink-50 border-pink-100" },
                                      ] as const).map(({ g, title, color, bar }) => {
                                        const groupTotal = SIZES.reduce((sum, s) => sum + (sizes[`${g}-${s}`] || 0), 0);
                                        return (
                                          <div key={g}>
                                            <div className={`flex items-center justify-between rounded-lg border px-3 py-2 mb-2 ${bar}`}>
                                              <span className={`text-sm font-bold ${color}`}>{title}</span>
                                              <span className={`text-xs font-semibold ${color}`}>{groupTotal} áo</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              {SIZES.map((s) => {
                                                const key = `${g}-${s}`;
                                                return (
                                                  <div
                                                    key={key}
                                                    className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-100 shadow-sm"
                                                  >
                                                    <span className="font-medium text-gray-700 w-8 shrink-0">
                                                      {s}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                      <button
                                                        type="button"
                                                        onClick={() => updateSizeCount(key, -1)}
                                                        className="w-6 h-6 flex items-center justify-center bg-gray-50 rounded text-gray-600 hover:bg-gray-100 border border-gray-200 shrink-0"
                                                      >
                                                        -
                                                      </button>
                                                      <input
                                                        type="number"
                                                        min={0}
                                                        value={sizes[key] || 0}
                                                        onWheel={(e) => (e.target as HTMLElement).blur()}
                                                        onChange={(e) => {
                                                          const val = Math.max(0, parseInt(e.target.value) || 0);
                                                          setSizes(prev => ({ ...prev, [key]: val }));
                                                        }}
                                                        className="w-8 text-center text-sm font-medium bg-transparent border-none outline-none appearance-none p-0 focus:ring-0"
                                                        style={{ MozAppearance: 'textfield' }}
                                                      />
                                                      <button
                                                        type="button"
                                                        onClick={() => updateSizeCount(key, 1)}
                                                        className="w-6 h-6 flex items-center justify-center bg-gray-50 rounded text-gray-600 hover:bg-gray-100 border border-gray-200 shrink-0"
                                                      >
                                                        +
                                                      </button>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Tổng tiền */}
                                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <span className="text-sm font-medium text-gray-700">Tổng tiền áo kỉ niệm</span>
                                    <span className="text-lg font-bold text-amber-600 flex items-center">
                                      <AnimatedNumber value={(comboCount * 500000).toLocaleString("vi-VN")} /><span className="ml-0.5">đ</span>
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Submit Button - Ở Box phải khi chọn Combo */}
                        <div className="pt-4 border-t border-gray-100 w-full">
                          <SubmitButtonSection />
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.form>
        ) : (
          <motion.div
            key="instructions"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: modalEase }}
            className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-xl mx-auto"
          >
            {/* Success header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Đăng ký thành công!
              </h2>
              <p className="text-gray-500 mt-2">
                Dưới đây là mã định danh (mã vé) của bạn.
              </p>
            </div>

            {/* Invitation info card */}
            <div className="bg-gray-50 p-6 rounded-xl space-y-4 border border-gray-100">
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-blue-50 border border-blue-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Mã định danh
                  </p>
                  <p className="font-semibold mt-0.5 text-blue-700 text-xl font-mono">
                    {code}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(code, "code")}
                  className="flex-shrink-0 p-2 rounded-lg hover:bg-blue-100 transition-colors text-blue-400 hover:text-blue-600"
                  title="Sao chép"
                >
                  {copied === "code" ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                  )}
                </button>
              </div>

              {amount > 0 && (
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div>
                    <p className="text-xs text-amber-600/80 uppercase tracking-wider">
                      Số tiền cần thanh toán
                    </p>
                    <p className="font-semibold mt-0.5 text-amber-700 text-lg flex items-center">
                      <AnimatedNumber value={amount.toLocaleString("vi-VN")} /><span className="ml-0.5">đ</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-sm text-amber-800 font-medium">
                ⚠️ Thông tin quan trọng
              </p>
              <p className="text-sm text-amber-700 mt-2">
                Chúng tôi sẽ sớm gửi Vé QR về hòm thư <strong>{email}</strong> (nếu có). Bạn hãy sử dụng mã vé để kiểm tra thông tin và xuất trình tại sự kiện.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size Chart Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${showSizeModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSizeModal(false)} />
        <div className={`t-modal bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 relative z-10 ${showSizeModal ? 'is-open' : 'is-closing'}`}>
          <button type="button" onClick={() => setShowSizeModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Bảng Size Áo</h3>
          <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div ref={sizeChartRef} className="bg-white">
              <div className="mb-6">
              <h4 className="font-bold text-blue-800 mb-3 uppercase text-sm">Bảng thông số chọn size áo Polo Nam</h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm text-center whitespace-nowrap">
                  <thead className="bg-blue-50 text-blue-900 font-semibold">
                    <tr>
                      <th className="px-3 py-2 border-b border-r border-gray-200 bg-blue-50 sticky left-0 z-10 text-left">SIZE</th>
                      <th className="px-3 py-2 border-b border-gray-200">S</th>
                      <th className="px-3 py-2 border-b border-gray-200">M</th>
                      <th className="px-3 py-2 border-b border-gray-200">L</th>
                      <th className="px-3 py-2 border-b border-gray-200">XL</th>
                      <th className="px-3 py-2 border-b border-gray-200">XXL</th>
                      <th className="px-3 py-2 border-b border-gray-200">NC1</th>
                      <th className="px-3 py-2 border-b border-gray-200">NC2</th>
                      <th className="px-3 py-2 border-b border-gray-200">NC3</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr>
                      <td className="px-3 py-2 border-b border-r border-gray-200 bg-white sticky left-0 z-10 font-medium text-left">Chiều cao <span className="text-xs text-gray-500 font-normal">(cm)</span></td>
                      <td className="px-3 py-2 border-b border-gray-200">&lt;160</td>
                      <td className="px-3 py-2 border-b border-gray-200">160 - 165</td>
                      <td className="px-3 py-2 border-b border-gray-200">165 - 170</td>
                      <td className="px-3 py-2 border-b border-gray-200">170 - 175</td>
                      <td className="px-3 py-2 border-b border-gray-200">175 - 180</td>
                      <td className="px-3 py-2 border-b border-gray-200">&gt;175</td>
                      <td className="px-3 py-2 border-b border-gray-200">&gt;175</td>
                      <td className="px-3 py-2 border-b border-gray-200">&gt;175</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-3 py-2 border-b border-r border-gray-200 bg-gray-50 sticky left-0 z-10 font-medium text-left">Cân nặng <span className="text-xs text-gray-500 font-normal">(kg)</span></td>
                      <td className="px-3 py-2 border-b border-gray-200">45 - 55</td>
                      <td className="px-3 py-2 border-b border-gray-200">55 - 62</td>
                      <td className="px-3 py-2 border-b border-gray-200">63 - 69</td>
                      <td className="px-3 py-2 border-b border-gray-200">70 - 75</td>
                      <td className="px-3 py-2 border-b border-gray-200">76 - 82</td>
                      <td className="px-3 py-2 border-b border-gray-200">82 - 90</td>
                      <td className="px-3 py-2 border-b border-gray-200">90 - 110</td>
                      <td className="px-3 py-2 border-b border-gray-200">110 - 130</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 border-b border-r border-gray-200 bg-white sticky left-0 z-10 font-medium text-left">Ngang ngực <span className="text-xs text-gray-500 font-normal">(cm)</span></td>
                      <td className="px-3 py-2 border-b border-gray-200">46</td>
                      <td className="px-3 py-2 border-b border-gray-200">48</td>
                      <td className="px-3 py-2 border-b border-gray-200">50</td>
                      <td className="px-3 py-2 border-b border-gray-200">52</td>
                      <td className="px-3 py-2 border-b border-gray-200">54</td>
                      <td className="px-3 py-2 border-b border-gray-200">55</td>
                      <td className="px-3 py-2 border-b border-gray-200">61</td>
                      <td className="px-3 py-2 border-b border-gray-200">67</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-3 py-2 border-r border-gray-200 bg-gray-50 sticky left-0 z-10 font-medium text-left">Dài áo <span className="text-xs text-gray-500 font-normal">(cm)</span></td>
                      <td className="px-3 py-2">64</td>
                      <td className="px-3 py-2">66</td>
                      <td className="px-3 py-2">68</td>
                      <td className="px-3 py-2">70</td>
                      <td className="px-3 py-2">72</td>
                      <td className="px-3 py-2">73</td>
                      <td className="px-3 py-2">75</td>
                      <td className="px-3 py-2">76</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-pink-800 mb-3 uppercase text-sm">Bảng thông số chọn size áo Polo Nữ</h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm text-center whitespace-nowrap">
                  <thead className="bg-pink-50 text-pink-900 font-semibold">
                    <tr>
                      <th className="px-3 py-2 border-b border-r border-gray-200 bg-pink-50 sticky left-0 z-10 text-left">SIZE</th>
                      <th className="px-3 py-2 border-b border-gray-200">S</th>
                      <th className="px-3 py-2 border-b border-gray-200">M</th>
                      <th className="px-3 py-2 border-b border-gray-200">L</th>
                      <th className="px-3 py-2 border-b border-gray-200">XL</th>
                      <th className="px-3 py-2 border-b border-gray-200">XXL</th>
                      <th className="px-3 py-2 border-b border-gray-200">NC1</th>
                      <th className="px-3 py-2 border-b border-gray-200">NC2</th>
                      <th className="px-3 py-2 border-b border-gray-200">NC3</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr>
                      <td className="px-3 py-2 border-b border-r border-gray-200 bg-white sticky left-0 z-10 font-medium text-left">Chiều cao <span className="text-xs text-gray-500 font-normal">(cm)</span></td>
                      <td className="px-3 py-2 border-b border-gray-200">145 - 150</td>
                      <td className="px-3 py-2 border-b border-gray-200">150 - 155</td>
                      <td className="px-3 py-2 border-b border-gray-200">155 - 160</td>
                      <td className="px-3 py-2 border-b border-gray-200">160 - 165</td>
                      <td className="px-3 py-2 border-b border-gray-200">165 - 170</td>
                      <td className="px-3 py-2 border-b border-gray-200">&gt;165</td>
                      <td className="px-3 py-2 border-b border-gray-200">&gt;165</td>
                      <td className="px-3 py-2 border-b border-gray-200">&gt;165</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-3 py-2 border-b border-r border-gray-200 bg-gray-50 sticky left-0 z-10 font-medium text-left">Cân nặng <span className="text-xs text-gray-500 font-normal">(kg)</span></td>
                      <td className="px-3 py-2 border-b border-gray-200">38 - 42</td>
                      <td className="px-3 py-2 border-b border-gray-200">42 - 46</td>
                      <td className="px-3 py-2 border-b border-gray-200">47 - 53</td>
                      <td className="px-3 py-2 border-b border-gray-200">54 - 59</td>
                      <td className="px-3 py-2 border-b border-gray-200">60 - 65</td>
                      <td className="px-3 py-2 border-b border-gray-200">65 - 75</td>
                      <td className="px-3 py-2 border-b border-gray-200">75 - 85</td>
                      <td className="px-3 py-2 border-b border-gray-200">85 - 95</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 border-b border-r border-gray-200 bg-white sticky left-0 z-10 font-medium text-left">Ngang ngực <span className="text-xs text-gray-500 font-normal">(cm)</span></td>
                      <td className="px-3 py-2 border-b border-gray-200">41</td>
                      <td className="px-3 py-2 border-b border-gray-200">43</td>
                      <td className="px-3 py-2 border-b border-gray-200">45</td>
                      <td className="px-3 py-2 border-b border-gray-200">47</td>
                      <td className="px-3 py-2 border-b border-gray-200">49</td>
                      <td className="px-3 py-2 border-b border-gray-200">50</td>
                      <td className="px-3 py-2 border-b border-gray-200">54</td>
                      <td className="px-3 py-2 border-b border-gray-200">58</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-3 py-2 border-r border-gray-200 bg-gray-50 sticky left-0 z-10 font-medium text-left">Dài áo <span className="text-xs text-gray-500 font-normal">(cm)</span></td>
                      <td className="px-3 py-2">57.5</td>
                      <td className="px-3 py-2">59.5</td>
                      <td className="px-3 py-2">61.5</td>
                      <td className="px-3 py-2">63</td>
                      <td className="px-3 py-2">64.5</td>
                      <td className="px-3 py-2">65.5</td>
                      <td className="px-3 py-2">68.5</td>
                      <td className="px-3 py-2">71.5</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 flex justify-end gap-3">
            <button type="button" onClick={handleDownloadPNG} className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Tải PNG
            </button>
            <button type="button" onClick={() => setShowSizeModal(false)} className="px-5 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">Đóng</button>
          </div>
        </div>
      </div>
    </>
  );
}
