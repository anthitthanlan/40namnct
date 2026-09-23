import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { checkInInvitation, findInvitationById, findInvitationByCode, shirtCheckInByQr, listMembers } from "@/lib/members";
import { logAction } from "@/lib/action-logs";

export const dynamic = "force-dynamic";

/** Ngày sự kiện: 08/11/2026 00:00 ICT (UTC+7) → check-in chỉ mở từ ngày này */
const EVENT_DATE = new Date("2026-11-08T00:00:00+07:00");

type ScanMode = "checkin" | "shirt" | "info";

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role === "editor") {
    return NextResponse.json(
      { ok: false, message: "Yêu cầu quyền Quản trị viên." },
      { status: 401 },
    );
  }

  try {
    const { payload, mode: rawMode } = (await req.json()) as {
      payload?: string;
      mode?: string;
    };

    if (!payload || typeof payload !== "string") {
      return NextResponse.json(
        { ok: false, message: "Dữ liệu mã QR trống hoặc không hợp lệ." },
        { status: 400 },
      );
    }

    const mode: ScanMode =
      rawMode === "shirt" ? "shirt" : rawMode === "info" ? "info" : "checkin";

    // Check-in cổng chỉ mở từ ngày 08/11/2026
    if (mode === "checkin" && Date.now() < EVENT_DATE.getTime()) {
      const eventDateStr = EVENT_DATE.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      return NextResponse.json(
        {
          ok: false,
          message: `Chức năng Check-in cổng chỉ mở từ ngày ${eventDateStr}. Hiện chưa đến ngày sự kiện.`,
        },
        { status: 403 },
      );
    }

    // Parse mã QR tĩnh
    let existingInvitation: any = null;
    let validInvitationId = "";

    // Thử parse QR tĩnh (dạng text có chứa mã vé NCT19862026-...)
    if (payload.includes("NCT19862026-")) {
      const match = payload.match(/NCT19862026-[A-Z0-9]+/);
      if (match) {
        const code = match[0];
        
        // --- Mock data cho vé test ---
        if (code === "NCT19862026-000POLN7") {
          validInvitationId = "sample";
          existingInvitation = {
            id: "sample",
            code: "NCT19862026-000POLN7",
            type: "individual",
            attendeeName: "Lại Nhất Phong (Cá nhân)",
            size: "L",
            quantity: 1,
            sizes: { L: 1 },
            snacks: 1,
            amount: 500000,
            status: "confirmed",
            note: "Dev Test 1",
            checkedIn: false,
            shirtReceived: false,
            memberPhone: "0901234567",
            memberEmail: "dev1@test.com",
          } as any;
        } else if (code === "NCT19862026-000GROUP") {
          validInvitationId = "sample-group";
          existingInvitation = {
            id: "sample-group",
            code: "NCT19862026-000GROUP",
            type: "group",
            attendeeName: "Lại Nhất Phong (Nhóm)",
            size: null,
            quantity: 10,
            sizes: { S: 0, M: 1, L: 2, XL: 3, XXL: 4 },
            snacks: 10,
            amount: 5000000,
            status: "confirmed",
            note: "Dev Test 2",
            checkedIn: false,
            shirtReceived: false,
            memberPhone: "0907654321",
            memberEmail: "dev2@test.com",
          } as any;
        } else {
          // Vé thật
          existingInvitation = await findInvitationByCode(code);
          if (existingInvitation) {
            validInvitationId = existingInvitation.id;
          }
        }
      }
    }

    if (!existingInvitation) {
      return NextResponse.json(
        { ok: false, message: "Mã QR không hợp lệ hoặc không tìm thấy thông tin vé." },
        { status: 400 },
      );
    }

    if (existingInvitation.id !== "sample" && existingInvitation.id !== "sample-group") {
      const members = await listMembers();
      const member = members.find((m) => m.id === existingInvitation.memberId);
      if (member) {
        existingInvitation = {
          ...existingInvitation,
          memberPhone: member.phone,
          memberEmail: member.email,
        };
      }
    }

    // ========== MODE: INFO ==========
    if (mode === "info") {
      return NextResponse.json({
        ok: true,
        mode: "info",
        invitation: existingInvitation,
        message: "Lấy thông tin vé thành công.",
      });
    }

    // ========== MODE: CHECK-IN CỔNG ==========
    if (mode === "checkin") {
      let checkInResult;
      
      if (validInvitationId === "sample" || validInvitationId === "sample-group") {
        checkInResult = { ok: true, invitation: { ...existingInvitation, checkedIn: true } };
      } else {
        checkInResult = await checkInInvitation(validInvitationId);
      }

      if (!checkInResult.ok) {
        return NextResponse.json(
          {
            ok: false,
            mode: "checkin",
            invitation: existingInvitation,
            message: checkInResult.message,
          },
          { status: 409 },
        );
      }

      await logAction(
        "checkin",
        "registrations",
        validInvitationId,
        admin.fullName || admin.username,
        admin.username,
        admin.role,
        `Check-in cổng: ${existingInvitation.attendeeName || existingInvitation.code}`,
      );

      return NextResponse.json({
        ok: true,
        mode: "checkin",
        invitation: checkInResult.invitation,
        message: "Check-in thành công!",
      });
    }

    // ========== MODE: TRAO ÁO ==========
    let shirtResult;
    if (validInvitationId === "sample" || validInvitationId === "sample-group") {
      shirtResult = { ok: true, invitation: { ...existingInvitation, shirtReceived: true } };
    } else {
      shirtResult = await shirtCheckInByQr(validInvitationId);
    }
    
    if (!shirtResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          mode: "shirt",
          invitation: existingInvitation,
          message: shirtResult.message,
        },
        { status: 409 },
      );
    }

    await logAction(
      "shirt",
      "registrations",
      validInvitationId,
      admin.fullName || admin.username,
      admin.username,
      admin.role,
      `Trao áo: ${existingInvitation.attendeeName || existingInvitation.code}`,
    );

    return NextResponse.json({
      ok: true,
      mode: "shirt",
      invitation: shirtResult.invitation,
      message: "Đã trao áo thành công!",
    });
  } catch (err) {
    console.error("Lỗi quét vé:", err);
    return NextResponse.json(
      { ok: false, message: "Có lỗi khi xử lý quét vé." },
      { status: 500 },
    );
  }
}
