import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import { listAdminAccounts, deleteAdminAccount, createAdminAccount, type CreateAdminInput } from "@/lib/admin";

export const dynamic = "force-dynamic";

/** Danh sách tài khoản (chỉ Super Admin) */
export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role !== "super_admin") return unauthorized();

  const token = req.cookies.get("nct_admin")?.value;
  const accounts = await listAdminAccounts(token);
  return NextResponse.json({ ok: true, accounts });
}

export async function DELETE(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role !== "super_admin") return unauthorized();

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, message: "Thiếu ID" }, { status: 400 });

  const token = req.cookies.get("nct_admin")?.value;
  const success = await deleteAdminAccount(id, token);
  if (!success) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy tài khoản" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role !== "super_admin") return unauthorized();

  try {
    const input = (await req.json()) as CreateAdminInput;
    const token = req.cookies.get("nct_admin")?.value;
    const result = await createAdminAccount(input, token);
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, account: result.account });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Lỗi tạo tài khoản" }, { status: 400 });
  }
}
