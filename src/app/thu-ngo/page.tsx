import type { Metadata } from "next";
import Image from "next/image";
import { BreadcrumbJsonLd } from "@/components/JsonLd";

const SITE_URL = "https://40namnctru.nctitc.io.vn";

export const metadata: Metadata = {
  title: "Thư Ngỏ Ban Tổ Chức",
  description:
    "Thư ngỏ từ Ban Tổ chức Chuỗi chương trình Kỷ niệm 40 năm Thành lập Trường THPT Nguyễn Công Trứ (1986 - 2026) và thông tin tiếp nhận đóng góp đồng hành.",
  alternates: {
    canonical: `${SITE_URL}/thu-ngo`,
  },
  openGraph: {
    title: "Thư Ngỏ Ban Tổ Chức",
    description:
      "Thư ngỏ từ Ban Tổ chức Chuỗi chương trình Kỷ niệm 40 năm Thành lập Trường THPT Nguyễn Công Trứ (1986 - 2026) và thông tin tiếp nhận đóng góp đồng hành.",
    url: `${SITE_URL}/thu-ngo`,
    siteName: "40 Năm THPT Nguyễn Công Trứ",
    images: [
      {
        url: "/images/og-share.png",
        width: 1200,
        height: 630,
        alt: "Thư ngỏ Kỷ niệm 40 năm THPT Nguyễn Công Trứ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thư ngỏ BTC Chuỗi chương trình Kỷ niệm 40 năm THPT Nguyễn Công Trứ",
    description:
      "Thư ngỏ từ Ban Tổ chức Chuỗi chương trình Kỷ niệm 40 năm Thành lập Trường THPT Nguyễn Công Trứ (1986 - 2026).",
    images: ["/images/og-share.png"],
  },
};

export default function ThuNgoPage() {
  return (
    <main className="min-h-screen pt-32 pb-16 px-4 md:px-8 bg-slate-50">
      <BreadcrumbJsonLd
        items={[
          { name: "Trang chủ", url: "/" },
          { name: "Thư ngỏ", url: "/thu-ngo" },
        ]}
      />
      <div className="max-w-4xl mx-auto flex flex-col gap-12 items-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-sm font-extrabold tracking-widest text-[#1d4ed8]">
            <span className="h-0.5 w-6 rounded-full bg-[#1d4ed8]" />
            <span>THƯ NGỎ</span>
            <span className="h-0.5 w-6 rounded-full bg-[#1d4ed8]" />
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-slate-900">
            BTC Chuỗi chương trình Kỷ niệm 40 năm
          </h1>
        </div>

        <div className="w-full flex flex-col gap-8 md:gap-12">
          {/* Thư ngỏ */}
          <div className="relative w-full rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 bg-white p-2 md:p-4 transition-transform hover:scale-[1.01] duration-300">
            <Image
              src="/messages_images/thu-ngo.webp"
              alt="Thư ngỏ BTC Chuỗi chương trình Kỷ niệm 40 năm thành lập Trường THPT Nguyễn Công Trứ (1986 - 2026)"
              width={1600}
              height={2200}
              className="w-full h-auto object-contain rounded-xl"
              priority
            />
          </div>

          {/* Thông tin tài khoản */}
          <div className="relative w-full rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 bg-white p-2 md:p-4 transition-transform hover:scale-[1.01] duration-300">
            <Image
              src="/messages_images/thong-tin-tai-khoan.webp"
              alt="Thông tin tài khoản tiếp nhận đóng góp kỷ niệm 40 năm THPT Nguyễn Công Trứ"
              width={1600}
              height={2200}
              className="w-full h-auto object-contain rounded-xl"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
