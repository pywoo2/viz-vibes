'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Color palette: 0=transparent, 1=#0f380f (dark), 2=#306230 (medium), 3=#8bac0f (light body)
const PALETTE = ['transparent', '#0f380f', '#306230', '#8bac0f'];

// ── Egg sprites ──

const EGG_1: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,1,3,3,3,1,3,3,3,3,1,0,0,0],
  [0,0,0,1,3,3,3,3,3,1,3,3,1,0,0,0],
  [0,0,1,3,3,3,3,3,3,3,3,3,3,1,0,0],
  [0,0,1,3,3,1,3,3,3,3,3,3,3,1,0,0],
  [0,0,1,3,3,3,3,3,3,3,1,3,3,1,0,0],
  [0,0,1,3,3,3,3,3,3,3,3,3,3,1,0,0],
  [0,0,0,1,3,3,3,3,3,3,3,3,1,0,0,0],
  [0,0,0,1,3,3,3,3,3,3,3,3,1,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Egg wobble — shifted 1px right
const EGG_2: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,0,1,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,3,3,1,0,0,0],
  [0,0,0,0,1,3,3,3,1,3,3,3,3,1,0,0],
  [0,0,0,0,1,3,3,3,3,3,1,3,3,1,0,0],
  [0,0,0,1,3,3,3,3,3,3,3,3,3,3,1,0],
  [0,0,0,1,3,3,1,3,3,3,3,3,3,3,1,0],
  [0,0,0,1,3,3,3,3,3,3,3,1,3,3,1,0],
  [0,0,0,1,3,3,3,3,3,3,3,3,3,3,1,0],
  [0,0,0,0,1,3,3,3,3,3,3,3,3,1,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,3,3,1,0,0],
  [0,0,0,0,0,1,3,3,3,3,3,3,1,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ── Baby sprites ──

// Baby idle frame 1 — centered blob with eyes and feet
const BABY_IDLE_1: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,1,3,3,1,3,1,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,3,2,2,3,3,1,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Baby idle frame 2 — bounced up 1px
const BABY_IDLE_2: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,1,3,3,1,3,1,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,3,2,2,3,3,1,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Baby eating frame 1 — mouth open
const BABY_EAT_1: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,1,3,3,1,3,1,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,3,1,1,3,3,1,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Baby eating frame 2 — mouth closed, food gone
const BABY_EAT_2: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,2,3,3,2,3,1,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Baby sad — droopy eyes
const BABY_SAD: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,3,1,3,3,1,1,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,3,2,2,3,3,1,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Baby dirty — stink lines above
const BABY_DIRTY: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0],
  [0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,1,3,3,1,3,1,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,3,2,2,3,3,1,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Baby sleeping — closed eyes + Z's
const BABY_SLEEP_1: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,1,1,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,2,2,3,2,2,1,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Baby sleeping frame 2 — Z moved up
const BABY_SLEEP_2: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,2,2,3,2,2,1,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Baby playing frame 1 — arms up
const BABY_PLAY_1: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,1,3,3,1,3,1,0,0,0,0],
  [0,0,0,1,1,3,3,3,3,3,3,1,1,0,0,0],
  [0,0,1,0,1,3,3,2,2,3,3,1,0,1,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Baby playing frame 2 — arms down, bounced
const BABY_PLAY_2: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,1,3,3,1,3,1,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,0,1,3,3,2,2,3,3,1,0,0,0,0],
  [0,0,0,0,0,1,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,1,0,1,3,3,3,3,1,0,1,0,0,0],
  [0,0,1,0,0,0,1,1,1,1,0,0,0,1,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

type SpriteMap = Record<string, Record<string, number[][][]>>;

const SPRITES: SpriteMap = {
  egg: {
    idle: [EGG_1, EGG_2],
    eating: [EGG_1, EGG_2],
    playing: [EGG_1, EGG_2],
    sleeping: [EGG_1, EGG_2],
    sad: [EGG_1],
    dirty: [EGG_1],
  },
  baby: {
    idle: [BABY_IDLE_1, BABY_IDLE_2],
    eating: [BABY_EAT_1, BABY_EAT_2],
    playing: [BABY_PLAY_1, BABY_PLAY_2],
    sleeping: [BABY_SLEEP_1, BABY_SLEEP_2],
    sad: [BABY_SAD],
    dirty: [BABY_DIRTY],
  },
};

function getSpriteForState(stage: string, animation: string, frame: number): number[][] {
  const stageSprites = SPRITES[stage] || SPRITES.baby;
  const frames = stageSprites[animation] || stageSprites.idle;
  return frames[frame % frames.length];
}

function renderSprite(ctx: CanvasRenderingContext2D, sprite: number[][], canvasW: number, canvasH: number) {
  const gridSize = sprite.length;
  const pixelSize = Math.floor(Math.min(canvasW, canvasH) / gridSize);
  const offsetX = Math.floor((canvasW - gridSize * pixelSize) / 2);
  const offsetY = Math.floor((canvasH - gridSize * pixelSize) / 2);

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < sprite[y].length; x++) {
      const colorIdx = sprite[y][x];
      if (colorIdx === 0) continue;
      ctx.fillStyle = PALETTE[colorIdx];
      ctx.fillRect(offsetX + x * pixelSize, offsetY + y * pixelSize, pixelSize, pixelSize);
    }
  }
}

function getMoodAnimation(pet: PetState): string {
  if (pet.cleanliness < 30) return 'dirty';
  if (pet.happiness < 30) return 'sad';
  if (pet.hunger > 80) return 'sad';
  return 'idle';
}

interface PetState {
  name: string;
  stage: string;
  mood: string;
  hunger: number;
  happiness: number;
  cleanliness: number;
  totalInteractions: number;
}

interface TodoEntry {
  text: string;
  author: string;
  timestamp: string;
}

const stageGoals = [
  { stage: 'egg', next: 'baby', threshold: 150, emoji: '\u{1F95A}', nextEmoji: '\u{1F423}' },
  { stage: 'baby', next: 'kid', threshold: 600, emoji: '\u{1F423}', nextEmoji: '\u{1F425}' },
  { stage: 'kid', next: 'teen', threshold: 3000, emoji: '\u{1F425}', nextEmoji: '\u{1F426}' },
  { stage: 'teen', next: 'adult', threshold: 15000, emoji: '\u{1F426}', nextEmoji: '\u{1F985}' },
];

export default function Pet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pet, setPet] = useState<PetState | null>(null);
  const [animation, setAnimation] = useState<string>('idle');
  const [frame, setFrame] = useState(0);
  const [error, setError] = useState(false);
  const [feedbackEmoji, setFeedbackEmoji] = useState<{emoji: string, x: number, y: number} | null>(null);
  const [actionFlash, setActionFlash] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [todos, setTodos] = useState<TodoEntry[]>([]);
  const [todoInput, setTodoInput] = useState('');

  // Fetch pet state
  useEffect(() => {
    const fetchPet = () => {
      fetch(`${API_URL}/api/pet`)
        .then(r => r.json())
        .then((data: PetState) => { setPet(data); setError(false); })
        .catch(() => {
          setError(true);
          // Fallback pet for demo when backend is down
          setPet({
            name: 'viz',
            stage: 'baby',
            mood: 'neutral',
            hunger: 50,
            happiness: 70,
            cleanliness: 60,
            totalInteractions: 12,
          });
        });
    };
    fetchPet();
    const interval = setInterval(fetchPet, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch community todos
  useEffect(() => {
    fetch(`${API_URL}/api/pet/todos`)
      .then(r => r.json())
      .then((data) => { if (Array.isArray(data)) setTodos(data); })
      .catch(() => {});
  }, []);

  // Animation loop — 2fps like real Tamagotchi
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => f + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Determine animation from mood when idle
  useEffect(() => {
    if (pet && animation === 'idle') {
      const moodAnim = getMoodAnimation(pet);
      if (moodAnim !== 'idle') {
        setAnimation(moodAnim);
      }
    }
  }, [pet, animation]);

  // Render sprite to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pet) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    // Fill with Tamagotchi screen color
    ctx.fillStyle = '#9bbc0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sprite = getSpriteForState(pet.stage, animation, frame);
    renderSprite(ctx, sprite, canvas.width, canvas.height);
  }, [pet, animation, frame]);

  const triggerFlash = useCallback(() => {
    setActionFlash(true);
    setTimeout(() => setActionFlash(false), 300);
  }, []);

  const handleAction = useCallback(async (action: string, animName: string, emoji: string, e?: React.MouseEvent) => {
    setAnimation(animName);
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      setFeedbackEmoji({ emoji, x: rect.left + rect.width / 2, y: rect.top });
    }
    triggerFlash();
    setTimeout(() => setFeedbackEmoji(null), 1500);
    try {
      await fetch(`${API_URL}/api/pet/${action}`, { method: 'POST' });
      const data = await fetch(`${API_URL}/api/pet`).then(r => r.json());
      setPet(data);
    } catch {
      // Simulate locally if backend is down
      if (pet) {
        setPet({
          ...pet,
          hunger: action === 'feed' ? Math.max(0, pet.hunger - 20) : pet.hunger,
          happiness: action === 'play' ? Math.min(100, pet.happiness + 15) : pet.happiness,
          cleanliness: action === 'clean' ? Math.min(100, pet.cleanliness + 25) : pet.cleanliness,
          totalInteractions: pet.totalInteractions + 1,
        });
      }
    }
    setTimeout(() => setAnimation('idle'), 2000);
  }, [pet, triggerFlash]);

  const handleFeed = useCallback((e: React.MouseEvent) => handleAction('feed', 'eating', '\u{1F354}', e), [handleAction]);
  const handlePlay = useCallback((e: React.MouseEvent) => handleAction('play', 'playing', '\u{1F3BE}', e), [handleAction]);
  const handleClean = useCallback((e: React.MouseEvent) => handleAction('clean', 'sleeping', '\u2728', e), [handleAction]);

  const renamingRef = useRef(false);
  const handleRename = useCallback(async (newName: string) => {
    if (renamingRef.current) return;
    renamingRef.current = true;
    const trimmed = newName.trim().slice(0, 20);
    if (!trimmed) {
      setIsEditingName(false);
      renamingRef.current = false;
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/pet/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      setPet(data);
    } catch {
      if (pet) setPet({ ...pet, name: trimmed });
    }
    setIsEditingName(false);
    renamingRef.current = false;
  }, [pet]);

  const handleAddTodo = useCallback(async () => {
    const text = todoInput.trim();
    if (!text) return;
    try {
      const res = await fetch(`${API_URL}/api/pet/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, author: 'visitor' }),
      });
      const newTodo = await res.json();
      setTodos(prev => [newTodo, ...prev].slice(0, 20));
    } catch {
      setTodos(prev => [{ text, author: 'visitor', timestamp: new Date().toISOString() }, ...prev].slice(0, 20));
    }
    setTodoInput('');
  }, [todoInput]);

  const hungerVal = 100 - (pet?.hunger ?? 50);
  const happyVal = pet?.happiness ?? 50;
  const cleanVal = pet?.cleanliness ?? 50;

  const currentGoal = stageGoals.find(g => g.stage === pet?.stage);
  const totalInteractions = pet?.totalInteractions ?? 0;
  const progress = currentGoal ? Math.min(100, (totalInteractions / currentGoal.threshold) * 100) : 100;
  const currentStageEmoji = currentGoal?.emoji ?? '\u{2B50}';
  const nextStageEmoji = currentGoal?.nextEmoji ?? '\u{2B50}';

  return (
    <div className="pet-container">
      <div className="pet-layout">
      <div className="pet-instructions">
        <div className="pet-instructions-header">how to care</div>
        <div className="pet-instructions-body">
          <p>{'\u{1F354}'} <strong>feed</strong> — reduces hunger</p>
          <p>{'\u{1F3BE}'} <strong>play</strong> — increases happiness</p>
          <p>{'\u2728'} <strong>clean</strong> — increases cleanliness</p>
          <p className="pet-instructions-note">everyone shares this one pet — take care of it together! stats decay over time if nobody visits.</p>
        </div>
        <div className="pet-instructions-header">evolution</div>
        <div className="pet-instructions-body">
          <div className="pet-evolution-stages">
            {'\u{1F95A}'} → {'\u{1F423}'} → {'\u{1F425}'} → {'\u{1F414}'} → {'\u{2B50}'}
          </div>
          <p>the pet evolves as the community interacts with it.</p>
          <div className="pet-evolution">
            <span>{currentStageEmoji}</span>
            <div className="pet-evolution-bar">
              <div className="pet-evolution-fill" style={{ width: `${progress}%` }} />
            </div>
            <span>{nextStageEmoji}</span>
          </div>
        </div>
      </div>
      <div className="pet-device">
        <div className={`pet-screen${actionFlash ? ' action-flash' : ''}`}>
          <div className="pet-canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={160}
              height={160}
              className="pet-canvas"
            />
          </div>
          <div className="pet-stats">
            <div className="pet-stat">
              <span className="pet-stat-label">FED</span>
              <span className="pet-stat-bar">
                <span
                  className={`pet-stat-fill${hungerVal < 0 ? ' overfed' : ''}`}
                  style={{ width: `${Math.min(100, Math.abs(hungerVal))}%` }}
                />
              </span>
            </div>
            <div className="pet-stat">
              <span className="pet-stat-label">JOY</span>
              <span className="pet-stat-bar">
                <span
                  className={`pet-stat-fill${happyVal > 100 ? ' overfed' : ''}`}
                  style={{ width: `${Math.min(100, happyVal)}%` }}
                />
              </span>
            </div>
            <div className="pet-stat">
              <span className="pet-stat-label">CLN</span>
              <span className="pet-stat-bar">
                <span
                  className={`pet-stat-fill${cleanVal > 100 ? ' overfed' : ''}`}
                  style={{ width: `${Math.min(100, cleanVal)}%` }}
                />
              </span>
            </div>
          </div>
          <div className="pet-info">
            {isEditingName ? (
              <input
                className="pet-name-input"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onBlur={() => handleRename(nameInput)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(nameInput); if (e.key === 'Escape') setIsEditingName(false); }}
                maxLength={20}
                autoFocus
              />
            ) : (
              <span
                className="pet-name pet-name-clickable"
                onClick={() => { setNameInput(pet?.name ?? ''); setIsEditingName(true); }}
                title="click to rename"
              >
                {pet?.name ?? 'tamagotchi'}
              </span>
            )}
            <span className="pet-info-dot">&middot;</span>
            <span className="pet-stage">{pet?.stage ?? 'egg'}</span>
            <span className="pet-info-dot">&middot;</span>
            <span className="pet-mood">{pet?.mood ?? 'neutral'}</span>
          </div>
          {error && (
            <div className="pet-offline">offline mode</div>
          )}
        </div>
        <div className="pet-buttons">
          <button onClick={handleFeed} className="pet-btn" title="feed">
            feed
          </button>
          <button onClick={handlePlay} className="pet-btn" title="play">
            play
          </button>
          <button onClick={handleClean} className="pet-btn" title="clean">
            clean
          </button>
        </div>
      </div>
      <div className="pet-log">
        <div className="pet-log-header">community log</div>
        <div className="pet-log-messages" ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}>
          {todos.length === 0 && (
            <div className="pet-log-empty">no messages yet...</div>
          )}
          {todos.map((t, i) => (
            <div key={i} className="pet-log-entry">
              <span className="pet-log-text">{t.text}</span>
            </div>
          ))}
        </div>
        <div className="pet-log-input">
          <input
            placeholder="leave a note..."
            maxLength={100}
            value={todoInput}
            onChange={e => setTodoInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddTodo(); }}
          />
          <button onClick={handleAddTodo}>{'\u2192'}</button>
        </div>
      </div>
      </div>
      {feedbackEmoji && (
        <div className="pet-feedback-emoji" style={{
          position: 'fixed',
          left: feedbackEmoji.x,
          top: feedbackEmoji.y,
        }}>
          {feedbackEmoji.emoji}
        </div>
      )}
    </div>
  );
}
