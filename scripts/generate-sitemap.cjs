#!/usr/bin/env node
/*
  Generates a minimal sitemap.xml and robots.txt into dist/ after build.
  Assumes hash routing; includes top-level routes and project slugs from local data if available.
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const distDir = path.join(ROOT, 'dist');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadLocalProjects() {
  try {
    const lsPath = path.join(ROOT, 'portfolio-backup-placeholder-2025-10-17T18-02-15.json');
    if (fs.existsSync(lsPath)) {
      const raw = fs.readFileSync(lsPath, 'utf8');
      const data = JSON.parse(raw);
      const caseStudies = Array.isArray(data?.caseStudies) ? data.caseStudies : [];
      return caseStudies.map(p => p.title).filter(Boolean);
    }
  } catch (_) {}
  return [];
}

function slugify(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function generateSitemap(baseUrl) {
  // Remove hash fragments - use proper paths for SEO
  const staticPaths = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/about', priority: '0.8', changefreq: 'monthly' },
    { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  ];
  
  const titles = loadLocalProjects();
  const projectPaths = titles.map(t => ({
    path: `/project/${slugify(t)}`,
    priority: '0.9',
    changefreq: 'monthly',
  }));
  
  const urls = [...staticPaths, ...projectPaths];
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => {
      const path = typeof u === 'string' ? u : u.path;
      const priority = typeof u === 'string' ? '0.8' : u.priority;
      const changefreq = typeof u === 'string' ? 'monthly' : u.changefreq;
      return `  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    }).join('\n') +
    `\n</urlset>\n`;
  return xml;
}

function generateRobots(baseUrl) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
}

function main() {
  const baseUrl = process.env.SITE_URL || 'https://portfolio-bb.vercel.app';
  ensureDir(distDir);
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), generateSitemap(baseUrl));
  fs.writeFileSync(path.join(distDir, 'robots.txt'), generateRobots(baseUrl));
  console.log('✅ Generated sitemap.xml and robots.txt');
}

main();


