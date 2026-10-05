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

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/accounts/logs", { cache: "no-store" });
      if (res.status === 401) return onAuthError?.();
      const data = await res.json();
      if (data.ok) setLogs(data.logs);
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }, [onAuthError]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Nhật ký hệ thống
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Ghi nhận mọi thao tác của Ban Quản trị.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-8 shadow-sm">
        <div className="space-y-4">
          {busy ? (
            <div className="text-sm text-slate-500 italic text-center py-8">Đang tải...</div>
          ) : logs.length === 0 ? (
            <div className="text-sm text-slate-500 italic text-center py-8">Chưa có lịch sử thao tác nào.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm text-slate-800">{log.action} <span className="text-slate-400 font-medium ml-2">({log.group})</span></div>
                    <div className="text-xs text-slate-500 mt-1">
                      Thực hiện bởi: <span className="font-semibold text-slate-700">{log.adminName}</span> ({log.adminRole})
                    </div>
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
    </div>
  );
}
