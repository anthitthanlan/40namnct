import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_API_URL ||
    "https://api.nctitc.io.vn";

  try {
    const res = await fetch(`${backendUrl}/api/invitations/public-stats`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const attendeeCount = data.attendeeCount || 0;
      const maxLimit = data.maxLimit || 400;
      return NextResponse.json({
        ...data,
        maxLimit,
        isFull: attendeeCount >= maxLimit,
        remaining: Math.max(0, maxLimit - attendeeCount),
      });
    }
  } catch (err) {
    console.warn("[PUBLIC_STATS] Failed to fetch stats from backend:", err);
  }

  return NextResponse.json({
    orderCount: 0,
    attendeeCount: 0,
    memberCount: 0,
    totalAmount: 0,
    maxLimit: 400,
    isFull: false,
    remaining: 400,
  });
}
