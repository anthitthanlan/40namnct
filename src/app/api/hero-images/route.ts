import { readdirSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

const HERO_DIR = join(process.cwd(), "public", "hero_images");
const ALLOWED_EXTENSIONS = new Set([".webp", ".jpg", ".jpeg", ".png", ".avif"]);

export const dynamic = "force-static";
export const revalidate = 3600; // cache 1 tiếng, tự làm mới khi deploy

export function GET() {
  try {
    const files = readdirSync(HERO_DIR)
      .filter((f) => {
        const ext = "." + f.split(".").pop()!.toLowerCase();
        return ALLOWED_EXTENSIONS.has(ext);
      })
      .sort() // đảm bảo thứ tự ổn định
      .map((f) => `/hero_images/${f}`);

    return NextResponse.json({ images: files });
  } catch {
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}
