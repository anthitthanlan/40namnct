"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Reveal from "@/components/Reveal";
import MediaUploader from "@/components/MediaUploader";
import StoryForm from "@/components/StoryForm";

function GuiBaiContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"media" | "story">("media");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "cau-chuyen") {
      setTab("story");
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <section className="relative overflow-hidden pb-16 pt-28 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero_images/hero-4.webp')" }}
        />
        <div className="absolute inset-0 bg-slate-950/80" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <h1 className="text-3xl font-extrabold sm:text-5xl">
              Gửi gắm kỷ niệm
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-slate-200 sm:text-lg">
              Bạn muốn chia sẻ điều gì về những tháng năm thanh xuân dưới mái trường Nguyễn Công Trứ?
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 md:px-0">
        <Reveal>
          <div className="mb-10 flex justify-center">
            <div className="inline-flex rounded-full bg-slate-200/50 p-1 backdrop-blur-md">
              <button
                onClick={() => setTab("media")}
                className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-extrabold transition-all ${
                  tab === "media"
                    ? "bg-white text-[#1d4ed8] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="material-symbols-rounded text-[1.2em]">photo_library</span>
                Khoảnh khắc
              </button>
              <button
                onClick={() => setTab("story")}
                className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-extrabold transition-all ${
                  tab === "story"
                    ? "bg-white text-[#1d4ed8] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="material-symbols-rounded text-[1.2em]">article</span>
                Câu chuyện
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50">
            {tab === "media" ? (
              <div>
                <div className="bg-slate-50 p-6 md:p-8">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Đăng ảnh hoặc video
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Gửi một hoặc nhiều ảnh, video ngắn kỷ niệm của bạn (tối đa 10MB/ảnh, 40MB/video).
                  </p>
                </div>
                <div className="p-6 md:p-8">
                  <MediaUploader />
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-slate-50 p-6 md:p-8">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Viết câu chuyện
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Kể lại những kỷ niệm sâu sắc, bài học hay những tâm sự gửi thanh xuân của bạn.
                  </p>
                </div>
                <div className="p-6 md:p-8">
                  <StoryForm />
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </section>
    </main>
  );
}

export default function GuiBaiPage() {
  return (
    <Suspense fallback={null}>
      <GuiBaiContent />
    </Suspense>
  );
}
