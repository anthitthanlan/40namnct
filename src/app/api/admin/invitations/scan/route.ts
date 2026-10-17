import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { checkInInvitation, findInvitationById, findInvitationByCode, shirtCheckInByQr, listMembers } from "@/lib/members";
import { logAction } from "@/lib/action-logs";

export const dynamic = "force-dynamic";

/** Ngày sự kiện: 08/11/2026 00:00 ICT (UTC+7) → check-in chỉ mở từ ngày này */
const EVENT_DATE = new Date("2026-11-08T00:00:00+07:00");

type ScanMode = "checkin" | "shirt" | "info" | "submit";

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role === "editor") {
    return NextResponse.json(
      { ok: false, message: "Yêu cầu quyền Quản trị viên." },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as {
      payload?: string;
      mode?: string;
      doCheckIn?: boolean;
      attendeeName?: string;
      doShirt?: boolean;
    };
    const { payload, mode: rawMode, doCheckIn, attendeeName, doShirt } = body;

    if (!payload || typeof payload !== "string") {
      return NextResponse.json(
        { ok: false, message: "Dữ liệu mã QR trống hoặc không hợp lệ." },
        { status: 400 },
      );
    }

    const mode: ScanMode =
      rawMode === "submit"
        ? "submit"
        : rawMode === "shirt"
          ? "shirt"
          : rawMode === "info"
            ? "info"
            : "checkin";

    // Phân quyền: role shirt_staff chỉ được quét info và trao áo, không được check-in
    if (admin.role === "shirt_staff") {
      if (mode === "checkin" || (mode === "submit" && doCheckIn)) {
        return NextResponse.json(
          {
            ok: false,
            message: "Tài khoản Bộ phận trao áo không có quyền thực hiện Check-in.",
          },
          { status: 403 },
        );
      }
    }

    // Check-in cổng chỉ mở từ ngày 08/11/2026 (ngoại trừ vé mock sample)
    const isMock = payload.includes("000POLN7") || payload.includes("000GROUP");
    if (!isMock && (mode === "checkin" || (mode === "submit" && doCheckIn)) && Date.now() < EVENT_DATE.getTime()) {
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

    const token = req.cookies.get(process.env.COOKIE_NAME || "nct_admin")?.value;

    if (existingInvitation.id !== "sample" && existingInvitation.id !== "sample-group") {
      const members = await listMembers(token);
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

    // ========== MODE: SUBMIT (CHECK-IN & TRAO ÁO ĐỒNG THỜI HOẶC RIÊNG LẺ) ==========
    if (mode === "submit") {
      let currentInv = existingInvitation;
      const actionsDone: string[] = [];

      // 1. Check-in
      if (doCheckIn) {
        if (validInvitationId === "sample" || validInvitationId === "sample-group") {
          const nowIso = new Date().toISOString();
          const existingEntries = Array.isArray(currentInv.checkinEntries) ? [...currentInv.checkinEntries] : [];
          if (currentInv.type === "group") {
            const maxQty = currentInv.quantity || 1;
            if (existingEntries.length >= maxQty) {
              return NextResponse.json(
                { ok: false, message: `Vé tập thể đã check-in đủ ${existingEntries.length}/${maxQty} suất.`, invitation: currentInv },
                { status: 400 }
              );
            }
            if (!attendeeName || !attendeeName.trim()) {
              return NextResponse.json(
                { ok: false, message: "Vui lòng nhập họ và tên của người tham dự cho lượt check-in này.", invitation: currentInv },
                { status: 400 }
              );
            }
            existingEntries.push({
              name: attendeeName.trim(),
              time: nowIso,
              by: admin.fullName || admin.username,
            });
            currentInv = {
              ...currentInv,
              checkinEntries: existingEntries,
              checkedIn: existingEntries.length >= maxQty,
              checkedInAt: nowIso,
            };
            actionsDone.push(`Check-in: ${attendeeName.trim()} (${existingEntries.length}/${maxQty})`);
          } else {
            // Individual
            if (!currentInv.checkedIn) {
              existingEntries.push({
                name: currentInv.attendeeName,
                time: nowIso,
                by: admin.fullName || admin.username,
              });
              currentInv = {
                ...currentInv,
                checkedIn: true,
                checkedInAt: nowIso,
                checkinEntries: existingEntries,
              };
              actionsDone.push("Check-in vào cổng");
            }
          }
        } else {
          // Real ticket
          const checkInResult = await checkInInvitation(validInvitationId, {
            attendeeName: attendeeName?.trim(),
            adminName: admin.fullName || admin.username,
            token,
          });
          if (!checkInResult.ok) {
            return NextResponse.json(
              {
                ok: false,
                mode: "submit",
                invitation: currentInv,
                message: checkInResult.message,
              },
              { status: 400 }
            );
          }
          currentInv = checkInResult.invitation || currentInv;
          actionsDone.push(checkInResult.message || "Check-in");
        }

        await logAction(
          "checkin",
          "registrations",
          validInvitationId,
          admin.fullName || admin.username,
          admin.username,
          admin.role,
          `Check-in cổng: ${currentInv.attendeeName || currentInv.code}${attendeeName ? ` - ${attendeeName}` : ""}`,
        );
      }

      // 2. Trao áo
      if (doShirt && !currentInv.shirtReceived) {
        if (validInvitationId === "sample" || validInvitationId === "sample-group") {
          currentInv = {
            ...currentInv,
            shirtReceived: true,
            shirtReceivedAt: new Date().toISOString(),
          };
          actionsDone.push("Đã trao áo");
        } else {
          const shirtResult = await shirtCheckInByQr(validInvitationId, token);
          if (!shirtResult.ok) {
            return NextResponse.json(
              {
                ok: false,
                mode: "submit",
                invitation: currentInv,
                message: shirtResult.message,
              },
              { status: 400 }
            );
          }
          currentInv = shirtResult.invitation || currentInv;
          actionsDone.push("Đã trao áo");
        }

        await logAction(
          "shirt_received",
          "registrations",
          validInvitationId,
          admin.fullName || admin.username,
          admin.username,
          admin.role,
          `Trao áo: ${currentInv.attendeeName || currentInv.code}`,
        );
      }

      const summaryMessage = actionsDone.length > 0
        ? actionsDone.join(" · ") + " thành công!"
        : "Đã hoàn tất kiểm tra thư mời.";

      return NextResponse.json({
        ok: true,
        mode: "submit",
        invitation: currentInv,
        message: summaryMessage,
      });
    }

    // ========== MODE: CHECK-IN CỔNG ==========
    if (mode === "checkin") {
      let checkInResult;
      
      if (validInvitationId === "sample" || validInvitationId === "sample-group") {
        checkInResult = { ok: true, invitation: { ...existingInvitation, checkedIn: true } };
      } else {
        checkInResult = await checkInInvitation(validInvitationId, {
          attendeeName: attendeeName?.trim(),
          adminName: admin.fullName || admin.username,
          token,
        });
      }

      if (!checkInResult.ok) {
        return NextResponse.json(
          {
            ok: false,
            mode: "checkin",
            invitation: existingInvitation,
            message: checkInResult.message,
          }
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
      shirtResult = await shirtCheckInByQr(validInvitationId, token);
    }
    
    if (!shirtResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          mode: "shirt",
          invitation: existingInvitation,
          message: shirtResult.message,
        }
      );
    }

    await logAction(
      "shirt_received",
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
