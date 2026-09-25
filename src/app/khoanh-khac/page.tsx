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

type OfficialInfo = {
  title: string;
  desc: string;
  icon: string;
  year: number;
  month: number;
};

const OFFICIALS: Record<string, OfficialInfo> = {
  khaigiang: {
    title: "Khai Giảng",
    desc: "Buổi lễ khai giảng năm học 2026 - cờ bay, áo trắng và những ánh mắt đầy hy vọng cho một năm học mới tràn đầy năng lượng.",
    icon: "🎒",
    year: 2025,
    month: 9,
  },
  giotohungvuong: {
    title: "Giỗ Tổ Hùng Vương",
    desc: "Lễ hội Giỗ Tổ Hùng Vương 10/3 - tri ân cội nguồn, giáo dục truyền thống yêu nước cho các thế hệ học trò.",
    icon: "🇻🇳",
    year: 2026,
    month: 3,
  },
  trianvatruongthanh: {
    title: "Tri Ân & Trưởng Thành",
    desc: "Chương trình tri ân thầy cô, người lớn và học sinh - khoác lên hành trang trưởng thành cùng ngôi trường thân yêu.",
    icon: "🎓",
    year: 2026,
    month: 5,
  },
  tongket: {
    title: "Tổng Kết Năm Học",
    desc: "Lễ tổng kết - vinh danh học sinh giỏi, các tập thể xuất sắc và khép lại một năm học 2026 rực rỡ thành công.",
    icon: "🏆",
    year: 2026,
    month: 6,
  },
};

const ORDER = ["khaigiang", "giotohungvuong", "trianvatruongthanh", "tongket"];

async function readMemories(): Promise<WallMemory[]> {
  const memories: WallMemory[] = [];
  const base = path.join(process.cwd(), "public", "roadmap");

  ORDER.forEach((id) => {
    const info = OFFICIALS[id];
    let images: string[] = [];
    try {
      images = fs
        .readdirSync(path.join(base, id))
        .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
        .sort()
        .map((f) => `/roadmap/${id}/${encodeURIComponent(f)}`);
    } catch {
      images = [];
    }
    if (images.length === 0) return;
    memories.push({
      id: `official-${id}`,
      title: info.title,
      caption: info.desc,
      icon: info.icon,
      author: "Ban Biên tập",
      role: "Trường THPT Nguyễn Công Trứ",
      year: info.year,
      month: info.month,
      kind: "album",
      images,
      isCommunity: false,
    });
  });

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
