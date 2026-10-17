import type { Metadata, Viewport } from "next";
import "./globals.css";
import DynamicNavbar from "@/components/DynamicNavbar";
import SiteFooter from "@/components/SiteFooter";
import PageTransitionProvider from "@/components/PageTransitionProvider";
import MusicPlayer from "@/components/MusicPlayer";
import { SchoolAndEventsJsonLd } from "@/components/JsonLd";
import { Toaster } from "react-hot-toast";

const SITE_URL = "https://40namnctru.nctitc.io.vn";

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kỷ Niệm 40 Năm THPT Nguyễn Công Trứ (1986 - 2026)",
    template: "%s | 40 Năm THPT Nguyễn Công Trứ",
  },
  description:
    "Chuyên trang thông tin Chuỗi hoạt động Kỷ niệm 40 năm Thành lập Trường THPT Nguyễn Công Trứ (1986 - 2026). Nơi hội tụ Thầy và Trò, lưu giữ ký ức và lan tỏa tinh thần 'Thắp Chí Vươn Xa'.",
  keywords: [
    "THPT Nguyễn Công Trứ",
    "40 năm Nguyễn Công Trứ",
    "kỷ niệm 40 năm THPT Nguyễn Công Trứ",
    "cựu học sinh Nguyễn Công Trứ",
    "trường Thông Tây Hội",
    "Nguyễn Công Trứ Gò Vấp",
    "NCTru",
    "NCT",
    "THPTNguyenCongTru",
    "TuHaoNguyenCongTru",
    "THPTNguyenCongTru40Nam",
    "THAPCHIVUONXA",
    "NgayTroVe",
    "CLBTinhocNCT",
    "NCTITC",
  ],
  authors: [
    {
      name: "BTC Chuỗi chương trình Kỷ niệm 40 năm Thành lập THPT Nguyễn Công Trứ",
      url: SITE_URL,
    },
    {
      name: "CLB Tin học THPT Nguyễn Công Trứ (NCT ITC)",
      url: SITE_URL,
    },
  ],
  creator: "BTC Chuỗi chương trình Kỷ niệm 40 năm THPT Nguyễn Công Trứ",
  publisher: "Trường THPT Nguyễn Công Trứ",
  alternates: {
    canonical: "./",
  },
  icons: {
    icon: [
      { url: "/images/NCT.webp", type: "image/webp" },
      { url: "/images/Logo_40th_NCT.webp", type: "image/webp" },
    ],
    apple: [{ url: "/images/Logo_40th_NCT.webp", type: "image/webp" }],
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    siteName: "40 Năm THPT Nguyễn Công Trứ",
    title: "Kỷ Niệm 40 Năm THPT Nguyễn Công Trứ (1986 - 2026)",
    description:
      "Chuyên trang thông tin Chuỗi hoạt động Kỷ niệm 40 năm Thành lập Trường THPT Nguyễn Công Trứ (1986 - 2026). Nơi hội tụ Thầy và Trò, lưu giữ ký ức và lan tỏa tinh thần 'Thắp Chí Vươn Xa'.",
    images: [
      {
        url: "/images/og-share.png",
        width: 1200,
        height: 630,
        alt: "Banner Chuỗi chương trình Kỷ niệm 40 năm Thành lập THPT Nguyễn Công Trứ (1986 - 2026)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kỷ Niệm 40 Năm THPT Nguyễn Công Trứ (1986 - 2026)",
    description:
      "Chuyên trang thông tin Chuỗi hoạt động Kỷ niệm 40 năm Thành lập Trường THPT Nguyễn Công Trứ (1986 - 2026). Nơi hội tụ Thầy và Trò, lưu giữ ký ức và lan tỏa tinh thần 'Thắp Chí Vươn Xa'.",
    images: ["/images/og-share.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "fk8SXH8D4_ioMMwn8d7aiIu72iu4YQBukQySWdKKINs",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&family=Unbounded:wght@200..900&family=Beau+Rivage&family=Prata&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
        <SchoolAndEventsJsonLd />
      </head>
      <body className="antialiased selection:bg-[#1d4ed8]/20 selection:text-[#1d4ed8]">
        <DynamicNavbar />
        <PageTransitionProvider>{children}</PageTransitionProvider>
        <SiteFooter />
        <MusicPlayer />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              borderRadius: "16px",
              background: "#1e293b",
              color: "#fff",
              fontWeight: 600,
              fontSize: "14px",
            },
            success: {
              iconTheme: {
                primary: "#22c55e",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
