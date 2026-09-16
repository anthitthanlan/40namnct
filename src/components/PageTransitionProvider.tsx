"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useContext, useRef } from "react";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Image from "next/image";
import { useEffect, useState } from "react";

// Hack để Next.js không destroy layout cũ ngay lập tức
function FrozenRouter({ children }: { children: React.ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const frozen = useRef(context).current;
  return <LayoutRouterContext.Provider value={frozen}>{children}</LayoutRouterContext.Provider>;
}

// Trì hoãn việc render giao diện mới để đồng bộ với lúc màn trắng vuốt lên (chỉ áp dụng khi chuyển trang, không áp dụng lần đầu load web)
function DelayedMount({ children, isInitial }: { children: React.ReactNode, isInitial: boolean }) {
  const [show, setShow] = useState(isInitial);
  
  useEffect(() => {
    if (isInitial) return;
    // 500ms khớp với delay của màn trắng lúc mở trang mới
    const timer = setTimeout(() => setShow(true), 500);
    return () => clearTimeout(timer);
  }, [isInitial]);

  return show ? <>{children}</> : <div className="min-h-screen bg-transparent" />;
}

export default function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInitialRender = useRef(true);

  useEffect(() => {
    isInitialRender.current = false;
  }, []);

  // Bỏ qua timeline
  if (pathname === "/timeline") return <>{children}</>;

  return (
    <AnimatePresence mode="wait">
      <motion.div key={pathname} className="w-full">
        <FrozenRouter>
          <DelayedMount isInitial={isInitialRender.current}>{children}</DelayedMount>
        </FrozenRouter>

        {/* Lớp che lúc MỞ TRANG MỚI (Trượt lên trên & mất đi) */}
        <motion.div
          className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center pointer-events-none"
          initial={{ y: 0 }}
          animate={{ y: "-100%" }}
          exit={{ opacity: 0, transition: { duration: 0 } }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.5 }} // Chờ 0.5s cho logo mờ đi rồi mới trượt màn trắng
        >
          <motion.div 
            className="flex items-center gap-6"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut", delay: 0.1 }}
          >
            <Image src="/images/NCT.png" width={80} height={80} alt="Logo NCT" className="w-auto h-20" priority />
            <div className="h-16 w-[2px] bg-slate-300"></div>
            <Image src="/images/Logo_40th_NCT.png" width={80} height={80} alt="40 Năm NCT" className="w-auto h-20" priority />
          </motion.div>
        </motion.div>

        {/* Lớp che lúc RỜI TRANG CŨ (Trượt từ dưới lên che lại) */}
        <motion.div
          className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center pointer-events-none"
          initial={{ y: "100%" }}
          animate={{ y: "100%" }} // Bình thường giấu ở dưới
          exit={{ y: 0 }} // Khi rời trang, trượt lên che màn hình
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div 
            className="flex items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut", delay: 0.3 }} // Màn trắng che gần xong thì logo mới mờ mờ hiện ra
          >
            <Image src="/images/NCT.png" width={80} height={80} alt="Logo NCT" className="w-auto h-20" priority />
            <div className="h-16 w-[2px] bg-slate-300"></div>
            <Image src="/images/Logo_40th_NCT.png" width={80} height={80} alt="40 Năm NCT" className="w-auto h-20" priority />
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
