"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function InAppBrowserWarning() {
  const [isInApp, setIsInApp] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    // Phát hiện Zalo, Facebook, Messenger, Instagram, TikTok, Line...
    const isApp = 
      ua.includes("FBAN") || 
      ua.includes("FBAV") || 
      ua.includes("Zalo") || 
      ua.includes("Instagram") || 
      ua.includes("Messenger") || 
      ua.includes("Line") || 
      ua.includes("TikTok");

    if (isApp) {
      setIsInApp(true);
    }
  }, []);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isInApp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
              Trải nghiệm tốt nhất
            </h3>
            <p className="text-gray-600 text-center text-[15px] mb-6 leading-relaxed">
              Bạn đang sử dụng trình duyệt tích hợp của ứng dụng. Để việc <strong>đăng ký</strong> và <strong>tải ảnh lên</strong> không bị lỗi, vui lòng mở trang này bằng trình duyệt mặc định của máy (Chrome, Safari...).
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
              <p className="text-sm font-semibold text-gray-800 mb-2">Cách mở:</p>
              <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                <li>Bấm vào biểu tượng <strong>3 chấm (⋮)</strong> hoặc <strong>(⋯)</strong> ở góc phải trên cùng.</li>
                <li>Chọn <strong>Mở bằng trình duyệt</strong> (hoặc Open in Browser/Safari/Chrome).</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={copyUrl}
                className="w-full py-3.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span className="text-green-600">Đã copy link!</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy link trang web
                  </>
                )}
              </button>
              
              <button
                onClick={() => setIsInApp(false)}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
              >
                Tôi hiểu, tiếp tục dùng tạm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
