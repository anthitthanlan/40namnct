import type { ReactNode } from "react";

/**
 * Bộ render Markdown rất nhẹ dành cho nội dung bài viết:
 * - Tiêu đề:  # / ## / ###
 * - Trích dẫn:  > ...
 * - Danh sách:  - ... hoặc * ...
 * - Inline:  **đậm**, *nghiêng*, `code`
 * Toàn bộ văn bản được React escape - an toàn với nội dung người dùng gửi.
 */

function inline(text: string, key: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    const k = `${key}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={k} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (/^\*[^*]+\*$/.test(part)) {
      return <em key={k}>{part.slice(1, -1)}</em>;
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code
          key={k}
          className="rounded-lg bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-[#1d4ed8]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function Markdown({ content }: { content: string }) {
  const blocks: ReactNode[] = [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  let listItems: string[] = [];
  let quoteLines: string[] = [];
  let paraLines: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    const items = listItems;
    listItems = [];
    blocks.push(
      <ul
        key={`ul-${blocks.length}`}
        className="my-4 list-disc space-y-2 pl-6 text-slate-700"
      >
        {items.map((item, i) => (
          <li key={i}>{inline(item, `li-${blocks.length}-${i}`)}</li>
        ))}
      </ul>,
    );
  };

  const flushQuote = () => {
    if (quoteLines.length === 0) return;
    const queued = quoteLines;
    quoteLines = [];
    blocks.push(
      <blockquote
        key={`bq-${blocks.length}`}
        className="my-6 rounded-r-2xl border-l-4 border-[#1d4ed8]/60 bg-blue-50/60 px-5 py-4 italic text-slate-700"
      >
        {queued.map((q, i) => (
          <p key={i} className={i > 0 ? "mt-2" : undefined}>
            {inline(q, `bq-${blocks.length}-${i}`)}
          </p>
        ))}
      </blockquote>,
    );
  };

  const flushPara = () => {
    if (paraLines.length === 0) return;
    const queued = paraLines;
    paraLines = [];
    blocks.push(
      <p
        key={`p-${blocks.length}`}
        className="my-4 text-[1.05rem] leading-8 text-slate-700"
      >
        {queued.map((line, i) => (
          <span key={i}>
            {i > 0 && <br />}
            {inline(line, `p-${blocks.length}-${i}`)}
          </span>
        ))}
      </p>,
    );
  };

  const flushAll = () => {
    flushPara();
    flushList();
    flushQuote();
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (/^#{1,3}\s+/.test(line)) {
      flushAll();
      const match = line.match(/^#+/);
      const level = match ? match[0].length : 2;
      const text = line.replace(/^#{1,3}\s+/, "");
      const cls =
        level === 1
          ? "mt-10 text-2xl font-extrabold text-slate-900 sm:text-[1.7rem]"
          : level === 2
            ? "mt-10 text-xl font-extrabold text-slate-900 sm:text-2xl"
            : "mt-8 text-lg font-extrabold text-slate-900";
      const key = `h-${blocks.length}`;
      const Tag = (level === 1 ? "h1" : level === 2 ? "h2" : "h3") as "h2";
      blocks.push(
        <Tag key={key} className={cls}>
          {inline(text, key)}
        </Tag>,
      );
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushPara();
      flushList();
      quoteLines.push(line.replace(/^>\s?/, ""));
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      flushPara();
      flushQuote();
      listItems.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }

    if (line.trim() === "") {
      flushAll();
      continue;
    }

    flushList();
    flushQuote();
    paraLines.push(line.trim());
  }
  flushAll();

  return <div>{blocks}</div>;
}
