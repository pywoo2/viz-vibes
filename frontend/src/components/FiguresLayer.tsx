'use client';

import { useRef, useEffect, useCallback } from 'react';

interface FiguresLayerProps {
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  visible: boolean;
}

// --- Architectural sketch drawing functions ---

function drawSkyscraper(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, energy: number) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const scale = Math.min(w, h) * 0.3;
  const sway = Math.sin(time * 0.8) * energy * 2;

  const bw = scale * 0.35;
  const bh = scale * 1.2;
  const left = cx - bw / 2 + sway;
  const top = cy - bh * 0.6;
  const bottom = cy + bh * 0.4;

  // Outline
  ctx.beginPath();
  ctx.rect(left, top, bw, bh);
  ctx.stroke();

  // Floors
  const floors = 10;
  for (let i = 1; i < floors; i++) {
    const fy = top + (bh / floors) * i;
    ctx.beginPath();
    ctx.moveTo(left, fy);
    ctx.lineTo(left + bw, fy);
    ctx.stroke();
  }

  // Windows (2 columns)
  const winW = bw * 0.15;
  const winH = (bh / floors) * 0.5;
  for (let i = 0; i < floors; i++) {
    const fy = top + (bh / floors) * i + (bh / floors) * 0.25;
    // Left window
    ctx.beginPath();
    ctx.rect(left + bw * 0.2, fy, winW, winH);
    ctx.stroke();
    // Right window
    ctx.beginPath();
    ctx.rect(left + bw * 0.6, fy, winW, winH);
    ctx.stroke();
  }

  // Antenna
  ctx.beginPath();
  ctx.moveTo(cx + sway, top);
  ctx.lineTo(cx + sway, top - scale * 0.15);
  ctx.stroke();

  // Ground line
  ctx.beginPath();
  ctx.moveTo(cx - scale * 0.5 + sway * 0.5, bottom);
  ctx.lineTo(cx + scale * 0.5 + sway * 0.5, bottom);
  ctx.stroke();
}

function drawBridge(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, energy: number) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const scale = Math.min(w, h) * 0.35;
  const sway = Math.sin(time * 0.6) * energy * 1.5;

  const deckY = cy + scale * 0.1 + sway * 0.5;
  const left = cx - scale * 0.8;
  const right = cx + scale * 0.8;

  // Deck
  ctx.beginPath();
  ctx.moveTo(left, deckY);
  ctx.lineTo(right, deckY);
  ctx.stroke();

  // Two towers
  const towerH = scale * 0.5;
  const t1x = cx - scale * 0.35;
  const t2x = cx + scale * 0.35;
  [t1x, t2x].forEach((tx) => {
    ctx.beginPath();
    ctx.moveTo(tx, deckY);
    ctx.lineTo(tx, deckY - towerH);
    ctx.stroke();
  });

  // Main arch cable
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const x = left + (right - left) * t;
    const archY = deckY - towerH * 0.9 + Math.pow((t - 0.5) * 2, 2) * towerH * 0.9;
    if (i === 0) ctx.moveTo(x, archY);
    else ctx.lineTo(x, archY);
  }
  ctx.stroke();

  // Vertical cables
  const numCables = 12;
  for (let i = 1; i < numCables; i++) {
    const t = i / numCables;
    const x = left + (right - left) * t;
    const archY = deckY - towerH * 0.9 + Math.pow((t - 0.5) * 2, 2) * towerH * 0.9;
    ctx.beginPath();
    ctx.moveTo(x, archY);
    ctx.lineTo(x, deckY);
    ctx.stroke();
  }
}

function drawArch(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, energy: number) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const scale = Math.min(w, h) * 0.3;
  const sway = Math.sin(time * 0.7) * energy * 1.5;

  const baseY = cy + scale * 0.4;
  const colW = scale * 0.08;
  const colH = scale * 0.6;
  const archW = scale * 0.6;

  // Left column
  ctx.beginPath();
  ctx.rect(cx - archW / 2 - colW / 2 + sway, baseY - colH, colW, colH);
  ctx.stroke();

  // Right column
  ctx.beginPath();
  ctx.rect(cx + archW / 2 - colW / 2 + sway, baseY - colH, colW, colH);
  ctx.stroke();

  // Arch
  ctx.beginPath();
  ctx.arc(cx + sway, baseY - colH, archW / 2, Math.PI, 0);
  ctx.stroke();

  // Keystone detail
  ctx.beginPath();
  const ksW = scale * 0.06;
  const ksH = scale * 0.08;
  ctx.rect(cx - ksW / 2 + sway, baseY - colH - archW / 2 - ksH / 2, ksW, ksH);
  ctx.stroke();

  // Column capitals (small rectangles)
  [cx - archW / 2 + sway, cx + archW / 2 + sway].forEach((x) => {
    ctx.beginPath();
    ctx.rect(x - colW * 0.8, baseY - colH - colW * 0.3, colW * 1.6, colW * 0.3);
    ctx.stroke();
  });

  // Base line
  ctx.beginPath();
  ctx.moveTo(cx - scale * 0.5 + sway, baseY);
  ctx.lineTo(cx + scale * 0.5 + sway, baseY);
  ctx.stroke();
}

function drawFloorPlan(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, energy: number) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const scale = Math.min(w, h) * 0.3;
  const sway = Math.sin(time * 0.5) * energy * 1.5;

  const pw = scale * 1.0;
  const ph = scale * 0.7;
  const left = cx - pw / 2 + sway;
  const top = cy - ph / 2;

  // Outer walls
  ctx.beginPath();
  ctx.rect(left, top, pw, ph);
  ctx.stroke();

  // Vertical divider (hallway)
  ctx.beginPath();
  ctx.moveTo(left + pw * 0.4, top);
  ctx.lineTo(left + pw * 0.4, top + ph);
  ctx.stroke();

  // Horizontal divider left side
  ctx.beginPath();
  ctx.moveTo(left, top + ph * 0.5);
  ctx.lineTo(left + pw * 0.4, top + ph * 0.5);
  ctx.stroke();

  // Horizontal divider right side (partial -- door gap)
  ctx.beginPath();
  ctx.moveTo(left + pw * 0.4, top + ph * 0.35);
  ctx.lineTo(left + pw * 0.75, top + ph * 0.35);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(left + pw * 0.85, top + ph * 0.35);
  ctx.lineTo(left + pw, top + ph * 0.35);
  ctx.stroke();

  // Door arcs (quarter circles to indicate door swing)
  const doorR = pw * 0.1;
  // Door in upper left room
  ctx.beginPath();
  ctx.arc(left + pw * 0.4, top + ph * 0.5, doorR, -Math.PI / 2, 0);
  ctx.stroke();

  // Small room at bottom-right
  ctx.beginPath();
  ctx.moveTo(left + pw * 0.7, top + ph * 0.35);
  ctx.lineTo(left + pw * 0.7, top + ph);
  ctx.stroke();

  // Bathroom fixtures (small rectangles)
  ctx.beginPath();
  ctx.rect(left + pw * 0.73, top + ph * 0.75, pw * 0.08, pw * 0.06);
  ctx.stroke();

  ctx.beginPath();
  ctx.rect(left + pw * 0.88, top + ph * 0.75, pw * 0.06, pw * 0.06);
  ctx.stroke();
}

function drawStaircase(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, energy: number) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const scale = Math.min(w, h) * 0.3;
  const sway = Math.sin(time * 0.9) * energy * 1.5;

  const steps = 12;
  const stepW = scale * 0.6;
  const stepH = scale * 0.08;
  const totalH = steps * stepH;

  const startX = cx - stepW / 2 + sway;
  const startY = cy + totalH / 2;

  // Draw steps
  for (let i = 0; i < steps; i++) {
    const x = startX;
    const y = startY - i * stepH;

    // Horizontal tread
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + stepW, y);
    ctx.stroke();

    // Vertical riser
    ctx.beginPath();
    ctx.moveTo(x + stepW, y);
    ctx.lineTo(x + stepW, y - stepH);
    ctx.stroke();
  }

  // Left railing
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(startX, startY - totalH);
  ctx.stroke();

  // Right railing (diagonal)
  ctx.beginPath();
  ctx.moveTo(startX + stepW, startY);
  ctx.lineTo(startX + stepW, startY - totalH - stepH);
  ctx.stroke();

  // Railing handrail (slightly offset, diagonal)
  ctx.beginPath();
  ctx.moveTo(startX - scale * 0.03, startY - scale * 0.05);
  ctx.lineTo(startX - scale * 0.03, startY - totalH - scale * 0.05);
  ctx.stroke();

  // Top landing
  ctx.beginPath();
  ctx.moveTo(startX, startY - totalH);
  ctx.lineTo(startX + stepW, startY - totalH - stepH);
  ctx.stroke();
}

function drawDome(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, energy: number) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const scale = Math.min(w, h) * 0.3;
  const sway = Math.sin(time * 0.7) * energy * 1.5;

  const baseY = cy + scale * 0.3;
  const domeR = scale * 0.5;
  const dCx = cx + sway;

  // Dome outline (half circle)
  ctx.beginPath();
  ctx.arc(dCx, baseY, domeR, Math.PI, 0);
  ctx.stroke();

  // Ribs (curved lines from base to top)
  const numRibs = 7;
  for (let i = 1; i < numRibs; i++) {
    const t = i / numRibs;
    const angle = Math.PI * t;
    ctx.beginPath();
    // Draw a meridian line from base-left through top
    for (let j = 0; j <= 20; j++) {
      const a = Math.PI + (0 - Math.PI) * (j / 20);
      const rx = Math.cos(a) * domeR * Math.sin(angle);
      const ry = -Math.sin(a) * domeR;
      const px = dCx + rx;
      const py = baseY + ry;
      if (j === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Horizontal rings
  const numRings = 4;
  for (let i = 1; i <= numRings; i++) {
    const ringAngle = (Math.PI / 2) * (i / (numRings + 1));
    const ringR = Math.cos(ringAngle) * domeR;
    const ringY = baseY - Math.sin(ringAngle) * domeR;
    ctx.beginPath();
    ctx.moveTo(dCx - ringR, ringY);
    ctx.lineTo(dCx + ringR, ringY);
    ctx.stroke();
  }

  // Base line
  ctx.beginPath();
  ctx.moveTo(dCx - domeR * 1.1, baseY);
  ctx.lineTo(dCx + domeR * 1.1, baseY);
  ctx.stroke();

  // Small lantern at top
  ctx.beginPath();
  ctx.rect(dCx - scale * 0.03, baseY - domeR - scale * 0.08, scale * 0.06, scale * 0.08);
  ctx.stroke();
}

function drawTower(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, energy: number) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const scale = Math.min(w, h) * 0.3;
  const sway = Math.sin(time * 0.6) * energy * 1.5;

  const tw = scale * 0.3;
  const th = scale * 1.3;
  const left = cx - tw / 2 + sway;
  const top = cy - th * 0.55;
  const bottom = cy + th * 0.45;

  // Outline with slight taper
  const taperTop = tw * 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - tw / 2 + sway, bottom);
  ctx.lineTo(cx - taperTop / 2 + sway, top);
  ctx.lineTo(cx + taperTop / 2 + sway, top);
  ctx.lineTo(cx + tw / 2 + sway, bottom);
  ctx.closePath();
  ctx.stroke();

  // Geometric patterns - diagonal cross-bracing
  const sections = 8;
  for (let i = 0; i < sections; i++) {
    const t1 = i / sections;
    const t2 = (i + 1) / sections;
    const y1 = bottom - th * t1;
    const y2 = bottom - th * t2;
    const w1 = tw / 2 - (tw / 2 - taperTop / 2) * t1;
    const w2 = tw / 2 - (tw / 2 - taperTop / 2) * t2;

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(cx - w1 + sway, y1);
    ctx.lineTo(cx + w1 + sway, y1);
    ctx.stroke();

    // X-bracing
    if (i % 2 === 0) {
      ctx.beginPath();
      ctx.moveTo(cx - w1 + sway, y1);
      ctx.lineTo(cx + w2 + sway, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + w1 + sway, y1);
      ctx.lineTo(cx - w2 + sway, y2);
      ctx.stroke();
    } else {
      // Diamond pattern
      const midY = (y1 + y2) / 2;
      const midW = (w1 + w2) / 2;
      ctx.beginPath();
      ctx.moveTo(cx + sway, y1);
      ctx.lineTo(cx + midW + sway, midY);
      ctx.lineTo(cx + sway, y2);
      ctx.lineTo(cx - midW + sway, midY);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Top line
  ctx.beginPath();
  ctx.moveTo(cx - taperTop / 2 + sway, top);
  ctx.lineTo(cx + taperTop / 2 + sway, top);
  ctx.stroke();

  // Spire
  ctx.beginPath();
  ctx.moveTo(cx + sway, top - scale * 0.12);
  ctx.lineTo(cx - taperTop * 0.15 + sway, top);
  ctx.moveTo(cx + sway, top - scale * 0.12);
  ctx.lineTo(cx + taperTop * 0.15 + sway, top);
  ctx.stroke();
}

function drawSkyline(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, energy: number) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const scale = Math.min(w, h) * 0.3;
  const sway = Math.sin(time * 0.5) * energy * 1.5;

  const baseY = cy + scale * 0.35;
  const skyW = scale * 1.6;
  const startX = cx - skyW / 2 + sway;

  // Building definitions: [x offset ratio, width ratio, height ratio]
  const buildings: [number, number, number][] = [
    [0.0, 0.08, 0.3],
    [0.08, 0.06, 0.45],
    [0.14, 0.1, 0.55],
    [0.24, 0.07, 0.35],
    [0.31, 0.12, 0.75],
    [0.43, 0.06, 0.4],
    [0.49, 0.09, 0.9],
    [0.58, 0.07, 0.5],
    [0.65, 0.1, 0.6],
    [0.75, 0.08, 0.35],
    [0.83, 0.06, 0.5],
    [0.89, 0.11, 0.42],
  ];

  buildings.forEach(([xOff, wRatio, hRatio]) => {
    const bx = startX + xOff * skyW;
    const bw = wRatio * skyW;
    const bh = hRatio * scale * 0.8;
    const by = baseY - bh;

    // Building outline
    ctx.beginPath();
    ctx.rect(bx, by, bw, bh);
    ctx.stroke();

    // Window rows
    const floorH = bh / Math.max(3, Math.floor(bh / (scale * 0.06)));
    for (let f = 1; f < Math.floor(bh / floorH); f++) {
      const fy = by + f * floorH;
      // Small window dots
      const numWin = Math.max(1, Math.floor(bw / (scale * 0.04)));
      const winSpacing = bw / (numWin + 1);
      for (let wi = 1; wi <= numWin; wi++) {
        const wx = bx + wi * winSpacing;
        ctx.beginPath();
        ctx.rect(wx - scale * 0.008, fy - scale * 0.01, scale * 0.016, scale * 0.02);
        ctx.stroke();
      }
    }
  });

  // Ground line
  ctx.beginPath();
  ctx.moveTo(startX - scale * 0.05, baseY);
  ctx.lineTo(startX + skyW + scale * 0.05, baseY);
  ctx.stroke();
}

const scenes = [
  drawSkyscraper,
  drawBridge,
  drawArch,
  drawFloorPlan,
  drawStaircase,
  drawDome,
  drawTower,
  drawSkyline,
];

export default function FiguresLayer({ isPlaying, analyser, visible }: FiguresLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const sceneIndexRef = useRef(0);
  const sceneStartRef = useRef(Date.now());
  const fadeRef = useRef(1); // 0 = invisible, 1 = fully visible
  const fadingOutRef = useRef(false);
  const startTimeRef = useRef(Date.now());

  const SCENE_DURATION = 12000; // 12s per scene
  const FADE_DURATION = 3000;   // 3s crossfade

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Audio energy
    let energy = 0;
    if (analyser && isPlaying) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const bins = data.length;
      let bass = 0;
      for (let i = 0; i < bins / 6; i++) bass += data[i];
      bass = bass / (bins / 6) / 255;
      energy = bass;
    }

    const now = Date.now();
    const elapsed = now - sceneStartRef.current;
    const time = (now - startTimeRef.current) / 1000;

    // Handle scene transitions
    if (elapsed > SCENE_DURATION - FADE_DURATION && !fadingOutRef.current) {
      fadingOutRef.current = true;
    }

    if (fadingOutRef.current) {
      const fadeElapsed = elapsed - (SCENE_DURATION - FADE_DURATION);
      fadeRef.current = Math.max(0, 1 - fadeElapsed / FADE_DURATION);

      if (fadeRef.current <= 0) {
        // Switch scene
        sceneIndexRef.current = (sceneIndexRef.current + 1) % scenes.length;
        sceneStartRef.current = now;
        fadingOutRef.current = false;
        fadeRef.current = 0;
      }
    } else if (elapsed < FADE_DURATION) {
      // Fading in
      fadeRef.current = Math.min(1, elapsed / FADE_DURATION);
    } else {
      fadeRef.current = 1;
    }

    const opacity = fadeRef.current * 0.1; // max 0.1 opacity — very faint
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const sceneFn = scenes[sceneIndexRef.current];
    sceneFn(ctx, w, h, time, energy);

    animRef.current = requestAnimationFrame(render);
  }, [analyser, isPlaying]);

  useEffect(() => {
    if (!visible) {
      cancelAnimationFrame(animRef.current);
      return;
    }
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [visible, render]);

  return (
    <canvas
      ref={canvasRef}
      id="figures-layer"
      className={visible ? 'visible' : ''}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
