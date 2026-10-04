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

export async function listCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/api/categories`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getCategory(id: string): Promise<Category | null> {
  const res = await fetch(`${API_URL}/api/categories/${id}`);
  if (!res.ok) return null;
  return await res.json();
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const res = await fetch(`${API_URL}/api/categories/${slug}`);
  if (!res.ok) return null;
  return await res.json();
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
