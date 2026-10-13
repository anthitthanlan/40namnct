import type { Metadata } from "next";
import TimelineWall, { type WallMemory } from "@/components/TimelineWall";
import { listApprovedMediaChronological, mediaFileUrl } from "@/lib/media";
import { listPublished } from "@/lib/posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Khoảnh Khắc · Kỷ niệm 40 năm THPT Nguyễn Công Trứ",
  description:
    "Góc lưu giữ những khoảnh khắc, kỷ niệm của các thế hệ Thầy trò Nguyễn Công Trứ theo dòng thời gian 40 năm.",
};

async function readMemories(): Promise<WallMemory[]> {
  const memories: WallMemory[] = [];
  const list = await listApprovedMediaChronological();

  for (const m of list) {
    if (m.mediaType === "post") continue;
    if (!m.caption && !m.author && m.mediaType !== "feed") continue; // Bỏ qua ảnh upload cho bài viết cũ
    memories.push({
      id: m.id,
      title: m.caption || "Kỷ niệm dưới mái trường Trứ",
      caption: m.caption || "",
      icon: "",
      author: m.author || "",
      role: m.authorRole || "",
      year: m.year || 2026,
      month: m.month || 1,
      kind: m.kind || "image",
      images: [mediaFileUrl(m.file)],
      isCommunity: true,
    });
  }

  memories.sort(
    (a, b) =>
      (a.year || 0) - (b.year || 0) ||
      (a.month || 0) - (b.month || 0) ||
      (a.title || "").localeCompare(b.title || ""),
  );
  return memories;
}

export default async function KhoangKhacPage() {
  const memories = await readMemories();
  const allPosts = await listPublished();
  // Chỉ hiển thị chéo những bài viết có ảnh bìa và được Admin bật cờ crossDisplay
  const posts = allPosts.filter((p) => p.cover && p.crossDisplay === true);

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <TimelineWall memories={memories} posts={posts} />
    </main>
  );
}
