import type { Metadata } from "next";
import RegisterForm from "@/components/RegisterForm";
import Reveal from "@/components/Reveal";
import InAppBrowserWarning from "@/components/InAppBrowserWarning";
import { BreadcrumbJsonLd } from "@/components/JsonLd";

const SITE_URL = "https://40namnctru.nctitc.io.vn";

export const metadata: Metadata = {
  title: "Đăng ký tham dự Ngày Trở Về (08/11/2026) · 40 Năm THPT Nguyễn Công Trứ",
  description:
    "Đăng ký áo kỷ niệm 40 năm, suất ăn liên hoan và nhận thư mời điện tử tham dự Ngày Trở Về 08/11/2026 - Giao lưu giữa cựu học sinh và các thầy cô trường THPT Nguyễn Công Trứ.",
  alternates: {
    canonical: `${SITE_URL}/dang-ky`,
  },
  openGraph: {
    title: "Đăng ký tham dự Ngày Trở Về (08/11/2026) · 40 Năm THPT Nguyễn Công Trứ",
    description:
      "Đăng ký áo kỷ niệm 40 năm, suất ăn liên hoan và nhận thư mời điện tử tham dự Ngày Trở Về 08/11/2026 - Giao lưu giữa cựu học sinh và các thầy cô trường THPT Nguyễn Công Trứ.",
    url: `${SITE_URL}/dang-ky`,
    siteName: "40 Năm THPT Nguyễn Công Trứ (1986 - 2026)",
    images: [
      {
        url: "/images/og-share.png",
        width: 1200,
        height: 630,
        alt: "Đăng ký tham dự Ngày Trở Về 40 năm THPT Nguyễn Công Trứ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Đăng ký tham dự Ngày Trở Về (08/11/2026) · 40 Năm THPT Nguyễn Công Trứ",
    description:
      "Đăng ký áo kỷ niệm 40 năm và nhận thư mời điện tử tham dự Ngày Trở Về 08/11/2026.",
    images: ["/images/og-share.png"],
  },
};

export default function DangKyPage() {
  return (
    <main className="min-h-screen bg-gray-50 pt-28 pb-20 px-3 md:px-6">
      <BreadcrumbJsonLd
        items={[
          { name: "Trang chủ", url: "/" },
          { name: "Đăng ký tham dự", url: "/dang-ky" },
        ]}
      />
      <InAppBrowserWarning />
      <div className="w-full max-w-5xl mx-auto">
        <Reveal>
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              Đăng Ký Tham Dự<br />
              <span className="text-[#1d4ed8]">Ngày Trở Về – 08/11/2026</span>
            </h1>
            <p className="text-gray-500 mt-4 text-lg">
              Chào mừng bạn trở về mái trường xưa. Vui lòng điền thông tin để nhận thư mời điện tử.
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
