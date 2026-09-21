import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import {
  listMembers,
  listInvitations,
  setInvitationStatus,
  setShirtReceived,
  type InvitationStatus,
} from "@/lib/members";
import { logAction, listActionLogs } from "@/lib/action-logs";

export const dynamic = "force-dynamic";

/** Admin: danh sách thành viên + toàn bộ thư mời + logs */
export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role === "editor") return unauthorized();

  const [members, invitations] = await Promise.all([listMembers(), listInvitations()]);
  const byId = new Map(members.map((m) => [m.id, m]));

  const invitationViews = invitations
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((t) => {
      const m = byId.get(t.memberId);
      return {
        ...t,
        memberName: m?.name ?? "(đã xoá)",
        memberPhone: m?.phone ?? "",
      };
    });

  const memberViews = members.map((m) => {
    const mine = invitations.filter(
      (t) => t.memberId === m.id && t.status !== "cancelled",
    );
    return {
      id: m.id,
      name: m.name,
      phone: m.phone,
      createdAt: m.createdAt,
      invitationCount: mine.length,
      peopleCount: mine.reduce((sum, t) => sum + t.quantity, 0),
      confirmedAmount: mine
        .filter((t) => t.status === "confirmed")
        .reduce((sum, t) => sum + t.amount, 0),
      pendingAmount: mine
        .filter((t) => t.status === "pending")
        .reduce((sum, t) => sum + t.amount, 0),
    };
  });

  const logs = admin.role === "super_admin" ? await listActionLogs() : [];

  return NextResponse.json({ 
    ok: true, 
    role: admin.role,
    members: memberViews, 
    invitations: invitationViews,
    logs 
  });
}

type Body = Record<string, unknown>;
const ALLOWED: InvitationStatus[] = [
  "pending",
  "pending_payment",
  "pending_approval",
  "confirmed",
  "rejected",
  "cancelled",
];

/** Admin: đổi trạng thái vé - xác nhận đã nhận tiền / hủy */
export async function PATCH(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role === "editor") return unauthorized();

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  const id = typeof body.id === "string" ? body.id : "";
  const action = (body as any).action || "update_status";

  if (!id) {
    return NextResponse.json(
      { ok: false, message: "Thiếu id thư mời." },
      { status: 400 },
    );
  }

  if (action === "update_shirt") {
    const shirtReceived = typeof (body as any).shirtReceived === "boolean" ? (body as any).shirtReceived : false;
    const invitation = await setShirtReceived(id, shirtReceived);
    if (!invitation) return NextResponse.json({ ok: false, message: "Không tìm thấy thư mời." }, { status: 404 });
    await logAction(
      "update_status",
      "registrations",
      id,
      admin.fullName || admin.username,
      admin.username,
      admin.role,
      `Cập nhật nhận áo thành: ${shirtReceived ? "Đã nhận" : "Chưa nhận"}`,
    );
    return NextResponse.json({ ok: true, invitation });
  }

  const status = body.status as InvitationStatus;
  if (!ALLOWED.includes(status)) {
    return NextResponse.json(
      { ok: false, message: "Trạng thái không hợp lệ." },
      { status: 400 },
    );
  }

  const invitation = await setInvitationStatus(id, status);
  if (!invitation) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy thư mời." },
      { status: 404 },
    );
  }

  await logAction(
    "update_status",
    "registrations",
    id,
    admin.fullName || admin.username,
    admin.username,
    admin.role,
    `Cập nhật trạng thái thành: ${status}`,
  );

  return NextResponse.json({ ok: true, invitation });
}
