import type { Metadata } from "next";
import MemberAccount from "@/components/MemberAccount";

export const metadata: Metadata = {
  title: "Tài khoản của tôi · 40 năm THPT Nguyễn Công Trứ",
  description:
    "Mã định danh, vé cá nhân & vé tập thể của bạn cho Lễ kỷ niệm 40 năm thành lập trường ngày 15/11/2026.",
};

export default function TaiKhoanPage() {
  return (
    <main className="min-h-screen">
      <section className="bg-gradient-to-b from-[#16a34a] to-[#166534] pb-12 pt-32 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            🎟 Tài khoản của tôi
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-emerald-50 sm:text-lg">
            Mã định danh duyệt cổng và các vé tham dự ngày hội 15/11/2026.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14">
        <MemberAccount />
      </section>
    </main>
  );
}
