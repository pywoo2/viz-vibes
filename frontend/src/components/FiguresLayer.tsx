'use client';

import { useRef, useEffect, useCallback } from 'react';

interface FiguresLayerProps {
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  visible: boolean;
}

interface Pose {
  headX: number;
  headY: number;
  bodyEndY: number;
  leftArmX: number;
  leftArmY: number;
  rightArmX: number;
  rightArmY: number;
  leftLegX: number;
  leftLegY: number;
  rightLegX: number;
  rightLegY: number;
}

function drawFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  pose: Pose,
  sway: number
) {
  const sw = sway * scale * 0.02;

  ctx.beginPath();
  ctx.arc(x + pose.headX * scale + sw, y - scale * 0.8 + pose.headY * scale, scale * 0.12, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + sw * 0.8, y - scale * 0.65);
  ctx.lineTo(x + sw * 0.3, y + pose.bodyEndY * scale);
  ctx.stroke();

  // Left arm
  ctx.beginPath();
  ctx.moveTo(x + sw * 0.6, y - scale * 0.5);
  ctx.lineTo(x + pose.leftArmX * scale + sw, y + pose.leftArmY * scale);
  ctx.stroke();

  // Right arm
  ctx.beginPath();
  ctx.moveTo(x + sw * 0.6, y - scale * 0.5);
  ctx.lineTo(x + pose.rightArmX * scale + sw, y + pose.rightArmY * scale);
  ctx.stroke();

  // Left leg
  ctx.beginPath();
  ctx.moveTo(x + sw * 0.3, y + pose.bodyEndY * scale);
  ctx.lineTo(x + pose.leftLegX * scale, y + pose.leftLegY * scale);
  ctx.stroke();

  // Right leg
  ctx.beginPath();
  ctx.moveTo(x + sw * 0.3, y + pose.bodyEndY * scale);
  ctx.lineTo(x + pose.rightLegX * scale, y + pose.rightLegY * scale);
  ctx.stroke();
}

// --- Scene drawing functions ---

function drawWaving(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, energy: number) {
  const baseY = h * 0.78;
  const scale = Math.min(w, h) * 0.12;
  const sway = Math.sin(time * 1.2) * energy;

  // Figure 1 — standing, waving
  drawFigure(ctx, w * 0.42, baseY, scale, {
    headX: 0, headY: 0, bodyEndY: 0,
    leftArmX: -0.35, leftArmY: -0.25,
    rightArmX: 0.35, rightArmY: -0.75 + Math.sin(time * 2.5) * 0.1,
    leftLegX: -0.15, leftLegY: 0.45,
    rightLegX: 0.15, rightLegY: 0.45,
  }, sway);

  // Figure 2 — standing, relaxed
  drawFigure(ctx, w * 0.58, baseY, scale, {
    headX: 0, headY: 0, bodyEndY: 0,
    leftArmX: -0.3, leftArmY: -0.15,
    rightArmX: 0.3, rightArmY: -0.15,
    leftLegX: -0.15, leftLegY: 0.45,
    rightLegX: 0.15, rightLegY: 0.45,
  }, sway * 0.7);
}

function drawHighFive(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, energy: number) {
  const baseY = h * 0.78;
  const scale = Math.min(w, h) * 0.12;
  const sway = Math.sin(time * 1.5) * energy;
  const bob = Math.sin(time * 3) * 0.03;

  drawFigure(ctx, w * 0.45, baseY, scale, {
    headX: 0, headY: bob, bodyEndY: 0,
    leftArmX: -0.3, leftArmY: -0.2,
    rightArmX: 0.4, rightArmY: -0.8,
    leftLegX: -0.15, leftLegY: 0.45,
    rightLegX: 0.15, rightLegY: 0.45,
  }, sway);

  drawFigure(ctx, w * 0.55, baseY, scale, {
    headX: 0, headY: bob, bodyEndY: 0,
    leftArmX: -0.4, leftArmY: -0.8,
    rightArmX: 0.3, rightArmY: -0.2,
    leftLegX: -0.15, leftLegY: 0.45,
    rightLegX: 0.15, rightLegY: 0.45,
  }, sway * 0.8);
}

function drawDancing(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, energy: number) {
  const baseY = h * 0.78;
  const scale = Math.min(w, h) * 0.1;
  const sway = Math.sin(time * 2) * energy;

  const poses = [
    { x: 0.38, armPhase: 0 },
    { x: 0.5, armPhase: 1.2 },
    { x: 0.62, armPhase: 2.4 },
  ];

  poses.forEach(({ x, armPhase }) => {
    const armY = -0.5 + Math.sin(time * 2 + armPhase) * 0.3;
    const legSpread = 0.12 + Math.abs(Math.sin(time * 2 + armPhase)) * 0.08;
    drawFigure(ctx, w * x, baseY, scale, {
      headX: 0, headY: Math.sin(time * 2 + armPhase) * 0.05, bodyEndY: 0,
      leftArmX: -0.4, leftArmY: armY,
      rightArmX: 0.4, rightArmY: armY - 0.15,
      leftLegX: -legSpread, leftLegY: 0.45,
      rightLegX: legSpread, rightLegY: 0.45,
    }, sway);
  });
}

function drawHolding(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, energy: number) {
  const baseY = h * 0.78;
  const scale = Math.min(w, h) * 0.12;
  const sway = Math.sin(time * 0.8) * energy;

  drawFigure(ctx, w * 0.44, baseY, scale, {
    headX: 0, headY: 0, bodyEndY: 0,
    leftArmX: -0.3, leftArmY: -0.2,
    rightArmX: 0.35, rightArmY: -0.1,
    leftLegX: -0.15, leftLegY: 0.45,
    rightLegX: 0.15, rightLegY: 0.45,
  }, sway);

  drawFigure(ctx, w * 0.56, baseY, scale, {
    headX: 0, headY: 0, bodyEndY: 0,
    leftArmX: -0.35, leftArmY: -0.1,
    rightArmX: 0.3, rightArmY: -0.2,
    leftLegX: -0.15, leftLegY: 0.45,
    rightLegX: 0.15, rightLegY: 0.45,
  }, sway * 0.9);

  // Connecting line (held hands)
  const midY = baseY - scale * 0.1;
  ctx.beginPath();
  ctx.moveTo(w * 0.44 + 0.35 * scale, midY);
  ctx.lineTo(w * 0.56 - 0.35 * scale, midY);
  ctx.stroke();
}

function drawTalking(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, energy: number) {
  const baseY = h * 0.78;
  const scale = Math.min(w, h) * 0.12;
  const sway = Math.sin(time * 1.0) * energy;
  const gesture = Math.sin(time * 2.2) * 0.15;

  drawFigure(ctx, w * 0.43, baseY, scale, {
    headX: 0.02, headY: 0, bodyEndY: 0,
    leftArmX: -0.25, leftArmY: -0.15,
    rightArmX: 0.35, rightArmY: -0.35 + gesture,
    leftLegX: -0.15, leftLegY: 0.45,
    rightLegX: 0.15, rightLegY: 0.45,
  }, sway);

  drawFigure(ctx, w * 0.57, baseY, scale, {
    headX: -0.02, headY: 0, bodyEndY: 0,
    leftArmX: -0.35, leftArmY: -0.35 - gesture,
    rightArmX: 0.25, rightArmY: -0.15,
    leftLegX: -0.15, leftLegY: 0.45,
    rightLegX: 0.15, rightLegY: 0.45,
  }, sway * 0.8);
}

function drawHugging(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, energy: number) {
  const baseY = h * 0.78;
  const scale = Math.min(w, h) * 0.12;
  const sway = Math.sin(time * 0.6) * energy;
  const squeeze = Math.sin(time * 1.5) * 0.02;

  drawFigure(ctx, w * 0.47 + squeeze * scale, baseY, scale, {
    headX: 0.05, headY: -0.03, bodyEndY: 0,
    leftArmX: -0.15, leftArmY: -0.2,
    rightArmX: 0.35, rightArmY: -0.3,
    leftLegX: -0.18, leftLegY: 0.45,
    rightLegX: 0.1, rightLegY: 0.45,
  }, sway);

  drawFigure(ctx, w * 0.53 - squeeze * scale, baseY, scale, {
    headX: -0.05, headY: -0.03, bodyEndY: 0,
    leftArmX: -0.35, leftArmY: -0.3,
    rightArmX: 0.15, rightArmY: -0.2,
    leftLegX: -0.1, leftLegY: 0.45,
    rightLegX: 0.18, rightLegY: 0.45,
  }, sway * 0.9);
}

function drawWalking(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, energy: number) {
  const baseY = h * 0.78;
  const scale = Math.min(w, h) * 0.11;
  const sway = Math.sin(time * 1.3) * energy;
  const stride = Math.sin(time * 1.8);

  drawFigure(ctx, w * 0.44, baseY, scale, {
    headX: 0, headY: Math.abs(stride) * 0.03, bodyEndY: 0,
    leftArmX: -0.25 + stride * 0.1, leftArmY: -0.15 - stride * 0.1,
    rightArmX: 0.25 - stride * 0.1, rightArmY: -0.15 + stride * 0.1,
    leftLegX: -0.1 + stride * 0.1, leftLegY: 0.45,
    rightLegX: 0.1 - stride * 0.1, rightLegY: 0.45,
  }, sway);

  drawFigure(ctx, w * 0.56, baseY, scale, {
    headX: 0, headY: Math.abs(-stride) * 0.03, bodyEndY: 0,
    leftArmX: -0.25 - stride * 0.1, leftArmY: -0.15 + stride * 0.1,
    rightArmX: 0.25 + stride * 0.1, rightArmY: -0.15 - stride * 0.1,
    leftLegX: -0.1 - stride * 0.1, leftLegY: 0.45,
    rightLegX: 0.1 + stride * 0.1, rightLegY: 0.45,
  }, sway * 0.8);
}

function drawCheering(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, energy: number) {
  const baseY = h * 0.78;
  const scale = Math.min(w, h) * 0.1;
  const sway = Math.sin(time * 1.6) * energy;

  const positions = [0.38, 0.5, 0.62];
  positions.forEach((xp, i) => {
    const phase = i * 0.8;
    const armUp = -0.7 + Math.sin(time * 2.5 + phase) * 0.15;
    drawFigure(ctx, w * xp, baseY, scale, {
      headX: 0, headY: Math.sin(time * 2.5 + phase) * 0.04, bodyEndY: 0,
      leftArmX: -0.35, leftArmY: armUp,
      rightArmX: 0.35, rightArmY: armUp - 0.05,
      leftLegX: -0.15, leftLegY: 0.45,
      rightLegX: 0.15, rightLegY: 0.45,
    }, sway);
  });
}

const scenes = [
  drawWaving,
  drawHighFive,
  drawDancing,
  drawHolding,
  drawTalking,
  drawHugging,
  drawWalking,
  drawCheering,
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
    ctx.lineWidth = 1.5;
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
