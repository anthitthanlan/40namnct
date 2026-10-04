"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/lib/categories";
import toast from "react-hot-toast";

export default function AdminCategories({ onAuthError }: { onAuthError: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ id: "", name: "", description: "", order: 0 });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.status === 401) {
        onAuthError();
        return;
      }
      const data = await res.json();
      if (data.ok) setCategories(data.categories);
      else toast.error(data.message || "Lỗi lấy danh mục");
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const method = isEditing ? "PATCH" : "POST";
    const url = isEditing ? `/api/admin/categories/${form.id}` : "/api/admin/categories";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 401) {
        onAuthError();
        return;
      }
      const data = await res.json();
      if (data.ok) {
        toast.success(isEditing ? "Đã cập nhật danh mục" : "Đã tạo danh mục mới");
        setForm({ id: "", name: "", description: "", order: 0 });
        setIsEditing(false);
        fetchCategories();
      } else {
        toast.error(data.message || "Lỗi khi lưu");
      }
    } catch {
      toast.error("Lỗi kết nối khi lưu");
    }
  }

  function handleEdit(c: Category) {
    setForm({ id: c.id, name: c.name, description: c.description, order: c.order });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa danh mục này?")) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Đã xóa danh mục");
        fetchCategories();
      } else {
        toast.error("Lỗi khi xóa danh mục");
      }
    } catch {
      toast.error("Lỗi kết nối khi xóa");
    }
  }

  if (loading) return <div className="text-slate-500">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-slate-900">Quản lý Danh mục</h2>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          {isEditing ? "Sửa danh mục" : "Thêm danh mục mới"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Tên danh mục</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#0098d1] focus:ring-1 focus:ring-[#0098d1]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Thứ tự</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#0098d1] focus:ring-1 focus:ring-[#0098d1]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Mô tả (tùy chọn)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#0098d1] focus:ring-1 focus:ring-[#0098d1]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-xl bg-[#0098d1] px-6 py-2.5 font-bold text-white transition-all hover:bg-[#007ba8]"
            >
              {isEditing ? "Cập nhật" : "Thêm danh mục"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setForm({ id: "", name: "", description: "", order: 0 });
                  setIsEditing(false);
                }}
                className="rounded-xl bg-slate-200 px-6 py-2.5 font-bold text-slate-700 transition-all hover:bg-slate-300"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-900">Tên</th>
              <th className="px-6 py-4 font-bold text-slate-900">Slug</th>
              <th className="px-6 py-4 font-bold text-slate-900">Thứ tự</th>
              <th className="px-6 py-4 font-bold text-slate-900 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                <td className="px-6 py-4 text-slate-500">{c.slug}</td>
                <td className="px-6 py-4 text-slate-500">{c.order}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleEdit(c)}
                    className="text-[#0098d1] hover:underline mr-4 font-medium"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-red-500 hover:underline font-medium"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  Chưa có danh mục nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
