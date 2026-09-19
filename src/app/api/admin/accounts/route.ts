import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import {
  listAdminAccounts,
  createAdminAccount,
  deleteAdminAccount,
  isSuperAdmin,
} from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || !isSuperAdmin(admin.role)) {
    return unauthorized();
  }

  const accounts = await listAdminAccounts();
  return NextResponse.json({ ok: true, accounts });
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || !isSuperAdmin(admin.role)) {
    return unauthorized();
  }

  try {
    const body = await req.json();
    const result = await createAdminAccount({
      username: body.username,
      fullName: body.fullName,
      title: body.title,
      password: body.password,
      role: body.role,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
    }

    // Lọc bỏ passwordHash trước khi trả về client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeAccount } = result.account as any;
    return NextResponse.json({ ok: true, account: safeAccount });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Lỗi dữ liệu đầu vào." },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || !isSuperAdmin(admin.role)) {
    return unauthorized();
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, message: "Thiếu ID tài khoản." }, { status: 400 });
  }

  const success = await deleteAdminAccount(id);
  if (!success) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy tài khoản hoặc lỗi khi xoá." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
