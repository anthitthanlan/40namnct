import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { getAdminFromRequest, unauthorized, COOKIE_NAME } from "@/lib/auth";
import { listMembers, listInvitations } from "@/lib/members";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role === "editor") return unauthorized();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const [members, invitations] = await Promise.all([
    listMembers(token),
    listInvitations(token),
  ]);

  const byId = new Map(members.map((m) => [m.id, m]));

  // Chỉ lấy các đăng ký đã được duyệt (confirmed)
  const confirmedInvitations = invitations
    .filter((inv) => inv.status === "confirmed")
    .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BTC 40 Năm THPT Nguyễn Công Trứ";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Danh sách tham dự", {
    views: [{ showGridLines: true }],
  });

  // Thiết lập độ rộng các cột
  worksheet.columns = [
    { key: "stt", width: 8 }, // Cột 1: STT nhỏ vừa đủ
    { key: "name", width: 34 }, // Cột 2: Họ và Tên rộng rãi
    { key: "phone", width: 17 }, // Cột 3: SĐT đủ chuẩn 12 số
    { key: "type", width: 18 }, // Cột 4: Loại đăng ký
    { key: "size", width: 16 }, // Cột 5: Size áo
    { key: "quantity", width: 12 }, // Cột 6: Số lượng
    { key: "approval", width: 16 }, // Cột 7: Phê duyệt
    { key: "code", width: 25 }, // Cột 8: Mã thư mời
    { key: "email", width: 32 }, // Cột 9: Email
  ];

  // Header row
  const headerRow = worksheet.addRow([
    "STT",
    "Họ và Tên",
    "SĐT",
    "Loại đăng ký",
    "Size áo",
    "Số lượng",
    "Trạng thái phê duyệt",
    "Mã định danh thư mời",
    "Email",
  ]);

  headerRow.height = 30;

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFB0B0B0" } },
    left: { style: "thin", color: { argb: "FFB0B0B0" } },
    bottom: { style: "thin", color: { argb: "FFB0B0B0" } },
    right: { style: "thin", color: { argb: "FFB0B0B0" } },
  };

  headerRow.eachCell((cell) => {
    cell.font = {
      name: "Times New Roman",
      size: 11,
      bold: true,
      color: { argb: "FF0F172A" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E8F0" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = thinBorder;
  });

  let currentStt = 1;

  for (const inv of confirmedInvitations) {
    const member = byId.get(inv.memberId);
    const fullName = inv.attendeeName || member?.name || "Khách mời";
    const phone = member?.phone || "";
    const email = member?.email || (inv as any).memberEmail || "";
    const isGroup = inv.type === "group";
    const approvalText =
      inv.ocrResult?.confidence === "high" ? "Tự động" : "Thủ công";

    // Phân tích sizes
    type SizeItem = { size: string; qty: number | string };
    let sizeItems: SizeItem[] = [];

    if (isGroup) {
      if (inv.sizes && typeof inv.sizes === "object") {
        for (const [s, qty] of Object.entries(inv.sizes)) {
          if (typeof qty === "number" && qty > 0) {
            sizeItems.push({ size: s, qty });
          }
        }
      }
      if (sizeItems.length === 0) {
        sizeItems.push({ size: "-", qty: inv.snacks || 0 });
      }
    } else {
      const singleSize = inv.size || "-";
      const singleQty = inv.snacks > 0 ? inv.snacks : (inv.size ? 1 : 0);
      sizeItems.push({ size: singleSize, qty: singleQty });
    }

    const startRowNum = worksheet.lastRow ? worksheet.lastRow.number + 1 : 2;

    sizeItems.forEach((item) => {
      worksheet.addRow([
        currentStt,
        fullName,
        phone,
        isGroup ? "Tập thể" : "Cá nhân",
        item.size,
        item.qty,
        approvalText,
        inv.code,
        email,
      ]);
    });

    const endRowNum = startRowNum + sizeItems.length - 1;

    // Định dạng từng cell và dòng
    for (let r = startRowNum; r <= endRowNum; r++) {
      const row = worksheet.getRow(r);
      row.height = 24;

      const itemIndex = r - startRowNum;
      const currentItem = sizeItems[itemIndex];

      // Cột 1: STT
      const c1 = row.getCell(1);
      c1.font = { name: "Times New Roman", size: 11 };
      c1.alignment = { vertical: "middle", horizontal: "center" };
      c1.border = thinBorder;

      // Cột 2: Họ và Tên
      const c2 = row.getCell(2);
      c2.font = { name: "Times New Roman", size: 11, bold: true };
      c2.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      c2.border = thinBorder;

      // Cột 3: SĐT (Định dạng text chuẩn)
      const c3 = row.getCell(3);
      c3.font = { name: "Times New Roman", size: 11 };
      c3.alignment = { vertical: "middle", horizontal: "center" };
      c3.numFmt = "@";
      c3.border = thinBorder;

      // Cột 4: Loại đăng ký
      // Cá nhân: Nền xanh dương 0R 0G 255B chữ trắng
      // Tập thể: Nền xanh lá đậm 0R 145G 0B chữ trắng
      const c4 = row.getCell(4);
      c4.alignment = { vertical: "middle", horizontal: "center" };
      c4.border = thinBorder;
      if (isGroup) {
        c4.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        c4.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF009100" }, // 0R, 145G, 0B
        };
      } else {
        c4.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        c4.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0000FF" }, // 0R, 0G, 255B
        };
      }

      // Cột 5 & 6: Size áo & Số lượng
      // Nam nền 76R 128G 186B (FF4C80BA) chữ đen
      // Nữ nền 196R 112G 138B (FFC4708A) chữ đen
      const c5 = row.getCell(5);
      const c6 = row.getCell(6);

      c5.font = { name: "Times New Roman", size: 11, color: { argb: "FF000000" } };
      c5.alignment = { vertical: "middle", horizontal: "center" };
      c5.border = thinBorder;

      c6.font = { name: "Times New Roman", size: 11, color: { argb: "FF000000" } };
      c6.alignment = { vertical: "middle", horizontal: "center" };
      c6.border = thinBorder;

      const sizeStr = String(currentItem.size).trim();
      if (sizeStr.toLowerCase().startsWith("nam") || sizeStr.toLowerCase().includes("nam-")) {
        const namFill: ExcelJS.Fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4C80BA" }, // 76R, 128G, 186B
        };
        c5.fill = namFill;
        c6.fill = namFill;
      } else if (sizeStr.toLowerCase().startsWith("nữ") || sizeStr.toLowerCase().startsWith("nu") || sizeStr.toLowerCase().includes("nữ-") || sizeStr.toLowerCase().includes("nu-")) {
        const nuFill: ExcelJS.Fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFC4708A" }, // 196R, 112G, 138B
        };
        c5.fill = nuFill;
        c6.fill = nuFill;
      }

      // Cột 7: Phê duyệt
      const c7 = row.getCell(7);
      c7.font = { name: "Times New Roman", size: 11 };
      c7.alignment = { vertical: "middle", horizontal: "center" };
      c7.border = thinBorder;

      // Cột 8: Mã thư mời
      const c8 = row.getCell(8);
      c8.font = { name: "Times New Roman", size: 11, bold: true };
      c8.alignment = { vertical: "middle", horizontal: "center" };
      c8.border = thinBorder;

      // Cột 9: Email
      const c9 = row.getCell(9);
      c9.font = { name: "Times New Roman", size: 11 };
      c9.alignment = { vertical: "middle", horizontal: "left" };
      c9.border = thinBorder;
    }

    // Gộp ô cho tập thể có nhiều size áo
    if (isGroup && sizeItems.length > 1) {
      // Gộp các cột: 1, 2, 3, 4, 7, 8, 9
      [1, 2, 3, 4, 7, 8, 9].forEach((colIdx) => {
        worksheet.mergeCells(startRowNum, colIdx, endRowNum, colIdx);
      });
    }

    currentStt++;
  }

  const buffer = await workbook.xlsx.writeBuffer();

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const filename = `Danh_sach_tham_du_NCT40_${dateStr}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
