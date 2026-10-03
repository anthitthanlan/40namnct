import type { Metadata } from "next";
import fs from "fs";
import path from "path";
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

  for (const m of await listApprovedMediaChronological()) {
    memories.push({
      id: m.id,
      title: m.caption || "Kỷ niệm dưới mái trường Trứ",
      caption: m.caption,
      icon: "",
      author: m.author,
      role: m.authorRole,
      year: m.year,
      month: m.month,
      kind: m.kind,
      images: [mediaFileUrl(m.file)],
      isCommunity: true,
    });
  }

  memories.sort(
    (a, b) =>
      a.year - b.year ||
      a.month - b.month ||
      a.title.localeCompare(b.title),
  );
  return memories;
}

export default async function KhoangKhacPage() {
  const memories = await readMemories();
  const posts = await listPublished();

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <TimelineWall memories={memories} posts={posts} />
    </main>
  );
}
