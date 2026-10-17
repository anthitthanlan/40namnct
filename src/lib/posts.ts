export type PostStatus = "published" | "pending" | "rejected" | "draft";
export type PostSource = "admin" | "user";

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorRole: string;
  source: PostSource;
  status: PostStatus;
  pinned: boolean;
  cover: string | null;
  categoryId?: string | null;
  crossDisplay?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PostInput = {
  title: string;
  excerpt?: string;
  content?: string;
  author?: string;
  authorRole?: string;
  source?: PostSource;
  status?: PostStatus;
  pinned?: boolean;
  cover?: string | null;
  categoryId?: string | null;
  crossDisplay?: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nctitc.io.vn";

function getHeaders(token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

export function sortPublic(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function sortAdmin(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const pa = a.status === "pending" ? 0 : 1;
    const pb = b.status === "pending" ? 0 : 1;
    if (pa !== pb) return pa - pb;
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function extractFirstImage(content: string): string | null {
  if (!content) return null;
  const match = content.match(/!\[.*?\]\((.*?)\)/);
  if (match) return match[1];
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];
  return null;
}

export function getSmartExcerpt(content: string, maxLength = 160): string {
  if (!content) return "";
  let text = content.replace(/<[^>]*>/g, " ");
  text = text.replace(/!\[.*?\]\(.*?\)/g, "");
  text = text.replace(/\[([^\]]+)\]\(.*?\)/g, "$1");
  text = text.replace(/[#*_`>~-]/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > maxLength * 0.7 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

export async function listPublished(): Promise<Post[]> {
  try {
    const res = await fetch(`${API_URL}/api/posts?status=published`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const posts = await res.json();
    const sorted = sortPublic(posts);
    const { attachCrossDisplayToPosts } = await import("./cross-display");
    return await attachCrossDisplayToPosts(sorted);
  } catch {
    return [];
  }
}

export async function listAll(token?: string): Promise<Post[]> {
  try {
    const res = await fetch(`${API_URL}/api/posts`, {
      headers: getHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const posts = await res.json();
    const sorted = sortAdmin(posts);
    const { attachCrossDisplayToPosts } = await import("./cross-display");
    return await attachCrossDisplayToPosts(sorted, token);
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(`${API_URL}/api/posts/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const post = await res.json();
    if (post.status !== "published") return null;
    return post;
  } catch {
    return null;
  }
}

export async function findPostAnyBySlug(
  slug: string,
  token?: string,
): Promise<Post | null> {
  try {
    const res = await fetch(`${API_URL}/api/posts/${slug}`, {
      headers: getHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createPost(
  input: PostInput,
  token?: string,
): Promise<Post> {
  const res = await fetch(`${API_URL}/api/posts`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create post");
  return await res.json();
}

export async function updatePost(
  id: string,
  patch: Partial<PostInput>,
  token?: string,
): Promise<Post | null> {
  const res = await fetch(`${API_URL}/api/posts/${id}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(patch),
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function deletePost(id: string, token?: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/posts/${id}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  return res.ok;
}