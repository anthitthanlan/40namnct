/**
 * loading.tsx — Skeleton loading UI for the home page.
 * Shown by Next.js App Router while the async server component fetches data.
 * Uses the same layout structure as page.tsx to minimise layout shift.
 */

export default function HomeLoading() {
  return (
    <main>
      {/* Hero skeleton */}
      <div className="relative h-screen min-h-[600px] w-full overflow-hidden bg-slate-200">
        <div className="skeleton-pulse absolute inset-0 rounded-none" />
      </div>

      {/* Giới thiệu skeleton */}
      <section className="mx-auto max-w-7xl px-6 py-32">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="skeleton-pulse h-4 w-36 rounded-full" />
            <div className="skeleton-pulse h-10 w-4/5" />
            <div className="skeleton-pulse h-10 w-3/5" />
            <div className="space-y-2">
              <div className="skeleton-pulse h-4 w-full" />
              <div className="skeleton-pulse h-4 w-5/6" />
              <div className="skeleton-pulse h-4 w-4/6" />
            </div>
          </div>
          <div className="skeleton-pulse min-h-[420px] rounded-[2.5rem]" />
        </div>
      </section>

      {/* Bài viết skeleton */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="skeleton-pulse mb-16 h-8 w-64" />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="skeleton-pulse h-44 w-full rounded-none" />
              <div className="space-y-3 p-6">
                <div className="skeleton-pulse h-4 w-1/2" />
                <div className="skeleton-pulse h-5 w-3/4" />
                <div className="skeleton-pulse h-4 w-full" />
                <div className="skeleton-pulse h-4 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
