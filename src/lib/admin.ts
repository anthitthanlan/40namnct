import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID, createHash, scryptSync, randomBytes } from "node:crypto";

// ============================================================
// Hệ thống tài khoản quản trị phân quyền
// Roles: super_admin | system_manager | editor
// Super Admin: lấy từ biến môi trường (không lưu trong DB)
// Các tài khoản còn lại: lưu trong data/admins.json
// ============================================================

export type AdminRole = "super_admin" | "system_manager" | "editor";

export type AdminLogEntry = {
  action: string;
  detail: string;
  timestamp: string;
};

export type AdminAccount = {
  id: string;
  /** Tên đăng nhập (username) */
  username: string;
  /** Họ và tên */
  fullName: string;
  /** Danh xưng (VD: Thầy, Cô, Anh, Chị...) */
  title: string;
  role: AdminRole;
  /** Mật khẩu đã hash (SHA-256) */
  passwordHash: string;
  /** Nhật ký tương tác */
  logs: AdminLogEntry[];
  createdAt: string;
  updatedAt: string;
};

export type SafeAdminAccount = Omit<AdminAccount, "passwordHash">;

/** Thông tin Super Admin từ biến môi trường */
const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || "nctitc@1986-2026";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "NCT@1986";

const DATA_DIR = path.join(process.cwd(), "data");
const ADMINS_FILE = path.join(DATA_DIR, "admins.json");

/** Khóa ghi file đơn giản */
let queue: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

function hashPassword(password: string, salt?: string): string {
  const s = salt || randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, s, 64).toString("hex");
  return `${s}:${derivedKey}`;
}

function verifyPassword(password: string, hash: string): boolean {
  if (!hash.includes(":")) {
    // Fallback if there are any old hashes
    return createHash("sha256").update(password).digest("hex") === hash;
  }
  const [salt, key] = hash.split(":");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return key === derivedKey;
}

async function readAdmins(): Promise<AdminAccount[]> {
  try {
    const raw = await fs.readFile(ADMINS_FILE, "utf8");
    return JSON.parse(raw) as AdminAccount[];
  } catch {
    await withLock(async () => {
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(ADMINS_FILE, "[]", "utf8");
      } catch {
        /* no-op */
      }
    });
    return [];
  }
}

async function writeAdmins(admins: AdminAccount[]): Promise<void> {
  await withLock(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(ADMINS_FILE, JSON.stringify(admins, null, 2), "utf8");
  });
}

// ============================================================
// Xác thực đăng nhập
// ============================================================

export type AuthResult = {
  ok: boolean;
  admin?: {
    id: string;
    username: string;
    fullName: string;
    title: string;
    role: AdminRole;
  };
  message?: string;
};

/** Xác thực đăng nhập admin (bao gồm cả Super Admin) */
export async function authenticateAdmin(
  username: string,
  password: string,
): Promise<AuthResult> {
  // Kiểm tra Super Admin (từ biến môi trường)
  if (username === SUPER_ADMIN_USERNAME && password === SUPER_ADMIN_PASSWORD) {
    return {
      ok: true,
      admin: {
        id: "super_admin",
        username: SUPER_ADMIN_USERNAME,
        fullName: "Quản trị viên Hệ thống",
        title: "Super Admin",
        role: "super_admin",
      },
    };
  }

  // Kiểm tra tài khoản trong DB
  const admins = await readAdmins();
  const account = admins.find((a) => a.username === username);
  if (!account) {
    return { ok: false, message: "Tên đăng nhập không tồn tại." };
  }

  if (!verifyPassword(password, account.passwordHash)) {
    return { ok: false, message: "Mật khẩu không đúng." };
  }

  return {
    ok: true,
    admin: {
      id: account.id,
      username: account.username,
      fullName: account.fullName,
      title: account.title,
      role: account.role,
    },
  };
}

// ============================================================
// CRUD tài khoản (chỉ Super Admin)
// ============================================================

export type CreateAdminInput = {
  username: string;
  fullName: string;
  title: string;
  role: "system_manager" | "editor";
  password: string;
};

/** Tạo tài khoản mới (chỉ Super Admin được phép) */
export async function createAdminAccount(
  input: CreateAdminInput,
): Promise<{ ok: true; account: AdminAccount } | { ok: false; message: string }> {
  const admins = await readAdmins();
  if (admins.some((a) => a.username === input.username)) {
    return { ok: false, message: "Tên đăng nhập đã tồn tại." };
  }

  const now = new Date().toISOString();
  const account: AdminAccount = {
    id: randomUUID(),
    username: input.username,
    fullName: input.fullName,
    title: input.title,
    role: input.role,
    passwordHash: hashPassword(input.password),
    logs: [
      {
        action: "account_created",
        detail: `Tài khoản được tạo bởi Super Admin`,
        timestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  admins.push(account);
  await writeAdmins(admins);
  return { ok: true, account };
}

/** Lấy danh sách tài khoản admin (không bao gồm super admin) */
export async function listAdminAccounts(): Promise<SafeAdminAccount[]> {
  const admins = await readAdmins();
  return admins.map(({ passwordHash, ...safe }) => safe);
}

/** Xóa tài khoản admin (chỉ Super Admin) */
export async function deleteAdminAccount(id: string): Promise<boolean> {
  const admins = await readAdmins();
  const next = admins.filter((a) => a.id !== id);
  if (next.length === admins.length) return false;
  await writeAdmins(next);
  return true;
}

/** Ghi log tương tác cho admin */
export async function addAdminLog(
  adminId: string,
  action: string,
  detail: string,
): Promise<void> {
  if (adminId === "super_admin") return; // Super Admin không lưu log trong file
  const admins = await readAdmins();
  const index = admins.findIndex((a) => a.id === adminId);
  if (index === -1) return;
  admins[index].logs.push({
    action,
    detail,
    timestamp: new Date().toISOString(),
  });
  admins[index].updatedAt = new Date().toISOString();
  await writeAdmins(admins);
}

// ============================================================
// Kiểm tra quyền
// ============================================================

/** Super Admin: mọi quyền */
export function isSuperAdmin(role: AdminRole): boolean {
  return role === "super_admin";
}

/** System Manager: quản lý hệ thống nhưng không tạo tài khoản */
export function canManageSystem(role: AdminRole): boolean {
  return role === "super_admin" || role === "system_manager";
}

/** Editor: chỉ được quản lý bài viết (đăng/gỡ, duyệt bài) */
export function canManagePosts(role: AdminRole): boolean {
  return role === "super_admin" || role === "system_manager" || role === "editor";
}

/** Chỉ Super Admin có thể tạo tài khoản */
export function canCreateAccounts(role: AdminRole): boolean {
  return role === "super_admin";
}

/** Nhãn hiển thị cho role */
export function roleLabel(role: AdminRole): string {
  switch (role) {
    case "super_admin":
      return "Quản trị tối cao";
    case "system_manager":
      return "Quản lý hệ thống";
    case "editor":
      return "Biên tập viên";
    default:
      return role;
  }
}
