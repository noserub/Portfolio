import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

/**
 * Loads Vercel Analytics + Speed Insights after idle time so they don't compete
 * with first-paint JS on slow mobile CPUs / connections.
 */
export function DeferredVercelMonitoring({ route }: { route: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fire = () => {
      if (!cancelled) setReady(true);
    };
    const idleId =
      typeof requestIdleCallback !== "undefined"
        ? requestIdleCallback(fire, { timeout: 4000 })
        : null;
    const timeoutId = idleId == null ? setTimeout(fire, 1) : null;
    return () => {
      cancelled = true;
      if (idleId != null) cancelIdleCallback(idleId);
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights sampleRate={1} route={route} />
    </>
  );
}
