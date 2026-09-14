import Link from "next/link";
import { formatDate, type Post } from "@/lib/posts";

/** Huy hiệu nguồn bài: ✦ Ban Biên tập (admin) hay 🗣 Câu chuyện cộng đồng (user) */
export function PostBadges({ post }: { post: Post }) {
  return (
    <div className="flex flex-wrap gap-2">
      {post.pinned ? (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold tracking-wide text-amber-700">
          📌 Ghim
        </span>
      ) : null}
      {post.source === "admin" ? (
        <span className="rounded-full bg-[#1d4ed8]/10 px-3 py-1 text-[11px] font-extrabold tracking-wide text-[#1d4ed8]">
          ✦ Ban Biên tập
        </span>
      ) : (
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold tracking-wide text-emerald-700">
          🗣 Câu chuyện cộng đồng
        </span>
      )}
    </div>
  );
}

/** Ảnh bìa bài viết - fallback gradient khi bài không có ảnh */
export function PostCover({ post, className = "" }: { post: Post; className?: string }) {
  if (post.cover) {
    return <img src={post.cover} alt={post.title} className={className} />;
  }
  return (
    <span
      aria-hidden
      className={`grid place-items-center bg-gradient-to-br from-[#1d4ed8] to-[#1e3a8a] text-5xl ${className}`}
    >
      📖
    </span>
  );
}

export default function PostCard({
  post,
  featured = false,
}: {
  post: Post;
  featured?: boolean;
}) {
  const href = `/bai-viet/${post.slug}`;

  if (featured) {
    return (
      <article className="btn-lightship-soft group grid overflow-hidden rounded-[2rem] bg-white md:grid-cols-2">
        <Link href={href} className="block md:order-2">
          <PostCover
            post={post}
            className="h-60 w-full object-cover transition duration-700 group-hover:scale-[1.04] md:h-full"
          />
        </Link>
        <div className="flex flex-col p-7 md:p-9">
          <PostBadges post={post} />
          <h2 className="mt-4 text-2xl font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#1d4ed8] md:text-3xl">
            <Link href={href}>{post.title}</Link>
          </h2>
          <p className="mt-3 line-clamp-3 text-slate-600">{post.excerpt}</p>
          <div className="mt-auto pt-6 text-xs font-semibold text-slate-500">
            {post.author} · {post.authorRole}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{formatDate(post.createdAt)}</span>
            <Link
              href={href}
              className="rounded-full bg-[#1d4ed8]/10 px-5 py-2 text-sm font-extrabold text-[#1d4ed8] transition group-hover:bg-[#1d4ed8] group-hover:text-white"
            >
              Đọc tiếp →
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="btn-lightship-soft group flex h-full flex-col overflow-hidden rounded-[2rem] bg-white">
      <Link href={href} className="block overflow-hidden">
        <PostCover
          post={post}
          className="h-44 w-full object-cover transition duration-700 group-hover:scale-[1.05]"
        />
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <PostBadges post={post} />
        <h3 className="mt-3 text-lg font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#1d4ed8]">
          <Link href={href}>{post.title}</Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
          {post.excerpt}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="truncate pr-2 font-semibold">{post.author}</span>
          <span className="shrink-0 text-slate-400">
            {formatDate(post.createdAt)}
          </span>
        </div>
      </div>
    </article>
  );
}
