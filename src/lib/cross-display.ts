import path from "node:path";
import fs from "node:fs";
import type { Post } from "./posts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nctitc.io.vn";

function getHeaders(token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function getLocalFilePath(): string {
  return path.join(process.cwd(), "data", "cross-display-posts.json");
}

function readLocalMap(): Record<string, boolean> {
  try {
    const filePath = getLocalFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("readLocalMap error:", err);
  }
  return {};
}

function writeLocalMap(map: Record<string, boolean>): void {
  try {
    const filePath = getLocalFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(map, null, 2), "utf-8");
  } catch (err) {
    console.error("writeLocalMap error:", err);
  }
}

/**
 * Lấy danh sách map ID bài viết -> boolean (Bật / Tắt hiển thị chéo)
 */
export async function getCrossDisplayMap(token?: string): Promise<Record<string, boolean>> {
  try {
    const res = await fetch(`${API_URL}/api/config`, {
      headers: getHeaders(token),
      next: { revalidate: 15 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object" && data.crossDisplayPosts) {
        const remoteMap = data.crossDisplayPosts as Record<string, boolean>;
        // Đồng bộ vào tệp tin local
        writeLocalMap(remoteMap);
        return remoteMap;
      }
    }
  } catch (err) {
    console.warn("getCrossDisplayMap fetch failed, falling back to local file:", err);
  }

  return readLocalMap();
}

/**
 * Cập nhật trạng thái hiển thị chéo cho 1 bài viết
 */
export async function setPostCrossDisplay(
  postId: string,
  enabled: boolean,
  token?: string
): Promise<boolean> {
  // 1. Cập nhật vào local map trước
  const localMap = readLocalMap();
  localMap[postId] = enabled;
  writeLocalMap(localMap);

  // 2. Đồng bộ lên API nếu có thể
  try {
    const res = await fetch(`${API_URL}/api/config`, {
      headers: getHeaders(token),
      cache: "no-store",
    });
    let currentConfig: Record<string, any> = {};
    if (res.ok) {
      currentConfig = await res.json();
    }

    const updatedConfig = {
      ...currentConfig,
      crossDisplayPosts: {
        ...(currentConfig.crossDisplayPosts || {}),
        [postId]: enabled,
      },
    };

    const updateRes = await fetch(`${API_URL}/api/config`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(updatedConfig),
    });

    if (updateRes.ok) {
      return true;
    }
  } catch (err) {
    console.error("setPostCrossDisplay sync to remote failed:", err);
  }

  return true;
}

/**
 * Gắn thuộc tính crossDisplay vào từng Post
 */
export async function attachCrossDisplayToPosts(
  posts: Post[],
  token?: string
): Promise<Post[]> {
  const map = await getCrossDisplayMap(token);
  return posts.map((p) => ({
    ...p,
    crossDisplay: map[p.id] === true,
  }));
}
