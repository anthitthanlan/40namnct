import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ ok: true, authenticated: false });
  }
  return NextResponse.json({
    ok: true,
    authenticated: true,
    admin: {
      id: admin.id,
      username: admin.username,
      fullName: admin.fullName,
      title: admin.title,
      role: admin.role,
    },
  });
}
