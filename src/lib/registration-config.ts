// ============================================================
// Cấu hình các mốc thời gian đăng ký - Lễ kỷ niệm 40 năm NCT
// ============================================================

export interface RegistrationConfig {
  openTime: Date;
  closeTime: Date;
  isSlotFull: boolean;
  isFinalPhase: boolean;
}

export const REGISTRATION_CONFIG: { phase2: RegistrationConfig } = {
  phase2: {
    // Mốc 1: 08:00 sáng Thứ Tư, ngày 14/10/2026
    openTime: new Date("2026-10-14T08:00:00+07:00"),
    // Mốc 2: 00:00 Thứ Tư, ngày 21/10/2026 (nửa đêm giữa 20/10 và 21/10)
    closeTime: new Date("2026-10-21T00:00:00+07:00"),
    // Cờ đóng sớm nếu hết slot / đủ số lượng đăng ký trước hạn
    isSlotFull: false,
    isFinalPhase: true,
  },
};

export type RegPhaseStatus = "NOT_OPEN_YET" | "OPEN" | "SLOT_FULL" | "CLOSED_PERMANENTLY";

export interface RegStatusResult {
  status: RegPhaseStatus;
  title: string;
  badgeText: string;
  message: string;
  canRegister: boolean;
  targetDate?: Date;
  countdownLabel?: string;
}

/**
 * Xác định trạng thái đăng ký tại thời điểm chỉ định (mặc định là hiện tại)
 */
export function getRegistrationStatus(now: Date = new Date()): RegStatusResult {
  const { openTime, closeTime, isSlotFull } = REGISTRATION_CONFIG.phase2;

  // 1. Trường hợp kích hoạt đóng sớm do đã đủ số lượng / hết slot
  if (isSlotFull) {
    return {
      status: "SLOT_FULL",
      title: "Đã Đủ Số Lượng Đăng Ký Đợt 2",
      badgeText: "Cổng đăng ký đợt 2 đã đủ số lượng và đóng sớm hơn dự kiến",
      message:
        "Cổng đăng ký Đợt 2 đã chính thức khép lại do đã đủ số lượng người đăng ký. Ban tổ chức xin chân thành cảm ơn sự quan tâm và đồng hành của Quý vị!",
      canRegister: false,
    };
  }

  // 2. Giai đoạn 1: Trước 08:00 sáng Thứ Tư 14/10/2026 (Chưa mở cổng)
  if (now.getTime() < openTime.getTime()) {
    return {
      status: "NOT_OPEN_YET",
      title: "Cổng Đăng Ký Đợt 2 Chưa Mở",
      targetDate: openTime,
      countdownLabel: "MỞ ĐĂNG KÝ ĐỢT 2 SAU",
      badgeText: "Đăng ký đợt 2 sẽ chính thức mở vào 08:00 Thứ Tư, 14/10/2026",
      message:
        "Cổng đăng ký Đợt 2 sẽ chính thức mở vào lúc 08:00 sáng Thứ Tư, ngày 14/10/2026 và đóng vào 00:00 ngày 21/10/2026 (hoặc khi hết số lượng). Quý Thầy Cô và các bạn cựu học sinh vui lòng quay lại sau.",
      canRegister: false,
    };
  }

  // 3. Giai đoạn 2: Từ 08:00 14/10/2026 đến 00:00 21/10/2026 (Đang mở cổng)
  if (now.getTime() < closeTime.getTime()) {
    return {
      status: "OPEN",
      title: "Đang Mở Đăng Ký Đợt 2",
      targetDate: closeTime,
      countdownLabel: "KẾT THÚC ĐĂNG KÝ ĐỢT 2 SAU",
      badgeText: "Đăng ký đợt 2 sẽ kết thúc vào 00:00 Thứ Tư, 21/10/2026 (hoặc khi đủ số lượng)",
      message: "Cổng đăng ký Đợt 2 đang mở. Hãy hoàn tất đăng ký sớm trước thời hạn!",
      canRegister: true,
    };
  }

  // 4. Giai đoạn 3: Sau 00:00 Thứ Tư 21/10/2026 (Đã đóng vĩnh viễn, không mở thêm đợt nào)
  return {
    status: "CLOSED_PERMANENTLY",
    title: "Đã Chính Thức Đóng Đăng Ký",
    badgeText: "Thời gian đăng ký Đợt 2 đã kết thúc",
    message:
      "Thời gian đăng ký đợt 2 cho Ngày Trở Về đã kết thúc vào lúc 00:00 ngày 21/10/2026. Ban tổ chức đã chính thức chốt danh sách và không mở thêm đợt đăng ký nào nữa. Xin trân trọng cảm ơn!",
    canRegister: false,
  };
}
