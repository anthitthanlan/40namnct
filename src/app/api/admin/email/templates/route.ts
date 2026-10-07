import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nctitc.io.vn";

function getHeaders(token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();

  const token = req.cookies.get("nct_admin")?.value;
  try {
    const res = await fetch(`${API_URL}/api/email/templates`, { headers: getHeaders(token), cache: "no-store" });
    if (!res.ok) return NextResponse.json({ ok: false, message: await res.text() }, { status: res.status });
    return NextResponse.json({ ok: true, templates: await res.json() });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();

  const token = req.cookies.get("nct_admin")?.value;
  try {
    const body = await req.json();
    const res = await fetch(`${API_URL}/api/email/templates`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(body),
    });
    if (!res.ok) return NextResponse.json({ ok: false, message: await res.text() }, { status: res.status });
    return NextResponse.json({ ok: true, template: await res.json() });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, message: "Thiếu ID" }, { status: 400 });

  const token = req.cookies.get("nct_admin")?.value;
  try {
    const body = await req.json();
    const res = await fetch(`${API_URL}/api/email/templates/${id}`, {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify(body),
    });
    if (!res.ok) return NextResponse.json({ ok: false, message: await res.text() }, { status: res.status });
    return NextResponse.json({ ok: true, template: await res.json() });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, message: "Thiếu ID" }, { status: 400 });

  const token = req.cookies.get("nct_admin")?.value;
  try {
    const res = await fetch(`${API_URL}/api/email/templates/${id}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });
    if (!res.ok) return NextResponse.json({ ok: false, message: await res.text() }, { status: res.status });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
