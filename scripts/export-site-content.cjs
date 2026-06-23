#!/usr/bin/env node
/**
 * Export all published portfolio content from Supabase to a single markdown file.
 * Usage: node scripts/export-site-content.cjs [output-path]
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const ROOT = process.cwd();
require('dotenv').config({ path: path.join(ROOT, '.env.local') });
require('dotenv').config({ path: path.join(ROOT, '.env') });

const DEFAULT_OWNER_ID = '7cd2752f-93c5-46e6-8535-32769fb10055';
const SITE_URL = (process.env.SITE_URL || 'https://www.bureson.com').replace(/\/+$/, '');

function slugify(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function mdEscape(text) {
  return String(text ?? '').replace(/\r\n/g, '\n');
}

function heading(level, text) {
  return `${'#'.repeat(level)} ${mdEscape(text)}\n\n`;
}

function para(text) {
  const t = mdEscape(text).trim();
  return t ? `${t}\n\n` : '';
}

function list(items) {
  if (!Array.isArray(items) || items.length === 0) return '';
  return items.map((item) => `- ${mdEscape(item)}`).join('\n') + '\n\n';
}

function cardList(items, getTitle, getBody) {
  if (!Array.isArray(items) || items.length === 0) return '';
  let out = '';
  for (const item of items) {
    const title = getTitle(item);
    const body = getBody(item);
    if (title) out += `### ${mdEscape(title)}\n\n`;
    if (body) out += `${mdEscape(body)}\n\n`;
  }
  return out;
}

function bioDocumentToMarkdown(doc) {
  if (!doc?.paragraphs?.length) return '';
  const lines = [];
  for (const p of doc.paragraphs) {
    let line = '';
    for (const run of p.runs || []) {
      const text = run.text || '';
      if (!text) continue;
      if (run.type === 'bold') line += `**${text}**`;
      else if (run.type === 'gradient') line += `*${text}*`;
      else line += text;
    }
    if (line.trim()) lines.push(line.trim());
  }
  return lines.join('\n\n') + (lines.length ? '\n\n' : '');
}

function parseHeroText(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

function formatHeroSection(heroRaw) {
  const content = parseHeroText(heroRaw);
  if (!content) return '_No home hero content found._\n\n';

  const hero = content.hero || content;
  let out = '';

  const greetings = hero.greetings?.length ? hero.greetings : hero.greeting ? [hero.greeting] : [];
  if (greetings.length) {
    out += '**Greetings**\n\n';
    out += list(greetings);
  }

  if (hero.subtitle) out += para(hero.subtitle);
  if (hero.description) out += para(hero.description);

  const words = [hero.word1, hero.word2, hero.word3, hero.word4].filter(Boolean);
  if (words.length) {
    out += `**Animated phrase:** ${words.join(' ')}\n\n`;
  }
  if (hero.buttonText) out += `**CTA button:** ${hero.buttonText}\n\n`;

  if (hero.bioDocument) {
    out += bioDocumentToMarkdown(hero.bioDocument);
  } else if (hero.bioText) {
    out += para(hero.bioText);
    if (hero.accentText) out += para(hero.accentText);
  }

  const stats = content.stats || [];
  if (stats.length) {
    out += '### Stats\n\n';
    out += cardList(
      stats,
      (s) => `${s.number} — ${s.label}`,
      (s) => s.description || '',
    );
  }

  const ui = content.ui;
  if (ui) {
    out += '### Case studies UI\n\n';
    if (ui.caseStudiesTitle) out += `- **Section title:** ${ui.caseStudiesTitle}\n`;
    if (ui.filterAll) out += `- **All filter label:** ${ui.filterAll}\n`;
    if (ui.defaultCaseStudyFilter) out += `- **Default filter:** ${ui.defaultCaseStudyFilter}\n`;
    if (Array.isArray(ui.caseStudyFilters) && ui.caseStudyFilters.length) {
      out += '- **Filters:**\n';
      for (const f of ui.caseStudyFilters) {
        out += `  - ${f.label} (\`${f.id}\`)\n`;
      }
    }
    out += '\n';
  }

  return out;
}

function formatAboutSection(profile) {
  let out = '';
  if (profile.full_name) out += `**Name:** ${profile.full_name}\n\n`;
  if (profile.email) out += `**Email:** ${profile.email}\n\n`;
  if (profile.resume_url) out += `**Resume:** [${profile.resume_url}](${profile.resume_url})\n\n`;
  if (profile.avatar_url) out += `**Avatar:** [${profile.avatar_url}](${profile.avatar_url})\n\n`;

  if (profile.about_hero_headline) out += heading(3, 'Hero headline') + para(profile.about_hero_headline);
  if (profile.about_hero_lead) out += heading(3, 'Hero lead') + para(profile.about_hero_lead);

  if (profile.bio_paragraph_1) out += heading(3, 'Bio card — paragraph 1') + para(profile.bio_paragraph_1);
  if (profile.bio_paragraph_2) out += heading(3, 'Bio card — paragraph 2') + para(profile.bio_paragraph_2);

  if (profile.super_powers?.length) {
    out += heading(3, profile.super_powers_title || 'Super powers');
    out += list(profile.super_powers);
  }

  if (profile.highlights?.length) {
    out += heading(3, profile.highlights_title || 'Highlights');
    out += cardList(
      profile.highlights,
      (h) => h.title,
      (h) => h.text || h.content || '',
    );
  }

  if (profile.leadership_items?.length) {
    out += heading(3, profile.leadership_title || 'Leadership & Impact');
    out += cardList(
      profile.leadership_items,
      (h) => h.title,
      (h) => h.text || h.content || '',
    );
  }

  if (profile.expertise_items?.length) {
    out += heading(3, profile.expertise_title || 'Expertise');
    out += cardList(
      profile.expertise_items,
      (h) => h.title,
      (h) => h.text || h.content || '',
    );
  }

  if (profile.how_i_use_ai_items?.length) {
    out += heading(3, profile.how_i_use_ai_title || 'How I Use AI');
    out += cardList(
      profile.how_i_use_ai_items,
      (h) => h.title,
      (h) => h.text || h.content || '',
    );
  }

  if (profile.process_items?.length) {
    out += heading(3, profile.process_title || 'Process');
    if (profile.process_subheading) out += para(profile.process_subheading);
    out += cardList(
      profile.process_items,
      (h) => (h.num ? `${h.num}. ` : '') + (h.title || ''),
      (h) => h.text || h.content || '',
    );
  }

  if (profile.certifications_items?.length) {
    out += heading(3, profile.certifications_title || 'Certifications');
    out += cardList(
      profile.certifications_items,
      (h) => h.title || h.name,
      (h) => h.text || h.description || '',
    );
  }

  if (profile.tools_categories?.length) {
    out += heading(3, profile.tools_title || 'Tools');
    for (const cat of profile.tools_categories) {
      const title = cat.title || cat.name || 'Tools';
      out += `#### ${mdEscape(title)}\n\n`;
      const tools = cat.tools || cat.items || [];
      if (Array.isArray(tools)) {
        if (typeof tools[0] === 'string') out += list(tools);
        else {
          out += cardList(
            tools,
            (t) => t.name || t.title,
            (t) => t.description || t.text || '',
          );
        }
      }
    }
  }

  if (profile.research_insights?.length) {
    out += heading(3, 'Research insights');
    out += cardList(
      profile.research_insights,
      (h) => h.title,
      (h) => h.text || h.content || '',
    );
  }

  return out || '_No about content found._\n\n';
}

function formatSidebars(sidebars) {
  if (!sidebars || typeof sidebars !== 'object') return '';
  let out = '';
  for (const [key, value] of Object.entries(sidebars)) {
    if (!value || value.hidden) continue;
    const title = value.title || key;
    const content = value.content || '';
    if (!content.trim()) continue;
    out += `#### ${mdEscape(title)}\n\n`;
    out += `${mdEscape(content)}\n\n`;
  }
  return out;
}

function formatMediaList(label, items) {
  if (!Array.isArray(items) || items.length === 0) return '';
  let out = `#### ${label}\n\n`;
  for (const item of items) {
    const url = item.url || item.src || item.image || item;
    const caption = item.caption || item.title || item.alt || '';
    if (typeof url === 'string' && url.startsWith('http')) {
      out += caption
        ? `- [${mdEscape(caption)}](${url})\n`
        : `- [${url}](${url})\n`;
    } else if (caption) {
      out += `- ${mdEscape(caption)}\n`;
    }
  }
  out += '\n';
  return out;
}

function formatProject(project) {
  let out = heading(2, project.title);
  const slug = slugify(project.title);
  if (slug) out += `**URL:** ${SITE_URL}/project/${slug}\n\n`;
  if (project.description) out += para(project.description);
  if (project.project_type) out += `**Type:** ${project.project_type}\n\n`;
  if (project.url) out += `**Cover image:** [${project.url}](${project.url})\n\n`;

  const sidebars = formatSidebars(project.case_study_sidebars);
  if (sidebars) {
    out += '### Sidebars\n\n';
    out += sidebars;
  }

  if (project.case_study_content) {
    out += '### Case study\n\n';
    out += `${mdEscape(project.case_study_content)}\n\n`;
  }

  out += formatMediaList('Gallery images', project.case_study_images);
  out += formatMediaList('Flow diagrams', project.flow_diagram_images);
  out += formatMediaList('Videos', project.video_items);

  return out;
}

function formatSeo(rows) {
  if (!rows?.length) return '_No SEO records found._\n\n';
  let out = '';
  for (const row of rows) {
    out += heading(3, row.page_type || 'unknown');
    const fields = [
      ['Title', row.title],
      ['Description', row.description],
      ['Keywords', row.keywords],
      ['OG title', row.og_title],
      ['OG description', row.og_description],
      ['OG image', row.og_image],
      ['Twitter card', row.twitter_card],
      ['Twitter title', row.twitter_title],
      ['Twitter description', row.twitter_description],
      ['Twitter image', row.twitter_image],
      ['Canonical URL', row.canonical_url],
      ['Site name', row.site_name],
      ['Site URL', row.site_url],
      ['Default author', row.default_author],
      ['Default OG image', row.default_og_image],
      ['Default Twitter card', row.default_twitter_card],
      ['Favicon type', row.favicon_type],
      ['Favicon text', row.favicon_text],
      ['Favicon image', row.favicon_image],
      ['Same as', row.same_as],
      ['Organization logo', row.organization_logo_url],
    ];
    for (const [label, value] of fields) {
      if (value) out += `- **${label}:** ${value}\n`;
    }
    out += '\n';
  }
  return out;
}

function formatUrlField(value) {
  if (!value) return '';
  if (typeof value === 'string' && value.startsWith('data:')) {
    const kind = value.slice(5, value.indexOf(';')) || 'binary';
    return `[embedded ${kind} data URL, ${value.length} chars]`;
  }
  return value;
}

function formatAppSettings(settings) {
  if (!settings) return '_No app settings found._\n\n';
  let out = '';
  const fields = [
    ['Logo URL', formatUrlField(settings.logo_url)],
    ['Favicon URL', formatUrlField(settings.favicon_url)],
    ['Theme', settings.theme],
  ];
  for (const [label, value] of fields) {
    if (value) out += `- **${label}:** ${value}\n`;
  }
  return (out || '_No app settings fields set._\n') + '\n';
}

function formatPageVisibility(visibility) {
  if (!visibility) return '_No page visibility settings found._\n\n';
  const pages = ['about', 'contact', 'music', 'visuals'];
  let out = '';
  for (const page of pages) {
    if (page in visibility) out += `- **${page}:** ${visibility[page] ? 'visible' : 'hidden'}\n`;
  }
  return (out || '_No page visibility fields set._\n') + '\n';
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;
  const ownerId =
    process.env.VITE_PUBLIC_PORTFOLIO_OWNER_ID ||
    process.env.SUPABASE_PORTFOLIO_OWNER_ID ||
    DEFAULT_OWNER_ID;

  if (!url || !key) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const errors = [];
  const exportedAt = new Date().toISOString();

  const profileRes = await supabase.from('profiles').select('*').eq('id', ownerId).maybeSingle();
  if (profileRes.error) errors.push(`profiles: ${profileRes.error.message}`);
  const profile = profileRes.data;

  let projects = [];
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const projectsRes = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', ownerId)
      .order('sort_order', { ascending: true });
    if (projectsRes.error) errors.push(`projects: ${projectsRes.error.message}`);
    projects = projectsRes.data || [];
  } else {
    const rpcRes = await supabase.rpc('get_projects_public');
    if (rpcRes.error) {
      const fallback = await supabase
        .from('projects')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true });
      if (fallback.error) errors.push(`projects: ${fallback.error.message}`);
      projects = fallback.data || [];
    } else {
      projects = rpcRes.data || [];
    }
  }

  const seoRes = await supabase.from('seo_data').select('*').eq('user_id', ownerId);
  if (seoRes.error) errors.push(`seo_data: ${seoRes.error.message}`);

  const settingsRes = await supabase
    .from('app_settings')
    .select('*')
    .eq('user_id', ownerId)
    .maybeSingle();
  if (settingsRes.error) errors.push(`app_settings: ${settingsRes.error.message}`);

  const visibilityRes = await supabase
    .from('page_visibility')
    .select('*')
    .eq('user_id', ownerId)
    .maybeSingle();
  if (visibilityRes.error) errors.push(`page_visibility: ${visibilityRes.error.message}`);

  const publishedProjects = projects.filter((p) => p.published !== false);
  const unpublishedCount = projects.length - publishedProjects.length;

  let md = '';
  md += '# Brian Bureson Portfolio — Site Content Export\n\n';
  md += `> Generated from Supabase on ${exportedAt}\n`;
  md += `> Portfolio owner ID: \`${ownerId}\`\n`;
  md += `> Source: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service role (all projects)' : 'public API (published projects)'}\n\n`;
  if (errors.length) {
    md += '## Export warnings\n\n';
    for (const e of errors) md += `- ${e}\n`;
    md += '\n';
  }

  md += '## Table of contents\n\n';
  md += '- [Home](#home)\n';
  md += '- [About](#about)\n';
  md += '- [Contact](#contact)\n';
  md += `- [Case studies (${publishedProjects.length})](#case-studies)\n`;
  md += '- [SEO](#seo)\n';
  md += '- [Site settings](#site-settings)\n';
  md += '- [Page visibility](#page-visibility)\n\n';

  md += '---\n\n';
  md += heading(1, 'Home');
  md += formatHeroSection(profile?.hero_text);

  md += '---\n\n';
  md += heading(1, 'About');
  md += formatAboutSection(profile || {});

  md += '---\n\n';
  md += heading(1, 'Contact');
  if (profile?.email) {
    md += `- **Email:** ${profile.email}\n`;
  }
  md += '- **Location:** Colorado, USA\n';
  md += "- **Availability:** Open to new opportunities\n";
  md += "- **Subtitle:** Have a question or want to work together? I'd love to hear from you.\n\n";
  md += '_Note: Contact page subtitle and info cards are stored in browser localStorage in the CMS; email above is from Supabase._\n\n';

  md += '---\n\n';
  md += heading(1, `Case studies (${publishedProjects.length})`);
  if (unpublishedCount > 0) {
    md += `_(${unpublishedCount} unpublished project(s) omitted from public export.)_\n\n`;
  }
  if (!publishedProjects.length) {
    md += '_No published case studies found._\n\n';
  } else {
    for (const project of publishedProjects) {
      md += formatProject(project);
      md += '---\n\n';
    }
  }

  md += heading(1, 'SEO');
  md += formatSeo(seoRes.data || []);

  md += '---\n\n';
  md += heading(1, 'Site settings');
  md += formatAppSettings(settingsRes.data);

  md += '---\n\n';
  md += heading(1, 'Page visibility');
  md += formatPageVisibility(visibilityRes.data);

  const outPath = path.resolve(ROOT, process.argv[2] || 'docs/site-content.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`✅ Wrote ${outPath}`);
  console.log(`   Profile: ${profile ? 'ok' : 'missing'}`);
  console.log(`   Projects: ${publishedProjects.length} published (${projects.length} total fetched)`);
  console.log(`   SEO rows: ${(seoRes.data || []).length}`);
  if (errors.length) console.warn('⚠️ Warnings:', errors.join('; '));
}

main().catch((err) => {
  console.error('❌ export-site-content failed:', err);
  process.exit(1);
});
