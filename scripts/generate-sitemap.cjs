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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;
  const key = serviceKey || publicKey;
  if (!url || !key) {
    return [];
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ownerId =
    process.env.VITE_PUBLIC_PORTFOLIO_OWNER_ID || process.env.SUPABASE_PORTFOLIO_OWNER_ID || '';

  let data;
  let error;
  if (serviceKey) {
    let q = supabase.from('projects').select('title, updated_at').eq('published', true);
    if (ownerId) {
      q = q.eq('user_id', ownerId);
    }
    ({ data, error } = await q);
  } else {
    ({ data, error } = await supabase.rpc('get_projects_public'));
  }

  if (error) {
    console.warn('⚠️ Sitemap: Supabase public projects query failed:', error.message);
    return [];
  }

  const out = [];
  for (const row of data || []) {
    const slug = slugify(row.title);
    if (!slug) continue;
    out.push({
      slug,
      title: row.title,
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
    bySlug.set(e.slug, { path: `/project/${e.slug}`, title: e.title, lastmod: e.lastmod });
  }
  const now = new Date().toISOString().split('T')[0];
  for (const t of localTitles) {
    const slug = slugify(t);
    if (!slug || bySlug.has(slug)) continue;
    bySlug.set(slug, { path: `/project/${slug}`, title: t, lastmod: now });
  }
  return [...bySlug.values()];
}

function getSitemapRoutes(projectEntries) {
  const staticPaths = [
    { path: '/', priority: '1.0', changefreq: 'weekly', lastmod: null },
    { path: '/about', priority: '0.8', changefreq: 'monthly', lastmod: null },
    { path: '/contact', priority: '0.7', changefreq: 'monthly', lastmod: null },
  ];

  const now = new Date().toISOString().split('T')[0];
  const projectPaths = projectEntries.map((e) => ({
    path: e.path,
    title: e.title,
    priority: '0.9',
    changefreq: 'monthly',
    lastmod: e.lastmod || now,
  }));

  return [...staticPaths, ...projectPaths];
}

function generateSitemap(baseUrl, routes) {
  const urls = routes;
  const now = new Date().toISOString().split('T')[0];

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

function escapeHtmlAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function upsertTag(html, selectorPattern, replacement, insertBefore = '</head>') {
  if (selectorPattern.test(html)) {
    return html.replace(selectorPattern, replacement);
  }
  return html.replace(insertBefore, `${replacement}\n${insertBefore}`);
}

function metadataForRoute(route, baseUrl) {
  if (route.path === '/') {
    return {
      title: 'Brian Bureson - Product Design Leader',
      description:
        'Brian Bureson is a Denver-based product design leader with 20+ years of experience building research-driven digital products, UX strategy, and design systems.',
      canonical: `${baseUrl}/`,
    };
  }
  if (route.path === '/about') {
    return {
      title: 'About - Brian Bureson',
      description:
        'Learn more about Brian Bureson, a Denver-based product design leader focused on UX strategy, AI-native product design, and design systems.',
      canonical: `${baseUrl}/about`,
    };
  }
  if (route.path === '/contact') {
    return {
      title: 'Contact - Brian Bureson',
      description:
        'Get in touch with Brian Bureson for design collaboration, consulting, or speaking opportunities.',
      canonical: `${baseUrl}/contact`,
    };
  }
  const projectTitle = route.title || 'Case Study';
  return {
    title: `${projectTitle} - Brian Bureson`,
    description: `Case study from Brian Bureson's product design portfolio: ${projectTitle}.`,
    canonical: `${baseUrl}${route.path}`,
  };
}

function htmlForRoute(baseHtml, route, baseUrl) {
  const meta = metadataForRoute(route, baseUrl);
  const title = escapeHtmlAttr(meta.title);
  const description = escapeHtmlAttr(meta.description);
  const canonical = escapeHtmlAttr(meta.canonical);

  let html = baseHtml;
  html = upsertTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = upsertTag(
    html,
    /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="description" content="${description}" />`,
  );
  html = upsertTag(
    html,
    /<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/i,
    `<link rel="canonical" href="${canonical}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:title" content="${title}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:description" content="${description}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:url["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:url" content="${canonical}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+name=["']twitter:title["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="twitter:title" content="${title}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="twitter:description" content="${description}" />`,
  );

  return html;
}

function writeStaticRouteHtml(routes, baseUrl) {
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.warn('⚠️ Static route HTML skipped: dist/index.html not found');
    return;
  }

  const baseHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  for (const route of routes) {
    if (route.path === '/') {
      fs.writeFileSync(indexHtmlPath, htmlForRoute(baseHtml, route, baseUrl), 'utf8');
      continue;
    }

    const routeDir = path.join(distDir, route.path.replace(/^\/+/, ''));
    ensureDir(routeDir);
    fs.writeFileSync(path.join(routeDir, 'index.html'), htmlForRoute(baseHtml, route, baseUrl), 'utf8');
  }
  console.log(`✅ Generated ${routes.length} static HTML route(s) with route-specific canonical URLs`);
}

async function main() {
  const baseUrl = (process.env.SITE_URL || 'https://www.bureson.com').replace(/\/+$/, '');
  const fromDb = await fetchPublishedSlugsFromSupabase();
  const localTitles = loadLocalProjects();
  const projectEntries = mergeProjectEntries(fromDb, localTitles);
  const routes = getSitemapRoutes(projectEntries);

  if (fromDb.length) {
    console.log(`✅ Sitemap: ${fromDb.length} published project URL(s) from Supabase`);
  } else {
    console.log(
      'ℹ️ Sitemap: no Supabase project rows (set Supabase env vars for production project URLs)',
    );
  }

  ensureDir(distDir);
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), generateSitemap(baseUrl, routes));
  fs.writeFileSync(path.join(distDir, 'robots.txt'), generateRobots(baseUrl));
  writeStaticRouteHtml(routes, baseUrl);
  console.log('✅ Generated sitemap.xml and robots.txt');
}

main().catch((e) => {
  console.error('❌ generate-sitemap failed:', e);
  process.exit(1);
});
