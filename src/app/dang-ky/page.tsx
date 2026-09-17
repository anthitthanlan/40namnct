import type { Metadata } from "next";
import RegisterForm from "@/components/RegisterForm";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Đăng ký áo kỷ niệm · Lễ kỷ niệm 40 năm THPT Nguyễn Công Trứ",
  description:
    "Đăng ký áo kỷ niệm và suất ăn liên hoan ngày 08/11/2026 - Ngày trở về giao lưu giữa cựu học sinh và các thầy cô trường THPT Nguyễn Công Trứ.",
};

export default function DangKyPage() {
  return (
    <main className="min-h-screen bg-gray-50 pt-28 pb-20 px-3 md:px-6">
      <div className="w-full max-w-5xl mx-auto">
        <Reveal>
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              Đăng Ký Tham Dự<br />
              <span className="text-[#1d4ed8]">Ngày Trở Về – 08/11/2026</span>
            </h1>
            <p className="text-gray-500 mt-4 text-lg">
              Chào mừng bạn trở về mái trường xưa. Vui lòng điền thông tin để nhận mã vé.
            </p>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <RegisterForm />
        </Reveal>
      </div>
    </main>
  );
}
