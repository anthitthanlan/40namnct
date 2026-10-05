import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import { updateInvitationDetails } from "@/lib/members";
import { logAction } from "@/lib/action-logs";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role === "editor") return unauthorized();

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, message: "Thiếu id thư mời." }, { status: 400 });
  }

  const token = req.cookies.get("nct_admin")?.value;
  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const result = await updateInvitationDetails(id, body, token);
  
  if (result) {
    await logAction(
      "update",
      "registrations",
      id,
      admin.fullName || admin.username,
      admin.username,
      admin.role,
      "Cập nhật thông tin thư mời"
    );
    return NextResponse.json({ ok: true, data: result });
  } else {
    return NextResponse.json(
      { ok: false, message: "Cập nhật thông tin thất bại." },
      { status: 500 }
    );
  }
}
