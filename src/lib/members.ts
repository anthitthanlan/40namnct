import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { UNIT_PRICE, type Size } from "./ticket-view";

export { SIZES, UNIT_PRICE } from "./ticket-view";
export type { Size } from "./ticket-view";
export const MAX_GROUP_QUANTITY = 500;

export type TicketType = "individual" | "group";
export type TicketStatus = "pending" | "confirmed" | "cancelled";

export type Member = {
  id: string;
  name: string;
  /** SĐT chuẩn hoá (bắt đầu 0) - khoá đăng nhập */
  phone: string;
  /** Mã định danh - đăng nhập lại & xuất trình tại cổng 15/11 */
  code: string;
  createdAt: string;
};

export type Ticket = {
  id: string;
  /** Mã vé - ghi trong nội dung chuyển khoản khi quét QR */
  code: string;
  memberId: string;
  type: TicketType;
  /** Cá nhân: tên người tham dự (mặc định = tên tài khoản) */
  attendeeName: string;
  /** Cá nhân: 1 size áo */
  size: string | null;
  /** Tập thể: tổng số suất (cá nhân = 1) */
  quantity: number;
  /** size -> số lượng */
  sizes: Record<string, number>;
  /** Cá nhân miễn phí (0) · tập thể quantity × 200.000 */
  amount: number;
  status: TicketStatus;
  /** Ghi chú tự do (VD: Lớp 12A2 - khóa 2005) */
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type TicketInput = {
  type: TicketType;
  attendeeName: string;
  size: Size | null;
  quantity: number;
  sizes: Record<string, number>;
  note: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const MEMBERS_FILE = path.join(DATA_DIR, "members.json");
const TICKETS_FILE = path.join(DATA_DIR, "tickets.json");

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

export async function listTickets(): Promise<Ticket[]> {
  return readJson<Ticket[]>(TICKETS_FILE, []);
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

export async function findMemberByCode(code: string): Promise<Member | null> {
  const normalized = code.trim().toUpperCase();
  const members = await listMembers();
  return members.find((m) => m.code === normalized) ?? null;
}

/** Tạo tài khoản thành viên mới - trùng SĐT sẽ bị từ chối */
export async function createMember(
  name: string,
  phone: string,
): Promise<{ ok: true; member: Member } | { ok: false; message: string }> {
  const members = await listMembers();
  if (members.some((m) => m.phone === phone)) {
    return {
      ok: false,
      message:
        "Số điện thoại này đã đăng ký tài khoản. Hãy đăng nhập bằng SĐT + mã định danh.",
    };
  }
  let code = "";
  do {
    code = `NCT40-${randomCode(6)}`;
  } while (members.some((m) => m.code === code));
  const member: Member = {
    id: randomUUID(),
    name,
    phone,
    code,
    createdAt: new Date().toISOString(),
  };
  members.push(member);
  await writeJson(MEMBERS_FILE, members);
  return { ok: true, member };
}

/** Đăng nhập: SĐT + mã định danh */
export async function verifyMemberLogin(
  phone: string,
  code: string,
): Promise<Member | null> {
  const member = await findMemberByPhone(phone);
  if (!member) return null;
  if (member.code !== code.trim().toUpperCase()) return null;
  return member;
}

export async function getMemberById(id: string): Promise<Member | null> {
  const members = await listMembers();
  return members.find((m) => m.id === id) ?? null;
}

function randomTicketCode(): string {
  return `VE-${randomCode(6)}`;
}

/** Tạo vé (dữ liệu đã được validate ở route gọi) */
export async function createTicket(
  memberId: string,
  input: TicketInput,
): Promise<Ticket> {
  const tickets = await listTickets();
  let code = randomTicketCode();
  while (tickets.some((t) => t.code === code)) {
    code = randomTicketCode();
  }
  const now = new Date().toISOString();
  const ticket: Ticket =
    input.type === "individual"
      ? {
          id: randomUUID(),
          code,
          memberId,
          type: "individual",
          attendeeName: input.attendeeName,
          size: input.size,
          quantity: 1,
          sizes: input.size ? { [input.size]: 1 } : {},
          amount: 0,
          status: "confirmed",
          note: input.note,
          createdAt: now,
          updatedAt: now,
        }
      : {
          id: randomUUID(),
          code,
          memberId,
          type: "group",
          attendeeName: "",
          size: null,
          quantity: input.quantity,
          sizes: input.sizes,
          amount: input.quantity * UNIT_PRICE,
          status: "pending",
          note: input.note,
          createdAt: now,
          updatedAt: now,
        };
  tickets.push(ticket);
  await writeJson(TICKETS_FILE, tickets);
  return ticket;
}

export async function listTicketsByMember(memberId: string): Promise<Ticket[]> {
  const tickets = await listTickets();
  return tickets
    .filter((t) => t.memberId === memberId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findTicketById(id: string): Promise<Ticket | null> {
  const tickets = await listTickets();
  return tickets.find((t) => t.id === id) ?? null;
}

export async function setTicketStatus(
  id: string,
  status: TicketStatus,
): Promise<Ticket | null> {
  const tickets = await listTickets();
  const index = tickets.findIndex((t) => t.id === id);
  if (index === -1) return null;
  tickets[index] = {
    ...tickets[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  await writeJson(TICKETS_FILE, tickets);
  return tickets[index];
}

export { vietqrUrl } from "./vietqr";

