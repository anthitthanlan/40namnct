import type { Metadata } from "next";
import { Suspense } from "react";
import ThuMoiClient from "./ThuMoiClient";
import { BreadcrumbJsonLd } from "@/components/JsonLd";

const SITE_URL = "https://40namnctru.nctitc.io.vn";

export const metadata: Metadata = {
  title: "Thư Mời Điện Tử Ngày Trở Về",
  description:
    "Thư mời điện tử chính thức tham dự Ngày Trở Về 08/11/2026 và Chuỗi chương trình Kỷ niệm 40 năm Thành lập Trường THPT Nguyễn Công Trứ.",
  alternates: {
    canonical: `${SITE_URL}/thu-moi`,
  },
  openGraph: {
    title: "Thư Mời Điện Tử Ngày Trở Về",
    description:
      "Thư mời điện tử chính thức tham dự Ngày Trở Về 08/11/2026 và Chuỗi chương trình Kỷ niệm 40 năm Thành lập Trường THPT Nguyễn Công Trứ.",
    url: `${SITE_URL}/thu-moi`,
    siteName: "40 Năm THPT Nguyễn Công Trứ",
    images: [
      {
        url: "/images/og-share.png",
        width: 1200,
        height: 630,
        alt: "Thư mời điện tử 40 năm THPT Nguyễn Công Trứ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thư mời điện tử Ngày Trở Về (08/11/2026) · 40 Năm THPT Nguyễn Công Trứ",
    description:
      "Thư mời điện tử chính thức tham dự Ngày Trở Về 08/11/2026 - Kỷ niệm 40 năm THPT Nguyễn Công Trứ.",
    images: ["/images/og-share.png"],
  },
};

export default function InvitationPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Trang chủ", url: "/" },
          { name: "Thư mời", url: "/thu-moi" },
        ]}
      />
      <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
        <ThuMoiClient />
      </Suspense>
    </>
  );
}
