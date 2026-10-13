import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized, COOKIE_NAME } from "@/lib/auth";
import { queryActionLogs } from "@/lib/action-logs";

export const dynamic = "force-dynamic";

/** Lấy danh sách logs dựa trên phân quyền và tham số lọc/phân trang */
export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();

  const url = new URL(req.url);
  const targetUsername = url.searchParams.get("username") || undefined;
  const entityId = url.searchParams.get("entityId") || undefined;
  const action = url.searchParams.get("action") || undefined;
  const search = url.searchParams.get("q") || url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const all = url.searchParams.get("all") === "true";

  const token = req.cookies.get(COOKIE_NAME)?.value;

  const result = await queryActionLogs(token, {
    entityId,
    page,
    limit,
    action,
    search,
    all,
  });

  let items = result.items;

  // Quyền hạn lọc theo vai trò
  if (admin.role !== "super_admin") {
    // Admin thường và Editor chỉ được xem log của chính mình nếu không phải xem theo entityId
    if (!entityId) {
      items = items.filter((log) => log.adminUsername === admin.username);
    }

    // Editor chỉ được xem log bài viết
    if (admin.role === "editor") {
      items = items.filter((log) => log.group === "posts");
    }
  } else if (targetUsername) {
    items = items.filter((log) => log.adminUsername === targetUsername);
  }

  // Đảm bảo log mới nhất lên đầu
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({
    ok: true,
    logs: items,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
}

