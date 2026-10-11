import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizePhone, listMembers, listInvitations } from "@/lib/members";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawPhone = searchParams.get("phone") || "";

  const normalized = normalizePhone(rawPhone);
  if (!normalized) {
    return NextResponse.json({ ok: false, exists: false, message: "Số điện thoại không hợp lệ." }, { status: 400 });
  }

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_API_URL ||
    "https://api.nctitc.io.vn";

  try {
    const res = await fetch(
      `${backendUrl}/api/invitations/search?q=${encodeURIComponent(normalized)}`,
      { cache: "no-store" },
    );

    if (res.ok) {
      const data = (await res.json()) as { items?: Array<any> };
      const items = data.items || [];
      if (items.length > 0) {
        const pendingItem = items.find((it) => ["pending_payment", "pending"].includes(it.status));
        const latest = items[0];
        return NextResponse.json({
          ok: true,
          exists: true,
          hasPending: !!pendingItem,
          latestInvitationId: pendingItem?.id || latest?.id,
          attendeeName: pendingItem?.attendeeName || latest?.attendeeName,
          status: pendingItem?.status || latest?.status,
        });
      }
    }
  } catch (err) {
    console.warn("[CHECK_PHONE] Backend search failed, checking local database fallback:", err);
  }

  // Fallback to local members & invitations
  try {
    const members = await listMembers();
    const member = members.find((m) => m.phone === normalized);
    if (member) {
      const allInvitations = await listInvitations();
      const memberInvitations = allInvitations
        .filter((t) => t.memberId === member.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const pendingItem = memberInvitations.find((it) => ["pending_payment", "pending"].includes(it.status));
      const latest = memberInvitations[0];

      return NextResponse.json({
        ok: true,
        exists: true,
        hasPending: !!pendingItem,
        latestInvitationId: pendingItem?.id || latest?.id,
        attendeeName: pendingItem?.attendeeName || member.name,
        status: pendingItem?.status || latest?.status,
      });
    }
  } catch (localErr) {
    console.warn("[CHECK_PHONE] Local check failed:", localErr);
  }

  return NextResponse.json({
    ok: true,
    exists: false,
    hasPending: false,
  });
}
