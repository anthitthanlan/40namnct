/**
 * EMVCo QR (chuẩn EMV®QRCPS - Merchant Presented Mode, dùng bởi VietQR / Napas 247)
 * - module thuần, KHÔNG import node:* để dùng được ở client bundle.
 *
 * Payload TLV:
 *   00 = "01" (payload format indicator)
 *   01 = "12" (dynamic - có số tiền)
 *   38 = Merchant Account Information (VietQR GUID A000000727 + QRIBFTTA + BIN + STK)
 *   52 = "0000" (MCC) · 53 = "704" (VND) · 54 = số tiền · 58 = "VN"
 *   62 = Additional Data (08 = nội dung chuyển khoản, ≤ 25 ký tự)
 *   63 = CRC-16/CCITT-FALSE (4 hex, tính trên toàn bộ chuỗi kể cả "6304")
 */

/** Tài khoản nhận tiền vé (theo QR Sacombank Ban Tổ chức cung cấp) */
export const PAY_BANK = {
  /** Mã BIN Sacombank */
  bin: "970403",
  account: "060004015137",
  shortName: "Sacombank",
  /** Tên chủ TK trong payload - chữ HOA không dấu để máy quét đọc chuẩn */
  accountName: "DOAN THUY KIM PHUONG",
  accountNameDisplay: "ĐOÀN THỤY KIM PHƯỢNG",
} as const;

/**
 * Ảnh nền thẻ chuyển tiền - nằm trong public/bg.
 * Muốn thêm ảnh nền mới: bỏ file vào public/bg rồi thêm đường dẫn vào đây,
 * thẻ QR sẽ tự chọn ngẫu nhiên một ảnh mỗi lần mở.
 */
export const PAY_BACKGROUNDS: string[] = [
  "/bg/qr-chuyen-tien.svg",
];

/** Nội dung CK xoay mỗi 2 phút */
export const TRANSFER_WINDOW_MS = 120_000;

/** Nội dung CK = mã định danh + 3 ký tự xoay (bỏ ký tự dễ nhầm 0/1/I/O) */
const SUFFIX_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Số thứ tự của "cửa sổ 2 phút" chứa thời điểm at (ms epoch) */
export function windowIndexOf(at: number): number {
  return Math.floor(at / TRANSFER_WINDOW_MS);
}

/**
 * Nội dung chuyển khoản cho mã định danh tại thời điểm at:
 * "NCT40-JZ6FEY-K3A" - phần đuôi đổi deterministically mỗi 2 phút,
 * để admin đối chiếu lại được (tính lại cho cửa sổ hiện tại / vừa qua).
 */
export function transferContent(code: string, at: number): string {
  const base = code.toUpperCase();
  const w = windowIndexOf(at);
  const h = fnv1a(`${base}:${w}`);
  const n = SUFFIX_ALPHABET.length;
  const suffix =
    SUFFIX_ALPHABET[h % n] +
    SUFFIX_ALPHABET[Math.floor(h / n) % n] +
    SUFFIX_ALPHABET[Math.floor(h / (n * n)) % n];
  return `${base}-${suffix}`;
}

/** Các nội dung CK hợp lệ quanh thời điểm at: [hiện tại, vừa qua] */
export function expectedTransferContents(code: string, at: number): string[] {
  return [
    transferContent(code, at),
    transferContent(code, at - TRANSFER_WINDOW_MS),
  ];
}

/**
 * Kiểm tra văn bản thông báo ngân hàng có chứa nội dung CK của mã định danh không.
 * Chấp nhận cả khi app ngân hàng chèn/thay ký tự ngăn cách (dấu "-", khoảng trắng…).
 */
export function matchTransferContent(code: string, text: string): boolean {
  const normalized = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const base = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return base.length > 0 && normalized.includes(base);
}

function tlv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) - vector kiểm chứng: "123456789" → "29B1" */
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

/** Dựng chuỗi payload EMVCo (đưa vào thư viện QR để vẽ ảnh) */
export function buildEmvQrPayload(amount: number, content: string): string {
  const merchant = [
    tlv("00", "A000000727"), // GUID VietQR
    tlv("01", "QRIBFTTA"), // dịch vụ Napas 247
    tlv("02", PAY_BANK.bin),
    tlv("03", PAY_BANK.account),
  ].join("");
  const additional = tlv("08", content.slice(0, 25).toUpperCase());
  const withCrcTag = [
    tlv("00", "01"),
    tlv("01", "12"),
    tlv("38", merchant),
    tlv("52", "0000"),
    tlv("53", "704"),
    tlv("54", String(Math.round(amount))),
    tlv("58", "VN"),
    tlv("62", additional),
    "6304",
  ].join("");
  return withCrcTag + crc16Emv(withCrcTag);
}
