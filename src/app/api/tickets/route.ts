import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMemberIdFromRequest } from "@/lib/memberAuth";
import {
  createTicket,
  getMemberById,
  listTicketsByMember,
  SIZES,
  MAX_GROUP_QUANTITY,
  type TicketType,
} from "@/lib/members";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    { ok: false, message: "Vui lòng đăng ký / đăng nhập tài khoản trước." },
    { status: 401 },
  );
}

/** Danh sách vé của thành viên đang đăng nhập */
export async function GET(req: NextRequest) {
  const memberId = getMemberIdFromRequest(req);
  if (!memberId) return unauthorized();
  const tickets = await listTicketsByMember(memberId);
  return NextResponse.json({ ok: true, tickets });
}

type Body = Record<string, unknown>;

/** Đăng ký vé: cá nhân (miễn phí + size áo) hoặc tập thể (số lượng × 200.000đ) */
export async function POST(req: NextRequest) {
  const memberId = getMemberIdFromRequest(req);
  if (!memberId) return unauthorized();
  const member = await getMemberById(memberId);
  if (!member) return unauthorized();

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  const note =
    typeof body.note === "string" ? body.note.trim().slice(0, 200) : "";
  const type: TicketType = body.type === "group" ? "group" : "individual";

  if (type === "individual") {
    const attendeeName =
      typeof body.attendeeName === "string" && body.attendeeName.trim().length >= 2
        ? body.attendeeName.trim().slice(0, 80)
        : member.name;
    const size = typeof body.size === "string" ? body.size : "";
    if (!SIZES.includes(size as (typeof SIZES)[number])) {
      return NextResponse.json(
        { ok: false, message: "Vui lòng chọn size áo hợp lệ." },
        { status: 400 },
      );
    }
    const ticket = await createTicket(memberId, {
      type: "individual",
      attendeeName,
      size: size as (typeof SIZES)[number],
      quantity: 1,
      sizes: {},
      note,
    });
    return NextResponse.json({ ok: true, ticket }, { status: 201 });
  }

  // Tập thể: số lượng + breakdown theo size (tổng phải khớp số lượng)
  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_GROUP_QUANTITY) {
    return NextResponse.json(
      {
        ok: false,
        message: `Số lượng suất phải từ 1 đến ${MAX_GROUP_QUANTITY}.`,
      },
      { status: 400 },
    );
  }

  const rawSizes =
    typeof body.sizes === "object" && body.sizes !== null
      ? (body.sizes as Record<string, unknown>)
      : {};
  const sizes: Record<string, number> = {};
  let total = 0;
  for (const s of SIZES) {
    const n = Number(rawSizes[s] ?? 0);
    if (!Number.isInteger(n) || n < 0) {
      return NextResponse.json(
        { ok: false, message: `Số lượng size ${s} không hợp lệ.` },
        { status: 400 },
      );
    }
    sizes[s] = n;
    total += n;
  }
  if (total !== quantity) {
    return NextResponse.json(
      {
        ok: false,
        message: `Tổng số áo theo size (${total}) phải bằng số lượng suất đã chọn (${quantity}).`,
      },
      { status: 400 },
    );
  }

  const ticket = await createTicket(memberId, {
    type: "group",
    attendeeName: "",
    size: null,
    quantity,
    sizes,
    note,
  });
  return NextResponse.json({ ok: true, ticket }, { status: 201 });
}
