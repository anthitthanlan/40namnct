import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

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
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "posts.json");

/** Dữ liệu mẫu - được ghi vào data/posts.json ở lần chạy đầu tiên */
const SEED: Post[] = [
  // __SEED_MORE__
  {
    id: "nct-seed-02",
    slug: "le-ky-niem-40-nam-thanh-lap-truong-1986-2026-ngay-tro-ve",
    title: "Lễ kỷ niệm 40 năm thành lập trường (1986-2026): Ngày trở về",
    excerpt:
      "Tin tức chính thức về Lễ kỷ niệm 40 năm: thời gian, địa điểm, chương trình tri ân, triển lãm kỷ vật và gặp mặt các thế hệ Thầy trò Nguyễn Công Trứ.",
    content: `## Thông báo chính thức

Ngày 08/11/2026, Trường THPT Nguyễn Công Trứ trân trọng tổ chức **LỄ KỶ NIỆM 40 NĂM THÀNH LẬP TRƯỜNG (1986 - 2026)** tại hội trường và sân trường - 97 Quang Trung, Phường Thông Tây Hội, TP. Hồ Chí Minh.

> "Đây còn là NGÀY TRỞ VỀ - ngày các thế hệ Thầy Cô, cựu học sinh và học sinh cùng hội ngộ, cùng viết tiếp câu chuyện đầy tự hào về THPT Nguyễn Công Trứ."

### Chương trình dự kiến

- **07:30** - Đón khách, tham quan Triển lãm 40 năm (ảnh, kỷ vật, học bạ, sổ liên lạc của các thế hệ)
- **08:30** - Lễ kỷ niệm: hoàn cảnh ra đời của trường, film tư liệu 40 năm, phát biểu của đại biểu và đại diện các thế hệ
- **10:00** - Vinh danh Thầy Cô giáo về hưu, tri ân các thế hệ cựu học sinh tiêu biểu
- **10:45** - Công bố Quỹ học bổng "Uyên bác - Nhân ái - Giàu chí khí" hỗ trợ học sinh
- **11:30** - Giao lưu, gặp mặt theo từng khóa, chụp ảnh lưu niệm tại các góc kỷ niệm

### Thông tin cần biết

- Trang phục gợi ý: áo dài truyền thống, áo sơ mi trắng - màu của những năm tháng học trò
- Đăng ký tham dự qua fanpage của trường để Ban Tổ chức chuẩn bị chỗ ngồi
- Các khóa muốn tổ chức "gặp mặt khóa" riêng, vui lòng liên hệ Ban Tổ chức trước 01/11/2026

### Liên hệ

- 📧 Hộp thư tiếp nhận tư liệu: thptnguyencongtru@hcm.edu.vn
- 📞 Điện thoại: (028) 38941546
- 📍 Địa chỉ: 97 Quang Trung, Phường Thông Tây Hội, TP. Hồ Chí Minh

Hẹn gặp lại các bạn trong ngày hội trở về!`,
    author: "Ban Tổ chức",
    authorRole: "Ban Tổ chức Lễ kỷ niệm 40 năm",
    source: "admin",
    status: "published",
    pinned: false,
    cover: "/roadmap/khaigiang/DSCF8015.JPG",
    createdAt: "2026-09-01T09:30:00+07:00",
    updatedAt: "2026-09-01T09:30:00+07:00",
  },
  // __SEED_MORE__
  {
    id: "nct-seed-03",
    slug: "chiec-ban-go-lop-10a2-ky-uc-cua-mot-hoc-tro-khoa-1998",
    title: "Chiếc bàn gỗ lớp 10A2 - ký ức của một học trò khóa 1998",
    excerpt:
      "Câu chuyện của anh Minh Trí (khóa 1998) về chiếc bàn gỗ khắc tên lớp, về cô giáo Văn và những buổi trực nhật quét lá me trên sân trường.",
    content: `> "Hôm qua tôi đưa con trai vào trường làm hồ sơ. Chỉ tay vào dãy hành lang cũ, tôi bảo: 'Ba đã từng ngồi học ở đó'."

Nghe nói trường sắp kỷ niệm 40 năm, đêm qua tôi ngồi lật lại chiếc hộp đồ đã để gần chục năm và tìm thấy tấm thẻ học sinh in năm 1996. Rồi mọi thứ ùa về như mới hôm qua.

## Chiếc bàn gỗ với dòng khắc "10A2"

Chiếc bàn gỗ dài ba người của lớp 10A2 có một vết khắc lỗ nhọn - lớp trưởng lúc đó khắc dòng chữ "10A2 vô địch bóng đá" sau trận chung kết thể thao mùa xuân. Thầy tổng phụ trách định bắt mình sơn lại, nhưng rồi thầy chỉ cười: *"Bàn của lớp nào, ký ức của lớp đó."*

Những điều tôi nhớ nhất về những năm tháng ấy:

- Buổi trực nhật quét lá me rơi đúng mùa thi học kỳ
- Tiếng cô giáo Văn đọc "Vợ nhặt" khiến cả lớp nín thở
- Chiếc bánh đa cô mua tặng cả lớp trước ngày xa trường
- Cột cờ nơi tụ hợp mỗi sáng, giờ vẫn đứng đó

## Gửi các thế hệ sau

Các bạn học trò ngày nay ơi, 20 năm nữa nhìn lại, các bạn sẽ thấy những điều bình dị nhất mới là điều không thể mua lại. Hãy trân trọng từng buổi sáng cầm cờ, từng trang vở, từng người bạn ngồi cạnh.

> "Cảm ơn Trường THPT Nguyễn Công Trứ - nơi đã cho tôi không chỉ chữ, mà cả phương cách làm người."

*- Lê Minh Trí, cựu học sinh khóa 1998, hiện sống tại TP. Hồ Chí Minh*`,
    author: "Lê Minh Trí",
    authorRole: "Cựu học sinh, khóa 1998",
    source: "user",
    status: "published",
    pinned: false,
    cover: "/roadmap/trianvatruongthanh/DSCF4145.jpg",
    createdAt: "2026-09-05T20:15:00+07:00",
    updatedAt: "2026-09-05T20:15:00+07:00",
  },
  // __SEED_MORE__
  {
    id: "nct-seed-04",
    slug: "san-truong-mua-phuong-2005-loi-nhan-gui-cac-the-he-sau",
    title: "Sân trường mùa phượng 2005 - lời nhắn gửi các thế hệ sau",
    excerpt:
      "Chị Thanh Hường (khóa 2005) kể về mùa phượng nở, về vở ghi đầy chữ phê của cô giáo Hóa và mong mỏi trở về trong ngày hội 08/11/2026.",
    content: `Mùa phượng năm 2005, chúng tôi tốt nghiệp trong những cơn mưa bất chợt. Tấm ảnh chụp trước cổng trường, cả lớp mình đứng chen nhau, ai cũng cười mà mắt đỏ hoe.

## Vở ghi chữ cô Hóa

Tôi giữ đến nay một vở ghi môn Hóa học - từng trang đều có dòng nhận xét bằng chữ viết tay của cô: "Cẩn thận hơn nhé, Hường!". Ngày xưa tôi hay quên cân bằng phương trình, giờ mỗi lần cân đối sổ sách, tôi vẫn nghe câu ấy vang lên.

### Điều tôi muốn nhắn

- Với các em học sinh: hãy chụp thật nhiều ảnh cùng thầy cô và bạn bè - thứ tưởng như vô dụng ấy sẽ thành báu vật sau này
- Với các thầy cô: lời phê nhỏ trong sổ vở có thể theo đuổi một học sinh cả cuộc đời, như lời cô Hóa theo tôi tận bây giờ
- Với trường: mong Triển lãm 40 năm sẽ có một góc trưng bày những vở ghi của học trò các thời

Mong gặp lại mái trường trong ngày 08/11/2026!

*- Trần Thanh Hường, cựu học sinh khóa 2005*`,
    author: "Trần Thanh Hường",
    authorRole: "Cựu học sinh, khóa 2005",
    source: "user",
    status: "pending",
    pinned: false,
    cover: null,
    createdAt: "2026-09-10T22:40:00+07:00",
    updatedAt: "2026-09-10T22:40:00+07:00",
  },
];

/** Khóa ghi file đơn giản - tránh ghi đè song song */
let queue: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

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

/** Sinh tóm tắt từ nội dung (bỏ cú pháp markdown) */
export function deriveExcerpt(content: string, max = 200): string {
  const clean = content
    .replace(/^#+\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
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

export async function readPosts(): Promise<Post[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Post[];
  } catch {
    // File chưa có - ghi dữ liệu mẫu xuống đĩa (bỏ qua nếu FS chỉ đọc)
    await withLock(async () => {
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(DATA_FILE, JSON.stringify(SEED, null, 2), "utf8");
      } catch {
        /* no-op */
      }
    });
  }
  return SEED;
}

async function writePosts(posts: Post[]): Promise<void> {
  await withLock(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2), "utf8");
  });
}

export async function listPublished(): Promise<Post[]> {
  return sortPublic((await readPosts()).filter((p) => p.status === "published"));
}

export async function listAll(): Promise<Post[]> {
  return sortAdmin(await readPosts());
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const found = (await readPosts()).find(
    (p) => p.slug === slug && p.status === "published",
  );
  return found ?? null;
}

export async function findPostAnyBySlug(slug: string): Promise<Post | null> {
  const found = (await readPosts()).find((p) => p.slug === slug);
  return found ?? null;
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const taken = new Set(
    (await readPosts()).filter((p) => p.id !== excludeId).map((p) => p.slug),
  );
  if (!taken.has(base)) return base;
  for (let i = 2; ; i += 1) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export async function createPost(input: PostInput): Promise<Post> {
  const now = new Date().toISOString();
  const post: Post = {
    id: randomUUID(),
    slug: await uniqueSlug(slugify(input.title)),
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    content: input.content,
    author: input.author.trim(),
    authorRole: input.authorRole.trim() || "Cộng đồng Trứ",
    source: input.source,
    status: input.status,
    pinned: input.pinned,
    cover: input.cover,
    createdAt: now,
    updatedAt: now,
  };
  const posts = await readPosts();
  posts.push(post);
  await writePosts(posts);
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
  return out;
}

export async function updatePost(
  id: string,
  patch: Partial<PostInput>,
): Promise<Post | null> {
  const posts = await readPosts();
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) return null;
  const current = posts[index];
  const next: Post = {
    ...current,
    ...cleanPatch(patch),
    updatedAt: new Date().toISOString(),
  };
  // Đổi tiêu đề → sinh slug mới (không trùng với bài khác)
  if (patch.title !== undefined && patch.title.trim() !== current.title) {
    next.slug = await uniqueSlug(slugify(patch.title), id);
  }
  posts[index] = next;
  await writePosts(posts);
  return next;
}

export async function deletePost(id: string): Promise<boolean> {
  const posts = await readPosts();
  const next = posts.filter((p) => p.id !== id);
  if (next.length === posts.length) return false;
  await writePosts(next);
  return true;
}