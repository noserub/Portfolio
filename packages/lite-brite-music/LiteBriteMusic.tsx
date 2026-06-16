/**
 * Lite-Brite Groove — audio-reactive canvas visualization.
 * Self-contained: React + Canvas + Web Audio only (no UI kit required).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";

/** Stereo-ish rhythm bands + transient punch derived from frequency data */
export type RhythmSnapshot = {
  bass: number;
  mid: number;
  high: number;
  beat: number;
  flux: number;
};

export type LiteBriteMusicProps = {
  /** Panel heading */
  title?: string;
  /** Sets `document.title` while mounted (restored on unmount). Omit to leave title unchanged. */
  documentTitle?: string;
  /** Extra class names for the root container (e.g. Tailwind). */
  className?: string;
  /** Inline styles for the root container */
  style?: React.CSSProperties;
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function analyzeBins(freq: Uint8Array): RhythmSnapshot {
  const n = freq.length;
  const slice = (lo: number, hi: number) => {
    let s = 0;
    let c = 0;
    const i0 = Math.max(0, Math.floor(lo));
    const i1 = Math.min(n, Math.floor(hi));
    for (let i = i0; i < i1; i++) {
      s += freq[i];
      c++;
    }
    return c ? s / c / 255 : 0;
  };

  const bass = clamp01(slice(2, 16) * 1.4);
  const mid = clamp01(slice(16, 56) * 1.15);
  const high = clamp01(slice(56, n) * 1.25);

  let flux = 0;
  for (let i = 2; i < n - 1; i++) {
    const d = freq[i] - freq[i - 1];
    if (d > 0) flux += d;
  }
  flux = clamp01((flux / (n * 255)) * 3);

  const beat = clamp01(bass * 0.55 + flux * 0.85);

  return { bass, mid, high, beat, flux };
}

function syntheticRhythm(tSec: number): RhythmSnapshot {
  const groove =
    Math.sin(tSec * Math.PI * 2 * 1.8) * 0.12 +
    Math.sin(tSec * Math.PI * 2 * 3.7 + 1.1) * 0.08 +
    Math.sin(tSec * Math.PI * 2 * 6.2 + 2.4) * 0.05;

  const pulse = Math.pow(Math.abs(Math.sin(tSec * Math.PI * 7.2)), 6);
  const bass = clamp01(0.42 + groove + pulse * 0.55);
  const mid = clamp01(0.38 + Math.sin(tSec * 2.9 + 0.7) * 0.25 + pulse * 0.2);
  const high = clamp01(0.25 + Math.sin(tSec * 6.1) * 0.15 + pulse * 0.35);
  const kickish = Math.pow(Math.abs(Math.sin(tSec * Math.PI * 3.6)), 18);
  const beat = clamp01(bass * 0.5 + kickish * 0.95 + Math.sin(tSec * 11) * 0.08 + 0.05);
  const flux = clamp01(kickish * 2 + Math.abs(Math.sin(tSec * 13.7)) * 0.2);

  return { bass, mid, high, beat, flux };
}

type AudioMode = "demo" | "file" | "mic";

function hsla(h: number, s: number, l: number, a: number): string {
  return `hsla(${h % 360}, ${s}%, ${l}%, ${a})`;
}

/** Heart outline in local coords; caller applies `scale()` before calling. */
function addHeartPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  const topCurve = -0.55;
  ctx.moveTo(0, topCurve + 0.18);
  ctx.bezierCurveTo(0.85, topCurve - 0.35, 1.15, 0.55, 0, 1.25);
  ctx.bezierCurveTo(-1.15, 0.55, -0.85, topCurve - 0.35, 0, topCurve + 0.18);
  ctx.closePath();
}

function drawMushroom(ctx: CanvasRenderingContext2D, hue: number, glow: number): void {
  ctx.save();
  ctx.shadowBlur = 28 + glow * 45;
  ctx.shadowColor = hsla(hue + 40, 95, 62, 0.95);

  ctx.fillStyle = hsla(hue + 120, 85, 72, 1);
  ctx.beginPath();
  ctx.ellipse(0, -22, 52, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = hsla(hue + 90, 35, 78, 1);
  ctx.beginPath();
  ctx.ellipse(0, -8, 58, 22, 0, Math.PI, 0, false);
  ctx.fill();

  ctx.fillStyle = hsla(hue + 35, 78, 82, 1);
  ctx.fillRect(-14, -10, 28, 62);

  ctx.fillStyle = hsla(hue + 25, 55, 92, 0.85);
  ctx.beginPath();
  ctx.arc(-18, -28, 8, 0, Math.PI * 2);
  ctx.arc(22, -22, 6, 0, Math.PI * 2);
  ctx.arc(8, -38, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawRainbowArcs(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  pulse: number,
  spin: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(spin * 0.15);
  const bands = [
    { r: 140 + pulse * 35, w: 14, off: 0 },
    { r: 118 + pulse * 30, w: 13, off: 18 },
    { r: 96 + pulse * 26, w: 12, off: 36 },
    { r: 74 + pulse * 22, w: 11, off: 54 },
    { r: 52 + pulse * 18, w: 10, off: 72 },
  ];
  for (let i = 0; i < bands.length; i++) {
    const b = bands[i];
    ctx.strokeStyle = hsla(b.off + pulse * 40 + i * 14, 96, 62 - i * 4, 0.92);
    ctx.lineWidth = b.w;
    ctx.shadowBlur = 22 + pulse * 28;
    ctx.shadowColor = hsla(b.off + 200, 90, 65, 0.75);
    ctx.beginPath();
    ctx.arc(0, 30, b.r, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, R: number, hue: number, a: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? R : R * 0.42;
    const px = Math.cos(ang) * r;
    const py = Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = hsla(hue, 96, 68, a);
  ctx.shadowBlur = 18;
  ctx.shadowColor = hsla(hue, 100, 70, a);
  ctx.fill();
  ctx.restore();
}

type Spark = { x: number; y: number; vx: number; vy: number; life: number; hue: number };

const shell: React.CSSProperties = {
  position: "relative",
  minHeight: "100dvh",
  width: "100%",
  overflow: "hidden",
  background: "#070612",
};

const panel: React.CSSProperties = {
  pointerEvents: "auto",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  padding: "12px 16px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
  maxWidth: 560,
};

const btnBase: React.CSSProperties = {
  cursor: "pointer",
  border: "none",
  borderRadius: 9999,
  padding: "8px 16px",
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "inherit",
  transition: "background 0.15s ease, opacity 0.15s ease",
};

export function LiteBriteMusic({
  title = "Lite-Brite Groove",
  documentTitle,
  className,
  style,
}: LiteBriteMusicProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const freqRef = useRef<Uint8Array>(new Uint8Array(1024));
  const beatHoldRef = useRef(0);
  const energyAvgRef = useRef(0);
  const sparksRef = useRef<Spark[]>([]);
  const rafRef = useRef<number>(0);
  const fileUrlRef = useRef<string | null>(null);

  const [mode, setMode] = useState<AudioMode>("demo");
  const [status, setStatus] = useState<string>("Demo groove running — add audio anytime.");
  const [micBusy, setMicBusy] = useState(false);

  useEffect(() => {
    if (!documentTitle) return;
    const prev = document.title;
    document.title = documentTitle;
    return () => {
      document.title = prev;
    };
  }, [documentTitle]);

  const teardownAudio = useCallback(() => {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;

    try {
      sourceRef.current?.disconnect();
    } catch {}
    sourceRef.current = null;

    try {
      analyserRef.current?.disconnect();
    } catch {}
    analyserRef.current = null;

    try {
      void ctxRef.current?.close();
    } catch {}
    ctxRef.current = null;

    const el = audioRef.current;
    if (el) {
      el.pause();
      el.src = "";
    }

    if (fileUrlRef.current) {
      URL.revokeObjectURL(fileUrlRef.current);
      fileUrlRef.current = null;
    }
  }, []);

  const ensureAnalyser = useCallback(async (): Promise<AnalyserNode | null> => {
    const AC =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) {
      setStatus("Web Audio API not supported in this browser.");
      return null;
    }
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AC();
    }
    const ctx = ctxRef.current;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.72;
    analyser.minDecibels = -85;
    analyser.maxDecibels = -12;
    analyserRef.current = analyser;
    freqRef.current = new Uint8Array(analyser.frequencyBinCount);
    return analyser;
  }, []);

  const startMic = useCallback(async () => {
    setMicBusy(true);
    teardownAudio();
    setMode("mic");
    try {
      const analyser = await ensureAnalyser();
      if (!analyser || !ctxRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const src = ctxRef.current.createMediaStreamSource(stream);
      src.connect(analyser);
      sourceRef.current = src;
      await ctxRef.current.resume();
      setStatus("Microphone live — play music nearby or sing.");
    } catch (e) {
      console.warn(e);
      setStatus("Could not access microphone. Try a file or Demo.");
      setMode("demo");
    } finally {
      setMicBusy(false);
    }
  }, [ensureAnalyser, teardownAudio]);

  const attachAudioFile = useCallback(
    async (file: File) => {
      teardownAudio();
      setMode("file");
      const analyser = await ensureAnalyser();
      if (!analyser || !ctxRef.current) return;

      const url = URL.createObjectURL(file);
      fileUrlRef.current = url;

      const el = new Audio();
      el.crossOrigin = "anonymous";
      el.src = url;
      el.loop = true;
      el.playsInline = true;
      audioRef.current = el;

      try {
        await ctxRef.current.resume();
        const src = ctxRef.current.createMediaElementSource(el);
        src.connect(analyser);
        analyser.connect(ctxRef.current.destination);
        sourceRef.current = src;
        await el.play();
        setStatus(`Playing: ${file.name}`);
      } catch (e) {
        console.warn(e);
        setStatus("Could not play file — try another format (MP3/WAV/OGG).");
      }
    },
    [ensureAnalyser, teardownAudio],
  );

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      teardownAudio();
    };
  }, [teardownAudio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { innerWidth: w, innerHeight: h } = window;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.dataset.layoutDpr = String(dpr);
      const c2 = canvas.getContext("2d");
      if (c2) c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let last = performance.now();

    const burstSparks = (cx: number, cy: number, hue: number, n: number) => {
      const sparks = sparksRef.current;
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 2 + Math.random() * 7 + beatHoldRef.current * 8;
        sparks.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          life: 1,
          hue: hue + Math.random() * 40 - 20,
        });
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      const dpr = Number(canvas.dataset.layoutDpr) || Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      let rhythm: RhythmSnapshot;
      const analyser = analyserRef.current;

      if (mode !== "demo" && analyser) {
        analyser.getByteFrequencyData(freqRef.current);
        rhythm = analyzeBins(freqRef.current);

        const e = rhythm.beat;
        energyAvgRef.current = energyAvgRef.current * 0.94 + e * 0.06;
        const spike = e - energyAvgRef.current;
        if (spike > 0.08 && e > 0.22) {
          beatHoldRef.current = Math.min(1, beatHoldRef.current + spike * 4);
          burstSparks(w * 0.5, h * 0.42, 280 + rhythm.mid * 120, 10 + Math.floor(rhythm.high * 18));
        }
      } else {
        rhythm = syntheticRhythm(now / 1000);
        energyAvgRef.current = rhythm.beat * 0.95 + energyAvgRef.current * 0.05;
        if (rhythm.beat > 0.82 || Math.sin(now / 1000 * 13.7) > 0.94) {
          beatHoldRef.current = Math.min(1, beatHoldRef.current + dt * 6);
          burstSparks(w * (0.35 + Math.sin(now / 900) * 0.05), h * (0.38 + Math.cos(now / 700) * 0.04), 300 + rhythm.mid * 80, 8);
        }
      }

      beatHoldRef.current = Math.max(0, beatHoldRef.current - dt * 2.2);

      const pulse = 0.65 + rhythm.bass * 0.55 + beatHoldRef.current * 0.35;
      const shim = rhythm.high * 1.2;
      const swirl = now * 0.00012 + rhythm.mid * 0.018;

      ctx.fillStyle = "#070612";
      ctx.fillRect(0, 0, w, h);

      const holePitch = Math.max(10, Math.min(22, 13 + rhythm.mid * 7));
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      for (let y = holePitch * 0.8; y < h; y += holePitch) {
        for (let x = holePitch * 0.8; x < w; x += holePitch) {
          ctx.beginPath();
          ctx.arc(x, y, holePitch * 0.28, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const cols = Math.floor(w / holePitch);
      const rows = Math.floor(h / holePitch);
      const bins = freqRef.current.length;

      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const idx = (gx + gy * cols + Math.floor(swirl * 40)) % bins;
          const v =
            mode !== "demo" && analyser ? freqRef.current[idx] / 255 : 0.15 + rhythm.mid * Math.sin(idx * 0.07 + now / 400);
          const bright = clamp01(v * (0.55 + pulse * 0.65) + shim * 0.08);
          if (bright < 0.07) continue;
          const px = gx * holePitch + holePitch * 0.8;
          const py = gy * holePitch + holePitch * 0.8;
          const hue = (gx * 17 + gy * 31 + now / 25 + rhythm.mid * 120) % 360;

          const rg = ctx.createRadialGradient(px, py, 0, px, py, holePitch * 0.42);
          rg.addColorStop(0, hsla(hue, 100, 72, bright));
          rg.addColorStop(0.55, hsla(hue + 22, 96, 58, bright * 0.85));
          rg.addColorStop(1, hsla(hue + 44, 90, 48, 0));

          ctx.fillStyle = rg;
          ctx.beginPath();
          ctx.arc(px, py, holePitch * 0.38 * (0.85 + pulse * 0.12), 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = hsla(hue, 95, 78, bright * 0.55);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      const cx = w * 0.32;
      const cy = h * 0.42 + Math.sin(now / 800 + rhythm.bass * 4) * 14 * pulse;
      ctx.translate(cx, cy);
      ctx.rotate(swirl * 3 + rhythm.mid * 0.35);
      const heartHue = (now / 40 + rhythm.mid * 140) % 360;
      ctx.shadowBlur = 36 + beatHoldRef.current * 55 + rhythm.bass * 25;
      ctx.shadowColor = hsla(heartHue, 100, 65, 0.95);
      const heartGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 110);
      heartGrad.addColorStop(0, hsla(heartHue + 10, 100, 72, 1));
      heartGrad.addColorStop(0.55, hsla(heartHue - 10, 96, 58, 0.95));
      heartGrad.addColorStop(1, hsla(heartHue + 40, 92, 48, 0));
      ctx.fillStyle = heartGrad;
      const hs = 72 * (0.92 + rhythm.bass * 0.18);
      ctx.scale(hs, hs);
      addHeartPath(ctx);
      ctx.fill();

      ctx.strokeStyle = hsla(heartHue + 180, 85, 82, 0.35 + shim * 0.25);
      ctx.lineWidth = 3 / hs;
      addHeartPath(ctx);
      ctx.stroke();

      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.translate(w * 0.72, h * 0.46 + Math.cos(now / 650) * 12 * pulse);
      ctx.rotate(-swirl * 2 - rhythm.mid * 0.25);
      drawMushroom(ctx, (now / 50) % 360 + rhythm.high * 80, rhythm.bass + beatHoldRef.current);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      drawRainbowArcs(ctx, w * 0.5, h * 0.72 - rhythm.bass * 40, pulse, swirl + now / 5000);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const stars = 14;
      for (let s = 0; s < stars; s++) {
        const sx = (w * (0.12 + ((s * 59.123) % 1) * 0.76) + Math.sin(now / 1000 + s) * 18 * shim) % w;
        const sy =
          (h * (0.08 + ((s * 37.891) % 1) * 0.35) + Math.cos(now / 900 + s * 2) * 14 * shim) % (h * 0.45);
        const tw = 0.55 + 0.45 * Math.sin(now / 300 + s * 13 + rhythm.high * 10);
        drawStar(ctx, sx, sy, 10 + rhythm.high * 14 + beatHoldRef.current * 10, (s * 47 + now / 18) % 360, tw * (0.55 + pulse * 0.45));
      }
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const sparks = sparksRef.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        p.vy += 0.12;
        p.life -= dt * 1.1;
        if (p.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 + p.life * 3, 0, Math.PI * 2);
        ctx.fillStyle = hsla(p.hue, 98, 72, p.life * 0.95);
        ctx.shadowBlur = 14;
        ctx.shadowColor = hsla(p.hue, 100, 70, p.life);
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = `rgba(255, 180, 220, ${0.04 + shim * 0.06})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [mode, teardownAudio]);

  const primaryBtn: React.CSSProperties = {
    ...btnBase,
    background: "linear-gradient(135deg, #a855f7, #6366f1)",
    color: "#fff",
  };
  const idleBtn: React.CSSProperties = {
    ...btnBase,
    background: "rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.92)",
  };
  const fileLabel: React.CSSProperties = {
    ...idleBtn,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div className={className} style={{ ...shell, ...style }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, display: "block", touchAction: "none" }} aria-hidden />

      <div
        style={{
          position: "relative",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: "16px 24px",
          maxWidth: 560,
          pointerEvents: "none",
        }}
      >
        <div style={panel}>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.05rem, 2.5vw, 1.35rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#fff",
              fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
            }}
          >
            {title}
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.45 }}>{status}</p>

          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              style={mode === "demo" ? primaryBtn : idleBtn}
              onClick={() => {
                teardownAudio();
                setMode("demo");
                setStatus("Demo groove running — add audio anytime.");
              }}
            >
              Demo
            </button>
            <label style={fileLabel}>
              <input
                type="file"
                accept="audio/*"
                style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", border: 0 }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void attachAudioFile(f);
                  e.target.value = "";
                }}
              />
              Audio file
            </label>
            <button
              type="button"
              disabled={micBusy}
              style={{
                ...(mode === "mic" ? primaryBtn : idleBtn),
                opacity: micBusy ? 0.65 : 1,
                cursor: micBusy ? "wait" : "pointer",
              }}
              onClick={() => void startMic()}
            >
              {micBusy ? "Mic…" : "Mic"}
            </button>
          </div>

          <p style={{ margin: "12px 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.45 }}>
            Pegs and shapes pulse with bass and mids; beats throw sparks. Best with headphones or a track with strong drums.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LiteBriteMusic;
