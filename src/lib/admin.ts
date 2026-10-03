import { randomUUID, createHash, scryptSync, randomBytes } from "node:crypto";
import { db } from "./firebase";

// ============================================================
// Hệ thống tài khoản quản trị phân quyền
// Roles: super_admin | system_manager | editor
// Super Admin: lấy từ biến môi trường (không lưu trong DB)
// Các tài khoản còn lại: lưu trong Firestore (collection "admins")
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
const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || "";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "";

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

  // Kiểm tra tài khoản trong DB Firestore
  const snap = await db.collection("admins").where("username", "==", username).limit(1).get();
  if (snap.empty) {
    return { ok: false, message: "Tên đăng nhập không tồn tại." };
  }
  const account = snap.docs[0].data() as AdminAccount;

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
  const snap = await db.collection("admins").where("username", "==", input.username).limit(1).get();
  if (!snap.empty) {
    return { ok: false, message: "Tên đăng nhập đã tồn tại." };
  }

  const now = new Date().toISOString();
  const id = randomUUID();
  const account: AdminAccount = {
    id,
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

  await db.collection("admins").doc(id).set(account);
  return { ok: true, account };
}

/** Lấy danh sách tài khoản admin (không bao gồm super admin) */
export async function listAdminAccounts(): Promise<SafeAdminAccount[]> {
  const snap = await db.collection("admins").get();
  const accounts = snap.docs.map((doc) => doc.data() as AdminAccount);
  return accounts.map(({ passwordHash, ...safe }) => safe);
}

/** Xóa tài khoản admin (chỉ Super Admin) */
export async function deleteAdminAccount(id: string): Promise<boolean> {
  const docRef = db.collection("admins").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;
  
  await docRef.delete();
  return true;
}

/** Ghi log tương tác cho admin */
export async function addAdminLog(
  adminId: string,
  action: string,
  detail: string,
): Promise<void> {
  if (adminId === "super_admin") return; // Super Admin không lưu log
  const docRef = db.collection("admins").doc(adminId);
  const doc = await docRef.get();
  if (!doc.exists) return;
  
  const current = doc.data() as AdminAccount;
  const newLogs = [
    ...(current.logs || []),
    {
      action,
      detail,
      timestamp: new Date().toISOString(),
    }
  ];
  
  await docRef.update({
    logs: newLogs,
    updatedAt: new Date().toISOString(),
  });
}

// ============================================================
// Kiểm tra quyền
// ============================================================

export function isSuperAdmin(role: AdminRole): boolean {
  return role === "super_admin";
}

export function canManageSystem(role: AdminRole): boolean {
  return role === "super_admin" || role === "system_manager";
}

export function canManagePosts(role: AdminRole): boolean {
  return role === "super_admin" || role === "system_manager" || role === "editor";
}

export function canCreateAccounts(role: AdminRole): boolean {
  return role === "super_admin";
}

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
