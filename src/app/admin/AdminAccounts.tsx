"use client";

import { useCallback, useEffect, useState } from "react";
import type { SafeAdminAccount } from "@/lib/admin";

type Banner = { ok: boolean; text: string } | null;

export default function AdminAccounts({
  onAuthError,
}: {
  onAuthError?: () => void;
}) {
  const [accounts, setAccounts] = useState<SafeAdminAccount[] | null>(null);
  const [banner, setBanner] = useState<Banner>(null);
  const [busy, setBusy] = useState(false);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("Thầy");
  const [role, setRole] = useState<"system_manager" | "editor">("editor");
  const [password, setPassword] = useState("");

  const flash = useCallback((ok: boolean, text: string) => {
    setBanner({ ok, text });
    setTimeout(() => setBanner(null), 4000);
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/accounts", { cache: "no-store" });
    if (res.status === 401) {
      onAuthError?.();
      return;
    }
    const data = await res.json();
    if (data.ok) {
      setAccounts(data.accounts);
    } else {
      flash(false, data.message || "Không thể tải danh sách tài khoản.");
    }
  }, [onAuthError, flash]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !fullName || !password) {
      flash(false, "Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, fullName, title, role, password }),
      });
      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      const data = await res.json();
      if (data.ok) {
        flash(true, "Tạo tài khoản thành công!");
        setShowForm(false);
        setUsername("");
        setFullName("");
        setPassword("");
        setAccounts((prev) => (prev ? [...prev, data.account] : [data.account]));
      } else {
        flash(false, data.message || "Tạo tài khoản thất bại.");
      }
    } catch {
      flash(false, "Lỗi kết nối.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá tài khoản của ${name}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/accounts?id=${id}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      const data = await res.json();
      if (data.ok) {
        flash(true, "Đã xoá tài khoản.");
        setAccounts((prev) => (prev ? prev.filter((a) => a.id !== id) : []));
      } else {
        flash(false, data.message || "Xoá thất bại.");
      }
    } catch {
      flash(false, "Lỗi kết nối.");
    } finally {
      setBusy(false);
    }
  };

  const getRoleLabel = (r: string) => {
    if (r === "system_manager") return "Quản lý hệ thống";
    if (r === "editor") return "Biên tập viên";
    return r;
  };

  if (!accounts) {
    return (
      <div className="flex h-40 items-center justify-center">
        <span className="text-sm font-medium text-slate-400 animate-pulse">
          Đang tải dữ liệu...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {banner && (
        <div
          className={`rounded-3xl px-6 py-4 text-sm font-bold shadow-sm ${
            banner.ok
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-rose-100 text-rose-800 border border-rose-200"
          }`}
        >
          {banner.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Quản lý tài khoản</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Dành riêng cho Super Admin. Quản lý danh sách biên tập viên và quản lý hệ thống.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="btn-lightship rounded-2xl bg-[#1d4ed8] px-5 py-3 text-sm font-extrabold text-white transition-all hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-900/20 whitespace-nowrap"
        >
          {showForm ? "Đóng Form" : "Thêm tài khoản"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-[2rem] border border-slate-200/60 bg-white/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm">
          <h3 className="mb-6 text-lg font-extrabold text-slate-900">Tạo tài khoản mới</h3>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[13px] font-extrabold tracking-wide text-slate-500 uppercase">
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                  placeholder="Ví dụ: nct_admin"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-extrabold tracking-wide text-slate-500 uppercase">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                  placeholder="Mật khẩu mạnh..."
                />
              </div>
              <div className="sm:col-span-2 grid gap-5 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="mb-1.5 block text-[13px] font-extrabold tracking-wide text-slate-500 uppercase">
                    Danh xưng
                  </label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8] appearance-none"
                  >
                    <option value="Thầy">Thầy</option>
                    <option value="Cô">Cô</option>
                    <option value="Anh">Anh</option>
                    <option value="Chị">Chị</option>
                    <option value="Bạn">Bạn</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[13px] font-extrabold tracking-wide text-slate-500 uppercase">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-extrabold tracking-wide text-slate-500 uppercase">
                  Vai trò (Role)
                </label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      value="system_manager"
                      checked={role === "system_manager"}
                      onChange={() => setRole("system_manager")}
                      className="text-[#1d4ed8] focus:ring-[#1d4ed8] w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">Quản lý hệ thống</div>
                      <div className="text-xs text-slate-500 font-medium">Full quyền ngoại trừ tạo tài khoản</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      value="editor"
                      checked={role === "editor"}
                      onChange={() => setRole("editor")}
                      className="text-[#1d4ed8] focus:ring-[#1d4ed8] w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">Biên tập viên</div>
                      <div className="text-xs text-slate-500 font-medium">Chỉ được duyệt và quản lý bài viết/media</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={busy}
                className="btn-lightship rounded-xl bg-[#1d4ed8] px-6 py-2.5 text-sm font-extrabold text-white transition-all disabled:opacity-50"
              >
                {busy ? "Đang xử lý..." : "Lưu tài khoản"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Account List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-100 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                    {acc.title} {acc.fullName}
                  </h4>
                  <p className="text-[13px] font-medium text-slate-500 mt-0.5">@{acc.username}</p>
                </div>
                <span
                  className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-extrabold whitespace-nowrap ml-3 ${
                    acc.role === "system_manager"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {getRoleLabel(acc.role)}
                </span>
              </div>
              <div className="text-[13px] text-slate-500 font-medium mt-4">
                <div>Tạo lúc: {new Date(acc.createdAt).toLocaleDateString("vi-VN")}</div>
                <div>Tương tác: {acc.logs.length} sự kiện</div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-right">
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDelete(acc.id, acc.fullName)}
                className="text-sm font-extrabold text-rose-500 hover:text-rose-700 transition-colors disabled:opacity-50"
              >
                Xoá tài khoản
              </button>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm font-medium text-slate-400 bg-white/50 rounded-[2rem] border border-dashed border-slate-200">
            Chưa có tài khoản nào được tạo.
          </div>
        )}
      </div>
    </div>
  );
}
