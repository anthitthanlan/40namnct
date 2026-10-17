import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import { canManageInvitations } from "@/lib/admin";
import { findInvitationById, updateInvitationDetails } from "@/lib/members";
import { logAction } from "@/lib/action-logs";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();
  if (!canManageInvitations(admin.role)) {
    return NextResponse.json(
      { ok: false, message: "Không có quyền chỉnh sửa thư mời." },
      { status: 403 },
    );
  }

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

  const existing = await findInvitationById(id);
  if (!existing) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy thư mời." }, { status: 404 });
  }

  // Nếu là đơn tập thể và có cập nhật sizes: bắt buộc tổng số lượng các size phải khớp số lượng đã đăng ký ban đầu
  let isSizeChanged = false;
  const isGroup = existing.type === "group";

  if (isGroup) {
    if (body.sizes && typeof body.sizes === "object") {
      const totalSizes = Object.values(body.sizes as Record<string, number>).reduce(
        (sum, count) => sum + (Math.max(0, Number(count) || 0)),
        0
      );
      const expectedQty = existing.quantity || 1;
      if (totalSizes !== expectedQty) {
        return NextResponse.json(
          {
            ok: false,
            message: `Tổng số lượng áo đã chọn (${totalSizes}) không khớp với tổng số lượng ban đầu của đơn (${expectedQty} áo). Vui lòng cân đối lại số lượng.`,
          },
          { status: 400 }
        );
      }
      isSizeChanged = true;
    }
  } else {
    // Đơn cá nhân chỉ dùng trường `size`, bỏ qua `sizes`
    delete body.sizes;
  }

  const result = await updateInvitationDetails(id, body, token);
  
  if (result) {
    const changedFields: string[] = [];
    if (isSizeChanged) changedFields.push(`size áo (${existing.quantity} áo)`);
    if (body.memberPhone) changedFields.push(`SĐT (${body.memberPhone})`);
    if (body.memberEmail) changedFields.push(`Email (${body.memberEmail})`);
    if (body.attendeeName) changedFields.push(`Tên (${body.attendeeName})`);
    if (Array.isArray(body.attendees)) changedFields.push(`DS thành viên (${body.attendees.length} người)`);

    const details = changedFields.length > 0
      ? `Cập nhật thông tin thư mời: ${changedFields.join(", ")}`
      : "Cập nhật thông tin thư mời";

    await logAction(
      "update",
      "registrations",
      id,
      admin.fullName || admin.username,
      admin.username,
      admin.role,
      details
    );
    return NextResponse.json({ ok: true, data: result });
  } else {
    return NextResponse.json(
      { ok: false, message: "Cập nhật thông tin thất bại." },
      { status: 500 }
    );
  }
}
