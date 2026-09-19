import type { Metadata } from "next";
import AdminApp from "./AdminApp";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Quản trị bài viết · THPT Nguyễn Công Trứ",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="admin-scope min-h-screen bg-slate-100 pb-24 pt-28">
      <Suspense fallback={<div className="flex justify-center py-20">Đang tải...</div>}>
        <AdminApp />
      </Suspense>
    </main>
  );
}
