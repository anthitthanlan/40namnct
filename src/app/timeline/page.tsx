import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import TimelineMap from "@/components/TimelineMap";
import MusicPlayer from "@/components/MusicPlayer";

export const metadata: Metadata = {
  title: "Timeline 2026 · THPT Nguyễn Công Trứ",
  description:
    "Lộ trình 4 chặng của năm học 2026 - Khai giảng, Giỗ Tổ Hùng Vương, Tri ân & trưởng thành, Tổng kết.",
};

type Milestone = {
  id: string;
  index: number;
  title: string;
  desc: string;
  icon: string;
  color: string;
  images: string[];
};

/** Thông tin 4 chặng 2026 - icon + màu node như mockup squircle */
const MILESTONE_INFO: Record<
  string,
  { title: string; desc: string; icon: string; color: string }
> = {
  khaigiang: {
    title: "Khai Giảng",
    desc: "Buổi lễ khai giảng năm học 2026 - cờ bay, áo trắng và những ánh mắt đầy hy vọng cho một năm học mới tràn đầy năng lượng.",
    icon: "🎒",
    color: "bg-[#16a34a]",
  },
  giotohungvuong: {
    title: "Giỗ Tổ Hùng Vương",
    desc: "Lễ hội Giỗ Tổ Hùng Vương 10/3 - tri ân cội nguồn, giáo dục truyền thống yêu nước cho các thế hệ học trò.",
    icon: "🇻🇳",
    color: "bg-[#1d4ed8]",
  },
  trianvatruongthanh: {
    title: "Tri Ân & Trưởng Thành",
    desc: "Chương trình tri ân thầy cô, người lớn và học sinh - khoác lên hành trang trưởng thành cùng ngôi trường thân yêu.",
    icon: "🎓",
    color: "bg-[#0ea5e9]",
  },
  tongket: {
    title: "Tổng Kết Năm Học",
    desc: "Lễ tổng kết - vinh danh học sinh giỏi, các tập thể xuất sắc và khép lại một năm học 2026 rực rỡ thành công.",
    icon: "🏆",
    color: "bg-[#f59e0b]",
  },
};

const ORDER = ["khaigiang", "giotohungvuong", "trianvatruongthanh", "tongket"];

function readMilestones(): Milestone[] {
  const base = path.join(process.cwd(), "public", "roadmap");
  const milestones: Milestone[] = [];
  ORDER.forEach((id, i) => {
    const info = MILESTONE_INFO[id];
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
    milestones.push({ id, index: i + 1, ...info, images });
  });
  return milestones;
}

export default function TimelinePage() {
  const milestones = readMilestones();

  return (
    <main className="relative min-h-screen">
      <MusicPlayer />
      <TimelineMap milestones={milestones} />
    </main>
  );
}
