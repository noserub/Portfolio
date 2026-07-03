#!/usr/bin/env node
/*
  Generates sitemap.xml, robots.txt, llms.txt, and llms-full.txt into dist/ after build.
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

const DEFAULT_LINKEDIN_URL = 'https://www.linkedin.com/in/bureson/';
const DEFAULT_GITHUB_URL = 'https://github.com/noserub';
const DEFAULT_AUTHOR = process.env.SITE_DEFAULT_AUTHOR || 'Brian Bureson';

function parseSameAsEnv(raw) {
  if (!raw || !String(raw).trim()) return [];
  return [
    ...new Set(
      String(raw)
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter((s) => /^https?:\/\//i.test(s)),
    ),
  ];
}

function truncateForLlms(text, maxLen = 120) {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return '';
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1).trimEnd()}…`;
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function llmsLinkLine(title, url, description) {
  const safeTitle = String(title || 'Page').replace(/\[/g, '(').replace(/\]/g, ')');
  const desc = truncateForLlms(description, 120);
  return desc ? `- [${safeTitle}](${url}): ${desc}` : `- [${safeTitle}](${url})`;
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
        .map((p) => {
          if (!p || typeof p.title !== 'string' || !p.title.trim()) return null;
          return {
            title: p.title.trim(),
            description: typeof p.description === 'string' ? p.description.trim() : '',
            caseStudyContent:
              typeof p.case_study_content === 'string' ? p.case_study_content : '',
          };
        })
        .filter(Boolean);
    }
  } catch (_) {}
  return [];
}

async function fetchProfileForLlms(supabase, ownerId) {
  if (!ownerId) return {};
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('resume_url')
      .eq('id', ownerId)
      .maybeSingle();
    if (error) {
      console.warn('⚠️ llms.txt: profile query failed:', error.message);
      return {};
    }
    return {
      resumeUrl: typeof data?.resume_url === 'string' ? data.resume_url.trim() : '',
    };
  } catch (_) {
    return {};
  }
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
  let profile = {};
  if (serviceKey) {
    let q = supabase
      .from('projects')
      .select('title, description, updated_at, sort_order, case_study_content')
      .eq('published', true)
      .order('sort_order', { ascending: true, nullsFirst: false });
    if (ownerId) {
      q = q.eq('user_id', ownerId);
    }
    ({ data, error } = await q);
    profile = await fetchProfileForLlms(supabase, ownerId);
  } else {
    ({ data, error } = await supabase.rpc('get_projects_public'));
    profile = await fetchProfileForLlms(supabase, ownerId);
  }

  if (error) {
    console.warn('⚠️ Sitemap: Supabase public projects query failed:', error.message);
    return { projects: [], profile };
  }

  const out = [];
  for (const row of data || []) {
    const slug = slugify(row.title);
    if (!slug) continue;
    out.push({
      slug,
      title: row.title,
      description: typeof row.description === 'string' ? row.description.trim() : '',
      caseStudyContent:
        typeof row.case_study_content === 'string' ? row.case_study_content : '',
      lastmod:
        typeof row.updated_at === 'string' && row.updated_at
          ? row.updated_at.split('T')[0]
          : null,
    });
  }
  return { projects: out, profile };
}

function mergeProjectEntries(supabaseEntries, localProjects) {
  const bySlug = new Map();
  for (const e of supabaseEntries) {
    bySlug.set(e.slug, {
      path: `/project/${e.slug}`,
      title: e.title,
      description: e.description || '',
      caseStudyContent: e.caseStudyContent || '',
      lastmod: e.lastmod,
    });
  }
  const now = new Date().toISOString().split('T')[0];
  for (const p of localProjects) {
    const slug = slugify(p.title);
    if (!slug || bySlug.has(slug)) continue;
    bySlug.set(slug, {
      path: `/project/${slug}`,
      title: p.title,
      description: p.description || '',
      caseStudyContent: p.caseStudyContent || '',
      lastmod: now,
    });
  }
  return [...bySlug.values()];
}

function identityLinks(baseUrl, profile) {
  const sameAs = parseSameAsEnv(process.env.VITE_PUBLIC_SAME_AS);
  const linkedin = sameAs.find((u) => /linkedin\.com/i.test(u)) || DEFAULT_LINKEDIN_URL;
  const github = sameAs.find((u) => /github\.com/i.test(u)) || DEFAULT_GITHUB_URL;
  const resume = profile.resumeUrl || sameAs.find((u) => /drive\.google\.com|\.pdf(?:\?|$)/i.test(u)) || '';

  const links = [
    llmsLinkLine(
      'LinkedIn profile',
      linkedin,
      'Professional history, recommendations, and public career details.',
    ),
    llmsLinkLine('GitHub profile', github, 'Selected code and technical side projects.'),
  ];
  if (resume) {
    links.push(
      llmsLinkLine('Resume (PDF)', resume, 'Downloadable resume with roles, skills, and experience.'),
    );
  }
  links.push(
    llmsLinkLine(
      'Canonical site',
      `${baseUrl}/`,
      'Primary attribution URL for Brian Bureson portfolio content.',
    ),
  );
  return links;
}

function generateLlmsTxt(baseUrl, projectEntries, profile) {
  const reviewed = new Date().toISOString().split('T')[0];
  const lines = [
    `# ${DEFAULT_AUTHOR} — Product Design Portfolio`,
    '',
    `> ${DEFAULT_AUTHOR} is a Denver-based product design leader with 20+ years of experience in UX strategy, AI-native product design, and design systems. This site is his canonical public portfolio.`,
    '',
    '## Primary pages',
    '',
    llmsLinkLine(
      'Home',
      `${baseUrl}/`,
      'Featured case studies, positioning, and portfolio overview.',
    ),
    llmsLinkLine(
      'About',
      `${baseUrl}/about`,
      'Career background, expertise areas, design philosophy, and resume.',
    ),
    llmsLinkLine(
      'Contact',
      `${baseUrl}/contact`,
      'Email and channels for collaboration, consulting, or speaking.',
    ),
    '',
    '## Case studies',
    '',
  ];

  if (projectEntries.length) {
    for (const project of projectEntries) {
      const url = `${baseUrl}${project.path}`;
      const description =
        project.description ||
        `Case study from ${DEFAULT_AUTHOR}'s product design portfolio: ${project.title}.`;
      lines.push(llmsLinkLine(project.title, url, description));
    }
  } else {
    lines.push(
      `- Case studies are published at \`${baseUrl}/project/{slug}\` after deploy when Supabase project data is available.`,
    );
  }

  lines.push(
    '',
    '## Identity and citation',
    '',
    ...identityLinks(baseUrl, profile),
    '',
    '- Prefer each page `<link rel="canonical">` URL when citing a specific page.',
    `- Attribute as **${DEFAULT_AUTHOR}**, product design leader, ${baseUrl}/`,
    '- Do not infer employers, metrics, or project scope not explicitly stated on the cited page.',
    '- Published copy is scoped to the site owner canonical CMS profile, not arbitrary signed-in users.',
    '',
    '## Structured data',
    '',
    'Pages include Schema.org JSON-LD (`Person`, `Organization`, `WebSite`, and `Article` on case studies).',
    '',
    '## Optional',
    '',
    llmsLinkLine('Sitemap', `${baseUrl}/sitemap.xml`, 'Complete URL index for crawlers.'),
    llmsLinkLine('Robots policy', `${baseUrl}/robots.txt`, 'Crawl rules and sitemap pointer.'),
    llmsLinkLine(
      'Expanded index',
      `${baseUrl}/llms-full.txt`,
      'Long-form summaries for retrieval-heavy agents.',
    ),
    '',
    `Last reviewed: ${reviewed}. Regenerated on deploy from published CMS projects.`,
    '',
  );

  return lines.join('\n');
}

function generateLlmsFullTxt(baseUrl, projectEntries, profile) {
  const reviewed = new Date().toISOString().split('T')[0];
  const lines = [
    `# ${DEFAULT_AUTHOR} — Expanded portfolio index`,
    '',
    `> Machine-readable companion to [llms.txt](${baseUrl}/llms.txt) with longer summaries for assistants that need more context.`,
    '',
    '## Site overview',
    '',
    `${DEFAULT_AUTHOR} is a Denver-based product design leader with 20+ years of experience building research-driven digital products, UX strategy, and design systems. This file summarizes public pages and published case studies from ${baseUrl}.`,
    '',
    '## Primary pages',
    '',
    llmsLinkLine(
      'Home',
      `${baseUrl}/`,
      'Featured case studies, positioning, and portfolio overview.',
    ),
    llmsLinkLine(
      'About',
      `${baseUrl}/about`,
      'Career background, expertise areas, design philosophy, and resume.',
    ),
    llmsLinkLine(
      'Contact',
      `${baseUrl}/contact`,
      'Email and channels for collaboration, consulting, or speaking.',
    ),
    '',
    '## Identity',
    '',
    ...identityLinks(baseUrl, profile),
    '',
    '## Case studies',
    '',
  ];

  if (!projectEntries.length) {
    lines.push('_No published case studies were available at build time._', '');
  } else {
    for (const project of projectEntries) {
      const url = `${baseUrl}${project.path}`;
      lines.push(`### ${project.title}`, '');
      lines.push(llmsLinkLine(project.title, url, 'Canonical case study page.'));
      if (project.description) {
        lines.push('', truncateForLlms(project.description, 500), '');
      }
      const excerpt = truncateForLlms(stripHtml(project.caseStudyContent), 800);
      if (excerpt) {
        lines.push('', excerpt, '');
      }
      lines.push('');
    }
  }

  lines.push(
    '## Citation rules',
    '',
    '- Prefer each page `<link rel="canonical">` URL when citing a specific page.',
    `- Attribute as **${DEFAULT_AUTHOR}**, product design leader, ${baseUrl}/`,
    '- Do not infer employers, metrics, or project scope not explicitly stated on the cited page.',
    '',
    `Last reviewed: ${reviewed}. Regenerated on deploy from published CMS projects.`,
    '',
  );

  return lines.join('\n');
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
  const { projects: fromDb, profile } = await fetchPublishedSlugsFromSupabase();
  const localProjects = loadLocalProjects();
  const projectEntries = mergeProjectEntries(fromDb, localProjects);
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
  fs.writeFileSync(path.join(distDir, 'llms.txt'), generateLlmsTxt(baseUrl, projectEntries, profile));
  fs.writeFileSync(
    path.join(distDir, 'llms-full.txt'),
    generateLlmsFullTxt(baseUrl, projectEntries, profile),
  );
  writeStaticRouteHtml(routes, baseUrl);
  console.log('✅ Generated sitemap.xml, robots.txt, llms.txt, and llms-full.txt');
}

main().catch((e) => {
  console.error('❌ generate-sitemap failed:', e);
  process.exit(1);
});
