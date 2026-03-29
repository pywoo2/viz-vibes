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
}

export default function Pet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pet, setPet] = useState<PetState | null>(null);
  const [animation, setAnimation] = useState<string>('idle');
  const [frame, setFrame] = useState(0);
  const [error, setError] = useState(false);

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
          });
        });
    };
    fetchPet();
    const interval = setInterval(fetchPet, 30000);
    return () => clearInterval(interval);
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

  const handleAction = useCallback(async (action: string, animName: string) => {
    setAnimation(animName);
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
        });
      }
    }
    setTimeout(() => setAnimation('idle'), 2000);
  }, [pet]);

  const handleFeed = useCallback(() => handleAction('feed', 'eating'), [handleAction]);
  const handlePlay = useCallback(() => handleAction('play', 'playing'), [handleAction]);
  const handleClean = useCallback(() => handleAction('clean', 'sleeping'), [handleAction]);

  const hungerVal = 100 - (pet?.hunger ?? 50);
  const happyVal = pet?.happiness ?? 50;
  const cleanVal = pet?.cleanliness ?? 50;

  return (
    <div className="pet-container">
      <div className="pet-device">
        <div className="pet-screen">
          <canvas
            ref={canvasRef}
            width={160}
            height={160}
            className="pet-canvas"
          />
          <div className="pet-stats">
            <div className="pet-stat">
              <span className="pet-stat-label">FED</span>
              <span className="pet-stat-bar">
                <span
                  className="pet-stat-fill"
                  style={{ width: `${hungerVal}%` }}
                />
              </span>
              <span className="pet-stat-val">{hungerVal}</span>
            </div>
            <div className="pet-stat">
              <span className="pet-stat-label">JOY</span>
              <span className="pet-stat-bar">
                <span
                  className="pet-stat-fill"
                  style={{ width: `${happyVal}%` }}
                />
              </span>
              <span className="pet-stat-val">{happyVal}</span>
            </div>
            <div className="pet-stat">
              <span className="pet-stat-label">CLN</span>
              <span className="pet-stat-bar">
                <span
                  className="pet-stat-fill"
                  style={{ width: `${cleanVal}%` }}
                />
              </span>
              <span className="pet-stat-val">{cleanVal}</span>
            </div>
          </div>
          <div className="pet-info">
            <span className="pet-name">{pet?.name ?? 'viz'}</span>
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
    </div>
  );
}
