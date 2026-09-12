import type { Metadata } from "next";
import AdminApp from "./AdminApp";

export const metadata: Metadata = {
  title: "Quản trị bài viết · THPT Nguyễn Công Trứ",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-100 pb-24 pt-28">
      <AdminApp />
    </main>
  );
}
