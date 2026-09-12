import type { Metadata } from "next";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Đăng ký tham dự · Lễ kỷ niệm 40 năm THPT Nguyễn Công Trứ",
  description:
    "Tạo tài khoản, nhận mã định danh và đăng ký vé tham dự ngày 15/11/2026 - vé cá nhân miễn phí, vé tập thể 200.000đ/suất thanh toán qua QR EMVCo (Napas 247).",
};

const CHIPS = [
  { icon: "👤", title: "Vé cá nhân", desc: "Miễn phí · chọn size áo kỷ niệm" },
  { icon: "👥", title: "Vé tập thể", desc: "200.000đ/suất · nhóm, lớp, khóa" },
  {
    icon: "🏦",
    title: "Thanh toán QR EMVCo",
    desc: "Sacombank 060004015137 · nội dung CK tự đổi mỗi 2 phút",
  },
];

export default function DangKyPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#172554] px-6 pb-20 pt-32">
      {/* Blobs trang trí - phong cách glassmorphic */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-16 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-2xl">
        <div className="text-center">
          <span className="inline-block rounded-full border border-white/40 bg-white/15 px-5 py-2 text-[11px] font-extrabold tracking-widest text-white backdrop-blur-md">
            🎟 ĐĂNG KÝ THAM DỰ - NGÀY TRỞ VỀ 15/11/2026
          </span>
          <h1 className="mt-5 text-3xl font-extrabold text-white sm:text-5xl">
            Đăng ký tham dự Lễ kỷ niệm 40 năm
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-blue-50/90 sm:text-base">
            Tạo tài khoản chỉ với họ tên và số điện thoại - hệ thống cấp{" "}
            <strong className="font-extrabold text-white">mã định danh</strong>{" "}
            để đăng nhập lại và duyệt vào cổng ngày hội dưới mái trường Nguyễn
            Công Trứ (1986 - 2026).
          </p>
        </div>

        <div className="mt-9">
          <RegisterForm />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {CHIPS.map((chip) => (
            <div
              key={chip.title}
              className="rounded-2xl border border-white/30 bg-white/10 p-4 text-center backdrop-blur-md"
            >
              <span className="text-2xl">{chip.icon}</span>
              <p className="mt-1.5 text-sm font-extrabold text-white">
                {chip.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-blue-50/85">
                {chip.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
