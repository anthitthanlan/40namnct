"use client";

import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"] as const;
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

  // Combo Toggle
  const [buyCombo, setBuyCombo] = useState(false);
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

  const currentTotalSizes = SIZES.reduce((sum, s) => sum + (sizes[s] || 0), 0);
  const amount = buyCombo
    ? type === "individual"
      ? 500000
      : comboCount * 500000
    : 0;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

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

    if (buyCombo && type === "group") {
      if (comboCount < 2) {
        newFieldErrors["comboCount"] = true;
        errorMsgs.push("Đăng ký tập thể vui lòng chọn số lượng tối thiểu là 2.");
      }
      if (comboCount >= 2 && currentTotalSizes !== comboCount) {
        newFieldErrors["sizes"] = true;
        errorMsgs.push(`Vui lòng phân bổ chính xác ${comboCount} áo vào các size (đang chọn ${currentTotalSizes}).`);
      }
    }

    if (hasMissingRequired) {
      errorMsgs.unshift("Vui lòng hoàn thành các phần bắt buộc."); // Put missing required first
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
      const data = await res.json();
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
                    onChange={(e) => {
                      const val = e.target.value;
                      // Auto-capitalize: viết hoa chữ cái đầu của mỗi từ (hỗ trợ cả tiếng Việt có dấu)
                      setName(val.replace(/(^|\s)\S/g, l => l.toUpperCase()));
                    }}
                    placeholder="Nguyễn Văn A"
                    required
                    className={`w-full px-4 py-3 rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 ${
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
                      onChange={handleNienKhoaChange}
                      placeholder="VD: 1986 - 1989"
                      className={`w-full px-4 py-3 rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 ${
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
                      onChange={(e) => setLop(e.target.value)}
                      placeholder="VD: 12A1"
                      className={`w-full px-4 py-3 rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 ${
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
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    required
                    className={`w-full px-4 py-3 rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 ${
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
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className={`w-full px-4 py-3 rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 ${
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
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Bạn có muốn gửi gắm điều gì cho BTC chương trình không?"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-y"
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
                        className={`flex items-center gap-3 cursor-pointer group w-fit rounded-lg p-1 -ml-1 transition-all ${
                          fieldErrors["readNote"] ? "shake-error ring-2 ring-red-500/50 bg-red-50" : ""
                        }`}
                        onClick={() => setReadNote(!readNote)}
                      >
                        <CustomCheckbox
                          checked={readNote}
                          onChange={setReadNote}
                          className={`w-5 h-5 group-hover:border-blue-400 ${fieldErrors["readNote"] ? "border-red-500" : ""}`}
                        />
                        <span className="text-sm font-medium text-gray-800 select-none group-hover:text-blue-900 transition-colors">
                          Tôi đã đọc và hiểu rõ thông tin trên <span className="text-red-500">*</span>
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-3 cursor-pointer group w-fit rounded-lg p-1 -ml-1 transition-all"
                        onClick={() => setSubscribeNews(!subscribeNews)}
                      >
                        <CustomCheckbox
                          checked={subscribeNews}
                          onChange={setSubscribeNews}
                          className="w-5 h-5 group-hover:border-blue-400"
                        />
                        <span className="text-sm font-medium text-gray-700 select-none group-hover:text-gray-900 transition-colors">
                          Đăng ký nhận thông báo nhắc nhở qua email về chương trình
                        </span>
                      </div>
                    </div>
                  </div>

                {/* Footer Section: Grouped to prevent flex gap snap when unmounting */}
                <motion.div layout className="flex flex-col">
                  <div className="pt-2">
                    <div
                      onClick={() => setBuyCombo(!buyCombo)}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors cursor-pointer group ${buyCombo
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      <CustomCheckbox
                        checked={buyCombo}
                        onChange={setBuyCombo}
                        className="w-6 h-6 border-2 group-hover:border-blue-400"
                      />
                      <div>
                        <p className={`font-medium transition-colors ${buyCombo ? "text-blue-900" : "text-gray-900"}`}>
                          Đăng ký Áo kỉ niệm
                        </p>
                        <p className={`text-sm mt-0.5 transition-colors ${buyCombo ? "text-blue-700/80" : "text-gray-500"}`}>
                          Giá 500.000đ/suất bao gồm áo kỷ niệm 40 năm và F&B liên hoan giao lưu.
                          <br />
                          <span className="text-blue-600/90 font-medium inline-block mt-1">Có thể đăng kí áo tập thể.</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Khi chưa chọn áo: không hiển thị nút submit */}
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {SIZES.map((s) => (
                                        <div
                                          key={s}
                                          className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-100 shadow-sm"
                                        >
                                          <span className="font-medium text-gray-700 w-8 shrink-0">
                                            {s}
                                          </span>
                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => updateSizeCount(s, -1)}
                                              className="w-6 h-6 flex items-center justify-center bg-gray-50 rounded text-gray-600 hover:bg-gray-100 border border-gray-200 shrink-0"
                                            >
                                              -
                                            </button>
                                            <input
                                              type="number"
                                              min={0}
                                              value={sizes[s] || 0}
                                              onWheel={(e) => (e.target as HTMLElement).blur()}
                                              onChange={(e) => {
                                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                                setSizes(prev => ({ ...prev, [s]: val }));
                                              }}
                                              className="w-8 text-center text-sm font-medium bg-transparent border-none outline-none appearance-none p-0 focus:ring-0"
                                              style={{ MozAppearance: 'textfield' }}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => updateSizeCount(s, 1)}
                                              className="w-6 h-6 flex items-center justify-center bg-gray-50 rounded text-gray-600 hover:bg-gray-100 border border-gray-200 shrink-0"
                                            >
                                              +
                                            </button>
                                          </div>
                                        </div>
                                      ))}
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
        <div className={`t-modal bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative z-10 ${showSizeModal ? 'is-open' : 'is-closing'}`}>
          <button type="button" onClick={() => setShowSizeModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Bảng Size Áo</h3>
          <div className="aspect-[4/3] bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden relative">
            <p className="text-gray-500 text-sm p-4 text-center">
              (Khu vực hiển thị ảnh bảng size)
              <br />
              Bạn có thể tải ảnh lên thư mục <code className="bg-gray-200 px-1 rounded">/images</code> và thay thế tại đây.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 flex justify-end">
            <button type="button" onClick={() => setShowSizeModal(false)} className="px-5 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">Đóng</button>
          </div>
        </div>
      </div>
    </>
  );
}
