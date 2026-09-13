import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/auth";
import {
  listMembers,
  listTickets,
  setTicketStatus,
  type TicketStatus,
} from "@/lib/members";

export const dynamic = "force-dynamic";

/** Admin: danh sách thành viên (kèm mã định danh) + toàn bộ vé đăng ký */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();

  const [members, tickets] = await Promise.all([listMembers(), listTickets()]);
  const byId = new Map(members.map((m) => [m.id, m]));

  const ticketViews = tickets
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((t) => {
      const m = byId.get(t.memberId);
      return {
        ...t,
        memberName: m?.name ?? "(đã xoá)",
        memberPhone: m?.phone ?? "",
        memberCode: m?.code ?? "",
      };
    });

  const memberViews = members.map((m) => {
    const mine = tickets.filter(
      (t) => t.memberId === m.id && t.status !== "cancelled",
    );
    return {
      id: m.id,
      name: m.name,
      phone: m.phone,
      code: m.code,
      createdAt: m.createdAt,
      ticketCount: mine.length,
      peopleCount: mine.reduce((sum, t) => sum + t.quantity, 0),
      confirmedAmount: mine
        .filter((t) => t.status === "confirmed")
        .reduce((sum, t) => sum + t.amount, 0),
      pendingAmount: mine
        .filter((t) => t.status === "pending")
        .reduce((sum, t) => sum + t.amount, 0),
    };
  });

  return NextResponse.json({ ok: true, members: memberViews, tickets: ticketViews });
}

type Body = Record<string, unknown>;
const ALLOWED: TicketStatus[] = [
  "pending",
  "pending_payment",
  "pending_approval",
  "confirmed",
  "rejected",
  "cancelled",
];

/** Admin: đổi trạng thái vé - xác nhận đã nhận tiền / hủy */
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();

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
  const status = body.status as TicketStatus;
  if (!id || !ALLOWED.includes(status)) {
    return NextResponse.json(
      { ok: false, message: "Yêu cầu không hợp lệ." },
      { status: 400 },
    );
  }

  const ticket = await setTicketStatus(id, status);
  if (!ticket) {
    return NextResponse.json(
      { ok: false, message: "Không tìm thấy vé." },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, ticket });
}
