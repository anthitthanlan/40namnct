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

function hashPassword(password: string, salt: string): string {
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

/** Super Admin reset mật khẩu cho tài khoản khác */
export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorized();

  if (admin.role !== "super_admin") {
    return NextResponse.json(
      { ok: false, message: "Chỉ Super Admin mới có quyền này." },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const targetUsername = typeof body.username === "string" ? body.username : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!targetUsername || newPassword.length < 6) {
    return NextResponse.json(
      { ok: false, message: "Username không hợp lệ hoặc mật khẩu mới quá ngắn (tối thiểu 6 ký tự)." },
      { status: 400 }
    );
  }

  try {
    const raw = await fs.readFile(ADMINS_FILE, "utf8");
    const admins = JSON.parse(raw) as AdminAccount[];
    const idx = admins.findIndex((a) => a.username === targetUsername);
    
    if (idx === -1) {
      return NextResponse.json({ ok: false, message: "Không tìm thấy tài khoản đích." }, { status: 404 });
    }

    const { randomBytes } = await import("node:crypto");
    const salt = randomBytes(16).toString("hex");
    admins[idx].passwordHash = hashPassword(newPassword, salt);
    admins[idx].updatedAt = new Date().toISOString();

    await fs.writeFile(ADMINS_FILE, JSON.stringify(admins, null, 2), "utf8");

    await logAction(
      "update_status",
      "registrations",
      admin.id,
      admin.fullName || admin.username,
      admin.username,
      admin.role,
      `Super Admin đã reset mật khẩu cho tài khoản: ${targetUsername}`
    );

    return NextResponse.json({ ok: true, message: `Đã reset mật khẩu cho ${targetUsername}.` });
  } catch (err) {
    console.error("Lỗi khi reset mật khẩu:", err);
    return NextResponse.json({ ok: false, message: "Lỗi hệ thống khi reset mật khẩu." }, { status: 500 });
  }
}
