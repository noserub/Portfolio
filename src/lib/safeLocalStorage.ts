const DISPOSABLE_KEY_PREFIXES = [
  "cache_",
  "projectRevisions:",
  "seo-case-study-",
  "seo-writing-post-",
] as const;

const DISPOSABLE_EXACT_KEYS = new Set([
  "__test",
  "__diagnostic_test",
  "freshImport",
  "positionsMigrated",
  "videoFieldsMigrated",
]);

export function isQuotaExceededError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "QuotaExceededError") {
    return true;
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes("quota") || msg.includes("storage");
  }
  return false;
}

export function estimateLocalStorageBytes(): number {
  if (typeof window === "undefined") return 0;
  let total = 0;
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key) ?? "";
    total += (key.length + value.length) * 2;
  }
  return total;
}

function isDisposableKey(key: string): boolean {
  if (DISPOSABLE_EXACT_KEYS.has(key)) return true;
  return DISPOSABLE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/** Remove non-essential local caches to free quota. Does not touch caseStudies or heroText. */
export function pruneDisposableLocalStorage(): { removedKeys: string[]; freedBytes: number } {
  if (typeof window === "undefined") {
    return { removedKeys: [], freedBytes: 0 };
  }

  const removedKeys: string[] = [];
  let freedBytes = 0;

  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (!key || !isDisposableKey(key)) continue;
    const value = localStorage.getItem(key) ?? "";
    freedBytes += (key.length + value.length) * 2;
    localStorage.removeItem(key);
    removedKeys.push(key);
  }

  return { removedKeys, freedBytes };
}

export function canWriteLocalStorage(probeKey = "__storage_probe"): boolean {
  if (typeof window === "undefined") return true;
  try {
    localStorage.setItem(probeKey, "1");
    localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Free disposable keys when needed, then verify a small write succeeds.
 * Returns true when localStorage accepts new writes.
 */
export function ensureLocalStorageHeadroom(): {
  ok: boolean;
  removedKeys: string[];
  freedBytes: number;
  usageBytes: number;
} {
  const usageBytes = estimateLocalStorageBytes();
  if (canWriteLocalStorage()) {
    return { ok: true, removedKeys: [], freedBytes: 0, usageBytes };
  }

  const firstPass = pruneDisposableLocalStorage();
  if (canWriteLocalStorage()) {
    return { ok: true, ...firstPass, usageBytes: estimateLocalStorageBytes() };
  }

  return {
    ok: false,
    removedKeys: firstPass.removedKeys,
    freedBytes: firstPass.freedBytes,
    usageBytes: estimateLocalStorageBytes(),
  };
}

export function safeLocalStorageSet(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (!isQuotaExceededError(err)) {
      console.warn(`localStorage set failed for ${key}:`, err);
      return false;
    }
    const headroom = ensureLocalStorageHeadroom();
    if (!headroom.ok) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (retryErr) {
      console.warn(`localStorage set failed for ${key} after prune:`, retryErr);
      return false;
    }
  }
}

export function safeLocalStorageRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`localStorage remove failed for ${key}:`, err);
  }
}

/** Legacy auth flag: prefer sessionStorage when localStorage is full. */
export function setLegacyAuthFlag(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active) {
    if (!safeLocalStorageSet("isAuthenticated", "true")) {
      try {
        sessionStorage.setItem("isAuthenticated", "true");
      } catch {
        // Supabase session is the source of truth; ignore legacy flag failures.
      }
    }
    return;
  }
  safeLocalStorageRemove("isAuthenticated");
  try {
    sessionStorage.removeItem("isAuthenticated");
  } catch {
    // ignore
  }
}

export function formatStorageMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
