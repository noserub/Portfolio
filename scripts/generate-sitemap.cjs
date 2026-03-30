#!/usr/bin/env node
/*
  Generates sitemap.xml and robots.txt into dist/ after build.
  Static routes plus /project/{slug} from published Supabase projects when
  SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (or SUPABASE_URL) are set.
  Falls back to portfolio-backup-*.json titles when Supabase is unavailable.
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const distDir = path.join(ROOT, 'dist');

require('dotenv').config({ path: path.join(ROOT, '.env.local') });
require('dotenv').config({ path: path.join(ROOT, '.env') });

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Keep in sync with src/lib/projectSlug.ts */
function slugify(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function loadLocalProjects() {
  try {
    const candidates = fs
      .readdirSync(ROOT)
      .filter((name) => /^portfolio-backup-.*\.json$/i.test(name))
      .map((name) => ({
        fullPath: path.join(ROOT, name),
        mtimeMs: fs.statSync(path.join(ROOT, name)).mtimeMs,
      }))
      .sort((a, b) => b.mtimeMs - a.mtimeMs);

    if (candidates.length > 0) {
      const newest = candidates[0];
      const raw = fs.readFileSync(newest.fullPath, 'utf8');
      const data = JSON.parse(raw);
      const caseStudies = Array.isArray(data?.caseStudies) ? data.caseStudies : [];
      return caseStudies
        .map((p) => (p && typeof p.title === 'string' ? p.title : ''))
        .filter(Boolean);
    }
  } catch (_) {}
  return [];
}

async function fetchPublishedSlugsFromSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return [];
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ownerId =
    process.env.VITE_PUBLIC_PORTFOLIO_OWNER_ID || process.env.SUPABASE_PORTFOLIO_OWNER_ID || '';

  let q = supabase.from('projects').select('title, updated_at').eq('published', true);
  if (ownerId) {
    q = q.eq('user_id', ownerId);
  }

  const { data, error } = await q;
  if (error) {
    console.warn('⚠️ Sitemap: Supabase projects query failed:', error.message);
    return [];
  }

  const out = [];
  for (const row of data || []) {
    const slug = slugify(row.title);
    if (!slug) continue;
    out.push({
      slug,
      lastmod:
        typeof row.updated_at === 'string' && row.updated_at
          ? row.updated_at.split('T')[0]
          : null,
    });
  }
  return out;
}

function mergeProjectEntries(supabaseEntries, localTitles) {
  const bySlug = new Map();
  for (const e of supabaseEntries) {
    bySlug.set(e.slug, { path: `/project/${e.slug}`, lastmod: e.lastmod });
  }
  const now = new Date().toISOString().split('T')[0];
  for (const t of localTitles) {
    const slug = slugify(t);
    if (!slug || bySlug.has(slug)) continue;
    bySlug.set(slug, { path: `/project/${slug}`, lastmod: now });
  }
  return [...bySlug.values()];
}

function generateSitemap(baseUrl, projectEntries) {
  const staticPaths = [
    { path: '/', priority: '1.0', changefreq: 'weekly', lastmod: null },
    { path: '/about', priority: '0.8', changefreq: 'monthly', lastmod: null },
    { path: '/contact', priority: '0.7', changefreq: 'monthly', lastmod: null },
  ];

  const now = new Date().toISOString().split('T')[0];
  const projectPaths = projectEntries.map((e) => ({
    path: e.path,
    priority: '0.9',
    changefreq: 'monthly',
    lastmod: e.lastmod || now,
  }));

  const urls = [...staticPaths, ...projectPaths];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => {
        const lastmod = u.lastmod || now;
        return `  <url>
    <loc>${baseUrl}${u.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`;
      })
      .join('\n') +
    `\n</urlset>\n`;
  return xml;
}

function generateRobots(baseUrl) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
}

async function main() {
  const baseUrl = (process.env.SITE_URL || 'https://www.bureson.com').replace(/\/+$/, '');
  const fromDb = await fetchPublishedSlugsFromSupabase();
  const localTitles = loadLocalProjects();
  const projectEntries = mergeProjectEntries(fromDb, localTitles);

  if (fromDb.length) {
    console.log(`✅ Sitemap: ${fromDb.length} published project URL(s) from Supabase`);
  } else {
    console.log(
      'ℹ️ Sitemap: no Supabase project rows (set SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL for production URLs)',
    );
  }

  ensureDir(distDir);
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), generateSitemap(baseUrl, projectEntries));
  fs.writeFileSync(path.join(distDir, 'robots.txt'), generateRobots(baseUrl));
  console.log('✅ Generated sitemap.xml and robots.txt');
}

main().catch((e) => {
  console.error('❌ generate-sitemap failed:', e);
  process.exit(1);
});
