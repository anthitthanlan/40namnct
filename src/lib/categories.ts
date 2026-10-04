import { randomUUID } from "node:crypto";
import { db } from "./firebase";
import { slugify } from "./posts";

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

export async function listCategories(): Promise<Category[]> {
  const snapshot = await db.collection("categories").orderBy("order", "asc").get();
  return snapshot.docs.map((d) => d.data() as Category);
}

export async function getCategory(id: string): Promise<Category | null> {
  const doc = await db.collection("categories").doc(id).get();
  return doc.exists ? (doc.data() as Category) : null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const snapshot = await db.collection("categories").where("slug", "==", slug).limit(1).get();
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as Category;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const id = randomUUID();
  let slug = slugify(input.name);
  if (!slug) slug = "danh-muc";

  // deduplicate slug
  const existing = await getCategoryBySlug(slug);
  if (existing) slug = `${slug}-${id.split("-")[0]}`;

  const now = new Date().toISOString();
  const category: Category = {
    id,
    slug,
    name: input.name.trim(),
    description: input.description.trim(),
    order: input.order ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("categories").doc(id).set(category);
  return category;
}

export async function updateCategory(id: string, patch: Partial<CategoryInput>): Promise<void> {
  const category = await getCategory(id);
  if (!category) throw new Error("Category not found");

  const out: Partial<Category> = {
    updatedAt: new Date().toISOString(),
  };

  if (patch.name !== undefined) {
    out.name = patch.name.trim();
    out.slug = slugify(out.name) || "danh-muc";
  }
  if (patch.description !== undefined) {
    out.description = patch.description.trim();
  }
  if (patch.order !== undefined) {
    out.order = patch.order;
  }

  // Deduplicate slug if name changed
  if (out.slug && out.slug !== category.slug) {
    const existing = await getCategoryBySlug(out.slug);
    if (existing && existing.id !== id) {
      out.slug = `${out.slug}-${id.split("-")[0]}`;
    }
  }

  await db.collection("categories").doc(id).update(out);
}

export async function deleteCategory(id: string): Promise<void> {
  await db.collection("categories").doc(id).delete();
}
