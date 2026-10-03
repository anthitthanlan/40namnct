import { NextResponse } from "next/server";
import { readUploadFile } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  
  const file = await readUploadFile(name);
  if (!file) {
    return new NextResponse("File not found", { status: 404 });
  }
  
  return new NextResponse(file.buffer, {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
