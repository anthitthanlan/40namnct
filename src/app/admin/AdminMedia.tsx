"use client";

import { useCallback, useEffect, useState } from "react";

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
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  url: string;
};

function vi(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function prettySize(bytes: number): string {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
    : `${Math.round(bytes / 1024)}KB`;
}

import React from "react";

const STATUS_INFO: Record<MediaRow["status"], { label: React.ReactNode; cls: string }> =
  {
    pending: { label: <><span className="material-symbols-rounded inline-block align-middle text-[1em]">hourglass_empty</span> Chờ duyệt</>, cls: "bg-amber-100 text-amber-700" },
    approved: { label: <><span className="material-symbols-rounded inline-block align-middle text-[1em]">check_circle</span> Đã duyệt</>, cls: "bg-emerald-100 text-emerald-700" },
    rejected: { label: <><span className="material-symbols-rounded inline-block align-middle text-[1em]">cancel</span> Đã từ chối</>, cls: "bg-rose-100 text-rose-600" },
  };

export default function AdminMedia({
  onAuthError,
}: {
  onAuthError?: () => void;
}) {
  const [items, setItems] = useState<MediaRow[] | null>(null);
  const [banner, setBanner] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const flash = useCallback((ok: boolean, text: string) => {
    setBanner({ ok, text });
    setTimeout(() => setBanner(null), 4000);
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/media", { cache: "no-store" });
    if (res.status === 401) {
      onAuthError?.();
      return;
    }
    const data = await res.json();
    if (data.ok) setItems(data.media as MediaRow[]);
  }, [onAuthError]);

  useEffect(() => {
    load();
  }, [load]);

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
      flash(true, okText);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: MediaRow) {
    if (!window.confirm(`Xoá tệp của "${item.author}"? Không thể hoàn tác.`))
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
      flash(true, "Đã xoá tệp media.");
    } finally {
      setBusy(false);
    }
  }

  if (items === null) {
    return (
      <div className="mt-8 rounded-3xl bg-white p-10 text-center text-sm font-semibold text-slate-400">
        Đang tải media…
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {banner && (
        <div
          className={`rounded-2xl px-5 py-3 text-sm font-bold ${
            banner.ok
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-600"
          }`}
        >
          {banner.text}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-400">
          Chưa có media nào được gửi.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => {
            const info = STATUS_INFO[m.status];
            return (
              <div
                key={m.id}
                className="overflow-hidden rounded-3xl bg-white shadow-sm"
              >
                <div className="relative">
                  <span
                    className={`absolute right-3 top-3 z-10 rounded-full px-3 py-1 text-[11px] font-extrabold ${info.cls}`}
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
                  <p className="line-clamp-2 text-sm font-bold text-slate-800">
                    {m.caption || "(không có chú thích)"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    🧡 {m.author} · {m.authorRole}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    📅 {String(m.month).padStart(2, "0")}.{m.year} · {vi(m.createdAt)} · {prettySize(m.size)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.status !== "approved" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => act(m, "approved", "Đã duyệt media.")}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50"
                      >
                        <span className="material-symbols-rounded inline-block align-middle text-[1em]">check_circle</span> Duyệt
                      </button>
                    )}
                    {m.status !== "rejected" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => act(m, "rejected", "Đã từ chối media.")}
                        className="rounded-full bg-rose-100 px-4 py-2 text-xs font-extrabold text-rose-600 disabled:opacity-50"
                      >
                        🚫 Từ chối
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => remove(m)}
                      className="rounded-full bg-rose-50 px-4 py-2 text-xs font-extrabold text-rose-500 disabled:opacity-50"
                    >
                      🗑 Xoá
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
