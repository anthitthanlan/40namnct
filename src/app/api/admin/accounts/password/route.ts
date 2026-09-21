import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import fs from "node:fs/promises";
import path from "node:path";
import { scryptSync } from "node:crypto";
import { logAction } from "@/lib/action-logs";
import { AdminAccount } from "@/lib/admin";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const ADMINS_FILE = path.join(DATA_DIR, "admins.json");

function verifyPassword(password: string, hash: string): boolean {
  if (!hash.includes(":")) return false; // Not supported
  const [salt, key] = hash.split(":");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return key === derivedKey;
}

function hashPassword(password: string, salt: string): string {
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

/** Đổi mật khẩu cá nhân */
export async function PUT(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();

  if (admin.role === "super_admin") {
    return NextResponse.json(
      { ok: false, message: "Super Admin không thể đổi mật khẩu qua giao diện này." },
      { status: 400 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (currentPassword.length < 1 || newPassword.length < 6) {
    return NextResponse.json(
      { ok: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự." },
      { status: 400 }
    );
  }

  try {
    const raw = await fs.readFile(ADMINS_FILE, "utf8");
    const admins = JSON.parse(raw) as AdminAccount[];
    const idx = admins.findIndex((a) => a.username === admin.username);
    
    if (idx === -1) {
      return NextResponse.json({ ok: false, message: "Không tìm thấy tài khoản." }, { status: 404 });
    }

    if (!verifyPassword(currentPassword, admins[idx].passwordHash)) {
      return NextResponse.json({ ok: false, message: "Mật khẩu hiện tại không đúng." }, { status: 400 });
    }

    const { randomBytes } = await import("node:crypto");
    const salt = randomBytes(16).toString("hex");
    admins[idx].passwordHash = hashPassword(newPassword, salt);
    admins[idx].updatedAt = new Date().toISOString();

    await fs.writeFile(ADMINS_FILE, JSON.stringify(admins, null, 2), "utf8");

    await logAction(
      "update_status",
      "registrations", // You can keep it as registrations or create a new group.
      admin.id,
      admin.fullName || admin.username,
      admin.username,
      admin.role,
      "Tự thay đổi mật khẩu tài khoản"
    );

    return NextResponse.json({ ok: true, message: "Đổi mật khẩu thành công." });
  } catch (err) {
    console.error("Lỗi khi đổi mật khẩu:", err);
    return NextResponse.json({ ok: false, message: "Lỗi hệ thống khi đổi mật khẩu." }, { status: 500 });
  }
}
