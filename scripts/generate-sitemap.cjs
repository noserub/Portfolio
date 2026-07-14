#!/usr/bin/env node
/*
  Generates sitemap.xml, robots.txt, llms.txt, and llms-full.txt into dist/ after build.
  Static routes plus /project/{slug} from published Supabase projects when
  SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (or SUPABASE_URL) are set.
  Falls back to portfolio-backup-*.json titles when Supabase is unavailable.
 */
const fs = require('fs');
const path = require('path');
const {
  DEFAULT_AUTHOR,
  SITE_NAME,
  HOME_TITLE,
  HOME_DESCRIPTION,
  HOME_OG_DESCRIPTION,
  ABOUT_DESCRIPTION,
  WRITING_INDEX_DESCRIPTION,
  FALLBACK_WRITING_POSTS,
  buildDefaultOgImageUrl,
} = require('./seo-defaults.cjs');
const {
  optimizeWritingOgImages,
} = require('./optimize-writing-og-images.cjs');

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
    return { projects: [], profile: {} };
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

async function fetchPublishedWritingFromSupabase() {
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
    let q = supabase
      .from('writing_posts')
      .select('slug, title, excerpt, hero_image, published_at, updated_at, blocks')
      .eq('published', true)
      .order('sort_order', { ascending: false, nullsFirst: false });
    if (ownerId) {
      q = q.eq('user_id', ownerId);
    }
    ({ data, error } = await q);
  } else {
    ({ data, error } = await supabase.rpc('get_writing_posts_public', {
      p_owner_id: ownerId || '7cd2752f-93c5-46e6-8535-32769fb10055',
    }));
  }

  if (error) {
    console.warn('⚠️ Sitemap: Supabase writing posts query failed:', error.message);
    return [];
  }

  const out = [];
  for (const row of data || []) {
    const slug = String(row.slug || '').trim();
    if (!slug) continue;
    out.push({
      slug,
      title: row.title,
      excerpt: typeof row.excerpt === 'string' ? row.excerpt.trim() : '',
      heroImage: typeof row.hero_image === 'string' ? row.hero_image.trim() : '',
      publishedAt:
        typeof row.published_at === 'string' && row.published_at ? row.published_at : null,
      blocks: row.blocks,
      lastmod:
        typeof row.updated_at === 'string' && row.updated_at
          ? row.updated_at.split('T')[0]
          : null,
    });
  }
  return out;
}

function mergeWritingEntries(writingEntries) {
  return writingEntries.map((e) => ({
    slug: e.slug,
    path: `/writing/${e.slug}`,
    title: e.title,
    description: e.excerpt || '',
    heroImage: e.heroImage || '',
    publishedAt: e.publishedAt || null,
    blocks: e.blocks,
    lastmod: e.lastmod,
  }));
}

function excerptFromWritingBlocks(blocks) {
  if (!Array.isArray(blocks)) return '';
  const prose = blocks
    .filter((b) => b && b.type === 'prose' && b.visible !== false)
    .map((b) => String(b.content || ''))
    .join('\n\n');
  return truncateForLlms(stripHtml(prose.replace(/[#>*_\[\]()!`~-]/g, ' ')), 900);
}

function mergeProjectEntries(supabaseEntries, localProjects) {
  const bySlug = new Map();
  for (const e of Array.isArray(supabaseEntries) ? supabaseEntries : []) {
    bySlug.set(e.slug, {
      path: `/project/${e.slug}`,
      title: e.title,
      description: e.description || '',
      caseStudyContent: e.caseStudyContent || '',
      lastmod: e.lastmod,
    });
  }
  const now = new Date().toISOString().split('T')[0];
  for (const p of Array.isArray(localProjects) ? localProjects : []) {
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

function generateLlmsTxt(baseUrl, projectEntries, profile, writingEntries = []) {
  const reviewed = new Date().toISOString().split('T')[0];
  const lines = [
    `# ${DEFAULT_AUTHOR} — AI product design portfolio`,
    '',
    `> ${DEFAULT_AUTHOR} is a Denver-based AI product design leader (Lead Principal UX at Oracle) with 20+ years shipping enterprise generative AI, trust UX, conversational search, and agent experiences. This site is his canonical public portfolio.`,
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
    llmsLinkLine(
      'Writing',
      `${baseUrl}/writing`,
      'Essays on enterprise AI, product design, and shipping trustworthy agent experiences.',
    ),
    '',
    '## Writing',
    '',
  ];

  if (writingEntries.length) {
    for (const post of writingEntries) {
      const url = `${baseUrl}${post.path}`;
      const description =
        post.description ||
        `Essay from ${DEFAULT_AUTHOR}'s writing archive: ${post.title}.`;
      lines.push(llmsLinkLine(post.title, url, description));
    }
  } else {
    lines.push(
      `- Writing posts are published at \`${baseUrl}/writing/{slug}\` when Supabase writing data is available.`,
    );
  }

  lines.push(
    '',
    '## Case studies',
    '',
  );

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
    `- Attribute as **${DEFAULT_AUTHOR}**, AI product design leader, ${baseUrl}/`,
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

function generateLlmsFullTxt(baseUrl, projectEntries, profile, writingEntries = []) {
  const reviewed = new Date().toISOString().split('T')[0];
  const lines = [
    `# ${DEFAULT_AUTHOR} — Expanded portfolio index`,
    '',
    `> Machine-readable companion to [llms.txt](${baseUrl}/llms.txt) with longer summaries for assistants that need more context.`,
    '',
    '## Site overview',
    '',
    `${DEFAULT_AUTHOR} is a Denver-based AI product design leader with 20+ years of experience in enterprise generative AI, trust UX, conversational search, and agent experiences. This file summarizes public pages and published case studies from ${baseUrl}.`,
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
    llmsLinkLine(
      'Writing',
      `${baseUrl}/writing`,
      'Essays on enterprise AI, product design, and agent UX.',
    ),
    '',
    '## Writing',
    '',
  ];

  if (!writingEntries.length) {
    lines.push('_No published writing posts were available at build time._', '');
  } else {
    for (const post of writingEntries) {
      const url = `${baseUrl}${post.path}`;
      lines.push(`### ${post.title}`, '');
      lines.push(llmsLinkLine(post.title, url, 'Canonical writing post.'));
      if (post.description) {
        lines.push('', truncateForLlms(post.description, 500), '');
      }
      const excerpt = excerptFromWritingBlocks(post.blocks);
      if (excerpt) {
        lines.push('', excerpt, '');
      }
      lines.push('');
    }
  }

  lines.push(
    '## Identity',
    '',
    ...identityLinks(baseUrl, profile),
    '',
    '## Case studies',
    '',
  );

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
    `- Attribute as **${DEFAULT_AUTHOR}**, AI product design leader, ${baseUrl}/`,
    '- Do not infer employers, metrics, or project scope not explicitly stated on the cited page.',
    '',
    `Last reviewed: ${reviewed}. Regenerated on deploy from published CMS projects.`,
    '',
  );

  return lines.join('\n');
}

function getSitemapRoutes(projectEntries, writingEntries = []) {
  const staticPaths = [
    { path: '/', priority: '1.0', changefreq: 'weekly', lastmod: null },
    { path: '/about', priority: '0.8', changefreq: 'monthly', lastmod: null },
    { path: '/contact', priority: '0.7', changefreq: 'monthly', lastmod: null },
    { path: '/writing', priority: '0.8', changefreq: 'weekly', lastmod: null, title: 'Writing' },
  ];

  const now = new Date().toISOString().split('T')[0];
  const projectPaths = projectEntries.map((e) => ({
    path: e.path,
    title: e.title,
    description: e.description || '',
    priority: '0.9',
    changefreq: 'monthly',
    lastmod: e.lastmod || now,
  }));

  const writingPaths = writingEntries.map((e) => ({
    path: e.path,
    slug: e.slug,
    title: e.title,
    description: e.description || '',
    heroImage: e.heroImage || '',
    optimizedOgImage: e.optimizedOgImage || '',
    ogImageWidth: e.ogImageWidth || null,
    ogImageHeight: e.ogImageHeight || null,
    publishedAt: e.publishedAt || null,
    blocks: e.blocks,
    priority: '0.7',
    changefreq: 'monthly',
    lastmod: e.lastmod || now,
  }));

  return [...staticPaths, ...writingPaths, ...projectPaths];
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

function resolvePublicImageUrl(baseUrl, imagePath) {
  if (!imagePath) return '';
  const value = String(imagePath).trim();
  if (/^https?:\/\//i.test(value)) return value;
  const base = String(baseUrl || '').replace(/\/+$/, '');
  return `${base}${value.startsWith('/') ? value : `/${value}`}`;
}

function toIso8601(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function metadataForRoute(route, baseUrl) {
  const defaultOgImage = buildDefaultOgImageUrl(baseUrl);

  if (route.path === '/') {
    return {
      title: HOME_TITLE,
      ogTitle: HOME_TITLE,
      description: HOME_DESCRIPTION,
      ogDescription: HOME_OG_DESCRIPTION,
      canonical: `${baseUrl}/`,
      ogImage: defaultOgImage,
    };
  }
  if (route.path === '/about') {
    return {
      title: `About · ${DEFAULT_AUTHOR}`,
      ogTitle: `About · ${DEFAULT_AUTHOR}`,
      description: ABOUT_DESCRIPTION,
      ogDescription: ABOUT_DESCRIPTION,
      canonical: `${baseUrl}/about`,
      ogImage: defaultOgImage,
    };
  }
  if (route.path === '/contact') {
    return {
      title: `Contact · ${DEFAULT_AUTHOR}`,
      ogTitle: `Contact · ${DEFAULT_AUTHOR}`,
      description:
        'Get in touch with Brian Bureson for AI product design collaboration, advisory, or speaking.',
      canonical: `${baseUrl}/contact`,
      ogImage: defaultOgImage,
    };
  }
  if (route.path === '/writing') {
    return {
      title: `Writing · ${DEFAULT_AUTHOR}`,
      ogTitle: `Writing · ${DEFAULT_AUTHOR}`,
      description: WRITING_INDEX_DESCRIPTION,
      ogDescription: WRITING_INDEX_DESCRIPTION,
      canonical: `${baseUrl}/writing`,
      ogImage: defaultOgImage,
    };
  }
  if (route.path.startsWith('/writing/')) {
    const postTitle = route.title || 'Writing';
    const description =
      route.description ||
      `Essay from ${DEFAULT_AUTHOR} on enterprise AI product design and trust UX: ${postTitle}.`;
    const meta = {
      title: `${postTitle} · ${DEFAULT_AUTHOR}`,
      ogTitle: postTitle,
      description,
      ogDescription: description,
      canonical: `${baseUrl}${route.path}`,
      ogType: 'article',
      author: DEFAULT_AUTHOR,
      publishedTime: toIso8601(route.publishedAt) || toIso8601(route.lastmod),
      ogImage:
        route.optimizedOgImage ||
        resolvePublicImageUrl(baseUrl, route.heroImage) ||
        defaultOgImage,
      ogImageWidth: route.ogImageWidth || 1200,
      ogImageHeight: route.ogImageHeight || 630,
    };
    return meta;
  }
  const projectTitle = route.title || 'Case Study';
  const description = `Case study from ${DEFAULT_AUTHOR}'s AI product design portfolio: ${projectTitle}.`;
  return {
    title: `${projectTitle} · ${DEFAULT_AUTHOR}`,
    ogTitle: projectTitle,
    description,
    ogDescription: description,
    canonical: `${baseUrl}${route.path}`,
    ogImage: defaultOgImage,
  };
}

function htmlForRoute(baseHtml, route, baseUrl) {
  const meta = metadataForRoute(route, baseUrl);
  const title = escapeHtmlAttr(meta.title);
  const ogTitle = escapeHtmlAttr(meta.ogTitle || meta.title);
  const description = escapeHtmlAttr(meta.description);
  const ogDescription = escapeHtmlAttr(meta.ogDescription || meta.description);
  const canonical = escapeHtmlAttr(meta.canonical);
  const siteName = escapeHtmlAttr(SITE_NAME);
  const ogImage = escapeHtmlAttr(meta.ogImage || buildDefaultOgImageUrl(baseUrl));
  const ogImageWidth = escapeHtmlAttr(String(meta.ogImageWidth || 1200));
  const ogImageHeight = escapeHtmlAttr(String(meta.ogImageHeight || 630));
  const author = escapeHtmlAttr(meta.author || DEFAULT_AUTHOR);

  let html = baseHtml;
  html = upsertTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = upsertTag(
    html,
    /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="description" content="${description}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+name=["']author["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="author" content="${author}" />`,
  );
  html = upsertTag(
    html,
    /<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/i,
    `<link rel="canonical" href="${canonical}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:site_name["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:site_name" content="${siteName}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:title" content="${ogTitle}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:description" content="${ogDescription}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:url["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:url" content="${canonical}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:image["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:image" content="${ogImage}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:image:width["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:image:width" content="${ogImageWidth}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:image:height["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:image:height" content="${ogImageHeight}" />`,
  );
  if (meta.ogType) {
    html = upsertTag(
      html,
      /<meta\s+property=["']og:type["']\s+content=["'][^"']*["']\s*\/?>/i,
      `<meta property="og:type" content="${escapeHtmlAttr(meta.ogType)}" />`,
    );
  }
  if (meta.ogType === 'article') {
    html = upsertTag(
      html,
      /<meta\s+property=["']article:author["']\s+content=["'][^"']*["']\s*\/?>/i,
      `<meta property="article:author" content="${author}" />`,
    );
    if (meta.publishedTime) {
      const publishedTime = escapeHtmlAttr(meta.publishedTime);
      html = upsertTag(
        html,
        /<meta\s+property=["']article:published_time["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta property="article:published_time" content="${publishedTime}" />`,
      );
    }
  }
  html = upsertTag(
    html,
    /<meta\s+name=["']twitter:title["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="twitter:title" content="${ogTitle}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="twitter:description" content="${ogDescription}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+name=["']twitter:image["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="twitter:image" content="${ogImage}" />`,
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
  let writingFromDb = await fetchPublishedWritingFromSupabase();
  if (!writingFromDb.length) {
    console.warn('⚠️ Sitemap: using fallback writing posts for static HTML and sitemap');
    writingFromDb = FALLBACK_WRITING_POSTS.map((post) => ({
      ...post,
      heroImage: '',
      blocks: null,
      lastmod: null,
    }));
  }
  const localProjects = loadLocalProjects();
  const projectEntries = mergeProjectEntries(fromDb, localProjects);
  const writingEntries = mergeWritingEntries(writingFromDb);
  await optimizeWritingOgImages(writingEntries, baseUrl, distDir, ensureDir);
  const routes = getSitemapRoutes(projectEntries, writingEntries);

  if (fromDb.length) {
    console.log(`✅ Sitemap: ${fromDb.length} published project URL(s) from Supabase`);
  } else {
    console.log(
      'ℹ️ Sitemap: no Supabase project rows (set Supabase env vars for production project URLs)',
    );
  }

  if (writingFromDb.length) {
    console.log(`✅ Sitemap: ${writingFromDb.length} published writing URL(s) from Supabase`);
  }

  ensureDir(distDir);
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), generateSitemap(baseUrl, routes));
  fs.writeFileSync(path.join(distDir, 'robots.txt'), generateRobots(baseUrl));
  fs.writeFileSync(
    path.join(distDir, 'llms.txt'),
    generateLlmsTxt(baseUrl, projectEntries, profile, writingEntries),
  );
  fs.writeFileSync(
    path.join(distDir, 'llms-full.txt'),
    generateLlmsFullTxt(baseUrl, projectEntries, profile, writingEntries),
  );
  writeStaticRouteHtml(routes, baseUrl);
  console.log('✅ Generated sitemap.xml, robots.txt, llms.txt, and llms-full.txt');
}

main().catch((e) => {
  console.error('❌ generate-sitemap failed:', e);
  process.exit(1);
});
