import type { Metadata } from "next";
import { Suspense } from "react";
import GuiBaiClient from "./GuiBaiClient";
import { BreadcrumbJsonLd } from "@/components/JsonLd";

const SITE_URL = "https://40namnctru.nctitc.io.vn";

export const metadata: Metadata = {
  title: "Gửi gắm kỷ niệm & Khoảnh khắc · 40 Năm THPT Nguyễn Công Trứ",
  description:
    "Chia sẻ bài viết, câu chuyện và những bức ảnh kỷ niệm thanh xuân của bạn dưới mái trường THPT Nguyễn Công Trứ nhân dịp Kỷ niệm 40 năm thành lập (1986 - 2026).",
  alternates: {
    canonical: `${SITE_URL}/gui-bai`,
  },
  openGraph: {
    title: "Gửi gắm kỷ niệm & Khoảnh khắc · 40 Năm THPT Nguyễn Công Trứ",
    description:
      "Chia sẻ bài viết, câu chuyện và những bức ảnh kỷ niệm thanh xuân dưới mái trường THPT Nguyễn Công Trứ nhân dịp Kỷ niệm 40 năm.",
    url: `${SITE_URL}/gui-bai`,
    siteName: "40 Năm THPT Nguyễn Công Trứ (1986 - 2026)",
    images: [
      {
        url: "/images/og-share.png",
        width: 1200,
        height: 630,
        alt: "Gửi gắm kỷ niệm 40 năm THPT Nguyễn Công Trứ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gửi gắm kỷ niệm & Khoảnh khắc · 40 Năm THPT Nguyễn Công Trứ",
    description:
      "Chia sẻ bài viết và ảnh kỷ niệm nhân dịp 40 năm thành lập trường THPT Nguyễn Công Trứ.",
    images: ["/images/og-share.png"],
  },
};

export default function GuiBaiPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Trang chủ", url: "/" },
          { name: "Gửi kỷ niệm", url: "/gui-bai" },
        ]}
      />
      <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
        <GuiBaiClient />
      </Suspense>
    </>
  );
}
