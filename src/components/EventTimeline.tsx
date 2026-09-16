"use client";

import Reveal from "@/components/Reveal";

// ============================================================
// EventTimeline: Timeline dọc có animation cho chương trình sự kiện
// Trái/phải luân phiên trên desktop, đơn cột trên mobile
// ============================================================

// Mock timeline data — sẽ được thay bằng dữ liệu từ DB sau
const timelineEvents = [
  {
    id: "1",
    time: "07:00 - 07:30",
    title: "Đón tiếp khách mời",
    description:
      "Đón tiếp cựu học sinh, thầy cô giáo và khách mời tại sảnh trường. Gửi phiếu lưu bút kỷ niệm.",
    icon: "🎓",
  },
  {
    id: "2",
    time: "07:30 - 08:00",
    title: "Ổn định tổ chức",
    description:
      "Văn nghệ chào mừng — chương trình ca nhạc của học sinh hiện tại và cựu học sinh.",
    icon: "🎵",
  },
  {
    id: "3",
    time: "08:00 - 09:30",
    title: "Lễ kỷ niệm chính thức",
    description:
      "Chào cờ, diễn văn khai mạc, phát biểu của Ban Giám Hiệu, đại diện cựu học sinh các thế hệ, và trao kỷ niệm chương.",
    icon: "🏛️",
  },
  {
    id: "4",
    time: "09:30 - 10:30",
    title: "Triển lãm & Hội ngộ",
    description:
      "Tham quan triển lãm ảnh 40 năm, gian hàng kỷ niệm. Gặp gỡ thầy cô, bạn bè đồng khóa.",
    icon: "📸",
  },
  {
    id: "5",
    time: "10:30 - 12:00",
    title: "Tiệc hội ngộ",
    description:
      "Tiệc liên hoan, chương trình giao lưu, bốc thăm may mắn và chia sẻ kỷ niệm.",
    icon: "🎉",
  },
];

interface TimelineEventProps {
  event: (typeof timelineEvents)[0];
  index: number;
  isLast: boolean;
}

function TimelineEvent({ event, index, isLast }: TimelineEventProps) {
  const isEven = index % 2 === 0;

  return (
    <div className="relative flex items-start gap-6 md:gap-0">
      {/* Desktop: Alternating layout */}
      {/* Left content (even items on desktop) */}
      <div
        className={`hidden md:block w-5/12 ${
          isEven ? "text-right pr-12" : "order-3 pl-12"
        }`}
      >
        <Reveal variant={isEven ? "right" : "left"} delay={index * 100}>
          <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md p-6 shadow-sm hover:-translate-y-1 transition-transform duration-300">
            <span className="text-sm font-semibold text-[#1d4ed8]">
              {event.time}
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2">
              {event.title}
            </h3>
            <p className="text-slate-500 mt-2 leading-relaxed text-sm">
              {event.description}
            </p>
          </div>
        </Reveal>
      </div>

      {/* Center line + circle */}
      <div className="flex flex-col items-center md:w-2/12">
        <Reveal variant="zoom" delay={index * 100}>
          <div className="w-12 h-12 rounded-full bg-blue-50 border-4 border-white shadow-lg flex items-center justify-center text-xl z-10 relative">
            {event.icon}
          </div>
        </Reveal>
        {!isLast && (
          <div className="w-0.5 h-full min-h-[120px] bg-gradient-to-b from-blue-200 to-blue-50" />
        )}
      </div>

      {/* Right content (odd items on desktop, all items on mobile) */}
      <div
        className={`flex-1 md:w-5/12 ${
          isEven ? "order-3 md:pl-12" : "md:text-right md:pr-12"
        }`}
      >
        {/* Mobile card (visible on mobile, hidden on desktop) */}
        <div className="md:hidden">
          <Reveal delay={index * 100}>
            <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md p-5 shadow-sm">
              <span className="text-sm font-semibold text-[#1d4ed8]">
                {event.time}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                {event.title}
              </h3>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                {event.description}
              </p>
            </div>
          </Reveal>
        </div>

        {/* Desktop: Show content for odd items here */}
        <div
          className={`hidden md:block ${isEven ? "invisible" : "visible"}`}
        >
          {!isEven && (
            <Reveal variant="left" delay={index * 100}>
              <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md p-6 shadow-sm hover:-translate-y-1 transition-transform duration-300">
                <span className="text-sm font-semibold text-[#1d4ed8]">
                  {event.time}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  {event.title}
                </h3>
                <p className="text-slate-500 mt-2 leading-relaxed text-sm">
                  {event.description}
                </p>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventTimeline() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal variant="up">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 text-xs font-extrabold tracking-widest text-[#1d4ed8] sm:text-sm">
              <span className="h-0.5 w-6 rounded-full bg-[#1d4ed8]" />
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-rounded text-[1.25em]">
                  event
                </span>{" "}
                CHƯƠNG TRÌNH SỰ KIỆN
              </span>
              <span className="h-0.5 w-6 rounded-full bg-[#1d4ed8]" />
            </div>
            <h2 className="mt-5 text-4xl font-black text-slate-900 sm:text-5xl">
              Chương trình Ngày Trở Về
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              Lịch trình chi tiết ngày lễ kỷ niệm 40 năm thành lập trường —
              08/11/2026
            </p>
          </div>
        </Reveal>

        {/* Timeline */}
        <div className="mt-16 max-w-4xl mx-auto">
          {timelineEvents.map((event, index) => (
            <TimelineEvent
              key={event.id}
              event={event}
              index={index}
              isLast={index === timelineEvents.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
