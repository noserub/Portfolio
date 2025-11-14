#!/usr/bin/env node
/*
  Injects static structured data (JSON-LD) into index.html at build time.
  This ensures crawlers and test tools see the structured data in the initial HTML.
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const indexPath = path.join(ROOT, 'index.html');

// Default SEO data (matches DEFAULT_SEO_DATA in seoManager.ts)
const defaultSiteUrl = process.env.SITE_URL || 'https://brianbureson.com';
const defaultAuthor = 'Brian Bureson';
const siteName = 'Brian Bureson - Product Design Leader';

// Generate static structured data schemas
function generateStaticStructuredData() {
  const schemas = [];

  // Organization Schema (always included)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: defaultSiteUrl,
    description: `Portfolio website of ${defaultAuthor}, a product design leader.`,
  };

  // WebSite Schema (for home page)
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: defaultSiteUrl,
    description: `Portfolio website of ${defaultAuthor}, a product design leader.`,
  };

  schemas.push(organizationSchema);
  schemas.push(websiteSchema);

  return schemas;
}

function injectStructuredDataIntoHTML() {
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found at:', indexPath);
    process.exit(1);
  }

  let html = fs.readFileSync(indexPath, 'utf8');

  // Remove any existing structured data scripts (to avoid duplicates)
  html = html.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');

  // Generate structured data
  const schemas = generateStaticStructuredData();

  // Create script tags for each schema
  const structuredDataScripts = schemas
    .map((schema, index) => {
      const jsonString = JSON.stringify(schema, null, 2);
      return `  <script type="application/ld+json" id="static-structured-data-${index}">
${jsonString}
  </script>`;
    })
    .join('\n');

  // Insert structured data before closing </head> tag
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${structuredDataScripts}\n</head>`);
  } else {
    // Fallback: insert before </body> if </head> not found
    html = html.replace('</body>', `${structuredDataScripts}\n</body>`);
  }

  // Write back to file
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log(`✅ Injected ${schemas.length} static structured data schema(s) into index.html`);
}

// Run the injection
try {
  injectStructuredDataIntoHTML();
} catch (error) {
  console.error('❌ Error injecting structured data:', error);
  process.exit(1);
}

