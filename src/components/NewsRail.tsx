"use client";

import { useEffect, useState } from "react";

const SCALES = [0.9, 1, 1.15];

function apply(scale: number) {
  document.documentElement.style.setProperty("--news-scale", String(scale));
}

const btn =
  "grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#0098d1]";

/** Thanh công cụ dính bên trái bài viết: cỡ chữ, sao chép liên kết, in */
export function NewsRail() {
  const [idx, setIdx] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apply(SCALES[idx]);
    return () => apply(1);
  }, [idx]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="sticky top-28 flex w-12 flex-col items-center gap-1 rounded-xl border border-[#ebebeb] bg-white py-2">
      <button
        type="button"
        aria-label="Giảm cỡ chữ"
        className={btn}
        onClick={() => setIdx((i) => Math.max(0, i - 1))}
      >
        <span className="material-symbols-rounded text-[20px]">remove</span>
      </button>
      <span className="text-xs font-semibold text-slate-400">Aa</span>
      <button
        type="button"
        aria-label="Tăng cỡ chữ"
        className={btn}
        onClick={() => setIdx((i) => Math.min(SCALES.length - 1, i + 1))}
      >
        <span className="material-symbols-rounded text-[20px]">add</span>
      </button>
      <button
        type="button"
        aria-label="Sao chép liên kết"
        title={copied ? "Đã sao chép" : "Sao chép liên kết"}
        className={`${btn} ${copied ? "text-emerald-600" : ""}`}
        onClick={copy}
      >
        <span className="material-symbols-rounded text-[20px]">
          {copied ? "check" : "link"}
        </span>
      </button>
      <button
        type="button"
        aria-label="In bài viết"
        className={btn}
        onClick={() => window.print()}
      >
        <span className="material-symbols-rounded text-[20px]">print</span>
      </button>
    </div>
  );
}

/** Hàng chia sẻ nhỏ gọn kiểu báo điện tử */
export function NewsShare({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(window.location.href), []);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const pill =
    "rounded px-2.5 py-1 text-[11px] font-bold text-white transition hover:opacity-85";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        className={`${pill} bg-[#1877f2]`}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.facebook.com/sharer/sharer.php?u=${u}`}
      >
        Chia sẻ
      </a>
      <a
        className={`${pill} bg-[#0068ff]`}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://zalo.me/share/share.html?u=${u}&text=${t}`}
      >
        Zalo
      </a>
      <a
        className={`${pill} bg-slate-900`}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://twitter.com/intent/tweet?url=${u}&text=${t}`}
      >
        X
      </a>
    </div>
  );
}
