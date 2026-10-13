"use client";

import { useEffect, useState, useCallback } from "react";
import type { ActionLog } from "@/lib/action-logs";

export default function AdminLogs({
  onAuthError,
}: {
  onAuthError?: () => void;
}) {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadLogs = useCallback(
    async (targetPage: number, append: boolean = false) => {
      if (append) setLoadingMore(true);
      else setBusy(true);

      try {
        const params = new URLSearchParams();
        params.set("page", String(targetPage));
        params.set("limit", String(limit));
        if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
        if (selectedAction !== "all") params.set("action", selectedAction);

        const res = await fetch(`/api/admin/accounts/logs?${params.toString()}`, {
          cache: "no-store",
        });
        if (res.status === 401) {
          onAuthError?.();
          return;
        }
        const data = await res.json();
        if (data.ok) {
          if (append) {
            setLogs((prev) => [...prev, ...(data.logs || [])]);
          } else {
            setLogs(data.logs || []);
          }
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error("Failed to load logs:", err);
      } finally {
        setBusy(false);
        setLoadingMore(false);
      }
    },
    [limit, debouncedSearch, selectedAction, onAuthError]
  );

  useEffect(() => {
    loadLogs(page, false);
  }, [loadLogs, page]);

  const handleActionChange = (actionKey: string) => {
    setSelectedAction(actionKey);
    setPage(1);
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadLogs(nextPage, true);
    }
  };

  const getActionBadge = (action: string, group?: string) => {
    const act = (action || "").toLowerCase();
    const grp = (group || "").toLowerCase();

    if (act.includes("email") || grp === "email") {
      return {
        label: "Gửi Email",
        cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: "mail",
      };
    }
    if (act.includes("registration") || grp === "registrations" || act.includes("invitation")) {
      return {
        label: "Đăng ký / Thư mời",
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "assignment",
      };
    }
    if (act.includes("post") || grp === "posts") {
      return {
        label: "Bài viết",
        cls: "bg-blue-50 text-blue-700 border-blue-200",
        icon: "article",
      };
    }
    if (act.includes("media") || grp === "media") {
      return {
        label: "Hình ảnh / Media",
        cls: "bg-purple-50 text-purple-700 border-purple-200",
        icon: "photo_library",
      };
    }
    if (act.includes("login") || act.includes("auth")) {
      return {
        label: "Tài khoản & Bảo mật",
        cls: "bg-amber-50 text-amber-700 border-amber-200",
        icon: "security",
      };
    }

    return {
      label: action,
      cls: "bg-slate-50 text-slate-700 border-slate-200",
      icon: "info",
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-rounded text-blue-600 text-3xl">
              receipt_long
            </span>
            Nhật ký hệ thống
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Ghi nhận toàn bộ thao tác can thiệp, gửi mail, đổi size, duyệt vé của Ban Quản trị.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100 flex items-center gap-1.5 shadow-2xs">
            <span className="material-symbols-rounded text-base">database</span>
            {total} nhật ký
          </span>
          <button
            type="button"
            onClick={() => loadLogs(page, false)}
            disabled={busy || loadingMore}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            title="Làm mới"
          >
            <span
              className={`material-symbols-rounded text-xl ${
                busy ? "animate-spin" : ""
              }`}
            >
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="material-symbols-rounded absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo nội dung thao tác, tên admin, mã vé hoặc đối tượng..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-900 bg-slate-50/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <span className="material-symbols-rounded text-sm">close</span>
            </button>
          )}
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "Tất cả" },
            { id: "update_invitation", label: "Cập nhật vé" },
            { id: "send_email", label: "Gửi email" },
            { id: "update_status", label: "Đổi trạng thái" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleActionChange(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedAction === item.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Limit Selector */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3 shrink-0">
          <span className="text-xs font-semibold text-slate-400">Hiện:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Logs Content List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {busy && logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
            <span className="material-symbols-rounded animate-spin text-3xl text-blue-600">
              progress_activity
            </span>
            <span>Đang tải nhật ký thao tác...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
            <span className="material-symbols-rounded text-4xl text-slate-300">
              find_in_page
            </span>
            <p className="font-semibold text-slate-600">Không tìm thấy nhật ký nào</p>
            <p className="text-xs text-slate-400">
              {debouncedSearch
                ? `Không có kết quả khớp với "${debouncedSearch}". Thử từ khóa khác.`
                : "Chưa có thao tác nào được ghi nhận trong danh mục này."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const badge = getActionBadge(log.action, log.group as string);
              return (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-left"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.cls}`}
                      >
                        <span className="material-symbols-rounded text-sm">
                          {badge.icon}
                        </span>
                        {badge.label}
                      </span>

                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <span className="material-symbols-rounded text-sm text-slate-400">
                          person
                        </span>
                        {log.adminName || "Quản trị viên"}
                        {log.adminUsername && (
                          <span className="text-slate-400 font-mono text-[11px]">
                            (@{log.adminUsername})
                          </span>
                        )}
                      </span>

                      {log.adminRole && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                          {log.adminRole}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium break-words">
                      {log.details}
                    </p>

                    {log.entityId && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                        <span className="material-symbols-rounded text-xs text-slate-400">
                          tag
                        </span>
                        <span>Đối tượng:</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 select-all">
                          {log.entityId}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="text-xs font-semibold text-slate-400 whitespace-nowrap flex sm:justify-end items-center gap-1">
                      <span className="material-symbols-rounded text-sm">
                        schedule
                      </span>
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer / Pagination Controls */}
        {logs.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 font-medium">
              Hiển thị{" "}
              <strong className="text-slate-800 font-bold">{logs.length}</strong> /{" "}
              <strong className="text-slate-800 font-bold">{total}</strong> nhật ký
              {totalPages > 1 && ` (Trang ${page}/${totalPages})`}
            </div>

            <div className="flex items-center gap-2">
              {/* Load More Button if pagination has next */}
              {page < totalPages && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <span className="material-symbols-rounded text-sm">
                    {loadingMore ? "progress_activity" : "expand_more"}
                  </span>
                  {loadingMore ? "Đang tải thêm..." : "Tải thêm"}
                </button>
              )}

              {/* Standard Page Switcher */}
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || busy}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
                title="Trang trước"
              >
                <span className="material-symbols-rounded text-base">
                  chevron_left
                </span>
              </button>

              <span className="text-xs font-bold text-slate-700 px-2">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || busy}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
                title="Trang sau"
              >
                <span className="material-symbols-rounded text-base">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

