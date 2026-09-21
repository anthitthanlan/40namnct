import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import { listActionLogs } from "@/lib/action-logs";

export const dynamic = "force-dynamic";

/** Lấy danh sách logs dựa trên phân quyền */
export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();

  const url = new URL(req.url);
  const targetUsername = url.searchParams.get("username");

  let allLogs = await listActionLogs();

  if (admin.role === "super_admin") {
    // Super admin có thể lọc theo targetUsername
    if (targetUsername) {
      allLogs = allLogs.filter((log) => log.adminUsername === targetUsername);
    }
  } else {
    // Admin thường và Editor chỉ được xem log của chính mình
    allLogs = allLogs.filter((log) => log.adminUsername === admin.username);

    // Editor chỉ được xem log bài viết
    if (admin.role === "editor") {
      allLogs = allLogs.filter((log) => log.group === "posts");
    }
  }

  // Sắp xếp log mới nhất lên đầu
  allLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ ok: true, logs: allLogs });
}
