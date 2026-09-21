import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import { listAdminAccounts } from "@/lib/admin";

export const dynamic = "force-dynamic";

/** Danh sách tài khoản (chỉ Super Admin) */
export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role !== "super_admin") return unauthorized();

  const accounts = await listAdminAccounts();
  return NextResponse.json({ ok: true, accounts });
}
