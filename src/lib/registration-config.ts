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
    // Mở đăng ký bổ sung (tối đa 450 người): 13:00 chiều Thứ Bảy, ngày 17/10/2026
    openTime: new Date("2026-10-17T13:00:00+07:00"),
    // Mốc kết thúc: 00:00 Thứ Ba, ngày 20/10/2026 (liền sau 23:59 Thứ Hai 19/10/2026)
    closeTime: new Date("2026-10-20T00:00:00+07:00"),
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
      title: "Đã Đủ Số Lượng Đăng Ký (450 Người)",
      badgeText: "Cổng đăng ký đã đạt giới hạn 450 người và đóng sớm hơn dự kiến",
      message:
        "Cổng đăng ký tham dự Ngày Trở Về đã chính thức khép lại do đã đủ số lượng 450 người đăng ký. Ban tổ chức xin chân thành cảm ơn sự quan tâm và đồng hành của Quý vị!",
      canRegister: false,
    };
  }

  // 2. Giai đoạn 1: Trước 13:00 chiều Thứ Bảy 17/10/2026 (Chưa mở cổng bổ sung)
  if (now.getTime() < openTime.getTime()) {
    return {
      status: "NOT_OPEN_YET",
      title: "Cổng Đăng Ký Bổ Sung Sẽ Mở Lúc 13:00 Chiều Nay",
      targetDate: openTime,
      countdownLabel: "MỞ ĐĂNG KÝ BỔ SUNG SAU",
      badgeText: "Đăng ký bổ sung (tối đa 450 người) mở vào 13:00 chiều nay 17/10/2026",
      message:
        "Cổng đăng ký tham dự Ngày Trở Về sẽ mở đợt đăng ký bổ sung (nâng giới hạn lên 450 người) vào lúc 13:00 chiều nay, Thứ Bảy ngày 17/10/2026.\nQuý Thầy Cô và các bạn cựu học sinh vui lòng quay lại sau ít phút để hoàn tất đăng ký.",
      canRegister: false,
    };
  }

  // 3. Giai đoạn 2: Từ 13:00 17/10/2026 đến 23:59 19/10/2026 (Đang mở cổng bổ sung - hệ thống khóa lúc 00:00 20/10/2026)
  if (now.getTime() < closeTime.getTime()) {
    return {
      status: "OPEN",
      title: "Đang Mở Đăng Ký Bổ Sung",
      targetDate: closeTime,
      countdownLabel: "KẾT THÚC ĐĂNG KÝ SAU",
      badgeText: "Đang mở đăng ký bổ sung (giới hạn 450 người) đến 23:59 ngày 19/10/2026 (hoặc khi đủ số lượng)",
      message: "Cổng đăng ký bổ sung đang mở. Hãy hoàn tất đăng ký sớm trước khi hết suất!",
      canRegister: true,
    };
  }

  // 4. Giai đoạn 3: Sau 00:00 Thứ Ba 20/10/2026 (Đã đóng vĩnh viễn, không mở thêm đợt nào)
  return {
    status: "CLOSED_PERMANENTLY",
    title: "Đã Chính Thức Đóng Đăng Ký",
    badgeText: "Thời gian đăng ký tham dự đã kết thúc",
    message:
      "Thời gian đăng ký tham dự Ngày Trở Về đã kết thúc vào lúc 23:59 ngày 19/10/2026. Ban tổ chức đã chính thức chốt danh sách và không mở thêm đợt đăng ký nào nữa. Xin trân trọng cảm ơn!",
    canRegister: false,
  };
}
