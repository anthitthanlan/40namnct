"use client";

/**
 * ClientPostCover — Client wrapper for post cover images.
 * Handles the skeleton-reveal cross-fade via onLoad, which requires
 * a Client Component boundary. PostCard itself stays a Server Component.
 */
export default function ClientPostCover({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className="skeleton-reveal w-full h-full">
      {/* Pulsing skeleton behind the image */}
      <div
        className={`skeleton-pulse skeleton-reveal__placeholder rounded-none ${className}`}
        aria-hidden="true"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`skeleton-reveal__content ${className}`}
        onLoad={(e) => {
          const img = e.currentTarget;
          img.classList.add("is-loaded");
          img.previousElementSibling?.classList.add("is-loaded");
        }}
      />
    </div>
  );
}
