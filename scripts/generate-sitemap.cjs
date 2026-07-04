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
const seoPositioning = require(path.join(ROOT, 'src/data/seo-positioning.json'));

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
const DEFAULT_CONTACT_EMAIL =
  process.env.VITE_PUBLIC_CONTACT_EMAIL || process.env.VITE_SITE_OWNER_SIGNIN_EMAIL || '';
const DEFAULT_HOME_HEADING = 'I build things.';
const DEFAULT_HOME_LEAD =
  'Principal Product Designer focused on high-stakes, zero-failure systems across complex hardware, regulated software, and frontier AI.';
const DEFAULT_ABOUT_HEADLINE = 'AI-first design leader who still ships.';
const DEFAULT_ABOUT_LEAD =
  'I align executives, product, and engineering on strategy, then drive the work from research and design systems through prototypes and production-ready code.';
const DEFAULT_CONTACT_SUBTITLE =
  "Have a question or want to work together? I'd love to hear from you.";
const DEFAULT_CONTACT_LOCATION = seoPositioning.locationLabel;

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

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toObject(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      return toObject(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw;
}

function coerceStringArray(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => trimString(item)).filter(Boolean);
}

function excerptText(raw, maxLen = 320) {
  const clean = stripHtml(raw);
  if (!clean) return '';
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1).trimEnd()}…`;
}

function normalizeUrl(raw, fallback = '') {
  const trimmed = trimString(raw);
  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function extractBioParagraphs(rawDoc) {
  const doc = toObject(rawDoc);
  const paragraphs = Array.isArray(doc?.paragraphs) ? doc.paragraphs : [];
  return paragraphs
    .map((paragraph) => {
      const runs = Array.isArray(paragraph?.runs) ? paragraph.runs : [];
      return runs
        .map((run) => trimString(run?.text))
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    })
    .filter(Boolean);
}

function normalizeStats(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      number: trimString(item?.number),
      label: trimString(item?.label),
      description: trimString(item?.description),
    }))
    .filter((item) => item.number || item.label || item.description);
}

function parseHomeContentForPrerender(raw) {
  const obj = toObject(raw);
  const defaultStats = [
    { number: '1', label: 'Full stack web app', description: 'Solo developer' },
    { number: '4', label: 'AI native apps designed', description: 'with RAG & MCP hooks' },
    { number: '6', label: '0-1 product launches', description: 'From ambiguity to product' },
    { number: '9', label: 'US patents', description: 'Innovation and IP contribution' },
  ];
  if (!obj) {
    return {
      heading: DEFAULT_HOME_HEADING,
      paragraphs: [DEFAULT_HOME_LEAD],
      stats: defaultStats,
      caseStudiesTitle: 'Case studies',
      contactCtaLabel: 'Get in touch',
    };
  }

  const heroObj = toObject(obj.hero) || obj;
  const greetings = coerceStringArray(heroObj.greetings);
  const heroHeadlineMode = trimString(heroObj.heroHeadlineMode);
  const staticPrefix = trimString(heroObj.heroHeadlinePrefix);
  const staticMain = trimString(heroObj.heroHeadlineMain);
  const heading =
    heroHeadlineMode === 'static' && (staticPrefix || staticMain)
      ? [staticPrefix, staticMain].filter(Boolean).join(' ')
      : trimString(greetings[0]) || trimString(heroObj.greeting) || DEFAULT_HOME_HEADING;

  const paragraphs = extractBioParagraphs(heroObj.bioDocument);
  const subtitle = trimString(heroObj.subtitle);
  const description = trimString(heroObj.description);
  if (paragraphs.length === 0) {
    if (subtitle) paragraphs.push(subtitle);
    if (description) paragraphs.push(description);
  }

  const uiObj = toObject(obj.ui) || {};
  const stats = normalizeStats(obj.stats);

  return {
    heading: heading || DEFAULT_HOME_HEADING,
    paragraphs: paragraphs.length ? paragraphs : [DEFAULT_HOME_LEAD],
    stats: stats.length ? stats : defaultStats,
    caseStudiesTitle: trimString(uiObj.caseStudiesTitle) || 'Case studies',
    contactCtaLabel: trimString(uiObj.contactCtaLabel) || 'Get in touch',
  };
}

function resolveAboutPrerender(profile) {
  const headline = trimString(profile.aboutHeroHeadline) || DEFAULT_ABOUT_HEADLINE;
  const dedicatedLead = trimString(profile.aboutHeroLead);
  const bioParagraph1 = trimString(profile.bioParagraph1);
  const bioParagraph2 = trimString(profile.bioParagraph2);
  const hasDedicatedHero = Boolean(trimString(profile.aboutHeroHeadline) || dedicatedLead);
  const lead = !hasDedicatedHero && bioParagraph1 ? bioParagraph1 : dedicatedLead || DEFAULT_ABOUT_LEAD;
  const paragraphs = [];
  if (hasDedicatedHero && bioParagraph1) paragraphs.push(bioParagraph1);
  if (bioParagraph2) paragraphs.push(bioParagraph2);
  return {
    headline,
    lead,
    paragraphs,
    resumeUrl: trimString(profile.resumeUrl),
  };
}

function resolveContactPrerender(profile) {
  return {
    subtitle: DEFAULT_CONTACT_SUBTITLE,
    email: trimString(profile.email) || DEFAULT_CONTACT_EMAIL,
    linkedinUrl: normalizeUrl(profile.linkedinUrl, DEFAULT_LINKEDIN_URL),
    location: DEFAULT_CONTACT_LOCATION,
    resumeUrl: trimString(profile.resumeUrl),
  };
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

async function fetchProfileForBuild(supabase, ownerId) {
  const profile = {
    resumeUrl: '',
    heroText: null,
    email: '',
    linkedinUrl: '',
    aboutHeroHeadline: '',
    aboutHeroLead: '',
    bioParagraph1: '',
    bioParagraph2: '',
  };
  if (!ownerId) return profile;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('resume_url, hero_text, email, bio_paragraph_1, bio_paragraph_2')
      .eq('id', ownerId)
      .maybeSingle();
    if (error) {
      console.warn('⚠️ build profile query failed:', error.message);
    } else if (data) {
      profile.resumeUrl = trimString(data.resume_url);
      profile.heroText = data.hero_text ?? null;
      profile.email = trimString(data.email);
      profile.bioParagraph1 = trimString(data.bio_paragraph_1);
      profile.bioParagraph2 = trimString(data.bio_paragraph_2);
    }
  } catch (_) {}

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('about_hero_headline, about_hero_lead')
      .eq('id', ownerId)
      .maybeSingle();
    if (!error && data) {
      profile.aboutHeroHeadline = trimString(data.about_hero_headline);
      profile.aboutHeroLead = trimString(data.about_hero_lead);
    }
  } catch (_) {}

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('linkedin_url')
      .eq('id', ownerId)
      .maybeSingle();
    if (!error && data) {
      profile.linkedinUrl = trimString(data.linkedin_url);
    }
  } catch (_) {}

  return profile;
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
    profile = await fetchProfileForBuild(supabase, ownerId);
  } else {
    ({ data, error } = await supabase.rpc('get_projects_public'));
    profile = await fetchProfileForBuild(supabase, ownerId);
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
  const dbEntries = Array.isArray(supabaseEntries) ? supabaseEntries : [];
  for (const e of dbEntries) {
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
    `> ${seoPositioning.llmsIntro} This site is his canonical public portfolio.`,
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
    `- Attribute as **${DEFAULT_AUTHOR}**, enterprise AI product design leader, ${baseUrl}/`,
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
    `${seoPositioning.llmsIntro} This file summarizes public pages and published case studies from ${baseUrl}.`,
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
    `- Attribute as **${DEFAULT_AUTHOR}**, enterprise AI product design leader, ${baseUrl}/`,
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
    description: e.description || '',
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

const SEO_PRERENDER_HIDE_STYLE =
  'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';

function prerenderShell(innerHtml) {
  return [
    `<div style="max-width:960px;margin:0 auto;padding:96px 24px 48px;font-family:Inter,Arial,sans-serif;line-height:1.6;">`,
    innerHtml,
    '</div>',
  ].join('');
}

function renderHomePrerender(baseUrl, siteContent, projectEntries) {
  const home = parseHomeContentForPrerender(siteContent.heroText);
  const stats = home.stats
    .map(
      (stat) =>
        `<li><strong>${escapeHtml(stat.number || '')}</strong> ${escapeHtml(stat.label || '')}${
          stat.description ? ` - ${escapeHtml(stat.description)}` : ''
        }</li>`,
    )
    .join('');
  const projectList = projectEntries
    .map(
      (project) =>
        `<li><a href="${escapeHtmlAttr(`${baseUrl}${project.path}`)}">${escapeHtml(project.title)}</a>${
          project.description ? `: ${escapeHtml(project.description)}` : ''
        }</li>`,
    )
    .join('');
  const paragraphs = home.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('');

  return prerenderShell(`
    <header>
      <nav aria-label="Primary">
        <a href="${escapeHtmlAttr(`${baseUrl}/about`)}">About</a>
        &nbsp;|&nbsp;
        <a href="${escapeHtmlAttr(`${baseUrl}/contact`)}">${escapeHtml(home.contactCtaLabel)}</a>
      </nav>
      <h1>${escapeHtml(home.heading)}</h1>
      <p>${escapeHtml(seoPositioning.homePrerenderIntro)}</p>
      ${paragraphs}
    </header>
    <section aria-labelledby="home-stats">
      <h2 id="home-stats">Highlights</h2>
      <ul>${stats}</ul>
    </section>
    <section aria-labelledby="home-case-studies">
      <h2 id="home-case-studies">${escapeHtml(home.caseStudiesTitle)}</h2>
      <ul>${projectList}</ul>
    </section>
  `);
}

function renderAboutPrerender(baseUrl, siteContent) {
  const about = resolveAboutPrerender(siteContent);
  const paragraphs = about.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  const resumeHtml = about.resumeUrl
    ? `<p><a href="${escapeHtmlAttr(about.resumeUrl)}" target="_blank" rel="noopener noreferrer">View resume</a></p>`
    : '';

  return prerenderShell(`
    <nav aria-label="Primary">
      <a href="${escapeHtmlAttr(`${baseUrl}/`)}">Home</a>
      &nbsp;|&nbsp;
      <a href="${escapeHtmlAttr(`${baseUrl}/contact`)}">Contact</a>
    </nav>
    <main>
      <h1>${escapeHtml(about.headline)}</h1>
      <p>${escapeHtml(about.lead)}</p>
      ${paragraphs}
      ${resumeHtml}
    </main>
  `);
}

function renderContactPrerender(baseUrl, siteContent) {
  const contact = resolveContactPrerender(siteContent);
  const emailHtml = contact.email
    ? `<li><strong>Email:</strong> <a href="mailto:${escapeHtmlAttr(contact.email)}">${escapeHtml(contact.email)}</a></li>`
    : '';
  const linkedinHtml = contact.linkedinUrl
    ? `<li><strong>LinkedIn:</strong> <a href="${escapeHtmlAttr(contact.linkedinUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(contact.linkedinUrl)}</a></li>`
    : '';
  const resumeHtml = contact.resumeUrl
    ? `<li><strong>Resume:</strong> <a href="${escapeHtmlAttr(contact.resumeUrl)}" target="_blank" rel="noopener noreferrer">View resume</a></li>`
    : '';

  return prerenderShell(`
    <nav aria-label="Primary">
      <a href="${escapeHtmlAttr(`${baseUrl}/`)}">Home</a>
      &nbsp;|&nbsp;
      <a href="${escapeHtmlAttr(`${baseUrl}/about`)}">About</a>
    </nav>
    <main>
      <h1>Let&apos;s work together.</h1>
      <p>${escapeHtml(contact.subtitle)}</p>
      <ul>
        ${emailHtml}
        ${linkedinHtml}
        ${resumeHtml}
        <li><strong>Location:</strong> ${escapeHtml(contact.location)}</li>
      </ul>
    </main>
  `);
}

function renderProjectPrerender(baseUrl, route) {
  const fallbackDescription = route.description || excerptText(route.caseStudyContent, 420);
  const detailText = excerptText(route.caseStudyContent, 900);
  const detailParagraphs = (detailText ? [detailText] : [])
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');

  return prerenderShell(`
    <nav aria-label="Primary">
      <a href="${escapeHtmlAttr(`${baseUrl}/`)}">Home</a>
      &nbsp;|&nbsp;
      <a href="${escapeHtmlAttr(`${baseUrl}/about`)}">About</a>
      &nbsp;|&nbsp;
      <a href="${escapeHtmlAttr(`${baseUrl}/contact`)}">Contact</a>
    </nav>
    <main>
      <article>
        <h1>${escapeHtml(route.title || 'Case Study')}</h1>
        ${fallbackDescription ? `<p>${escapeHtml(fallbackDescription)}</p>` : ''}
        ${detailParagraphs}
      </article>
    </main>
  `);
}

function renderRoutePrerenderHtml(route, baseUrl, siteContent, projectEntries) {
  if (route.path === '/') {
    return renderHomePrerender(baseUrl, siteContent, projectEntries);
  }
  if (route.path === '/about') {
    return renderAboutPrerender(baseUrl, siteContent);
  }
  if (route.path === '/contact') {
    return renderContactPrerender(baseUrl, siteContent);
  }
  return renderProjectPrerender(baseUrl, route);
}

function injectSeoPrerender(html, prerenderHtml) {
  if (!prerenderHtml) return html;

  const prerenderBlock = [
    `<div id="seo-prerender" data-seo-prerender="true" aria-hidden="true" style="${SEO_PRERENDER_HIDE_STYLE}">`,
    prerenderHtml,
    '</div>',
  ].join('');

  // Keep #root empty so React mounts without paint-then-replace flash.
  if (/<div id="seo-prerender"[\s\S]*?<\/div>\s*<div id="root">[\s\S]*?<\/div>/i.test(html)) {
    return html.replace(
      /<div id="seo-prerender"[\s\S]*?<\/div>\s*<div id="root">[\s\S]*?<\/div>/i,
      `${prerenderBlock}\n      <div id="root"></div>`,
    );
  }

  if (/<div id="root">[\s\S]*?<\/div>/i.test(html)) {
    return html.replace(
      /<div id="root">[\s\S]*?<\/div>/i,
      `${prerenderBlock}\n      <div id="root"></div>`,
    );
  }

  return html;
}

function metadataForRoute(route, baseUrl) {
  if (route.path === '/') {
    return {
      title: seoPositioning.homeTitle,
      description: seoPositioning.homeDescription,
      canonical: `${baseUrl}/`,
    };
  }
  if (route.path === '/about') {
    return {
      title: seoPositioning.aboutTitle,
      description: seoPositioning.aboutDescription,
      canonical: `${baseUrl}/about`,
    };
  }
  if (route.path === '/contact') {
    return {
      title: seoPositioning.contactTitle,
      description: seoPositioning.contactDescription,
      canonical: `${baseUrl}/contact`,
    };
  }
  const projectTitle = route.title || 'Case Study';
  const projectDescription = route.description
    ? String(route.description).trim()
    : '';
  return {
    title: `${projectTitle} - Brian Bureson`,
    description:
      projectDescription || `Case study from Brian Bureson's product design portfolio: ${projectTitle}.`,
    canonical: `${baseUrl}${route.path}`,
  };
}

function htmlForRoute(baseHtml, route, baseUrl, siteContent, projectEntries) {
  const meta = metadataForRoute(route, baseUrl);
  const title = escapeHtmlAttr(meta.title);
  const description = escapeHtmlAttr(meta.description);
  const canonical = escapeHtmlAttr(meta.canonical);
  const socialImage = escapeHtmlAttr(
    `${baseUrl}/api/og?title=${encodeURIComponent(meta.title)}`,
  );

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
    /<meta\s+property=["']og:image["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:image" content="${socialImage}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:image:alt["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:image:alt" content="${title}" />`,
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
  html = upsertTag(
    html,
    /<meta\s+name=["']twitter:image["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="twitter:image" content="${socialImage}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+name=["']twitter:image:alt["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="twitter:image:alt" content="${title}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+name=["']twitter:card["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="twitter:card" content="summary_large_image" />`,
  );

  html = injectSeoPrerender(
    html,
    renderRoutePrerenderHtml(route, baseUrl, siteContent, projectEntries),
  );

  return html;
}

function writeStaticRouteHtml(routes, baseUrl, siteContent, projectEntries) {
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.warn('⚠️ Static route HTML skipped: dist/index.html not found');
    return;
  }

  const baseHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  for (const route of routes) {
    if (route.path === '/') {
      fs.writeFileSync(
        indexHtmlPath,
        htmlForRoute(baseHtml, route, baseUrl, siteContent, projectEntries),
        'utf8',
      );
      continue;
    }

    const routeDir = path.join(distDir, route.path.replace(/^\/+/, ''));
    ensureDir(routeDir);
    fs.writeFileSync(
      path.join(routeDir, 'index.html'),
      htmlForRoute(baseHtml, route, baseUrl, siteContent, projectEntries),
      'utf8',
    );
  }
  console.log(`✅ Generated ${routes.length} static HTML route(s) with route-specific canonical URLs`);
}

async function main() {
  const baseUrl = (process.env.SITE_URL || 'https://www.bureson.com').replace(/\/+$/, '');
  const { projects: fromDb = [], profile = {} } = await fetchPublishedSlugsFromSupabase();
  const localProjects = loadLocalProjects();
  const projectEntries = mergeProjectEntries(fromDb, localProjects);
  const routes = getSitemapRoutes(projectEntries);
  const siteContent = {
    heroText: profile.heroText,
    resumeUrl: profile.resumeUrl,
    email: profile.email,
    linkedinUrl: profile.linkedinUrl,
    aboutHeroHeadline: profile.aboutHeroHeadline,
    aboutHeroLead: profile.aboutHeroLead,
    bioParagraph1: profile.bioParagraph1,
    bioParagraph2: profile.bioParagraph2,
  };

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
  writeStaticRouteHtml(routes, baseUrl, siteContent, projectEntries);
  console.log('✅ Generated sitemap.xml, robots.txt, llms.txt, and llms-full.txt');
}

main().catch((e) => {
  console.error('❌ generate-sitemap failed:', e);
  process.exit(1);
});
