#!/usr/bin/env node
/*
  Captures a 1200x630 homepage screenshot for Open Graph / LinkedIn previews.
  Usage: node scripts/capture-homepage-og.cjs [url]
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = process.cwd();
const outDir = path.join(ROOT, 'public', 'share');
const outPath = path.join(outDir, 'og-default.png');
const url = process.argv[2] || process.env.SITE_URL || 'https://www.bureson.com';

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  await page.goto(url.replace(/\/+$/, '') + '/', {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });

  await page.waitForTimeout(1500);

  await page.screenshot({
    path: outPath,
    type: 'png',
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });

  await browser.close();

  // Normalize to OG standard dimensions (playwright may output 2x with deviceScaleFactor).
  try {
    const { execSync } = require('child_process');
    execSync(`sips -z 630 1200 "${outPath}"`, { stdio: 'ignore' });
  } catch {
    // sips is macOS-only; skip on Linux CI when committed PNG is already present.
  }

  const buf = fs.readFileSync(outPath);
  const isPng = buf.length > 8 && buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG';
  if (!isPng) {
    throw new Error('Screenshot did not produce a valid PNG');
  }

  console.log(`✅ Captured homepage OG image → ${outPath} (${buf.length} bytes)`);
}

main().catch((error) => {
  console.error('❌ Homepage OG capture failed:', error);
  process.exit(1);
});
