import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readUploadFile } from "@/lib/media";

export const dynamic = "force-dynamic";

/** Phục vụ tệp media từ data/uploads (chặn path traversal) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const found = await readUploadFile(name);
  if (!found) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy tệp." },
      { status: 404 },
    );
  }
  return new NextResponse(new Uint8Array(found.buffer), {
    headers: {
      "Content-Type": found.mime,
      "Content-Length": String(found.buffer.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
