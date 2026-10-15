import type { Metadata } from "next";
import NctMotionWrapper from "@/components/NctMotionWrapper";
import { BreadcrumbJsonLd } from "@/components/JsonLd";

const SITE_URL = "https://40namnctru.nctitc.io.vn";

export const metadata: Metadata = {
  title: "Logo Breakdown 40 Năm",
  description:
    "Trải nghiệm phân rã biểu trưng kỷ niệm 40 năm THPT Nguyễn Công Trứ (1986 - 2026) – hiệu ứng Motion Graphics tương tác theo thao tác cuộn.",
  alternates: {
    canonical: `${SITE_URL}/cau-chuyen/NCTru-breakdown`,
  },
  openGraph: {
    title: "Logo Breakdown 40 Năm",
    description:
      "Trải nghiệm phân rã biểu trưng kỷ niệm 40 năm THPT Nguyễn Công Trứ (1986 - 2026) – hiệu ứng Motion Graphics tương tác theo thao tác cuộn.",
    url: `${SITE_URL}/cau-chuyen/NCTru-breakdown`,
    siteName: "40 Năm THPT Nguyễn Công Trứ",
    images: [
      {
        url: "/images/og-share.png",
        width: 1200,
        height: 630,
        alt: "Logo Breakdown 40 năm THPT Nguyễn Công Trứ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NCT Logo Breakdown · 40 năm Nguyễn Công Trứ",
    description:
      "Trải nghiệm Motion Graphics biểu trưng 40 năm thành lập trường THPT Nguyễn Công Trứ.",
    images: ["/images/og-share.png"],
  },
};

export default function NctMotionPage() {
  return (
    <main style={{ background: "#03050b", minHeight: "100vh" }}>
      <BreadcrumbJsonLd
        items={[
          { name: "Trang chủ", url: "/" },
          { name: "Câu chuyện", url: "/cau-chuyen" },
          { name: "Logo Breakdown", url: "/cau-chuyen/NCTru-breakdown" },
        ]}
      />
      <h1 className="sr-only">NCT Logo Breakdown - 40 Năm THPT Nguyễn Công Trứ</h1>
      <NctMotionWrapper />
    </main>
  );
}
