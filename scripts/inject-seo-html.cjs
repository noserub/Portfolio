#!/usr/bin/env node
/*
  Injects static structured data (JSON-LD) into index.html at build time.
  This ensures crawlers and test tools see the structured data in the initial HTML.
*/
const fs = require('fs');
const path = require('path');
const {
  DEFAULT_AUTHOR,
  SITE_NAME,
  HOME_DESCRIPTION,
  PERSON_JOB_TITLE,
  buildDefaultOgImageUrl,
} = require('./seo-defaults.cjs');

const ROOT = process.cwd();
const indexPath = path.join(ROOT, 'index.html');

require('dotenv').config({ path: path.join(ROOT, '.env.local') });
require('dotenv').config({ path: path.join(ROOT, '.env') });

const defaultSiteUrl = (process.env.SITE_URL || 'https://www.bureson.com').replace(/\/+$/, '');

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

function entityIds(base) {
  const b = base.replace(/\/+$/, '');
  return {
    person: `${b}/#person`,
    organization: `${b}/#organization`,
    website: `${b}/#website`,
  };
}

function readMetaDescription(html) {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return m ? m[1] : '';
}

function generateStaticStructuredData(metaDescription) {
  const ids = entityIds(defaultSiteUrl);
  const sameAs = parseSameAsEnv(process.env.VITE_PUBLIC_SAME_AS);
  const desc = metaDescription || HOME_DESCRIPTION;
  const orgLogo =
    (process.env.VITE_PUBLIC_ORGANIZATION_LOGO_URL || '').trim() ||
    buildDefaultOgImageUrl(defaultSiteUrl);

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ids.organization,
    name: SITE_NAME,
    url: defaultSiteUrl,
    description: `Portfolio and writing by ${DEFAULT_AUTHOR}: enterprise AI product design and trust UX.`,
    ...(orgLogo ? { logo: orgLogo } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': ids.website,
    name: SITE_NAME,
    url: defaultSiteUrl,
    description: `Portfolio, case studies, and essays on enterprise AI product design by ${DEFAULT_AUTHOR}.`,
  };

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': ids.person,
    name: DEFAULT_AUTHOR,
    jobTitle: PERSON_JOB_TITLE,
    description: desc,
    url: defaultSiteUrl,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Denver',
      addressRegion: 'CO',
      addressCountry: 'US',
    },
    knowsAbout: [
      'AI product design',
      'enterprise generative AI',
      'trust UX',
      'conversational AI',
      'agent experiences',
      'answer UX',
      'design leadership',
    ],
    ...(sameAs.length ? { sameAs } : {}),
    worksFor: {
      '@type': 'Organization',
      '@id': ids.organization,
      name: SITE_NAME,
    },
  };

  return [organizationSchema, websiteSchema, personSchema];
}

function injectStructuredDataIntoHTML() {
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found at:', indexPath);
    process.exit(1);
  }

  let html = fs.readFileSync(indexPath, 'utf8');
  const metaDescription = readMetaDescription(html);

  html = html.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/(?:[ \t]*\r?\n){4,}/g, '\n\n\n');

  const schemas = generateStaticStructuredData(metaDescription);

  const structuredDataScripts = schemas
    .map((schema, index) => {
      const jsonString = JSON.stringify(schema, null, 2);
      return `  <script type="application/ld+json" id="static-structured-data-${index}">
${jsonString}
  </script>`;
    })
    .join('\n');

  if (html.includes('</head>')) {
    html = html.replace('</head>', `${structuredDataScripts}\n</head>`);
  } else {
    html = html.replace('</body>', `${structuredDataScripts}\n</body>`);
  }

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log(`✅ Injected ${schemas.length} static structured data schema(s) into index.html`);
}

try {
  injectStructuredDataIntoHTML();
} catch (error) {
  console.error('❌ Error injecting structured data:', error);
  process.exit(1);
}
