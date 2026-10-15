import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "40 Năm THPT Nguyễn Công Trứ (1986 - 2026)",
    short_name: "40 Năm NCT",
    description:
      "Trang thông tin Chuỗi chương trình Kỷ niệm 40 năm Thành lập THPT Nguyễn Công Trứ (1986 - 2026). Nơi kết nối các thế hệ Thầy và Trò.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1d4ed8",
    icons: [
      {
        src: "/images/NCT.webp",
        sizes: "192x192",
        type: "image/webp",
      },
      {
        src: "/images/Logo_40th_NCT.webp",
        sizes: "512x512",
        type: "image/webp",
      },
    ],
  };
}
