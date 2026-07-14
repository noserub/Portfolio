/**
 * Layout-stable Suspense / resolve fallback. Prefer this over a centered spinner
 * so chrome stays put and the content column does not jump.
 */
export function RouteContentFallback() {
  return (
    <div
      className="min-h-[60vh] w-full"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="mx-auto w-full max-w-3xl space-y-6 px-6 pb-16 pt-28">
        <div className="h-3 w-24 animate-pulse rounded bg-muted/70" />
        <div className="space-y-3">
          <div className="h-10 w-[min(100%,22rem)] max-w-xl animate-pulse rounded-md bg-muted/80" />
          <div className="h-10 w-[min(100%,16rem)] max-w-md animate-pulse rounded-md bg-muted/70" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted/60" />
          <div className="h-4 w-[95%] animate-pulse rounded bg-muted/60" />
          <div className="h-4 w-[80%] animate-pulse rounded bg-muted/50" />
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
