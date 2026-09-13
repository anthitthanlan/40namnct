import type { Metadata } from "next";
import "./globals.css";
import DynamicNavbar from "@/components/DynamicNavbar";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "40 Năm THPT Nguyễn Công Trứ (1986 - 2026)",
  description:
    "Kỷ niệm 40 năm thành lập trường THPT Nguyễn Công Trứ - hành trình 40 năm trồng người.",
  icons: {
    icon: [{ url: "/images/logo_nct.png", type: "image/png" }],
    apple: [{ url: "/images/logo_nct.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="antialiased">
        <DynamicNavbar />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
