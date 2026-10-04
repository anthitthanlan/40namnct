import { randomUUID } from "node:crypto";
import { db } from "./firebase";

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
  /** admin = do Ban Biên tập viết · user = câu chuyện gửi từ cộng đồng */
  source: PostSource;
  status: PostStatus;
  pinned: boolean;
  cover: string | null;
  categoryId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PostInput = {
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
};

/** Bỏ dấu tiếng Việt, tạo slug sạch cho URL */
export function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return base || "bai-viet";
}

/** Trích xuất ảnh đầu tiên từ nội dung HTML */
export function extractFirstImage(content: string): string {
  const match = content.match(/<img[^>]+src="([^">]+)"/i);
  return match ? match[1] : "";
}



export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

/** Công khai: bài ghim đứng trước, rồi mới theo thời gian mới nhất */
export function sortPublic(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/** Admin: bài chờ duyệt lên đầu để xử lý nhanh */
export function sortAdmin(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const pa = a.status === "pending" ? 0 : 1;
    const pb = b.status === "pending" ? 0 : 1;
    if (pa !== pb) return pa - pb;
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

async function readPosts(): Promise<Post[]> {
  const snapshot = await db.collection("posts").get();
  return snapshot.docs.map((doc) => doc.data() as Post);
}

export async function listPublished(): Promise<Post[]> {
  const snapshot = await db.collection("posts").where("status", "==", "published").get();
  return sortPublic(snapshot.docs.map((doc) => doc.data() as Post));
}

export async function listAll(): Promise<Post[]> {
  return sortAdmin(await readPosts());
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const snapshot = await db.collection("posts")
    .where("slug", "==", slug)
    .where("status", "==", "published")
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as Post;
}

export async function findPostAnyBySlug(slug: string): Promise<Post | null> {
  const snapshot = await db.collection("posts")
    .where("slug", "==", slug)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as Post;
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base;
  let i = 2;
  while (true) {
    const snapshot = await db.collection("posts").where("slug", "==", candidate).get();
    if (snapshot.empty) return candidate;
    if (snapshot.docs.every((d) => d.id === excludeId)) return candidate;
    candidate = `${base}-${i}`;
    i++;
  }
}

export async function createPost(input: PostInput): Promise<Post> {
  const now = new Date().toISOString();
  const id = randomUUID();
  const post: Post = {
    id,
    slug: await uniqueSlug(slugify(input.title)),
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    content: input.content,
    author: input.author.trim(),
    authorRole: input.authorRole.trim() || "Cộng đồng Trứ",
    source: input.source,
    status: input.status,
    pinned: input.pinned,
    cover: input.cover || extractFirstImage(input.content) || null,
    categoryId: input.categoryId || null,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection("posts").doc(id).set(post);
  return post;
}

function cleanPatch(patch: Partial<PostInput>): Partial<Post> {
  const out: Partial<Post> = {};
  if (patch.title !== undefined) out.title = patch.title.trim();
  if (patch.excerpt !== undefined) out.excerpt = patch.excerpt.trim();
  if (patch.content !== undefined) out.content = patch.content;
  if (patch.author !== undefined) out.author = patch.author.trim();
  if (patch.authorRole !== undefined) out.authorRole = patch.authorRole.trim();
  if (patch.source !== undefined) out.source = patch.source;
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.pinned !== undefined) out.pinned = patch.pinned;
  if (patch.cover !== undefined) out.cover = patch.cover;
  if (patch.categoryId !== undefined) out.categoryId = patch.categoryId;
  return out;
}

export async function updatePost(
  id: string,
  patch: Partial<PostInput>,
): Promise<Post | null> {
  const docRef = db.collection("posts").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return null;

  const current = doc.data() as Post;
  const next: Post = {
    ...current,
    ...cleanPatch(patch),
    updatedAt: new Date().toISOString(),
  };

  if (!next.cover) {
    next.cover = extractFirstImage(next.content) || null;
  }

  if (patch.title !== undefined && patch.title.trim() !== current.title) {
    next.slug = await uniqueSlug(slugify(patch.title), id);
  }

  await docRef.set(next);
  return next;
}

export async function deletePost(id: string): Promise<boolean> {
  const docRef = db.collection("posts").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;
  await docRef.delete();
  return true;
}