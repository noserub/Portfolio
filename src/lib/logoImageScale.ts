/** Clamp logo display scale for the home employer strip. */
export function clampLogoImageScale(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 1;
  return Math.min(2, Math.max(0.6, value));
}

/**
 * Estimate how much to scale a logo so padded PNG/SVG canvases match text wordmarks.
 * Returns 1 when the artwork fills the file, >1 when there is excess transparent margin.
 */
export function estimateLogoVisualScale(img: HTMLImageElement): number {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh) return 1;

  const sampleMax = 96;
  const sampleScale = Math.min(sampleMax / nw, sampleMax / nh, 1);
  const sw = Math.max(1, Math.round(nw * sampleScale));
  const sh = Math.max(1, Math.round(nh * sampleScale));

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 1;

  try {
    ctx.drawImage(img, 0, 0, sw, sh);
    const { data } = ctx.getImageData(0, 0, sw, sh);

    let minX = sw;
    let minY = sh;
    let maxX = 0;
    let maxY = 0;

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const i = (y * sw + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        // Ignore fully transparent and near-black padding common on dark PNGs.
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (a > 24 && lum > 18) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (maxX <= minX || maxY <= minY) return 1;

    const contentW = (maxX - minX + 1) / sw;
    const contentH = (maxY - minY + 1) / sh;
    const fill = Math.max(contentW, contentH);
    if (fill >= 0.82) return 1;

    return clampLogoImageScale(0.95 / fill);
  } catch {
    return 1;
  }
}

export function measureLogoImageScale(url: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.onload = () => resolve(estimateLogoVisualScale(img));
    img.onerror = () => resolve(1);
    img.src = url;
  });
}
