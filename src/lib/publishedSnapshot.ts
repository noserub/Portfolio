import snapshotJson from "../data/publishedSnapshot.json";

/** Read-only copy of the public portfolio. Used only when Supabase cannot be reached. */
export type PublishedSnapshot = {
  exportedAt: string;
  profile: Record<string, unknown>;
  projects: Record<string, unknown>[];
  writingPosts: Record<string, unknown>[];
  pageVisibility: {
    about: boolean;
    contact: boolean;
    writing: boolean;
    writing_index_grid: unknown;
    writing_index_content: unknown;
  };
  seoRows: Record<string, unknown>[];
  fontTheme: string | null;
  faviconUrl: string | null;
  logoUrl: string | null;
};

export const publishedSnapshot = snapshotJson as PublishedSnapshot;

/** How long a public read may wait before the saved snapshot is shown. */
export const PUBLISHED_SNAPSHOT_FALLBACK_MS = 4000;

/** Dev/preview switch. Set VITE_FORCE_PUBLISHED_SNAPSHOT=true to render the snapshot without calling Supabase. */
export function preferPublishedSnapshot(): boolean {
  return import.meta.env.VITE_FORCE_PUBLISHED_SNAPSHOT === "true";
}

function errorText(error: unknown, depth = 0): string {
  if (!error || depth > 2) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    const cause = "cause" in error ? errorText(error.cause, depth + 1) : "";
    return `${error.name} ${error.message} ${cause}`.trim();
  }
  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const cause = errorText(record.cause, depth + 1);
    return ["name", "message", "details", "hint", "code"]
      .map((key) => (typeof record[key] === "string" ? record[key] : ""))
      .concat(cause)
      .filter(Boolean)
      .join(" ");
  }
  return String(error);
}

function errorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const record = error as Record<string, unknown>;
  const status = record.status ?? record.statusCode;
  return typeof status === "number" ? status : null;
}

/**
 * True when the project is paused, offline, or the request never reached Postgres.
 * Schema and permission errors stay false so a live database is not replaced by the snapshot.
 */
export function isSupabaseUnavailable(error: unknown): boolean {
  if (!error) return false;
  const status = errorStatus(error);
  if (status != null && [408, 500, 502, 503, 504, 520, 521, 522, 523, 524, 540].includes(status)) {
    return true;
  }
  const text = errorText(error);
  if (/supabase-timeout|project-slug-lookup-timeout|navigate-to-project-timeout/i.test(text)) {
    return true;
  }
  if (
    /PGRST|42P01|23505|permission denied|row-level security|JWT expired|invalid api key/i.test(text) &&
    !/failed to fetch|network|paused|timeout/i.test(text)
  ) {
    return false;
  }
  return /failed to fetch|fetch failed|networkerror|network request failed|load failed|authretryablefetcherror|fetcherror|econnrefused|enotfound|getaddrinfo|etimedout|timed out|timeout|project is paused|paused|gateway|abort|522|503/i.test(
    text,
  );
}

export function snapshotHeroText(): unknown {
  return publishedSnapshot.profile?.hero_text ?? null;
}

export function snapshotAboutProfile<T>(): T {
  return publishedSnapshot.profile as T;
}

export function snapshotProjects<T>(): T[] {
  return (publishedSnapshot.projects ?? []) as T[];
}

export function snapshotProjectById(id: string): Record<string, unknown> | null {
  return (
    publishedSnapshot.projects.find((project) => String(project.id) === id) ?? null
  );
}

export function snapshotWritingPosts<T>(): T[] {
  return (publishedSnapshot.writingPosts ?? []) as T[];
}

export function snapshotWritingPostBySlug(slug: string): Record<string, unknown> | null {
  const target = slug.trim().toLowerCase();
  return (
    publishedSnapshot.writingPosts.find(
      (post) => String(post.slug ?? "").trim().toLowerCase() === target,
    ) ?? null
  );
}
