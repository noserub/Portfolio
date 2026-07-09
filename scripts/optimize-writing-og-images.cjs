const path = require('path');

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
/** LinkedIn preview cards crop ~65–75px from the top on wide organic link cards. */
const OG_TOP_SAFE_PAD = 100;

function resolvePublicImageUrl(baseUrl, imagePath) {
  if (!imagePath) return '';
  const value = String(imagePath).trim();
  if (/^https?:\/\//i.test(value)) return value;
  const base = String(baseUrl || '').replace(/\/+$/, '');
  return `${base}${value.startsWith('/') ? value : `/${value}`}`;
}

function slugFromWritingEntry(entry) {
  if (entry.slug) return String(entry.slug).trim();
  const match = String(entry.path || '').match(/^\/writing\/([^/]+)/);
  return match ? match[1] : '';
}

/**
 * Prepare writing OG images at /share/og/{slug}.png.
 * Full-bleed 1200x630 with top safe-zone padding so LinkedIn's preview crop
 * does not clip the headline baked into hero art.
 */
async function optimizeWritingOgImages(writingEntries, baseUrl, distDir, ensureDir) {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.warn('⚠️ sharp not installed; writing posts will use raw hero images for OG');
    return writingEntries;
  }

  const outDir = path.join(distDir, 'share', 'og');
  ensureDir(outDir);

  const contentHeight = OG_HEIGHT - OG_TOP_SAFE_PAD;
  const canvasBackground = { r: 10, g: 10, b: 10, alpha: 1 };

  for (const entry of writingEntries) {
    const slug = slugFromWritingEntry(entry);
    const hero = entry.heroImage;
    if (!slug || !hero) continue;

    const heroUrl = resolvePublicImageUrl(baseUrl, hero);
    const outPath = path.join(outDir, `${slug}.png`);

    try {
      const response = await fetch(heroUrl);
      if (!response.ok) {
        throw new Error(`fetch failed (${response.status})`);
      }
      const input = Buffer.from(await response.arrayBuffer());
      const metadata = await sharp(input).metadata();
      const srcWidth = metadata.width || 0;
      const srcHeight = metadata.height || 0;
      if (!srcWidth || !srcHeight) {
        throw new Error('missing image dimensions');
      }

      const scale = OG_WIDTH / srcWidth;
      const scaledHeight = Math.round(srcHeight * scale);
      const visibleHeight = Math.min(scaledHeight, contentHeight);

      const resized = await sharp(input)
        .resize(OG_WIDTH, scaledHeight, {
          fit: 'fill',
          kernel: sharp.kernel.lanczos3,
          withoutEnlargement: false,
        })
        .extract({
          left: 0,
          top: 0,
          width: OG_WIDTH,
          height: visibleHeight,
        })
        .toBuffer();

      await sharp({
        create: {
          width: OG_WIDTH,
          height: OG_HEIGHT,
          channels: 4,
          background: canvasBackground,
        },
      })
        .composite([{ input: resized, top: OG_TOP_SAFE_PAD, left: 0 }])
        .png({ compressionLevel: 6 })
        .toFile(outPath);

      entry.optimizedOgImage = `${baseUrl}/share/og/${slug}.png`;
      entry.ogImageWidth = OG_WIDTH;
      entry.ogImageHeight = OG_HEIGHT;
      console.log(
        `✅ Writing OG ${slug}: ${srcWidth}x${srcHeight} → ${OG_WIDTH}x${OG_HEIGHT} (top safe pad ${OG_TOP_SAFE_PAD}px)`,
      );
    } catch (error) {
      console.warn(`⚠️ Writing OG skipped for ${slug}:`, error.message);
    }
  }

  return writingEntries;
}

module.exports = {
  OG_WIDTH,
  OG_HEIGHT,
  OG_TOP_SAFE_PAD,
  optimizeWritingOgImages,
  resolvePublicImageUrl,
};
