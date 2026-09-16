import type { Metadata } from "next";
import RegisterForm from "@/components/RegisterForm";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Đăng ký tham dự · Lễ kỷ niệm 40 năm THPT Nguyễn Công Trứ",
  description:
    "Đăng ký nhận vé tham dự ngày 08/11/2026 - Lễ kỷ niệm 40 năm thành lập trường THPT Nguyễn Công Trứ.",
};

export default function DangKyPage() {
  return (
    <main className="min-h-screen bg-gray-50 pt-28 pb-20 px-3 md:px-6">
      <div className="w-full max-w-5xl mx-auto">
        <Reveal>
          <div className="text-center mb-10 max-w-xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Đăng Ký Tham Dự
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
