export type AdminRole = "super_admin" | "system_manager" | "editor";

export type AdminLogEntry = {
  action: string;
  detail: string;
  timestamp: string;
};

export type AdminAccount = {
  id: string;
  username: string;
  fullName: string;
  title: string;
  role: AdminRole;
  logs?: AdminLogEntry[];
  createdAt: string;
  updatedAt: string;
};

export type SafeAdminAccount = AdminAccount;

export type CreateAdminInput = {
  username: string;
  fullName: string;
  title: string;
  role: "system_manager" | "editor";
  password: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nctitc.io.vn";

function getHeaders(token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function createAdminAccount(
  input: CreateAdminInput,
  token?: string,
): Promise<{ ok: true; account: AdminAccount } | { ok: false; message: string }> {
  try {
    const res = await fetch(`${API_URL}/api/admin/accounts`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      let message = "Không thể tạo tài khoản";
      const text = await res.text();
      try {
        const err = JSON.parse(text);
        message = err.detail || message;
      } catch (e) {
        message = `Server lỗi (${res.status}): ${text}`;
      }
      return { ok: false, message };
    }
    return { ok: true, account: await res.json() };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

export async function listAdminAccounts(token?: string): Promise<SafeAdminAccount[]> {
  try {
    const res = await fetch(`${API_URL}/api/admin/accounts`, {
      headers: getHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function deleteAdminAccount(id: string, token?: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/admin/accounts/${id}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  return res.ok;
}

export async function addAdminLog(
  adminId: string,
  action: string,
  detail: string,
  token?: string,
): Promise<void> {
  // Logic logs are handled inside FastAPI
}

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
