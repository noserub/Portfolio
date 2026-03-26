import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const CHUNK_RELOAD_TS_KEY = "chunk_autoreload_last_ts";
/** Prevents tight reload loops when a chunk is permanently unavailable (offline, etc.). */
const MIN_MS_BETWEEN_AUTO_RELOADS = 30_000;

/**
 * True when a lazy-loaded JS chunk failed to load — usually a new deploy replaced
 * hashed filenames while the tab still references the previous build.
 */
export function isLikelyStaleBuildChunkError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Loading chunk") ||
    msg.includes("ChunkLoadError") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("error loading dynamically imported module")
  );
}

/**
 * Wraps React.lazy so a failed chunk load triggers one throttled full reload to pick up
 * the current index.html + asset manifest after a deployment.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (e) {
      if (!isLikelyStaleBuildChunkError(e)) {
        throw e;
      }
      if (typeof window === "undefined") {
        throw e;
      }
      const now = Date.now();
      const last = parseInt(sessionStorage.getItem(CHUNK_RELOAD_TS_KEY) || "0", 10);
      if (now - last > MIN_MS_BETWEEN_AUTO_RELOADS) {
        sessionStorage.setItem(CHUNK_RELOAD_TS_KEY, String(now));
        window.location.reload();
        return new Promise(() => {});
      }
      throw e;
    }
  });
}
