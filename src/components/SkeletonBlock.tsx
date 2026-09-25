/**
 * SkeletonBlock — Reusable pulsing skeleton placeholder.
 *
 * Usage:
 *   <SkeletonBlock className="h-44 w-full rounded-2xl" />
 *
 * Pairs with the `.skeleton-pulse` CSS class in globals.css which uses
 * the pulse keyframe animation for a smooth shimmer effect.
 */

type SkeletonBlockProps = {
  className?: string;
  style?: React.CSSProperties;
};

export default function SkeletonBlock({ className = "", style }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-pulse ${className}`}
      style={style}
    />
  );
}
