import type { Metadata } from "next";
import TraCuuClient from "./TraCuuClient";
import Reveal from "@/components/Reveal";
import { BreadcrumbJsonLd } from "@/components/JsonLd";

const SITE_URL = "https://40namnctru.nctitc.io.vn";

export const metadata: Metadata = {
  title: "Tra cứu thư mời điện tử · 40 Năm THPT Nguyễn Công Trứ",
  description:
    "Tra cứu trạng thái đăng ký, kết quả xác nhận đóng góp và tải thư mời điện tử tham dự Ngày Trở Về 08/11/2026 - Kỷ niệm 40 năm THPT Nguyễn Công Trứ.",
  alternates: {
    canonical: `${SITE_URL}/tra-cuu`,
  },
  openGraph: {
    title: "Tra cứu thư mời điện tử · 40 Năm THPT Nguyễn Công Trứ",
    description:
      "Tra cứu trạng thái đăng ký và tải thư mời điện tử tham dự Ngày Trở Về 08/11/2026 trường THPT Nguyễn Công Trứ.",
    url: `${SITE_URL}/tra-cuu`,
    siteName: "40 Năm THPT Nguyễn Công Trứ (1986 - 2026)",
    images: [
      {
        url: "/images/og-share.png",
        width: 1200,
        height: 630,
        alt: "Tra cứu thư mời 40 năm THPT Nguyễn Công Trứ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tra cứu thư mời điện tử · 40 Năm THPT Nguyễn Công Trứ",
    description:
      "Tra cứu trạng thái đăng ký và tải thư mời điện tử tham dự Ngày Trở Về 08/11/2026.",
    images: ["/images/og-share.png"],
  },
};

export default function TraCuuPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24 pt-32">
      <BreadcrumbJsonLd
        items={[
          { name: "Trang chủ", url: "/" },
          { name: "Tra cứu thư mời", url: "/tra-cuu" },
        ]}
      />
      <Reveal>
        <TraCuuClient />
      </Reveal>
    </main>
  );
}
