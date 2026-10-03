import { NextResponse } from "next/server";
import { mediaFileUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  return NextResponse.redirect(mediaFileUrl(name));
}
