import { useEffect, useRef } from "react";
import {
  atmosphereClusterBreath,
  atmosphereReadabilityAlpha,
  buildAtmosphereDots,
  clusterPosition,
} from "../../lib/modernHeroAtmosphere";

const DOTS = buildAtmosphereDots();

function parseColor(css: string, fallback: string): string {
  const v = css.trim();
  return v || fallback;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return null;
  const n = Number.parseInt(normalized, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function withAlpha(color: string, alpha: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  elapsed: number,
  colors: { accent: string; muted: string },
  reducedMotion: boolean,
) {
  ctx.clearRect(0, 0, width, height);

  const breath = reducedMotion ? 0.35 : atmosphereClusterBreath(elapsed);
  const driftAmp = reducedMotion ? 0 : 0.01;
  const pulse = 0.5 + 0.5 * Math.sin(elapsed * 0.55);

  const glowCx = width * 0.68;
  const glowCy = height * 0.42;
  const glowR = Math.max(width, height) * 0.48;
  const glow = ctx.createRadialGradient(glowCx, glowCy, 0, glowCx, glowCy, glowR);
  glow.addColorStop(0, withAlpha(colors.accent, 0.067 + pulse * 0.022));
  glow.addColorStop(0.4, withAlpha(colors.accent, 0.021));
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const sorted = [...DOTS].sort((a, b) => a.depth - b.depth);

  for (const dot of sorted) {
    const clustered = clusterPosition(dot.x, dot.y, breath);

    const driftX = Math.sin(elapsed * 0.4 + dot.phase) * driftAmp;
    const driftY = Math.cos(elapsed * 0.36 + dot.phase * 1.05) * driftAmp;

    const x = (clustered.x + driftX) * width;
    const y = (clustered.y + driftY) * height;

    const readAlpha = atmosphereReadabilityAlpha(x, width);
    const baseAlpha = (0.15 + dot.depth * 0.18) * readAlpha;
    const radius = 0.85 + dot.depth * 0.75;

    const useAccent = dot.accent && readAlpha > 0.35;
    const alpha = useAccent ? Math.min(0.48, baseAlpha * 1.65) : Math.min(0.34, baseAlpha);

    ctx.fillStyle = useAccent
      ? withAlpha(colors.accent, alpha)
      : withAlpha(colors.muted, alpha);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function ModernHeroAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const host = canvas.closest(".modern-hero-atmosphere");
    if (!host) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const readColors = () => {
      const root = canvas.closest("[data-design]") ?? document.documentElement;
      const style = getComputedStyle(root);
      return {
        accent: parseColor(style.getPropertyValue("--modern-accent"), "#84bd00"),
        muted: parseColor(style.getPropertyValue("--modern-muted-text"), "#8c8c8c"),
      };
    };

    let colors = readColors();

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const themeObserver = new MutationObserver(() => {
      colors = readColors();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-design"],
    });

    const paint = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = (now - startRef.current) / 1000;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawFrame(ctx, canvas.clientWidth, canvas.clientHeight, elapsed, colors, reducedMotion);
      }
      frameRef.current = requestAnimationFrame(paint);
    };

    frameRef.current = requestAnimationFrame(paint);

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  return (
    <div className="modern-hero-atmosphere" aria-hidden>
      <canvas ref={canvasRef} className="modern-hero-atmosphere__canvas" />
    </div>
  );
}
