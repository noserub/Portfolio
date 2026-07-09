const path = require('path');

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

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
 * Build 1200x630 OG crops for writing heroes into dist/share/og/{slug}.png.
 * LinkedIn expects at least 1200px width; raw heroes are often smaller or wrong aspect.
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
      await sharp(input)
        .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'center' })
        .png({ compressionLevel: 9 })
        .toFile(outPath);

      entry.optimizedOgImage = `${baseUrl}/share/og/${slug}.png`;
      entry.ogImageWidth = OG_WIDTH;
      entry.ogImageHeight = OG_HEIGHT;
      console.log(
        `✅ Writing OG ${slug}: ${metadata.width || '?'}x${metadata.height || '?'} hero → ${OG_WIDTH}x${OG_HEIGHT}`,
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
  optimizeWritingOgImages,
  resolvePublicImageUrl,
};
