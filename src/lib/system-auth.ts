const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nctitc.io.vn";

let cachedSystemToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Lấy JWT Token quản trị hệ thống (System Token) để thực thi các tác vụ tự động
 * giữa các server mà không phụ thuộc vào cookie phiên đăng nhập của người dùng.
 * Token được lưu cache trong bộ nhớ và tự động làm mới khi hết hạn.
 */
export async function getSystemAdminToken(): Promise<string | null> {
  const now = Date.now();
  // Nếu token còn hạn ít nhất 5 phút thì tái sử dụng
  if (cachedSystemToken && tokenExpiresAt > now + 5 * 60 * 1000) {
    return cachedSystemToken;
  }

  const username = process.env.SUPER_ADMIN_USERNAME || "nctitc@1986-2026";
  const password = process.env.SUPER_ADMIN_PASSWORD || "NCT@1986";

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[getSystemAdminToken] Đăng nhập quản trị hệ thống thất bại:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const token = data.access_token || data.token;
    if (!token) {
      console.error("[getSystemAdminToken] Không tìm thấy access_token trong phản hồi:", data);
      return null;
    }

    cachedSystemToken = token;
    // Mặc định cache 12 giờ
    tokenExpiresAt = now + 12 * 60 * 60 * 1000;
    return token;
  } catch (err) {
    console.error("[getSystemAdminToken] Lỗi mạng khi lấy system admin token:", err);
    return null;
  }
}
