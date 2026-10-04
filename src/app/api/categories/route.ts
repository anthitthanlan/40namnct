import { NextResponse } from "next/server";
import { listCategories } from "@/lib/categories";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await listCategories();
  return NextResponse.json({ ok: true, categories });
}
