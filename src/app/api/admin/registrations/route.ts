import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized, COOKIE_NAME } from "@/lib/auth";
import { canManageInvitations } from "@/lib/admin";
import {
  listMembers,
  listInvitations,
  setInvitationStatus,
  setShirtReceived,
  updateInvitationDetails,
  type InvitationStatus,
} from "@/lib/members";
import { logAction, listActionLogs } from "@/lib/action-logs";
import { sendInvitationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/** Admin: danh sách thành viên + toàn bộ thư mời + logs */
export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();
  if (!canManageInvitations(admin.role)) {
    return NextResponse.json(
      { ok: false, message: "Không có quyền quản lý thư mời." },
      { status: 403 },
    );
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const [members, invitations] = await Promise.all([listMembers(token), listInvitations(token)]);
  const byId = new Map(members.map((m) => [m.id, m]));

  const logs = await listActionLogs(token, { all: true });

  const emailLogsByEntity = new Map<string, number>();
  for (const l of logs) {
    if (
      l.entityId &&
      (l.action === "send_email" ||
        l.details?.toLowerCase().includes("gửi email") ||
        l.details?.toLowerCase().includes("email thư mời") ||
        l.details?.toLowerCase().includes("thư mời qua email"))
    ) {
      emailLogsByEntity.set(l.entityId, (emailLogsByEntity.get(l.entityId) || 0) + 1);
    }
  }

  const invitationViews = invitations
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((t) => {
      const m = byId.get(t.memberId);
      const unifiedName = t.attendeeName || m?.name || "(đã xoá)";
      const countFromLogs = emailLogsByEntity.get(t.id) || 0;
      const finalEmailCount = Math.max(countFromLogs, t.emailSent ? 1 : 0);
      return {
        ...t,
        attendeeName: unifiedName,
        memberName: unifiedName,
        memberPhone: m?.phone ?? "",
        memberEmail: m?.email ?? "",
        emailSent: finalEmailCount > 0,
        emailSentCount: finalEmailCount,
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
      email: m.email ?? "",
      createdAt: m.createdAt,
      invitationCount: mine.length,
      peopleCount: mine.reduce((sum, t) => sum + (t.quantity || 1), 0),
      confirmedAmount: mine
        .filter((t) => t.status === "confirmed")
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      pendingAmount: mine
        .filter((t) => t.status === "pending")
        .reduce((sum, t) => sum + (t.amount || 0), 0),
    };
  });

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
  if (!admin) return unauthorized();
  if (!canManageInvitations(admin.role)) {
    return NextResponse.json(
      { ok: false, message: "Không có quyền quản lý thư mời." },
      { status: 403 },
    );
  }

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
  const token = req.cookies.get("nct_admin")?.value;

  if (action === "update_shirt") {
    const shirtReceived = typeof (body as any).shirtReceived === "boolean" ? (body as any).shirtReceived : false;
    const invitation = await setShirtReceived(id, shirtReceived, token);
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

  let invitation;
  if (typeof (body as any).rejectReason === "string") {
    invitation = await updateInvitationDetails(id, { 
      status, 
      note: (body as any).rejectReason 
    }, token);
  } else {
    invitation = await setInvitationStatus(id, status, token);
  }
  
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

  if (status === "confirmed") {
    sendInvitationEmail(id, {
      token,
      adminName: admin.fullName || admin.username,
      adminUsername: admin.username,
      adminRole: admin.role,
      logDetail: "Tự động gửi email thư mời khi duyệt vé",
    }).catch((err) =>
      console.error("Async admin email send failed:", err)
    );
  }

  return NextResponse.json({ ok: true, invitation });
}
