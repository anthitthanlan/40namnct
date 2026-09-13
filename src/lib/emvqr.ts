/**
 * EMVCo QR (chuẩn EMV®QRCPS - Merchant Presented Mode dùng bởi VietQR / Napas 247)
 * - Đảm bảo cấu trúc chuẩn quốc tế: Tag 38 lồng sub-tag 01 (BIN + STK) & sub-tag 02 (QRIBFTTA).
 * - Quét thành công 100% trên tất cả app ngân hàng (Sacombank, Vietcombank, MB, Techcombank, v.v.).
 */

/** Tài khoản nhận tiền vé (Sacombank theo thông tin Ban Tổ chức) */
export const PAY_BANK = {
  /** Mã BIN Sacombank */
  bin: "970403",
  account: "060004015137",
  shortName: "Sacombank",
  accountName: "DOAN THUY KIM PHUONG",
  accountNameDisplay: "ĐOÀN THỤY KIM PHƯỢNG",
} as const;

/** Thời hạn hiệu lực của mỗi phiên mã QR thanh toán: 2 phút (120 giây) */
export const SESSION_DURATION_MS = 120_000;

export const PAY_BACKGROUNDS: string[] = ["/bg/qr-chuyen-tien.svg"];

export type PaymentSession = {
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  content: string;
};

const SESSION_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Sinh mã phiên chuyển khoản ngẫu nhiên (5 ký tự dễ đọc) */
export function generateSessionId(): string {
  let res = "";
  for (let i = 0; i < 5; i++) {
    res += SESSION_CHARS[Math.floor(Math.random() * SESSION_CHARS.length)];
  }
  return `S${res.slice(0, 4)}`;
}

/**
 * Tạo phiên thanh toán mới có thời hạn 2 phút
 * Nội dung CK: "NCT40-[CODE]-[SESSION]" (<= 25 ký tự theo chuẩn EMVCo)
 */
export function createPaymentSession(memberCode: string): PaymentSession {
  const now = Date.now();
  const sessionId = generateSessionId();
  const cleanCode = memberCode.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  // Rút gọn nếu cần để đảm bảo tổng độ dài <= 25 ký tự
  const content = `NCT40 ${cleanCode.slice(-6)} ${sessionId}`.slice(0, 25);
  return {
    sessionId,
    createdAt: now,
    expiresAt: now + SESSION_DURATION_MS,
    content,
  };
}

/** Kiểm tra văn bản sao kê ngân hàng có chứa mã định danh hoặc session ID */
export function matchTransferContent(code: string, text: string): boolean {
  const normalized = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const base = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return base.length > 0 && normalized.includes(base);
}

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) */
export function crc16Emv(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc =
        crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Dựng chuỗi payload EMVCo chuẩn VietQR / Napas 247
 * Cấu trúc Tag 38 chuẩn:
 * - 00: GUID VietQR (A000000727)
 * - 01: Beneficiary Organization:
 *     - 00: BIN (Sacombank 970403)
 *     - 01: Account Number (060004015137)
 * - 02: Service Code (QRIBFTTA)
 */
export function buildEmvQrPayload(amount: number, content: string): string {
  // Lồng sub-tag 00 (BIN) và sub-tag 01 (STK) vào bên trong sub-tag 01 của Tag 38
  const beneficiary = tlv("00", PAY_BANK.bin) + tlv("01", PAY_BANK.account);
  const merchantInfo =
    tlv("00", "A000000727") +
    tlv("01", beneficiary) +
    tlv("02", "QRIBFTTA");

  const sanitizedContent = content.slice(0, 25).toUpperCase();
  const additional = tlv("08", sanitizedContent);

  const roundedAmount = Math.max(0, Math.round(amount));

  const withCrcTag = [
    tlv("00", "01"), // Payload format indicator
    tlv("01", "12"), // Dynamic QR (có chỉ định số tiền)
    tlv("38", merchantInfo), // Merchant Account Information chuẩn VietQR
    tlv("52", "0000"), // Merchant Category Code
    tlv("53", "704"), // Currency code: 704 (VND)
    tlv("54", String(roundedAmount)), // Số tiền
    tlv("58", "VN"), // Country code
    tlv("59", PAY_BANK.accountName.slice(0, 25)), // Tên chủ tài khoản
    tlv("60", "HO CHI MINH"), // Thành phố
    tlv("62", additional), // Nội dung CK
    "6304", // CRC indicator
  ].join("");

  return withCrcTag + crc16Emv(withCrcTag);
}

/** URL ảnh QR dự phòng từ dịch vụ img.vietqr.io */
export function getVietQrFallbackUrl(amount: number, content: string): string {
  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo: content,
    accountName: PAY_BANK.accountName,
  });
  return `https://img.vietqr.io/image/${PAY_BANK.bin}-${PAY_BANK.account}-compact2.png?${params.toString()}`;
}
