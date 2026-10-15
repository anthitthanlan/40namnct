"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import MediaUploader from "@/components/MediaUploader";
import { useConfirm } from "@/components/useConfirm";
import { Modal } from "@/components/modal";
import type { ActionLog } from "@/lib/action-logs";

type MediaRow = {
  id: string;
  file: string;
  kind: "image" | "video";
  size: number;
  year: number;
  month: number;
  author: string;
  authorRole: string;
  caption: string;
  title?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  url: string;
};

function vi(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

function prettySize(bytes: number): string {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
    : `${Math.round(bytes / 1024)}KB`;
}

const STATUS_INFO: Record<MediaRow["status"], { label: React.ReactNode; cls: string }> = {
  pending: {
    label: (
      <>
        <span className="material-symbols-rounded inline-block align-middle text-[1em]">
          hourglass_empty
        </span>{" "}
        Chờ duyệt
      </>
    ),
    cls: "bg-amber-100 text-amber-700 border border-amber-200/60",
  },
  approved: {
    label: (
      <>
        <span className="material-symbols-rounded inline-block align-middle text-[1em]">
          check_circle
        </span>{" "}
        Đã duyệt
      </>
    ),
    cls: "bg-emerald-100 text-emerald-700 border border-emerald-200/60",
  },
  rejected: {
    label: (
      <>
        <span className="material-symbols-rounded inline-block align-middle text-[1em]">
          cancel
        </span>{" "}
        Đã từ chối
      </>
    ),
    cls: "bg-rose-100 text-rose-600 border border-rose-200/60",
  },
};

export default function AdminMedia({
  onAuthError,
}: {
  onAuthError?: () => void;
}) {
  const [items, setItems] = useState<MediaRow[] | null>(null);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [selectedItem, setSelectedItem] = useState<MediaRow | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const { confirm, ConfirmElement } = useConfirm();

  const [editTitle, setEditTitle] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (selectedItem) {
      setEditTitle(selectedItem.title || "");
      setEditCaption(selectedItem.caption || "");
    }
  }, [selectedItem]);

  const hasContentChanges = useMemo(() => {
    if (!selectedItem) return false;
    return (
      editTitle.trim() !== (selectedItem.title || "").trim() ||
      editCaption.trim() !== (selectedItem.caption || "").trim()
    );
  }, [selectedItem, editTitle, editCaption]);

  const flash = useCallback((ok: boolean, text: string) => {
    if (ok) {
      toast.success(text);
    } else {
      toast.error(text);
    }
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/media", { cache: "no-store" });
    if (res.status === 401) {
      onAuthError?.();
      return;
    }
    const data = await res.json();
    if (data.ok) {
      setItems(data.media as MediaRow[]);
      if (data.logs) setLogs(data.logs as ActionLog[]);
    }
  }, [onAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    if (!items) return { all: 0, approved: 0, pending: 0, rejected: 0 };
    return {
      all: items.length,
      approved: items.filter((x) => x.status === "approved").length,
      pending: items.filter((x) => x.status === "pending").length,
      rejected: items.filter((x) => x.status === "rejected").length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (activeTab === "all") return items;
    return items.filter((x) => x.status === activeTab);
  }, [items, activeTab]);

  const mediaMinitabs = [
    { id: "all", label: `Tất cả (${counts.all})` },
    { id: "approved", label: `Đã đăng (${counts.approved})` },
    { id: "pending", label: `Chờ duyệt (${counts.pending})` },
    { id: "rejected", label: `Bị từ chối (${counts.rejected})` },
  ] as const;

  async function act(
    item: MediaRow,
    status: MediaRow["status"],
    okText: string,
  ) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(false, data.message || "Thao tác thất bại.");
        return;
      }
      setItems((prev) =>
        prev ? prev.map((x) => (x.id === item.id ? { ...x, status } : x)) : prev,
      );
      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem((prev) => (prev ? { ...prev, status } : null));
      }
      flash(true, okText);
      // Tải lại để cập nhật action logs kiểm toán
      load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: MediaRow) {
    if (!(await confirm(`Xoá tệp của "${item.author}"? Không thể hoàn tác.`)))
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      if (!res.ok) {
        flash(false, "Không xoá được tệp.");
        return;
      }
      setItems((prev) => (prev ? prev.filter((x) => x.id !== item.id) : prev));
      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem(null);
      }
      flash(true, "Đã xoá tệp media.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveDetails() {
    if (!selectedItem) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/media/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          caption: editCaption.trim(),
        }),
      });
      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(false, data.message || "Không thể cập nhật thông tin.");
        return;
      }
      flash(true, "Đã lưu thông tin khoảnh khắc.");
      setItems((prev) =>
        prev
          ? prev.map((x) =>
              x.id === selectedItem.id
                ? { ...x, title: editTitle.trim(), caption: editCaption.trim() }
                : x
            )
          : null
      );
      setSelectedItem((prev) =>
        prev
          ? { ...prev, title: editTitle.trim(), caption: editCaption.trim() }
          : null
      );
      load();
    } catch {
      flash(false, "Đã có lỗi xảy ra.");
    } finally {
      setSavingEdit(false);
    }
  }

  // Logs kiểm toán của khoảnh khắc đang xem
  const selectedItemLogs = useMemo(() => {
    if (!selectedItem) return [];
    return logs
      .filter((l) => l.entityId === selectedItem.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [logs, selectedItem]);

  // Người duyệt gần nhất
  const latestApprovalLog = useMemo(() => {
    if (!selectedItem) return null;
    const statusLogs = logs
      .filter((l) => l.entityId === selectedItem.id && l.action === "update_media")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return statusLogs[0] || null;
  }, [logs, selectedItem]);

  if (items === null) {
    return (
      <div className="mt-8 rounded-3xl bg-white p-10 text-center text-sm font-semibold text-slate-400">
        Đang tải media…
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {ConfirmElement}

      {/* 1. ON TOP: Mini Tabs (Mobile Morph Dropdown & Desktop Mini-tabs) */}
      {!showUploader && (
        <div className="space-y-4">
          {/* Mobile Morph Dropdown */}
          <div className="md:hidden relative z-50 mb-6">
            <div
              className="t-morph shadow-sm"
              data-open={isMenuOpen}
              style={{ "--morph-height-open": "196px" } as React.CSSProperties}
            >
              <div className="t-morph-menu">
                {mediaMinitabs.map((tabItem) => (
                  <button
                    key={tabItem.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tabItem.id);
                      setIsMenuOpen(false);
                    }}
                    className={`flex-1 flex items-center px-4 py-3 text-left text-sm font-bold rounded-xl transition-colors ${
                      activeTab === tabItem.id
                        ? "bg-slate-100 text-[#1d4ed8]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {tabItem.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="t-morph-plus text-sm font-bold text-slate-800 flex items-center justify-between"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
              >
                <span>{mediaMinitabs.find((t) => t.id === activeTab)?.label}</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-500"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop Mini-tabs */}
          <div className="hidden md:flex flex-wrap gap-2 border-b border-slate-100 pb-4 text-sm font-bold mb-4">
            {mediaMinitabs.map((tabItem) => (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => setActiveTab(tabItem.id)}
                className={`rounded-xl px-4 py-2.5 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] ${
                  activeTab === tabItem.id
                    ? "bg-[#1d4ed8] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tabItem.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Tiêu đề & Nút đăng khoảnh khắc mới */}
      {!showUploader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Feed Khoảnh khắc</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Quản lý hình ảnh và video do cộng đồng cựu học sinh, giáo viên gửi về
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUploader(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-blue-700 transition-colors self-start sm:self-auto"
          >
            <span className="material-symbols-rounded text-lg">add</span>
            <span>Đăng khoảnh khắc mới</span>
          </button>
        </div>
      )}

      {showUploader && (
        <div className="mt-6 mb-10">
          <MediaUploader
            isAdmin={true}
            onSuccess={() => {
              setShowUploader(false);
              load();
            }}
            onCancel={() => setShowUploader(false)}
          />
        </div>
      )}

      {/* Grid danh sách Feed */}
      {!showUploader &&
        (filteredItems.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center text-sm font-medium text-slate-400 border border-slate-100">
            {activeTab === "pending"
              ? "🎉 Không có khoảnh khắc nào đang chờ duyệt."
              : activeTab === "approved"
              ? "Chưa có khoảnh khắc nào được đăng."
              : activeTab === "rejected"
              ? "Không có khoảnh khắc nào bị từ chối."
              : "Chưa có khoảnh khắc nào trong hệ thống."}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((m) => {
              const info = STATUS_INFO[m.status];
              return (
                <div
                  key={m.id}
                  className="overflow-hidden rounded-3xl bg-white shadow-xs border border-slate-100 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative">
                      <span
                        className={`absolute right-3 top-3 z-10 rounded-full px-3 py-1 text-[11px] font-extrabold ${info.cls} backdrop-blur-md`}
                      >
                        {info.label}
                      </span>
                      {m.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.url}
                          alt={m.caption || "Media"}
                          loading="lazy"
                          className="h-44 w-full bg-slate-100 object-cover"
                        />
                      ) : (
                        <video
                          src={m.url}
                          controls
                          preload="metadata"
                          className="h-44 w-full bg-slate-900 object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      {m.title && (
                        <div className="mb-1.5 flex items-center gap-1 text-xs font-extrabold text-[#1d4ed8]">
                          <span className="material-symbols-rounded text-sm">photo_album</span>
                          <span className="line-clamp-1">{m.title}</span>
                        </div>
                      )}
                      <p className="line-clamp-2 text-sm font-bold text-slate-800">
                        {m.caption || "(Không có chú thích)"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-rounded text-rose-500 text-sm">
                          person
                        </span>
                        <span>
                          {m.author} · {m.authorRole}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-rounded text-slate-400 text-sm">
                          calendar_today
                        </span>
                        <span>
                          Tháng {String(m.month).padStart(2, "0")}/{m.year} · {vi(m.createdAt)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <div className="mt-2 flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                      {/* Nút Xem chi tiết */}
                      <button
                        type="button"
                        onClick={() => setSelectedItem(m)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <span className="material-symbols-rounded text-base text-slate-500">
                          info
                        </span>
                        Chi tiết
                      </button>

                      {m.status !== "approved" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => act(m, "approved", "Đã duyệt khoảnh khắc.")}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-2xs"
                        >
                          <span className="material-symbols-rounded text-base">
                            check_circle
                          </span>
                          Duyệt
                        </button>
                      )}

                      {m.status !== "rejected" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => act(m, "rejected", "Đã từ chối khoảnh khắc.")}
                          className="rounded-xl bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <span className="material-symbols-rounded text-base">
                            block
                          </span>
                          Từ chối
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => remove(m)}
                        className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50 flex items-center gap-1 ml-auto"
                        title="Xoá vĩnh viễn tệp này"
                      >
                        <span className="material-symbols-rounded text-base">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {/* Modal Xem chi tiết khoảnh khắc */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        size="lg"
        title="Chi tiết khoảnh khắc"
        subtitle={
          selectedItem ? (
            <span>
              Người gửi: <strong>{selectedItem.author}</strong> ({selectedItem.authorRole})
            </span>
          ) : undefined
        }
        icon="photo_library"
        bodyClassName="p-5 sm:p-6 space-y-6 max-h-[75vh]"
        footer={
          selectedItem && (
            <div className="flex flex-wrap items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2">
                {selectedItem.status !== "approved" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(selectedItem, "approved", "Đã duyệt khoảnh khắc.")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-2xs"
                  >
                    <span className="material-symbols-rounded text-base">check_circle</span>
                    Duyệt khoảnh khắc
                  </button>
                )}
                {selectedItem.status !== "rejected" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(selectedItem, "rejected", "Đã từ chối khoảnh khắc.")}
                    className="rounded-xl bg-rose-100 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <span className="material-symbols-rounded text-base">block</span>
                    Từ chối
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(selectedItem)}
                  className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <span className="material-symbols-rounded text-base">delete</span>
                  Xoá tệp
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          )
        }
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* 1. Media Preview & Thông số */}
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-inner flex items-center justify-center max-h-72">
                {selectedItem.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.caption || "Media preview"}
                    className="max-h-72 w-full object-contain"
                  />
                ) : (
                  <video
                    src={selectedItem.url}
                    controls
                    className="max-h-72 w-full object-contain"
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-600 uppercase">
                    {selectedItem.kind}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                    {prettySize(selectedItem.size)}
                  </span>
                </div>
                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-rounded text-sm">open_in_new</span>
                  Mở tệp gốc
                </a>
              </div>
            </div>

            {/* 2. Chủ đề & Nội dung khoảnh khắc (Hỗ trợ chỉnh sửa nhanh) */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-rounded text-base text-slate-500">
                    photo_album
                  </span>
                  Chủ đề &amp; Nội dung khoảnh khắc
                </h4>
                {hasContentChanges && (
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 animate-pulse">
                    Có thay đổi chưa lưu
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1" htmlFor="edit-title">
                  Tên Chủ đề / Album:
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Nhập tên chủ đề hoặc album..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1" htmlFor="edit-caption">
                  Lời nhắn / Chú thích khoảnh khắc:
                </label>
                <textarea
                  id="edit-caption"
                  rows={3}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Nhập chú thích..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-800 focus:border-[#1d4ed8] focus:outline-none"
                />
              </div>

              {hasContentChanges && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={savingEdit}
                    onClick={handleSaveDetails}
                    className="rounded-xl bg-[#1d4ed8] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <span className="material-symbols-rounded text-base">save</span>
                    {savingEdit ? "Đang lưu..." : "Lưu thay đổi Tên/Chú thích"}
                  </button>
                </div>
              )}
            </div>

            {/* 3. Thông tin người gửi */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-rounded text-base text-slate-500">
                  person
                </span>
                Thông tin người gửi
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    Họ và tên:
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedItem.author}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    Niên khóa / Vai trò:
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedItem.authorRole || "(Chưa cập nhật)"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Các mốc thời gian & Thông tin người duyệt */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-rounded text-base text-slate-500">
                    schedule
                  </span>
                  Mốc thời gian
                </span>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500">Thời điểm kỷ niệm: </span>
                    <strong className="text-slate-900">
                      Tháng {String(selectedItem.month).padStart(2, "0")}/{selectedItem.year}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Gửi lên lúc: </span>
                    <strong className="text-slate-900 font-mono">
                      {vi(selectedItem.createdAt)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-rounded text-base text-slate-500">
                    verified_user
                  </span>
                  Thông tin người duyệt
                </span>
                <div className="text-xs space-y-1">
                  {latestApprovalLog ? (
                    <>
                      <div>
                        <span className="text-slate-500">Admin xử lý: </span>
                        <strong className="text-slate-900">
                          {latestApprovalLog.adminName}
                        </strong>{" "}
                        <span className="text-slate-400">
                          (@{latestApprovalLog.adminUsername})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Quyền hạn: </span>
                        <span className="font-semibold text-slate-700">
                          {latestApprovalLog.adminRole}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Thời gian duyệt: </span>
                        <span className="font-mono text-slate-700">
                          {vi(latestApprovalLog.createdAt)}
                        </span>
                      </div>
                    </>
                  ) : selectedItem.status === "approved" ? (
                    <p className="text-emerald-700 font-semibold pt-1">
                      Khoảnh khắc do Ban Quản Trị đăng trực tiếp
                    </p>
                  ) : (
                    <p className="text-amber-700 font-semibold pt-1">
                      Đang ở hàng chờ, chưa có quản trị viên phê duyệt
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Lịch sử trạng thái (Audit Timeline) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-rounded text-base text-slate-500">
                  history
                </span>
                Lịch sử trạng thái & Thao tác
              </h4>

              <div className="space-y-3 border-l-2 border-slate-200 ml-3 pl-4">
                {/* Mốc ban đầu: Gửi bài */}
                <div className="relative">
                  <div className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-500 shadow-xs" />
                  <div className="text-xs">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-800">Gửi khoảnh khắc lên hệ thống</strong>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {vi(selectedItem.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      Thực hiện bởi: <strong>{selectedItem.author}</strong> ({selectedItem.authorRole})
                    </p>
                  </div>
                </div>

                {/* Các mốc xử lý tiếp theo từ Action Logs */}
                {selectedItemLogs.map((log) => (
                  <div key={log.id} className="relative pt-2">
                    <div
                      className={`absolute -left-[23px] top-3 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs ${
                        log.details.includes("approved")
                          ? "bg-emerald-500"
                          : log.details.includes("rejected")
                          ? "bg-rose-500"
                          : "bg-indigo-500"
                      }`}
                    />
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-slate-800">
                          {log.adminName}{" "}
                          <span className="text-slate-400 font-normal">
                            (@{log.adminUsername})
                          </span>
                        </strong>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {vi(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 font-medium">{log.details}</p>
                    </div>
                  </div>
                ))}

                {selectedItemLogs.length === 0 && (
                  <p className="text-xs text-slate-400 italic pt-1">
                    Chưa có thao tác xử lý nào từ ban quản trị.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
