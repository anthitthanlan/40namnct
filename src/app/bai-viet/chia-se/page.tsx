import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import StoryForm from "@/components/StoryForm";

export const metadata: Metadata = {
  title: "Chia sẻ câu chuyện với Trứ · 40 năm THPT Nguyễn Công Trứ",
  description:
    "Kể câu chuyện, kỷ niệm của bạn dưới mái trường THPT Nguyễn Công Trứ để cùng lưu giữ ký ức trong Triển lãm 40 năm thành lập trường (1986-2026).",
};

const TIPS = [
  {
    icon: "🔍",
    text: "Câu chuyện hay thường bắt đầu từ một chi tiết nhỏ: một chiếc bàn, một câu phê trong vở, một trận bóng mùa xuân…",
  },
  {
    icon: "✍️",
    text: "Dùng ## để mở đầu một mục, **chữ đậm** để nhấn câu quan trọng và - để gạch đầu dòng - bài viết sẽ rất dễ đọc.",
  },
  {
    icon: "🧡",
    text: "Đúng tên thầy cô, bạn bè, sự kiện và năm tháng sẽ giúp người cùng khóa nhận ra nhau nhanh hơn.",
  },
];

const STEPS = [
  "Gửi câu chuyện qua biểu mẫu",
  "Ban Biên tập duyệt trong 1-2 ngày",
  "Xuất bản trong mục Bài viết",
];

export default function ChiaSePage() {
  return (
    <main className="min-h-screen">
      <section className="bg-gradient-to-b from-[#16a34a] to-[#166534] pb-14 pt-32 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <Reveal>
            <span className="btn-pop-soft inline-block rounded-2xl bg-white px-6 py-3 text-sm font-extrabold tracking-widest text-[#16a34a]">
              ✍️ CHIA SẺ CÂU CHUYỆN VỚI TRỨ
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="mt-6 text-3xl font-extrabold sm:text-5xl">
              Góp một kỷ niệm - lưu giữ một thời
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="mx-auto mt-4 max-w-2xl text-emerald-50 sm:text-lg">
              Mỗi câu chuyện được kể lại là một mảnh ghép ký ức làm nên bản sắc
              Nguyễn Công Trứ, để những ký ức tưởng như đã ngủ quên có cơ hội
              sống lại và được trao truyền cho các thế hệ mai sau.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="grid items-start gap-10 lg:grid-cols-[1.5fr_1fr]">
          <Reveal>
            <StoryForm />
          </Reveal>

          <Reveal delay={120}>
            <div className="space-y-6">
              <div className="btn-pop-soft rounded-[2rem] bg-white p-7">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Gợi ý để câu chuyện thật hay
                </h2>
                <ul className="mt-4 space-y-4">
                  {TIPS.map((tip) => (
                    <li
                      key={tip.text}
                      className="flex gap-3 text-sm leading-relaxed text-slate-600"
                    >
                      <span className="text-lg">{tip.icon}</span>
                      <span>{tip.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="btn-pop-soft rounded-[2rem] bg-white p-7">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Quy trình 3 bước
                </h2>
                <ol className="mt-4 space-y-3">
                  {STEPS.map((step, i) => (
                    <li
                      key={step}
                      className="flex items-start gap-3 text-sm text-slate-600"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#16a34a]/10 text-xs font-extrabold text-[#16a34a]">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="btn-pop-soft rounded-[2rem] bg-[#1d4ed8] p-7 text-white">
                <h2 className="text-lg font-extrabold">
                  Có ảnh, học bạ, kỷ vật?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-blue-100">
                  Gửi hình ảnh, tư liệu gốc về hộp thư tiếp nhận của nhà
                  trường:
                </p>
                <a
                  href="mailto:thptnguyencongtru@hcm.edu.vn"
                  className="mt-3 inline-block break-all rounded-xl bg-white/15 px-4 py-2 text-sm font-extrabold"
                >
                  📧 thptnguyencongtru@hcm.edu.vn
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
