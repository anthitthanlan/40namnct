import type { Metadata } from "next";
import TimelineWall, { type WallMemory } from "@/components/TimelineWall";
import { listApprovedMediaChronological, mediaFileUrl } from "@/lib/media";
import { listPublished } from "@/lib/posts";
import { BreadcrumbJsonLd } from "@/components/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = "https://40namnctru.nctitc.io.vn";

export const metadata: Metadata = {
  title: "Khoảnh Khắc 40 Năm THPT Nguyễn Công Trứ (1986 - 2026)",
  description:
    "Góc lưu giữ những khoảnh khắc, bức ảnh kỷ niệm thanh xuân của các thế hệ Thầy và Trò trường THPT Nguyễn Công Trứ theo dòng thời gian 40 năm.",
  alternates: {
    canonical: `${SITE_URL}/khoanh-khac`,
  },
  openGraph: {
    title: "Khoảnh Khắc 40 Năm THPT Nguyễn Công Trứ (1986 - 2026)",
    description:
      "Góc lưu giữ những khoảnh khắc, bức ảnh kỷ niệm thanh xuân của các thế hệ Thầy và Trò trường THPT Nguyễn Công Trứ theo dòng thời gian 40 năm.",
    url: `${SITE_URL}/khoanh-khac`,
    siteName: "40 Năm THPT Nguyễn Công Trứ (1986 - 2026)",
    images: [
      {
        url: "/images/og-share.png",
        width: 1200,
        height: 630,
        alt: "Khoảnh khắc 40 năm THPT Nguyễn Công Trứ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Khoảnh Khắc 40 Năm THPT Nguyễn Công Trứ (1986 - 2026)",
    description:
      "Góc lưu giữ những khoảnh khắc thanh xuân của các thế hệ Thầy và Trò Nguyễn Công Trứ.",
    images: ["/images/og-share.png"],
  },
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
      <h1 className="sr-only">
        Khoảnh Khắc &amp; Kỷ Niệm 40 Năm THPT Nguyễn Công Trứ (1986 - 2026)
      </h1>
      <BreadcrumbJsonLd
        items={[
          { name: "Trang chủ", url: "/" },
          { name: "Khoảnh khắc", url: "/khoanh-khac" },
        ]}
      />
      <TimelineWall memories={memories} posts={posts} />
    </main>
  );
}
