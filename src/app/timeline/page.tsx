import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import MusicPlayer from "@/components/MusicPlayer";
import TimelineWall, { type WallMemory } from "@/components/TimelineWall";
import { listApprovedMediaChronological, mediaFileUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Timeline 40 Năm · Tường ký ức THPT Nguyễn Công Trứ",
  description:
    "Tường ký ức tự động cuộn luôn - kỷ niệm trường và đóng góp cộng đồng, sắp theo năm & tháng trên Timeline 40 năm.",
};

type OfficialInfo = {
  title: string;
  desc: string;
  icon: string;
  year: number;
  month: number;
};

/** 4 chặng năm học 2026 - năm/tháng dùng để sắp trên Timeline cùng media cộng đồn */
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
    desc: "Lễ hội Giỗ Tổ Hùng Vương 10/3 - tri ân cội nguồn, giáo dục truyền thống yêu nước cho các thế hé học trò.",
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
      icon: m.author.slice(0, 1),
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

export default async function TimelinePage() {
  const memories = await readMemories();

  return (
    <main className="relative min-h-screen">
      <MusicPlayer />
      <TimelineWall memories={memories} />
    </main>
  );
}
