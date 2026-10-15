import { MetadataRoute } from "next";
import { listPublished } from "@/lib/posts";
import { listCategories } from "@/lib/categories";

const BASE_URL = "https://40namnctru.nctitc.io.vn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Danh sách các trang tĩnh trọng tâm
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/thu-ngo`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/dang-ky`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/khoanh-khac`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/cau-chuyen`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/bai-viet`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cau-chuyen/NCTru-breakdown`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/gui-bai`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tra-cuu`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/thu-moi`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/an-pham`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Nạp danh sách bài viết động
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await listPublished();
    postRoutes = posts.map((post) => ({
      url: `${BASE_URL}/cau-chuyen/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (e) {
    console.error("Failed to load posts for sitemap", e);
  }

  // Nạp danh sách danh mục động
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await listCategories();
    categoryRoutes = categories.map((cat) => ({
      url: `${BASE_URL}/cau-chuyen/danh-muc/${cat.slug}`,
      lastModified: cat.updatedAt ? new Date(cat.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (e) {
    console.error("Failed to load categories for sitemap", e);
  }

  return [...staticRoutes, ...postRoutes, ...categoryRoutes];
}
