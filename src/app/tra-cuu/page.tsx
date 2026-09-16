import type { Metadata } from "next";
import TraCuuClient from "./TraCuuClient";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Tra cứu vé · THPT Nguyễn Công Trứ",
  description:
    "Tra cứu kết quả giao dịch và tải vé QR cho ngày Lễ kỷ niệm 40 năm - 08/11/2026.",
};

export default function TraCuuPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24 pt-32">
      <Reveal>
        <TraCuuClient />
      </Reveal>
    </main>
  );
}
