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
  const staticPaths = ['/', '/#/about', '/#/contact'];
  const titles = loadLocalProjects();
  const projectPaths = titles.map(t => `/#/project/${slugify(t)}`);
  const urls = [...staticPaths, ...projectPaths];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${baseUrl}${u}</loc></url>`).join('\n') +
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


