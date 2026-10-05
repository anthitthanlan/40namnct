import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import { createCategory, listCategories } from "@/lib/categories";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) return unauthorized();
    const categories = await listCategories();
    return NextResponse.json({ ok: true, categories });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2) {
    return NextResponse.json({ ok: false, message: "Tên danh mục quá ngắn" }, { status: 400 });
  }

  try {
    const token = req.cookies.get("nct_admin")?.value;
    const category = await createCategory({
      name,
      description: typeof body.description === "string" ? body.description : "",
      order: typeof body.order === "number" ? body.order : 0,
    }, token);
    return NextResponse.json({ ok: true, category });
  } catch (error: any) {
    console.error("POST Error:", error);
    return NextResponse.json({ ok: false, message: error.message || "Failed to create category" }, { status: 500 });
  }
}
