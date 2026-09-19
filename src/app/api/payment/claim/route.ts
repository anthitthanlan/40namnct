import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { claimPayment, listTickets } from "@/lib/members";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const id = body.id;
  if (!id) {
    return NextResponse.json({ ok: false, message: "Thiếu ID định danh." }, { status: 400 });
  }

  // Find ticket by id
  const tickets = await listTickets();
  const ticket = tickets.find(t => t.id === id);
  
  if (!ticket) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy vé." }, { status: 404 });
  }

  // Claim payment
  const updated = await claimPayment(ticket.id);
  if (!updated) {
    return NextResponse.json({ ok: false, message: "Không thể cập nhật trạng thái vé." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Đã ghi nhận yêu cầu thanh toán."
  });
}
