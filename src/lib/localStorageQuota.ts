/** Bulky legacy keys only — do not remove pageVisibility, theme, or designVariant. */
const REMOVABLE_BLOAT_KEYS = ["caseStudies", "designProjects"] as const;

export function isStorageQuotaError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "QuotaExceededError") return true;
  const message = err instanceof Error ? err.message : String(err ?? "");
  return /quota|QuotaExceeded|exceeded the quota/i.test(message);
}

/** Remove large legacy localStorage entries so the app can boot and CMS can save. */
export function freeLocalStorageForCmsSave(): string[] {
  if (typeof window === "undefined" || !("localStorage" in window)) return [];

  const removed: string[] = [];

  for (const key of REMOVABLE_BLOAT_KEYS) {
    if (localStorage.getItem(key) != null) {
      localStorage.removeItem(key);
      removed.push(key);
    }
  }

  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith("cache_") || key.startsWith("seo-case-study-")) {
      localStorage.removeItem(key);
      removed.push(key);
    }
  }

  return removed;
}

/** Run once at startup if storage is full so theme/scripts and React can write small keys. */
export function ensureLocalStorageWritable(): string[] {
  if (typeof window === "undefined" || !("localStorage" in window)) return [];

  try {
    const probeKey = "__portfolio_storage_probe__";
    localStorage.setItem(probeKey, "1");
    localStorage.removeItem(probeKey);
    return [];
  } catch (err) {
    if (!isStorageQuotaError(err)) return [];
    return freeLocalStorageForCmsSave();
  }
}

export type LocalStorageWriteResult = {
  ok: boolean;
  quotaError?: boolean;
  freedKeys?: string[];
};

/** Best-effort localStorage write with one quota recovery pass. */
export function tryWriteLocalStorage(key: string, value: string): LocalStorageWriteResult {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return { ok: false };
  }

  try {
    localStorage.setItem(key, value);
    return { ok: true };
  } catch (err) {
    if (!isStorageQuotaError(err)) {
      return { ok: false, quotaError: false };
    }

    const freedKeys = freeLocalStorageForCmsSave();
    try {
      localStorage.setItem(key, value);
      return { ok: true, freedKeys };
    } catch (retryErr) {
      return { ok: false, quotaError: isStorageQuotaError(retryErr) };
    }
  }
}
