import { NextResponse } from "next/server";

// Cloudflare Workers không hỗ trợ Node.js `fs` module.
// Danh sách ảnh được hardcode ở đây — cập nhật khi thêm/xóa ảnh trong public/hero_images/
const HERO_IMAGES = [
  "/hero_images/hero_0.webp",
  "/hero_images/hero_1.webp",
  "/hero_images/hero_2.webp",
  "/hero_images/hero_2.1.webp",
  "/hero_images/hero_3.webp",
  "/hero_images/hero_4.webp",
  "/hero_images/hero_5.webp",
  "/hero_images/hero_6.webp",
  "/hero_images/hero_7.webp",
  "/hero_images/hero_8.webp",
  "/hero_images/hero_9.webp",
  "/hero_images/hero_10.webp",
  "/hero_images/hero_11.webp",
  "/hero_images/hero_12.webp",
  "/hero_images/hero_13.webp",
  "/hero_images/hero_14.webp",
  "/hero_images/hero_15.webp",
];

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  return NextResponse.json({ images: HERO_IMAGES });
}
