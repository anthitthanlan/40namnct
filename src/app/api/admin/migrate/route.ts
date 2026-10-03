import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/firebase";
import { uploadReceipt, uploadMediaFile } from "@/lib/r2";
import { extOf, mimeForExt } from "@/lib/media";

// Middleware xác thực basic auth (tương tự các route admin khác)
function isAuthenticated(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;

  const auth = Buffer.from(authHeader.split(" ")[1], "base64").toString();
  const [user, pwd] = auth.split(":");
  
  const expectedUser = process.env.SUPER_ADMIN_USERNAME || "admin";
  const expectedPwd = process.env.SUPER_ADMIN_PASSWORD || "admin";

  return user === expectedUser && pwd === expectedPwd;
}

export async function GET(req: Request) {
  if (!isAuthenticated(req)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic" },
    });
  }

  const DATA_DIR = path.join(process.cwd(), "data");
  
  try {
    const logs: string[] = [];
    const log = (msg: string) => {
      console.log(msg);
      logs.push(msg);
    };

    log("Bắt đầu tiến trình Migration (Chuyển dữ liệu lên Firebase & R2)...");

    // 1. Migrate Posts
    try {
      const postsRaw = await fs.readFile(path.join(DATA_DIR, "posts.json"), "utf8");
      const posts = JSON.parse(postsRaw);
      const batch = db.batch();
      for (const p of posts) {
        batch.set(db.collection("posts").doc(p.id), p);
      }
      await batch.commit();
      log(`✅ Đã đồng bộ ${posts.length} bài viết.`);
    } catch (e) {
      log(`⚠️ Bỏ qua Posts: Không thể đọc posts.json (${String(e)})`);
    }

    // 2. Migrate Members
    try {
      const membersRaw = await fs.readFile(path.join(DATA_DIR, "members.json"), "utf8");
      const members = JSON.parse(membersRaw);
      const batch = db.batch();
      for (const m of members) {
        batch.set(db.collection("members").doc(m.id), m);
      }
      await batch.commit();
      log(`✅ Đã đồng bộ ${members.length} tài khoản thành viên.`);
    } catch (e) {
      log(`⚠️ Bỏ qua Members: Không thể đọc members.json (${String(e)})`);
    }

    // 2.5 Migrate Admins
    try {
      const adminsRaw = await fs.readFile(path.join(DATA_DIR, "admins.json"), "utf8");
      const admins = JSON.parse(adminsRaw);
      const batch = db.batch();
      for (const a of admins) {
        batch.set(db.collection("admins").doc(a.id), a);
      }
      await batch.commit();
      log(`✅ Đã đồng bộ ${admins.length} tài khoản quản trị (Admins).`);
    } catch (e) {
      log(`⚠️ Bỏ qua Admins: Không thể đọc admins.json (${String(e)})`);
    }

    // 3. Migrate Invitations & Biên lai
    try {
      const invRaw = await fs.readFile(path.join(DATA_DIR, "invitations.json"), "utf8");
      const invitations = JSON.parse(invRaw);
      
      let uploadCount = 0;
      
      // Chúng ta sẽ lặp qua từng cái vì nếu có biên lai, ta phải upload lên R2
      for (const inv of invitations) {
        // Kiểm tra xem vé này có biên lai local không (từ receiptAttempts hoặc URL cũ)
        // Nếu ở local, uploadReceiptLocal thường tạo URL /api/admin/receipt/...
        // Do dữ liệu cũ lưu biên lai theo file <id>.jpg ở data/receipts/
        
        let receiptFound = false;
        const exts = ["jpg", "png", "webp", "heic", "heif"];
        for (const ext of exts) {
          const filepath = path.join(DATA_DIR, "receipts", `${inv.id}.${ext}`);
          try {
            const buffer = await fs.readFile(filepath);
            const mimeType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
            const res = await uploadReceipt(inv.id, buffer, mimeType);
            if (res.ok) {
              // Cập nhật receiptUrl thành key
              inv.receiptUrl = res.key;
              receiptFound = true;
              uploadCount++;
              break;
            }
          } catch {
            // Không có file đuôi này, thử đuôi khác
          }
        }
        
        // Dọn dẹp attempts nếu url cũ (local) không còn hợp lệ,
        // Nhưng tạm thời cứ giữ nguyên cấu trúc
        await db.collection("invitations").doc(inv.id).set(inv);
      }
      log(`✅ Đã đồng bộ ${invitations.length} thư mời và upload ${uploadCount} ảnh biên lai lên R2.`);
    } catch (e) {
      log(`⚠️ Bỏ qua Invitations: Không thể đọc invitations.json (${String(e)})`);
    }

    // 4. Migrate Media
    try {
      const mediaRaw = await fs.readFile(path.join(DATA_DIR, "media.json"), "utf8");
      const mediaList = JSON.parse(mediaRaw);
      
      let uploadCount = 0;
      for (const m of mediaList) {
        // Tên file lưu ở m.file, VD: uuid.jpg
        if (m.file && !m.file.startsWith("http")) {
          const filepath = path.join(DATA_DIR, "uploads", m.file);
          try {
            const buffer = await fs.readFile(filepath);
            const ext = extOf(m.file);
            const mimeType = mimeForExt(ext) || "application/octet-stream";
            
            // Upload lên R2_BUCKET_MEDIA
            const res = await uploadMediaFile(m.file, buffer, mimeType);
            if (res.ok) {
              uploadCount++;
              // public url của R2 đã được lưu nếu có cấu hình R2_PUBLIC_URL_MEDIA
            }
          } catch {
            // Bỏ qua nếu mất file
          }
        }
        await db.collection("media").doc(m.id).set(m);
      }
      log(`✅ Đã đồng bộ ${mediaList.length} Media items và upload ${uploadCount} file lên R2.`);
    } catch (e) {
      log(`⚠️ Bỏ qua Media: Không thể đọc media.json (${String(e)})`);
    }

    log("🎉 HOÀN TẤT QUÁ TRÌNH MIGRATION.");

    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Kết quả Migration</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; line-height: 1.6; }
          .container { max-width: 800px; margin: 0 auto; background: #1e293b; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
          h1 { color: #38bdf8; border-bottom: 2px solid #334155; padding-bottom: 1rem; }
          pre { background: #0f172a; padding: 1rem; border-radius: 8px; overflow-x: auto; font-family: ui-monospace, monospace; }
          .log-line { margin: 0.25rem 0; }
          .success { color: #4ade80; }
          .warning { color: #fbbf24; }
          .info { color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 Migration Hoàn Tất</h1>
          <p>Dữ liệu đã được đẩy thành công lên Firebase Firestore và Cloudflare R2.</p>
          <pre><code>${logs.map(l => {
            if (l.includes("✅")) return `<div class="log-line success">${l}</div>`;
            if (l.includes("⚠️")) return `<div class="log-line warning">${l}</div>`;
            return `<div class="log-line info">${l}</div>`;
          }).join("")}</code></pre>
          <br/>
          <a href="/admin" style="color: #38bdf8; text-decoration: none; font-weight: bold;">&larr; Quay lại Admin Panel</a>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });

  } catch (error) {
    console.error("Migration error:", error);
    return new NextResponse(`<h1>❌ Lỗi Migration</h1><pre>${String(error)}</pre>`, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
