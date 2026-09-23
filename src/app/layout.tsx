import type { Metadata } from "next";
import "./globals.css";
import DynamicNavbar from "@/components/DynamicNavbar";
import SiteFooter from "@/components/SiteFooter";
import PageTransitionProvider from "@/components/PageTransitionProvider";

export const metadata: Metadata = {
  title: "40 Năm THPT Nguyễn Công Trứ (1986 - 2026)",
  description:
    "Kỷ niệm 40 năm thành lập trường THPT Nguyễn Công Trứ - hành trình 40 năm trồng người.",
  icons: {
    icon: [{ url: "/images/logo_nct.webp", type: "image/png" }],
    apple: [{ url: "/images/logo_nct.webp" }],
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
      </head>
      <body className="antialiased selection:bg-[#1d4ed8]/20 selection:text-[#1d4ed8]">
        <DynamicNavbar />
        <PageTransitionProvider>{children}</PageTransitionProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
