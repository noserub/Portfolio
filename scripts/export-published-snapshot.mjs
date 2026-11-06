#!/usr/bin/env node
/**
 * Read-only export of the public portfolio into src/data/publishedSnapshot.json
 * and public/snapshot/. Does not write to Supabase.
 *
 * Usage: node scripts/export-published-snapshot.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT_DIR = path.join(ROOT, "public", "snapshot");
const JSON_PATH = path.join(ROOT, "src", "data", "publishedSnapshot.json");
const BRAND_LOGO =
  "https://ljapwsajftxltykmpsmz.supabase.co/storage/v1/object/public/portfolio-images/BrB-black.png";

function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = value;
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = (env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const anonKey = env.VITE_SUPABASE_ANON_KEY || "";
const ownerId =
  env.VITE_PUBLIC_PORTFOLIO_OWNER_ID || "7cd2752f-93c5-46e6-8535-32769fb10055";

if (!supabaseUrl || !anonKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const headers = {
  apikey: anonKey,
  Authorization: `Bearer ${anonKey}`,
  "Content-Type": "application/json",
};

async function rest(pathname, options = {}) {
  const res = await fetch(`${supabaseUrl}${pathname}`, { headers, ...options });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`${pathname} ${res.status} ${typeof body === "string" ? body.slice(0, 200) : JSON.stringify(body).slice(0, 200)}`);
  }
  return body;
}

const STORAGE_RE =
  /https?:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/(?:object|render\/image)\/public\/portfolio-images\/[^\s"'\\)]+/gi;

function objectKeyFromUrl(raw) {
  const cleaned = String(raw).replace(/\\u0026/g, "&").split("#")[0];
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(cleaned).pathname);
  } catch {
    return null;
  }
  const markers = [
    "/storage/v1/object/public/portfolio-images/",
    "/storage/v1/render/image/public/portfolio-images/",
  ];
  for (const marker of markers) {
    const index = pathname.indexOf(marker);
    if (index === -1) continue;
    const rel = pathname
      .slice(index + marker.length)
      .replace(/^\/+/, "")
      .replace(/^portfolio-images\//, "");
    if (!rel || rel.includes("..")) return null;
    return rel;
  }
  return null;
}

function collectUrls(value, into) {
  if (typeof value === "string") {
    const matches = value.match(STORAGE_RE);
    if (matches) {
      for (const match of matches) into.add(match);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectUrls(item, into);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectUrls(item, into);
  }
}

function rewriteStrings(value, keyToLocal) {
  if (typeof value === "string") {
    return value.replace(STORAGE_RE, (match) => {
      const key = objectKeyFromUrl(match);
      return key && keyToLocal.has(key) ? keyToLocal.get(key) : match;
    });
  }
  if (Array.isArray(value)) return value.map((item) => rewriteStrings(item, keyToLocal));
  if (value && typeof value === "object") {
    const next = {};
    for (const [key, item] of Object.entries(value)) {
      next[key] = rewriteStrings(item, keyToLocal);
    }
    return next;
  }
  return value;
}

async function downloadKey(key) {
  const encoded = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const remote = `${supabaseUrl}/storage/v1/object/public/portfolio-images/${encoded}`;
  const res = await fetch(remote);
  if (!res.ok) {
    throw new Error(`${res.status} ${key}`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  const dest = path.join(SNAPSHOT_DIR, key);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, bytes);
  return bytes.length;
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

const profileRows = await rest(
  `/rest/v1/profiles?id=eq.${ownerId}&select=*`,
);
const profile = Array.isArray(profileRows) ? profileRows[0] : null;
if (!profile) {
  console.error("No public profile row for owner", ownerId);
  process.exit(1);
}

const projects = await rest("/rest/v1/rpc/get_projects_public", {
  method: "POST",
  body: "{}",
});
const writingPosts = await rest("/rest/v1/rpc/get_writing_posts_public", {
  method: "POST",
  body: JSON.stringify({ p_owner_id: ownerId }),
});
const visibilityRows = await rest(
  `/rest/v1/page_visibility?user_id=eq.${ownerId}&select=about,contact,writing,writing_index_grid,writing_index_content`,
);
const seoRows = await rest(`/rest/v1/seo_data?user_id=eq.${ownerId}&select=*`);
const settingsRows = await rest(
  `/rest/v1/app_settings?user_id=eq.${ownerId}&select=font_theme,favicon_url,logo_url`,
);

const visibility = Array.isArray(visibilityRows) ? visibilityRows[0] : null;
const settings = Array.isArray(settingsRows) ? settingsRows[0] : null;

for (const project of projects || []) {
  if (project && typeof project === "object") delete project.password;
}

const payload = {
  exportedAt: new Date().toISOString(),
  profile,
  projects: Array.isArray(projects) ? projects : [],
  writingPosts: Array.isArray(writingPosts) ? writingPosts : [],
  pageVisibility: {
    about: visibility?.about ?? true,
    contact: visibility?.contact ?? true,
    writing: visibility?.writing ?? true,
    writing_index_grid: visibility?.writing_index_grid ?? "double",
    writing_index_content: visibility?.writing_index_content ?? null,
  },
  seoRows: Array.isArray(seoRows) ? seoRows : [],
  fontTheme: typeof settings?.font_theme === "string" ? settings.font_theme : null,
  faviconUrl: typeof settings?.favicon_url === "string" ? settings.favicon_url : null,
  logoUrl:
    typeof settings?.logo_url === "string" && settings.logo_url.trim()
      ? settings.logo_url
      : BRAND_LOGO,
};

const urls = new Set([BRAND_LOGO]);
collectUrls(payload, urls);

const keyToLocal = new Map();
const keys = [];
for (const url of urls) {
  const key = objectKeyFromUrl(url);
  if (!key) {
    console.warn("skip unparsed storage url", url.slice(0, 120));
    continue;
  }
  keyToLocal.set(key, `/snapshot/${key.split("/").map(encodeURIComponent).join("/")}`);
  if (!keys.includes(key)) keys.push(key);
}

fs.rmSync(SNAPSHOT_DIR, { recursive: true, force: true });
fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

let downloadedBytes = 0;
const failed = [];
await mapPool(keys, 8, async (key) => {
  try {
    downloadedBytes += await downloadKey(key);
  } catch (error) {
    failed.push({ key, message: error instanceof Error ? error.message : String(error) });
    keyToLocal.delete(key);
  }
});

let rewritten = rewriteStrings(payload, keyToLocal);

const strip = rewritten.profile?.hero_text?.logoStrip;
if (strip && Array.isArray(strip.entries)) {
  let kept = 0;
  strip.entries = strip.entries.map((entry) => {
    const imageUrl = typeof entry?.imageUrl === "string" ? entry.imageUrl : "";
    if (imageUrl.startsWith("/snapshot/")) {
      const rel = decodeURIComponent(imageUrl.replace(/^\/snapshot\//, ""));
      const file = path.join(SNAPSHOT_DIR, rel);
      if (fs.existsSync(file)) {
        kept += 1;
        return entry;
      }
    }
    if (imageUrl && !imageUrl.includes("supabase.co/storage")) {
      kept += 1;
      return entry;
    }
    return { ...entry, imageUrl: null };
  });
  if (kept === 0) strip.enabled = false;
}

fs.mkdirSync(path.dirname(JSON_PATH), { recursive: true });
fs.writeFileSync(JSON_PATH, `${JSON.stringify(rewritten)}\n`);

const logoEntries = rewritten.profile?.hero_text?.logoStrip?.entries ?? [];
console.log(
  JSON.stringify(
    {
      exportedAt: rewritten.exportedAt,
      projects: rewritten.projects.length,
      writingPosts: rewritten.writingPosts.length,
      seoRows: rewritten.seoRows.length,
      files: keys.length - failed.length,
      failed: failed.length,
      mb: Number((downloadedBytes / 1024 / 1024).toFixed(2)),
      logoStripEnabled: rewritten.profile?.hero_text?.logoStrip?.enabled ?? null,
      logos: logoEntries.map((entry) => ({
        name: entry?.name,
        local: typeof entry?.imageUrl === "string" && entry.imageUrl.startsWith("/snapshot/"),
      })),
      favicon: rewritten.faviconUrl,
      fontTheme: rewritten.fontTheme,
    },
    null,
    2,
  ),
);
if (failed.length) {
  console.warn("failed downloads", failed.slice(0, 20));
}
