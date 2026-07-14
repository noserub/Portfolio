import { useEffect, useRef } from "react";
import {
  ATMOSPHERE_ANIMATION_SPEED,
  ATMOSPHERE_DOT_INTENSITY,
  ATMOSPHERE_DRIFT_AMPLITUDE,
  ATMOSPHERE_LIGHT_MODE_BOOST,
  ATMOSPHERE_NEBULA_INTENSITY,
  applyPointerToMotion,
  atmosphereClusterBreath,
  atmosphereNebulaMotion,
  atmospherePointerParticleOffset,
  atmospherePointerSparkWeight,
  atmosphereReadabilityAlpha,
  atmosphereVerticalEdgeAlpha,
  atmosphereVerticalEdgeMaskGradient,
  blendHex,
  buildAtmosphereDots,
  clusterPosition,
  deriveNebulaPalette,
  lerp,
  type AtmospherePointerInfluence,
  type NebulaGlowMotion,
  type NebulaPalette,
  withAlphaHex,
} from "../../lib/modernHeroAtmosphere";

const DOTS = buildAtmosphereDots();
const POINTER_SMOOTHING = 0.065;

function parseColor(css: string, fallback: string): string {
  const v = css.trim();
  return v || fallback;
}

function parseLengthPx(css: string, fallback: number, rootFontSizePx: number): number {
  const trimmed = css.trim();
  if (!trimmed) return fallback;
  if (trimmed.endsWith("rem")) {
    const rem = Number.parseFloat(trimmed);
    return Number.isFinite(rem) ? rem * rootFontSizePx : fallback;
  }
  if (trimmed.endsWith("px")) {
    const px = Number.parseFloat(trimmed);
    return Number.isFinite(px) ? px : fallback;
  }
  const value = Number.parseFloat(trimmed);
  return Number.isFinite(value) ? value : fallback;
}

function drawNebulaLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cxNorm: number,
  cyNorm: number,
  radiusScale: number,
  color: string,
  peakAlpha: number,
  midAlpha: number,
) {
  const glowCx = width * cxNorm;
  const glowCy = height * cyNorm;
  const glowRx = Math.max(width, height) * radiusScale;
  const glowRy = height * (radiusScale * 2.52);

  ctx.save();
  ctx.translate(glowCx, glowCy);
  ctx.scale(1, glowRy / glowRx);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRx);
  glow.addColorStop(0, withAlphaHex(color, peakAlpha));
  glow.addColorStop(0.42, withAlphaHex(color, midAlpha));
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, glowRx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNebulaGlows(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: NebulaPalette,
  motion: NebulaGlowMotion,
  pointer: AtmospherePointerInfluence,
  useAdditiveBlend: boolean,
) {
  const sparkWeight = atmospherePointerSparkWeight(pointer);

  const washBase = blendHex(palette.wash, palette.core, 0.18 + motion.washMix * 0.14);
  const whisperBase = blendHex(palette.whisper, palette.wash, 0.22 + motion.whisperMix * 0.16);
  const coreBase = blendHex(palette.core, palette.wash, 0.08 + motion.washMix * 0.06);

  const washColor = blendHex(washBase, palette.spark, sparkWeight * 0.48);
  const whisperColor = blendHex(whisperBase, palette.spark, sparkWeight * 0.62);
  const coreColor = blendHex(coreBase, palette.spark, sparkWeight * 0.16);

  const themeBoost = useAdditiveBlend ? 1 : ATMOSPHERE_LIGHT_MODE_BOOST;
  const intensity = ATMOSPHERE_NEBULA_INTENSITY * themeBoost;

  const washPeak = (0.028 + motion.washMix * 0.014 + sparkWeight * 0.008) * intensity;
  const whisperPeak = (0.02 + motion.whisperMix * 0.011 + sparkWeight * 0.01) * intensity;
  const corePeak = (0.062 + motion.pulse * 0.026 + sparkWeight * 0.004) * intensity;

  ctx.save();
  if (useAdditiveBlend) {
    ctx.globalCompositeOperation = "lighter";
  }

  drawNebulaLayer(ctx, width, height, motion.whisperX, motion.whisperY, 0.48, whisperColor, whisperPeak, whisperPeak * 0.34);
  drawNebulaLayer(ctx, width, height, motion.washX, motion.washY, 0.4, washColor, washPeak, washPeak * 0.38);

  if (sparkWeight > 0.08) {
    drawNebulaLayer(
      ctx,
      width,
      height,
      pointer.x,
      pointer.y,
      0.14,
      palette.spark,
      (0.022 + sparkWeight * 0.018) * intensity,
      (0.008 + sparkWeight * 0.006) * intensity,
    );
  }

  ctx.globalCompositeOperation = "source-over";
  drawNebulaLayer(ctx, width, height, motion.coreX, motion.coreY, 0.34, coreColor, corePeak, corePeak * 0.36);
  ctx.restore();
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  elapsed: number,
  palette: NebulaPalette,
  muted: string,
  reducedMotion: boolean,
  navHeightPx: number,
  isDarkTheme: boolean,
  pointer: AtmospherePointerInfluence,
) {
  ctx.clearRect(0, 0, width, height);

  const animTime = elapsed * ATMOSPHERE_ANIMATION_SPEED;
  const breath = reducedMotion ? 0.35 : atmosphereClusterBreath(elapsed);
  const driftAmp = reducedMotion ? 0 : ATMOSPHERE_DRIFT_AMPLITUDE;
  const baseMotion = atmosphereNebulaMotion(elapsed, reducedMotion);
  const motion = applyPointerToMotion(baseMotion, pointer);
  const sparkWeight = atmospherePointerSparkWeight(pointer);

  drawNebulaGlows(ctx, width, height, palette, motion, pointer, isDarkTheme);

  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = atmosphereVerticalEdgeMaskGradient(ctx, height, navHeightPx);
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";

  const sorted = [...DOTS].sort((a, b) => a.depth - b.depth);

  for (const dot of sorted) {
    const clustered = clusterPosition(dot.x, dot.y, breath);

    const driftX = Math.sin(animTime * 0.46 + dot.phase) * driftAmp;
    const driftY = Math.cos(animTime * 0.4 + dot.phase * 1.05) * driftAmp;
    const pointerOffset = atmospherePointerParticleOffset(clustered.x, clustered.y, dot.depth, pointer);

    const nx = clustered.x + driftX + pointerOffset.dx;
    const ny = clustered.y + driftY + pointerOffset.dy;
    const x = nx * width;
    const y = ny * height;

    const readAlpha = atmosphereReadabilityAlpha(x, width);
    const edgeAlpha = atmosphereVerticalEdgeAlpha(ny, height, navHeightPx);
    const lightBoost = isDarkTheme ? 1 : 1.25;
    const baseAlpha =
      (0.15 + dot.depth * 0.18) * readAlpha * edgeAlpha * ATMOSPHERE_DOT_INTENSITY * lightBoost;
    const radius = 0.9 + dot.depth * 0.85;

    const useAccent = dot.accent && readAlpha > 0.35;
    const alpha = useAccent ? Math.min(0.58, baseAlpha * 1.7) : Math.min(0.42, baseAlpha);

    let dotColor = muted;
    if (useAccent) {
      const tint = 0.2 + 0.22 * (0.5 + 0.5 * Math.sin(animTime * 0.09 + dot.phase));
      const greenTint = blendHex(palette.core, palette.wash, tint);
      dotColor = blendHex(greenTint, palette.spark, sparkWeight * 0.28);
    }

    ctx.fillStyle = withAlphaHex(dotColor, alpha);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function ModernHeroAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const pointerRef = useRef<AtmospherePointerInfluence>({ active: 0, x: 0.72, y: 0.5 });
  const pointerTargetRef = useRef<AtmospherePointerInfluence>({ active: 0, x: 0.72, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const host = canvas.closest(".modern-hero-atmosphere");
    if (!host) return;

    const heroSection = host.closest(".modern-hero-section");
    if (!heroSection) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const finePointer =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches;

    const pointerEnabled = finePointer && !reducedMotion;

    const readTheme = () => {
      const root = canvas.closest("[data-design]") ?? document.documentElement;
      const style = getComputedStyle(root);
      const rootFontSizePx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const accent = parseColor(style.getPropertyValue("--modern-accent"), "#84bd00");
      const isDarkTheme = document.documentElement.classList.contains("dark");
      return {
        palette: deriveNebulaPalette(accent),
        muted: parseColor(style.getPropertyValue("--modern-muted-text"), "#8c8c8c"),
        navHeightPx: parseLengthPx(style.getPropertyValue("--modern-nav-height"), 56, rootFontSizePx),
        isDarkTheme,
      };
    };

    let theme = readTheme();

    const updatePointerTarget = (clientX: number, clientY: number, active: number) => {
      const rect = heroSection.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerTargetRef.current = {
        active,
        x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointerEnabled || event.pointerType !== "mouse") return;
      updatePointerTarget(event.clientX, event.clientY, 1);
    };

    const onPointerEnter = (event: PointerEvent) => {
      if (!pointerEnabled || event.pointerType !== "mouse") return;
      updatePointerTarget(event.clientX, event.clientY, 1);
    };

    const onPointerLeave = () => {
      if (!pointerEnabled) return;
      pointerTargetRef.current = { ...pointerTargetRef.current, active: 0 };
    };

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
      theme = readTheme();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-design"],
    });

    if (pointerEnabled) {
      heroSection.addEventListener("pointermove", onPointerMove);
      heroSection.addEventListener("pointerenter", onPointerEnter);
      heroSection.addEventListener("pointerleave", onPointerLeave);
    }

    const paint = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = (now - startRef.current) / 1000;

      const target = pointerTargetRef.current;
      const pointer = pointerRef.current;
      pointer.active = lerp(pointer.active, target.active, POINTER_SMOOTHING);
      pointer.x = lerp(pointer.x, target.x, POINTER_SMOOTHING);
      pointer.y = lerp(pointer.y, target.y, POINTER_SMOOTHING);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawFrame(
          ctx,
          canvas.clientWidth,
          canvas.clientHeight,
          elapsed,
          theme.palette,
          theme.muted,
          reducedMotion,
          theme.navHeightPx,
          theme.isDarkTheme,
          pointer,
        );
      }
      frameRef.current = requestAnimationFrame(paint);
    };

    frameRef.current = requestAnimationFrame(paint);

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      themeObserver.disconnect();
      if (pointerEnabled) {
        heroSection.removeEventListener("pointermove", onPointerMove);
        heroSection.removeEventListener("pointerenter", onPointerEnter);
        heroSection.removeEventListener("pointerleave", onPointerLeave);
      }
    };
  }, []);

  return (
    <div className="modern-hero-atmosphere" aria-hidden>
      <div className="modern-hero-atmosphere__mark" />
      <div className="modern-hero-atmosphere__glow" />
      <canvas ref={canvasRef} className="modern-hero-atmosphere__canvas" />
    </div>
  );
}
