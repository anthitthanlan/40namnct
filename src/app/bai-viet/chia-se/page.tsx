import type { Metadata } from "next";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import StoryForm from "@/components/StoryForm";

export const metadata: Metadata = {
  title: "Chia sẻ câu chuyện với Trứ · 40 năm THPT Nguyễn Công Trứ",
  description:
    "Kể câu chuyện, kỷ niệm của bạn dưới mái trường THPT Nguyễn Công Trứ để cùng lưu giữ ký ức trong Triển lãm 40 năm thành lập trường (1986-2026).",
};

const TIPS = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
      </svg>
    ),
    text: "Câu chuyện hay thường bắt đầu từ một chi tiết nhỏ: một chiếc bàn, một câu phê trong vở, một trận bóng mùa xuân…",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    ),
    text: "Dùng ## để mở đầu một mục, **chữ đậm** để nhấn câu quan trọng và - để gạch đầu dòng — bài viết sẽ rất dễ đọc.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
      </svg>
    ),
    text: "Đúng tên thầy cô, bạn bè, sự kiện và năm tháng sẽ giúp người cùng khóa nhận ra nhau nhanh hơn.",
  },
];

const STEPS = [
  {
    label: "Gửi câu chuyện qua biểu mẫu",
    sub: "Điền đầy đủ thông tin, nội dung và gửi đi",
  },
  {
    label: "Ban Biên tập duyệt trong 1–2 ngày",
    sub: "Đội ngũ biên tập sẽ kiểm tra nội dung",
  },
  {
    label: "Xuất bản trong mục Bài viết",
    sub: "Câu chuyện của bạn sẽ được lưu giữ mãi mãi",
  },
];

export default function ChiaSePage() {
  return (
    <main className="min-h-screen bg-[#f8fafc]">
      {/* Header - compact hero với ảnh trường nền */}
      <section className="relative overflow-hidden pb-16 pt-28 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/bg/hero-1.jpg')" }}
        />
        {/* Overlay đậm, gradient từ trên xuống */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/75 to-slate-950/90" />
        {/* Accent glow xanh lá */}
        <div className="absolute -bottom-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[80px]" />

        <div className="relative mx-auto max-w-5xl px-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-300 backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Chia sẻ câu chuyện với Trứ
            </span>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">
              Góp một kỷ niệm,{" "}
              <span className="text-emerald-400">lưu giữ một thời</span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-4 max-w-2xl text-base text-slate-200 sm:text-lg leading-relaxed">
              Mỗi câu chuyện được kể lại là một mảnh ghép ký ức làm nên bản
              sắc Nguyễn Công Trứ — để những ký ức tưởng như đã ngủ quên có cơ
              hội sống lại và được trao truyền cho các thế hệ mai sau.
            </p>
          </Reveal>

          {/* Mini stats */}
          <Reveal delay={250}>
            <div className="mt-8 flex flex-wrap gap-6">
              {[
                { num: "40", label: "năm lịch sử" },
                { num: "1986", label: "năm thành lập" },
                { num: "15/11", label: "Ngày Trở Về" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col">
                  <span className="text-3xl font-black text-white">{s.num}</span>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{s.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Main content */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid items-start gap-10 lg:grid-cols-[1.55fr_1fr]">

          {/* Form cột trái */}
          <Reveal>
            <StoryForm />
          </Reveal>

          {/* Sidebar cột phải */}
          <Reveal delay={120}>
            <div className="space-y-5">

              {/* Quy trình 3 bước */}
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2.5 text-base font-extrabold text-slate-900">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Quy trình 3 bước
                </h2>
                <ol className="mt-5 space-y-4">
                  {STEPS.map((step, i) => (
                    <li key={step.label} className="flex items-start gap-3.5">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-black text-white">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{step.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{step.sub}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tips viết hay */}
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2.5 text-base font-extrabold text-slate-900">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.347.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.512.477.859h4z" />
                    </svg>
                  </span>
                  Gợi ý để câu chuyện thật hay
                </h2>
                <ul className="mt-5 space-y-4">
                  {TIPS.map((tip, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 shrink-0 text-slate-400">{tip.icon}</span>
                      <p className="text-sm leading-relaxed text-slate-600">{tip.text}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gửi kỷ vật */}
              <div className="overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="font-extrabold text-base">Có ảnh, học bạ, kỷ vật?</h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                      Gửi hình ảnh và tư liệu gốc về hộp thư tiếp nhận của nhà trường:
                    </p>
                    <a
                      href="mailto:thptnguyencongtru@hcm.edu.vn"
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      thptnguyencongtru@hcm.edu.vn
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
