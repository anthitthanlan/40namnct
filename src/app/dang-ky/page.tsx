import type { Metadata } from "next";
import RegisterForm from "@/components/RegisterForm";
import SchoolAnimatedBg from "@/components/SchoolAnimatedBg";

export const metadata: Metadata = {
  title: "Đăng ký tham dự · Lễ kỷ niệm 40 năm THPT Nguyễn Công Trứ",
  description:
    "Tạo tài khoản, nhận mã định danh và đăng ký vé tham dự ngày 15/11/2026 - vé cá nhân miễn phí, vé tập thể 200.000đ/suất thanh toán qua QR EMVCo (Napas 247).",
};

const INFO_ITEMS = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        width={16}
        height={16}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    ),
    title: "Vé cá nhân",
    desc: "Miễn phí · chọn size áo",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        width={16}
        height={16}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" />
      </svg>
    ),
    title: "Vé tập thể",
    desc: "200.000đ/suất · theo khóa/lớp",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        width={16}
        height={16}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
      </svg>
    ),
    title: "Thanh toán QR",
    desc: "Sacombank · Napas 247",
  },
];

export default function DangKyPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden px-4 pb-12 pt-24 sm:py-24">
      {/* Background ảnh trường animated từ /public/bg + hiệu ứng làm mờ kính */}
      <SchoolAnimatedBg />

      {/* Container chính giữa màn hình */}
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center">
        {/* Box đăng ký kính đen glassmorphic */}
        <div className="w-full">
          <RegisterForm />
        </div>

        {/* Thông tin vé - 3 badge kính nhỏ với SVG icon */}
        <div className="mt-4 grid w-full grid-cols-3 gap-2.5">
          {INFO_ITEMS.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-white/10 bg-black/40 p-2.5 text-center shadow-lg shadow-black/40 backdrop-blur-xl transition hover:border-white/20 hover:bg-black/55"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white mx-auto">
                {item.icon}
              </span>
              <p className="mt-1 text-[11px] font-bold text-white sm:text-xs">
                {item.title}
              </p>
              <p className="hidden text-[10px] text-slate-400 sm:block leading-tight mt-0.5">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
