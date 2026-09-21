import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { UNIT_PRICE, type Size, type InvitationStatus } from "./invitation-view";

export { SIZES, UNIT_PRICE } from "./invitation-view";
export type { Size, InvitationStatus } from "./invitation-view";
export const MAX_GROUP_QUANTITY = 500;

export type InvitationType = "individual" | "group";

export type Member = {
  id: string;
  name: string;
  /** SĐT chuẩn hoá (bắt đầu 0) */
  phone: string;
  email: string;
  createdAt: string;
};

export type OcrResult = {
  /** Số tiền AI trích xuất từ biên lai */
  amount: number | null;
  /** Nội dung CK AI trích xuất */
  content: string | null;
  /** Thời gian giao dịch AI trích xuất */
  time: string | null;
  /** Mã giao dịch / Số tham chiếu */
  transactionId?: string | null;
  /** Trạng thái giao dịch trích xuất (mới thêm) */
  transactionStatus?: "success" | "pending" | "failed" | "unknown";
  /** Điểm tin cậy OCR */
  trustScore?: number | null;
  /** Mức độ tin cậy kết quả so khớp */
  confidence: "high" | "low" | "mismatch" | "system_error";
  /** Ghi chú chi tiết cho Admin */
  note: string;
  /** Provider AI đã dùng */
  provider: string;
};

export type ReceiptAttempt = {
  url: string;
  ocrResult: OcrResult;
  createdAt: string;
};


export type Invitation = {
  id: string;
  /** Mã thư mời - ghi trong nội dung chuyển khoản khi quét QR */
  code: string;
  memberId: string;
  nienKhoa?: string;
  type: InvitationType;
  /** Cá nhân: tên người tham dự (mặc định = tên tài khoản) */
  attendeeName: string;
  /** Cá nhân: 1 size áo */
  size: string | null;
  /** Tập thể: tổng số suất (cá nhân = 1) */
  quantity: number;
  /** size -> số lượng */
  sizes: Record<string, number>;
  /** Số lượng Combo Áo + Ăn nhẹ (500k/suất) */
  snacks: number;
  /** Vé tham gia miễn phí. Tiền = snacks × UNIT_PRICE */
  amount: number;
  status: InvitationStatus;
  /** Ghi chú tự do (VD: Lớp 12A2 - khóa 2005) */
  note: string;
  lastSessionId?: string;
  paymentClaimedAt?: string;
  /** URL ảnh biên lai chuyển khoản (Cloudflare R2 hoặc local fallback) - Bản mới nhất */
  receiptUrl?: string;
  /** Kết quả AI OCR từ ảnh biên lai - Bản mới nhất */
  ocrResult?: OcrResult;
  /** Lịch sử các lần tải ảnh (Tối đa 3 lần) */
  receiptAttempts?: ReceiptAttempt[];
  checkedIn?: boolean;
  checkedInAt?: string | null;
  shirtReceived?: boolean;
  shirtReceivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvitationInput = {
  type: InvitationType;
  nienKhoa?: string;
  attendeeName: string;
  size: Size | null; // Size áo
  quantity: number;
  sizes: Record<string, number>;
  snacks: number;
  note: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const MEMBERS_FILE = path.join(DATA_DIR, "members.json");
const INVITATIONS_FILE = path.join(DATA_DIR, "invitations.json");

/** Khóa ghi file đơn giản - tránh ghi đè song song */
let queue: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed: unknown = JSON.parse(raw);
    return parsed as T;
  } catch {
    await withLock(async () => {
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(file, JSON.stringify(fallback, null, 2), "utf8");
      } catch {
        /* no-op */
      }
    });
    return fallback;
  }
}

export async function listMembers(): Promise<Member[]> {
  return readJson<Member[]>(MEMBERS_FILE, []);
}

export async function listInvitations(): Promise<Invitation[]> {
  return readJson<Invitation[]>(INVITATIONS_FILE, []);
}

async function writeJson<T>(file: string, value: T): Promise<void> {
  await withLock(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
  });
}

/** Chuẩn hoá SĐT Việt Nam: bỏ ký tự lạ, +84/84 → 0. Null nếu không hợp lệ */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length >= 11) {
    digits = `0${digits.slice(2)}`;
  }
  if (!/^0\d{8,10}$/.test(digits)) return null;
  return digits;
}

/** Bảng chữ cái cho mã - bỏ I, O, 0, 1 dễ nhầm */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(len: number): string {
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export async function findMemberByPhone(phone: string): Promise<Member | null> {
  const members = await listMembers();
  return members.find((m) => m.phone === phone) ?? null;
}

/** Tạo tài khoản thành viên mới - trùng SĐT sẽ bị từ chối */
export async function createMember(
  name: string,
  phone: string,
  email: string,
): Promise<{ ok: true; member: Member } | { ok: false; message: string }> {
  const members = await listMembers();
  if (members.some((m) => m.phone === phone)) {
    return {
      ok: false,
      message:
        "Số điện thoại này đã đăng ký tham gia. Vui lòng sử dụng mã định danh đã được cấp.",
    };
  }
  const member: Member = {
    id: randomUUID(),
    name,
    phone,
    email,
    createdAt: new Date().toISOString(),
  };
  members.push(member);
  await writeJson(MEMBERS_FILE, members);
  return { ok: true, member };
}



export async function getMemberById(id: string): Promise<Member | null> {
  const members = await listMembers();
  return members.find((m) => m.id === id) ?? null;
}

export async function findInvitationByCode(code: string): Promise<Invitation | null> {
  const normalized = code.trim().toUpperCase();
  const invitations = await listInvitations();
  return invitations.find((i) => i.code === normalized) ?? null;
}

function generateInvitationCode(order: number): string {
  const orderStr = String(order).padStart(3, "0");
  return `NCT19862026-${orderStr}${randomCode(5)}`;
}

/** Tạo vé tham dự. Combo tính phí 500k/suất (lưu vào biến snacks) */
export async function createInvitation(
  memberId: string,
  input: InvitationInput,
): Promise<Invitation> {
  const invitations = await listInvitations();
  const order = invitations.length + 1;
  let code = generateInvitationCode(order);
  while (invitations.some((t) => t.code === code)) {
    code = generateInvitationCode(order);
  }
  const now = new Date().toISOString();
  const invitation: Invitation =
    input.type === "individual"
      ? {
          id: randomUUID(),
          code,
          memberId,
          nienKhoa: input.nienKhoa,
          type: "individual",
          attendeeName: input.attendeeName,
          size: input.size,
          quantity: 1,
          sizes: input.size ? { [input.size]: 1 } : {},
          snacks: input.snacks,
          amount: input.snacks * UNIT_PRICE,
          status: input.snacks > 0 ? "pending_payment" : "confirmed",
          note: input.note,
          checkedIn: false,
          checkedInAt: null,
          createdAt: now,
          updatedAt: now,
        }
      : {
          id: randomUUID(),
          code,
          memberId,
          nienKhoa: input.nienKhoa,
          type: "group",
          attendeeName: "",
          size: null,
          quantity: input.quantity,
          sizes: input.sizes,
          snacks: input.snacks,
          amount: input.snacks * UNIT_PRICE,
          status: input.snacks > 0 ? "pending_payment" : "confirmed",
          note: input.note,
          checkedIn: false,
          checkedInAt: null,
          createdAt: now,
          updatedAt: now,
        };
  invitations.push(invitation);
  await writeJson(INVITATIONS_FILE, invitations);
  return invitation;
}

export async function listInvitationsByMember(memberId: string): Promise<Invitation[]> {
  const invitations = await listInvitations();
  return invitations
    .filter((t) => t.memberId === memberId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findInvitationById(id: string): Promise<Invitation | null> {
  const invitations = await listInvitations();
  return invitations.find((t) => t.id === id) ?? null;
}

export async function setInvitationStatus(
  id: string,
  status: InvitationStatus,
): Promise<Invitation | null> {
  const invitations = await listInvitations();
  const index = invitations.findIndex((t) => t.id === id);
  if (index === -1) return null;
  invitations[index] = {
    ...invitations[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  await writeJson(INVITATIONS_FILE, invitations);
  return invitations[index];
}

export async function setShirtReceived(
  id: string,
  shirtReceived: boolean,
): Promise<Invitation | null> {
  const invitations = await listInvitations();
  const index = invitations.findIndex((t) => t.id === id);
  if (index === -1) return null;
  invitations[index] = {
    ...invitations[index],
    shirtReceived,
    updatedAt: new Date().toISOString(),
  };
  await writeJson(INVITATIONS_FILE, invitations);
  return invitations[index];
}

/** Người dùng xác nhận đã chuyển khoản -> chuyển sang chờ duyệt (24h) kèm Session ID */
export async function claimPayment(
  id: string,
  sessionId?: string,
): Promise<Invitation | null> {
  const invitations = await listInvitations();
  const index = invitations.findIndex((t) => t.id === id);
  if (index === -1) return null;
  const now = new Date().toISOString();
  invitations[index] = {
    ...invitations[index],
    status: "pending_approval",
    lastSessionId: sessionId || invitations[index].lastSessionId,
    paymentClaimedAt: now,
    updatedAt: now,
  };
  await writeJson(INVITATIONS_FILE, invitations);
  return invitations[index];
}

/**
 * Lưu kết quả AI OCR và URL ảnh biên lai vào vé
 * Đồng thời cập nhật trạng thái dựa trên confidence
 */
export async function updateInvitationReceipt(
  id: string,
  receiptUrl: string,
  ocrResult: OcrResult,
): Promise<Invitation | null> {
  const invitations = await listInvitations();
  const index = invitations.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  
  const attempt: ReceiptAttempt = {
    url: receiptUrl,
    ocrResult,
    createdAt: now,
  };
  const newAttempts = [...(invitations[index].receiptAttempts || []), attempt];

  let newStatus = invitations[index].status;
  if (ocrResult.confidence === "high") {
    newStatus = "confirmed";
  } else if (
    ocrResult.confidence === "low" ||
    ocrResult.confidence === "system_error" ||
    newAttempts.length >= 3 // Quá 3 lần sai -> Bắt buộc chuyển chờ duyệt
  ) {
    newStatus = "pending_approval";
  }

  invitations[index] = {
    ...invitations[index],
    receiptUrl, // Bản mới nhất để hiển thị nhanh
    ocrResult,
    receiptAttempts: newAttempts,
    status: newStatus,
    ...(newStatus !== invitations[index].status ? { paymentClaimedAt: now } : {}),
    updatedAt: now,
  };

  await writeJson(INVITATIONS_FILE, invitations);
  return invitations[index];
}

/** Check-in vé tại cổng bằng camera scanner */
export async function checkInInvitation(
  id: string,
): Promise<{ ok: boolean; invitation?: Invitation; message?: string }> {
  const invitations = await listInvitations();
  const index = invitations.findIndex((t) => t.id === id);
  if (index === -1) {
    return { ok: false, message: "Không tìm thấy vé trong hệ thống" };
  }
  const t = invitations[index];
  if (t.status !== "confirmed") {
    return {
      ok: false,
      message: `Vé chưa được duyệt phát hành (trạng thái: ${t.status})`,
    };
  }
  if (t.checkedIn) {
    return {
      ok: false,
      invitation: t,
      message: `Vé này đã được quét vào cổng lúc ${new Date(t.checkedInAt || "").toLocaleTimeString("vi-VN")}`,
    };
  }
  const now = new Date().toISOString();
  invitations[index] = {
    ...t,
    checkedIn: true,
    checkedInAt: now,
    updatedAt: now,
  };
  await writeJson(INVITATIONS_FILE, invitations);
  return { ok: true, invitation: invitations[index] };
}

/** Quét QR trao áo tại sự kiện — chỉ áp dụng cho vé đã duyệt */
export async function shirtCheckInByQr(
  id: string,
): Promise<{ ok: boolean; invitation?: Invitation; message?: string }> {
  const invitations = await listInvitations();
  const index = invitations.findIndex((t) => t.id === id);
  if (index === -1) {
    return { ok: false, message: "Không tìm thấy vé trong hệ thống" };
  }
  const t = invitations[index];
  if (t.status !== "confirmed") {
    return {
      ok: false,
      message: `Vé chưa được duyệt phát hành (trạng thái: ${t.status})`,
    };
  }
  if (t.shirtReceived) {
    return {
      ok: false,
      invitation: t,
      message: `Vé này đã được trao áo lúc ${new Date(t.shirtReceivedAt || "").toLocaleTimeString("vi-VN")}`,
    };
  }
  const now = new Date().toISOString();
  invitations[index] = {
    ...t,
    shirtReceived: true,
    shirtReceivedAt: now,
    updatedAt: now,
  };
  await writeJson(INVITATIONS_FILE, invitations);
  return { ok: true, invitation: invitations[index] };
}

export { vietqrUrl } from "./vietqr";

export async function deleteInvitation(id: string): Promise<boolean> {
  const invitations = await listInvitations();
  const index = invitations.findIndex((t) => t.id === id);
  if (index === -1) return false;
  invitations.splice(index, 1);
  await writeJson(INVITATIONS_FILE, invitations);
  return true;
}
