"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import QRCode from "qrcode";
import * as htmlToImage from "html-to-image";

function TicketContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("id");
  const [id] = useState(rawId);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ticketQrUrl, setTicketQrUrl] = useState("");
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) {
      setError("Không tìm thấy ID vé.");
      setLoading(false);
      return;
    }

    fetch(`/api/payment/ticket?id=${id}`)
      .then((res) => res.json())
      .then((res) => {
        if (!res.ok) {
          setError(res.message);
        } else {
          setData(res);
        }
      })
      .catch(() => setError("Lỗi kết nối."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (data?.ticket) {
      const { ticket, member } = data;
      const name = member?.name || "Khách";
      const phone = member?.phone || "";
      const code = ticket?.code || "";
      const text = `${name} - ${phone} - ${code}`;
      
      try {
        QRCode.toDataURL(text, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
          .then(url => setTicketQrUrl(url))
          .catch(err => {
            console.error("QR Gen error:", err);
            setTicketQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`);
          });
      } catch (err) {
        console.error("QR Sync error:", err);
        setTicketQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`);
      }
    }
  }, [data]);

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(ticketRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        style: {
          transform: "scale(1)",
        },
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `thu-moi-${data.ticket.code}.png`;
      a.click();
    } catch (err) {
      console.error("Download error:", err);
      alert("Có lỗi khi tải thư mời. Vui lòng thử lại.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Đang tải thông tin thư mời...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-red-500 mb-4">{error}</p>
        <a href="/dang-ky" className="text-blue-600 underline">Quay lại trang đăng ký</a>
      </div>
    );
  }

  const { ticket, member } = data;

  return (
    <main className="min-h-screen bg-gray-50 pt-28 pb-20 px-3 md:px-6">
      <div className="w-full max-w-[1200px] mx-auto flex flex-col items-center">
        <Reveal>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              Thư Mời Tham Dự
            </h1>
            <p className="text-gray-500 mt-2">
              Chụp ảnh màn hình hoặc tải thư mời này về để sử dụng tại sự kiện.
            </p>
          </div>
        </Reveal>

        <div className="flex flex-col-reverse lg:flex-row lg:items-start lg:justify-center gap-8 lg:gap-20 xl:gap-32 mt-6 w-full max-w-[1200px] mx-auto">
          {/* Left Column: Ticket Card (~3 parts) */}
          <div className="w-full lg:w-[340px] xl:w-[380px] flex flex-col items-center shrink-0">
            <Reveal delay={150} className="w-full">
              {/* TICKET CARD - Khung HTML để chụp */}
              <div 
                ref={ticketRef}
                className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200 relative w-full mx-auto p-5 sm:p-6"
              >
                {/* Background Layer with Mask */}
                  <div 
                  className="absolute inset-0 z-0 pointer-events-none"
                  style={{
                    backgroundImage: "url('/images/hero-5.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.3,
                    maskImage: "linear-gradient(to bottom, transparent 5%, black 25%, black 75%, transparent 95%)",
                    WebkitMaskImage: "linear-gradient(to bottom, transparent 5%, black 25%, black 75%, transparent 95%)"
                  }}
                />

                {/* Content Wrapper */}
                <div className="relative z-10">
                  {/* Header: Logos & Title */}
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 border-b border-gray-200 pb-3">
                  <div className="flex gap-1.5 shrink-0">
                    <img src="/images/logo_nct.png" alt="NCT Logo" className="w-10 h-10 object-contain" crossOrigin="anonymous" />
                    <img src="/images/Logo_40th_NCT.png" alt="40th Logo" className="w-10 h-10 object-contain" crossOrigin="anonymous" />
                  </div>
                  <div className="text-left text-blue-900 font-black leading-tight uppercase text-[11px] sm:text-[12px] tracking-wide w-full">
                    <div>Kỉ niệm 40 năm thành lập</div>
                    <div>Trường THPT Nguyễn Công Trứ</div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex justify-center mb-5 mt-3">
                  {ticketQrUrl ? (
                    <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-gray-200 inline-block">
                      <img src={ticketQrUrl} alt="Ticket QR" className="w-40 h-40 sm:w-44 sm:h-44 rounded-lg" crossOrigin="anonymous" />
                    </div>
                  ) : (
                    <div className="w-[180px] h-[180px] sm:w-[196px] sm:h-[196px] bg-gray-100 animate-pulse rounded-2xl border border-gray-200" />
                  )}
                </div>

                <div className="text-center mb-5 -mt-2">
                  <p className="beau-rivage-regular text-[36px] sm:text-[40px] text-emerald-700 leading-none pt-2">Memories Alive Again</p>
                </div>

                {/* Ticket Info */}
                <div className="space-y-1.5 text-[14px] sm:text-[15px] text-gray-800">
                  <p>
                    <span className="font-semibold text-gray-700 w-24 sm:w-28 inline-block">Cựu học sinh:</span>
                    <span className="prata-regular font-black text-gray-900 text-base sm:text-lg tracking-wide">{member.name}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700 w-24 sm:w-28 inline-block">Niên khóa:</span>
                    <span className="prata-regular font-bold">{ticket.nienKhoa || "Không rõ"}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700 w-24 sm:w-28 inline-block">SĐT:</span>
                    <span className="prata-regular font-semibold">{member.phone}</span>
                  </p>
                  {member.email && (
                    <p>
                      <span className="font-semibold text-gray-700 w-24 sm:w-28 inline-block">Email:</span>
                      <span className="prata-regular break-all">{member.email}</span>
                    </p>
                  )}
                  
                  <div className="pt-3 mt-1 border-t border-gray-100 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-rounded text-gray-400 text-[18px] mt-0.5">schedule</span>
                      <div>
                        <span className="font-semibold text-gray-700 block text-[13px]">Thời gian:</span>
                        <span className="prata-regular font-medium text-gray-800">08:00 - 08/11/2026</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-rounded text-gray-400 text-[18px] mt-0.5">location_on</span>
                      <div>
                        <span className="font-semibold text-gray-700 block text-[13px]">Địa điểm:</span>
                        <span className="prata-regular font-medium text-gray-800">Trường THPT Nguyễn Công Trứ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning Footer */}
                <div className="mt-6 pt-3 border-t border-gray-200 text-center relative z-10">
                  <p className="prata-regular text-red-600 text-[13px] sm:text-[14px]">
                    Vui lòng không chia sẻ thư mời này cho bất kì ai!
                  </p>
                </div>
                </div>
                
                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-12 h-12 sm:w-14 sm:h-14 border-t-4 border-l-4 border-blue-900/10 rounded-tl-3xl z-10"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-14 sm:h-14 border-b-4 border-r-4 border-blue-900/10 rounded-br-3xl z-10"></div>
              </div>
            </Reveal>

            {/* Mobile Button: Về trang chủ (Dưới vé) */}
            <div className="flex lg:hidden mt-6 w-full justify-center">
              <Link href="/" className="group/linkmobile relative inline-block text-blue-900 font-bold pb-1 transition-colors hover:text-blue-700 text-[14px] whitespace-nowrap">
                Về trang chủ
                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-blue-600 rounded-full transition-all duration-300 ease-out opacity-0 scale-x-0 group-hover/linkmobile:opacity-100 group-hover/linkmobile:scale-x-100 group-active/linkmobile:opacity-100 group-active/linkmobile:scale-x-100 group-focus/linkmobile:opacity-100 group-focus/linkmobile:scale-x-100"></span>
              </Link>
            </div>
          </div>

          {/* Right Column: Order Details (~7 parts) */}
          <Reveal delay={250} className="w-full lg:flex-1 lg:max-w-[500px]">
            <div className="sticky top-28 bg-transparent px-2 sm:px-6 lg:px-0">
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Chi tiết đăng ký
              </h3>
              
              <div className="space-y-4 sm:space-y-5 text-sm sm:text-base">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200 gap-4">
                  <span className="text-gray-500 font-medium shrink-0">Loại đăng ký</span>
                  <span className="font-bold text-gray-900 text-base sm:text-lg text-right">
                    {ticket.type === "individual" ? "Cá nhân" : "Tập thể"}
                  </span>
                </div>

                <div className="flex justify-between items-start pb-4 border-b border-gray-200 gap-4">
                  <span className="text-gray-500 font-medium shrink-0 sm:mt-0.5">Số lượng áo đăng ký</span>
                  <div className="text-right text-base sm:text-lg">
                    {Object.entries(ticket.sizes || {}).map(([size, qty]) => (
                      <div key={size} className="font-bold text-gray-900 mb-1">
                        Size {size} <span className="text-gray-400 font-normal ml-2">x {qty as number}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 gap-4">
                  <span className="text-gray-900 font-bold text-base sm:text-lg shrink-0">Tổng tiền đã thanh toán</span>
                  <span className="font-black text-emerald-600 text-2xl sm:text-3xl tracking-tight text-right">
                    {ticket.amount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              <div className="flex flex-row flex-nowrap items-center justify-center lg:justify-end gap-5 sm:gap-6 mt-6 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200 overflow-visible w-full">
                <button
                  onClick={handleDownload}
                  disabled={downloading || !ticketQrUrl}
                  className="group/btn relative overflow-hidden bg-[#1d4ed8] text-white rounded-xl px-5 py-2.5 sm:px-6 sm:py-3.5 font-bold inline-flex items-center justify-center shadow-lg hover:shadow-yellow-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <div className={`absolute inset-0 bg-live-gradient transition-opacity duration-300 pointer-events-none ${downloading ? 'opacity-100' : 'opacity-0 group-hover/btn:opacity-100'}`}></div>
                  <div className="relative flex items-center gap-1.5 sm:gap-2 z-10 overflow-hidden text-[13px] sm:text-[14px]">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>{downloading ? "Đang tải..." : "Tải thư mời về máy"}</span>
                  </div>
                </button>
                
                <Link href="/" className="hidden lg:inline-block group/link relative text-blue-900 font-bold sm:font-medium pb-1 transition-colors hover:text-blue-700 shrink-0 text-[13px] sm:text-[15px] whitespace-nowrap">
                  Về trang chủ
                  <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-blue-600 rounded-full transition-all duration-300 ease-out opacity-0 scale-x-0 group-hover/link:opacity-100 group-hover/link:scale-x-100 group-active/link:opacity-100 group-active/link:scale-x-100 group-focus/link:opacity-100 group-focus/link:scale-x-100"></span>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </main>
  );
}

export default function TicketPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"></div>}>
      <TicketContent />
    </Suspense>
  );
}
