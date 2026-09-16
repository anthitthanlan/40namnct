"use client";

import { useEffect, useState } from "react";

type Props = { title: string };

export default function ShareButtons({ title }: Props) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const enc = encodeURIComponent;
  const encodedUrl = enc(url);
  const encodedTitle = enc(title);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* trình duyệt chặn clipboard - bỏ qua */
    }
  }

  const btn =
    "btn-lightship-soft inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold text-white transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-bold text-slate-500">Chia sẻ bài viết:</span>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btn} bg-[#1877f2]`}
      >
        Facebook
      </a>
      <a
        href={`https://zalo.me/share/share.html?u=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btn} bg-[#0068ff]`}
      >
        Zalo
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btn} bg-slate-900`}
      >
        X (Twitter)
      </a>
      <button
        type="button"
        onClick={copyLink}
        className={`${btn} ${copied ? "bg-emerald-600" : "bg-[#16a34a]"}`}
      >
        {copied ? "Đã sao chép ✓" : "🔗 Sao chép liên kết"}
      </button>
    </div>
  );
}
