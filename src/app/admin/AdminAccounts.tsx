"use client";

import { useCallback, useEffect, useState } from "react";
import type { SafeAdminAccount } from "@/lib/admin";
import type { ActionLog } from "@/lib/action-logs";

type Banner = { ok: boolean; text: string } | null;

export default function AdminAccounts({
  adminInfo,
  onAuthError,
}: {
  adminInfo: { fullName: string; role: string; username?: string };
  onAuthError?: () => void;
}) {
  const isSuperAdmin = adminInfo.role === "super_admin";
  const [accounts, setAccounts] = useState<SafeAdminAccount[] | null>(null);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [banner, setBanner] = useState<Banner>(null);
  const [busy, setBusy] = useState(false);

  // For Super Admin viewing other users' logs
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Form states (Create Account)
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("Thầy");
  const [role, setRole] = useState<"system_manager" | "editor">("editor");
  const [password, setPassword] = useState("");

  // Form states (Change/Reset Password)
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const flash = useCallback((ok: boolean, text: string) => {
    setBanner({ ok, text });
    setTimeout(() => setBanner(null), 4000);
  }, []);

  const loadAccounts = useCallback(async () => {
    if (!isSuperAdmin) return;
    const res = await fetch("/api/admin/accounts", { cache: "no-store" });
    if (res.status === 401) return onAuthError?.();
    const data = await res.json();
    if (data.ok) setAccounts(data.accounts);
  }, [isSuperAdmin, onAuthError]);

  const loadLogs = useCallback(async (targetUsername?: string) => {
    const url = targetUsername
      ? `/api/admin/accounts/logs?username=${targetUsername}`
      : `/api/admin/accounts/logs`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.status === 401) return onAuthError?.();
    const data = await res.json();
    if (data.ok) setLogs(data.logs);
  }, [onAuthError]);

  useEffect(() => {
    loadAccounts();
    loadLogs(selectedUser || undefined);
  }, [loadAccounts, loadLogs, selectedUser]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !fullName || !password) return flash(false, "Vui lòng điền đủ thông tin.");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, fullName, title, role, password }),
      });
      if (res.status === 401) return onAuthError?.();
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
      const res = await fetch(`/api/admin/accounts?id=${id}`, { method: "DELETE" });
      if (res.status === 401) return onAuthError?.();
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return flash(false, "Mật khẩu mới phải từ 6 ký tự.");
    setBusy(true);

    try {
      if (isSuperAdmin && selectedUser) {
        // Reset password for selected user
        const res = await fetch("/api/admin/accounts/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: selectedUser, newPassword }),
        });
        if (res.status === 401) return onAuthError?.();
        const data = await res.json();
        flash(data.ok, data.message);
        if (data.ok) setShowPasswordForm(false);
      } else {
        // Change own password
        const res = await fetch("/api/admin/accounts/password", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        if (res.status === 401) return onAuthError?.();
        const data = await res.json();
        flash(data.ok, data.message);
        if (data.ok) setShowPasswordForm(false);
      }
    } catch {
      flash(false, "Lỗi kết nối.");
    } finally {
      setBusy(false);
      setNewPassword("");
      setCurrentPassword("");
    }
  };

  const getRoleLabel = (r: string) => {
    if (r === "system_manager") return "Quản lý hệ thống";
    if (r === "editor") return "Biên tập viên";
    return r;
  };

  return (
    <div className="space-y-8">
      {banner && (
        <div className={`rounded-3xl px-6 py-4 text-sm font-bold shadow-sm ${banner.ok ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
          {banner.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {isSuperAdmin && !selectedUser ? "Quản lý tài khoản" : "Tài khoản của tôi"}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {selectedUser 
              ? `Đang xem lịch sử của ${selectedUser}` 
              : isSuperAdmin 
                ? "Dành riêng cho Super Admin." 
                : "Quản lý thông tin và bảo mật cá nhân."}
          </p>
        </div>
        <div className="flex items-center gap-6 mt-4 md:mt-0 md:ml-auto">
          {isSuperAdmin && selectedUser && (
            <button
              onClick={() => setSelectedUser(null)}
              className="group/link flex items-center gap-1.5 relative pb-2 text-[13px] font-extrabold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
            >
              <span className="material-symbols-rounded text-[16px] mb-0.5">arrow_back</span>
              <span className="hidden sm:inline">Quay lại danh sách</span>
              <span className="sm:hidden">Trở về</span>
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-800 origin-center scale-x-0 transition-transform duration-200 group-hover/link:scale-x-100" />
            </button>
          )}
          {(!isSuperAdmin || selectedUser) && (
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className={`group/link relative pb-2 text-[13px] font-extrabold transition-colors uppercase tracking-wider ${isSuperAdmin && selectedUser ? "text-red-500 hover:text-red-600" : "text-slate-600 hover:text-slate-900"}`}
            >
              {isSuperAdmin && selectedUser ? "Reset mật khẩu" : "Đổi mật khẩu"}
              <span className={`absolute bottom-0 left-0 right-0 h-[2px] ${isSuperAdmin && selectedUser ? "bg-red-500" : "bg-slate-900"} origin-center transition-transform duration-200 ${showPasswordForm ? "scale-x-100" : "scale-x-0 group-hover/link:scale-x-100"}`} />
            </button>
          )}
          {isSuperAdmin && !selectedUser && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="group/link relative pb-2 text-[13px] font-extrabold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider"
            >
              {showForm ? "Đóng Form" : "Thêm tài khoản"}
              <span className={`absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 origin-center transition-transform duration-200 ${showForm ? "scale-x-100" : "scale-x-0 group-hover/link:scale-x-100"}`} />
            </button>
          )}
        </div>
      </div>

      {/* Password Form */}
      {showPasswordForm && (
        <div className="rounded-[2rem] border border-slate-200/60 bg-white/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm">
          <h3 className="mb-6 text-lg font-extrabold text-slate-900">
            {isSuperAdmin && selectedUser ? `Reset mật khẩu cho ${selectedUser}` : "Đổi mật khẩu"}
          </h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-sm">
            {!isSuperAdmin && (
              <div>
                <label className="mb-1.5 block text-[13px] font-extrabold uppercase text-slate-500">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-500"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-[13px] font-extrabold uppercase text-slate-500">Mật khẩu mới</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <button type="submit" disabled={busy} className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-extrabold text-white">
              {busy ? "Đang xử lý..." : "Lưu mật khẩu"}
            </button>
          </form>
        </div>
      )}

      {/* Super Admin View: Account List */}
      {isSuperAdmin && !selectedUser && (
        <div className="space-y-6">
          {showForm && (
             <div className="rounded-[2rem] border border-slate-200/60 bg-white/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm">
             <h3 className="mb-6 text-lg font-extrabold text-slate-900">Tạo tài khoản mới</h3>
             <form onSubmit={handleCreate} className="space-y-5">
               <div className="grid gap-5 sm:grid-cols-2">
                 <div>
                   <label className="mb-1.5 block text-[13px] font-extrabold uppercase text-slate-500">Tên đăng nhập</label>
                   <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
                 </div>
                 <div>
                   <label className="mb-1.5 block text-[13px] font-extrabold uppercase text-slate-500">Mật khẩu</label>
                   <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
                 </div>
                 <div className="sm:col-span-2 grid gap-5 sm:grid-cols-3">
                   <div className="sm:col-span-1">
                     <label className="mb-1.5 block text-[13px] font-extrabold uppercase text-slate-500">Danh xưng</label>
                     <select value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm appearance-none">
                       <option value="Thầy">Thầy</option><option value="Cô">Cô</option><option value="Anh">Anh</option><option value="Chị">Chị</option><option value="Bạn">Bạn</option>
                     </select>
                   </div>
                   <div className="sm:col-span-2">
                     <label className="mb-1.5 block text-[13px] font-extrabold uppercase text-slate-500">Họ và tên</label>
                     <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
                   </div>
                 </div>
                 <div className="sm:col-span-2">
                   <label className="mb-1.5 block text-[13px] font-extrabold uppercase text-slate-500">Vai trò</label>
                   <div className="flex gap-4">
                     <label className="flex gap-2 cursor-pointer"><input type="radio" checked={role === "system_manager"} onChange={() => setRole("system_manager")} /> Quản lý hệ thống</label>
                     <label className="flex gap-2 cursor-pointer"><input type="radio" checked={role === "editor"} onChange={() => setRole("editor")} /> Biên tập viên</label>
                   </div>
                 </div>
               </div>
               <button type="submit" disabled={busy} className="bg-[#1d4ed8] text-white px-6 py-2.5 rounded-xl text-sm font-extrabold">Lưu tài khoản</button>
             </form>
           </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts?.map((acc) => (
              <div key={acc.id} className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">{acc.title} {acc.fullName}</h4>
                  <p className="text-[13px] text-slate-500">@{acc.username}</p>
                  <span className="inline-block mt-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{getRoleLabel(acc.role)}</span>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <button onClick={() => setSelectedUser(acc.username)} className="text-sm font-bold text-blue-600 hover:text-blue-800">
                    Xem lịch sử
                  </button>
                  <button onClick={() => handleDelete(acc.id, acc.fullName)} className="text-sm font-bold text-rose-500 hover:text-rose-700">
                    Xoá
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs View (For Regular Admin or Super Admin viewing someone) */}
      {(!isSuperAdmin || selectedUser) && (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
          <h3 className="text-lg font-extrabold mb-6">Lịch sử hoạt động</h3>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-sm text-slate-500 italic text-center py-8">Chưa có lịch sử thao tác nào.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm text-slate-800">{log.action} <span className="text-slate-400 font-medium ml-2">({log.group})</span></div>
                      <div className="text-xs text-slate-500 mt-1">{log.details}</div>
                      <div className="text-xs text-slate-400 mt-1">Đối tượng: {log.entityId}</div>
                    </div>
                    <div className="text-xs text-slate-400 font-medium whitespace-nowrap ml-4">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
