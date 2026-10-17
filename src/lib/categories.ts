export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type CategoryInput = {
  name: string;
  description: string;
  order: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nctitc.io.vn";

function getHeaders(token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export const DEFAULT_THANH_XUAN_CATEGORY: Category = {
  id: "cau-chuyen-thanh-xuan",
  slug: "cau-chuyen-thanh-xuan",
  name: "Câu chuyện thanh xuân",
  description: "Nơi lưu giữ những câu chuyện, ký ức và dòng hồi tưởng thanh xuân của các thế hệ Thầy và Trò Nguyễn Công Trứ.",
  order: 1,
  createdAt: "2026-10-17T00:00:00.000Z",
  updatedAt: "2026-10-17T00:00:00.000Z",
};

export async function listCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/api/categories`, {
      cache: "no-store",
    });
    if (res.ok) {
      const list: Category[] = await res.json();
      const hasThanhXuan = list.some(
        (c) => c.slug === "cau-chuyen-thanh-xuan" || c.name.toLowerCase().includes("thanh xuân")
      );
      if (!hasThanhXuan) {
        list.push(DEFAULT_THANH_XUAN_CATEGORY);
      }
      return list.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  } catch {}
  return [DEFAULT_THANH_XUAN_CATEGORY];
}

export async function getCategory(id: string): Promise<Category | null> {
  try {
    const res = await fetch(`${API_URL}/api/categories/${id}`);
    if (res.ok) return await res.json();
  } catch {}
  if (id === "cau-chuyen-thanh-xuan") {
    return DEFAULT_THANH_XUAN_CATEGORY;
  }
  return null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const res = await fetch(`${API_URL}/api/categories/${slug}`);
    if (res.ok) return await res.json();
  } catch {}
  if (slug === "cau-chuyen-thanh-xuan") {
    return DEFAULT_THANH_XUAN_CATEGORY;
  }
  return null;
}

export async function createCategory(
  input: CategoryInput,
  token?: string,
): Promise<Category> {
  const res = await fetch(`${API_URL}/api/categories`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error("Failed to create category");
  }
  return await res.json();
}

export async function updateCategory(
  id: string,
  patch: Partial<CategoryInput>,
  token?: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/categories/${id}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update category");
}

export async function deleteCategory(id: string, token?: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/categories/${id}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete category");
}
