'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// 16x16 character sprites
const SPRITES: Record<string, number[][]> = {
  boy: [
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,3,3,3,3,1,0,0,0,0,0,0],
    [0,0,0,0,1,3,1,3,1,3,1,0,0,0,0,0],
    [0,0,0,0,1,3,3,2,3,3,1,0,0,0,0,0],
    [0,0,0,0,0,1,3,3,3,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,3,3,3,1,1,0,0,0,0,0],
    [0,0,0,1,0,0,3,3,3,0,0,1,0,0,0,0],
    [0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  girl: [
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,1,3,3,3,3,3,3,1,0,0,0,0,0],
    [0,0,0,1,3,1,3,3,1,3,1,0,0,0,0,0],
    [0,0,0,1,3,3,3,2,3,3,1,0,0,0,0,0],
    [0,0,0,0,1,3,3,3,3,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,1,1,3,3,3,3,1,1,0,0,0,0,0],
    [0,0,1,0,0,3,3,3,3,0,0,1,0,0,0,0],
    [0,0,0,0,0,3,3,3,3,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  dog: [
    [0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,1,3,1,0,0,1,3,1,0,0,0,0,0],
    [0,0,0,1,3,3,1,1,3,3,1,0,0,0,0,0],
    [0,0,0,1,3,1,3,3,1,3,1,0,0,0,0,0],
    [0,0,0,1,3,3,3,3,3,3,1,0,0,0,0,0],
    [0,0,0,0,1,3,2,2,3,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,3,3,3,3,1,0,0,0,0,0,0],
    [0,0,0,0,1,3,3,3,3,1,0,0,0,0,0,0],
    [0,0,0,0,1,3,3,3,3,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  cat: [
    [0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,1,3,1,0,0,1,3,1,0,0,0,0,0],
    [0,0,0,0,1,3,3,3,3,1,0,0,0,0,0,0],
    [0,0,0,0,1,1,3,3,1,1,0,0,0,0,0,0],
    [0,0,0,0,1,3,3,3,3,1,0,0,0,0,0,0],
    [0,0,0,0,1,3,2,2,3,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,3,3,3,3,1,0,0,0,0,0,0],
    [0,0,0,0,1,3,3,3,3,1,0,0,0,0,0,0],
    [0,0,0,0,1,3,3,3,3,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  monkey: [
    [0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,1,3,3,3,3,3,1,0,0,0,0,0,0],
    [0,0,1,3,1,0,0,0,1,3,1,0,0,0,0,0],
    [0,0,0,1,3,1,3,1,3,1,0,0,0,0,0,0],
    [0,0,0,1,3,3,3,3,3,1,0,0,0,0,0,0],
    [0,0,0,0,1,2,3,2,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,1,1,3,3,3,1,1,0,0,0,0,0,0],
    [0,0,1,0,0,3,3,3,0,0,1,0,0,0,0,0],
    [0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// Environment sprites — { grid, pixels } for mixed sizes
// 0=transparent, 1=dark, 2=mid, 3=light
interface SpriteData { grid: number; pixels: number[][] }
const ENV_SPRITES: Record<string, SpriteData> = {
  star: { grid: 8, pixels: [
    [0,0,0,3,0,0,0,0],
    [0,0,0,3,0,0,0,0],
    [0,0,2,3,2,0,0,0],
    [3,3,3,3,3,3,3,0],
    [0,0,2,3,2,0,0,0],
    [0,0,0,3,0,0,0,0],
    [0,0,0,3,0,0,0,0],
    [0,0,0,0,0,0,0,0],
  ]},
  star_small: { grid: 8, pixels: [
    [0,0,0,0,0,0,0,0],
    [0,0,0,3,0,0,0,0],
    [0,0,3,3,3,0,0,0],
    [0,0,0,3,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
  ]},
  moon: { grid: 12, pixels: [
    [0,0,0,0,1,1,1,1,0,0,0,0],
    [0,0,0,1,3,3,3,3,1,0,0,0],
    [0,0,1,3,3,3,3,1,0,0,0,0],
    [0,1,3,3,3,3,1,0,0,0,0,0],
    [0,1,3,3,3,1,0,0,0,0,0,0],
    [0,1,3,3,3,1,0,0,0,0,0,0],
    [0,1,3,3,3,1,0,0,0,0,0,0],
    [0,1,3,3,3,1,0,0,0,0,0,0],
    [0,0,1,3,3,3,3,1,0,0,0,0],
    [0,0,0,1,3,3,3,3,1,0,0,0],
    [0,0,0,0,1,1,1,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  satellite: { grid: 12, pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,3,3,0,0,0,0,0,3,3,0,0],
    [0,3,3,0,0,0,0,0,3,3,0,0],
    [0,0,0,0,1,1,1,0,0,0,0,0],
    [0,0,0,1,3,2,3,1,0,0,0,0],
    [0,0,0,1,2,3,2,1,0,0,0,0],
    [0,0,0,1,3,2,3,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0,0],
    [0,3,3,0,0,0,0,0,3,3,0,0],
    [0,3,3,0,0,0,0,0,3,3,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  planet: { grid: 12, pixels: [
    [0,0,0,0,1,1,1,0,0,0,0,0],
    [0,0,0,1,3,3,2,1,0,0,0,0],
    [0,0,1,3,2,3,3,2,1,0,0,0],
    [0,1,3,3,3,2,3,3,3,1,0,0],
    [0,1,2,3,3,3,2,3,3,1,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,3,3,2,3,3,2,3,1,0,0],
    [0,1,3,2,3,3,2,3,3,1,0,0],
    [0,0,1,3,3,2,3,3,1,0,0,0],
    [0,0,0,1,2,3,3,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  comet: { grid: 12, pixels: [
    [0,0,0,0,0,0,0,0,0,0,3,0],
    [0,0,0,0,0,0,0,0,0,3,3,0],
    [0,0,0,0,0,0,0,0,3,3,3,0],
    [0,0,0,0,0,0,0,3,3,3,0,0],
    [2,0,2,0,2,3,3,3,3,0,0,0],
    [0,2,0,2,3,3,3,3,0,0,0,0],
    [0,0,0,0,0,0,0,3,3,3,0,0],
    [0,0,0,0,0,0,0,0,3,3,3,0],
    [0,0,0,0,0,0,0,0,0,3,3,0],
    [0,0,0,0,0,0,0,0,0,0,3,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  ufo: { grid: 12, pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0,0],
    [0,0,0,1,3,3,3,1,0,0,0,0],
    [0,0,0,1,3,3,3,1,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,0,0],
    [1,2,3,2,3,2,3,2,3,2,1,0],
    [0,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  cloud: { grid: 12, pixels: [
    [0,0,0,0,0,3,3,0,0,0,0,0],
    [0,0,0,0,3,3,3,3,0,0,0,0],
    [0,0,3,3,3,3,3,3,3,0,0,0],
    [0,3,3,3,3,3,3,3,3,3,0,0],
    [3,3,3,3,3,3,3,3,3,3,3,0],
    [3,3,3,3,3,3,3,3,3,3,3,3],
    [3,3,3,3,3,3,3,3,3,3,3,3],
    [0,2,3,3,3,3,3,3,3,3,2,0],
    [0,0,2,2,2,2,2,2,2,2,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  bird: { grid: 12, pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [3,0,0,0,0,0,0,0,0,3,0,0],
    [3,3,0,0,0,0,0,0,3,3,0,0],
    [0,3,3,0,0,0,0,3,3,0,0,0],
    [0,0,3,1,0,0,1,3,0,0,0,0],
    [0,0,0,1,1,1,1,0,0,0,0,0],
    [0,0,0,1,3,3,1,0,0,0,0,0],
    [0,0,0,0,1,1,0,0,0,0,0,0],
    [0,0,0,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  airplane: { grid: 12, pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,0,0,0],
    [0,0,0,0,0,0,0,1,2,1,0,0],
    [0,0,0,0,0,0,1,2,2,1,0,0],
    [3,3,1,1,1,1,2,2,2,1,0,0],
    [0,0,1,2,2,2,2,2,2,2,1,0],
    [3,3,1,1,1,1,2,2,2,1,0,0],
    [0,0,0,0,0,0,1,2,2,1,0,0],
    [0,0,0,0,0,0,0,1,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  sun: { grid: 12, pixels: [
    [0,0,0,3,0,0,0,3,0,0,0,0],
    [0,0,0,0,3,0,3,0,0,0,0,0],
    [0,0,0,3,3,3,3,3,0,0,0,0],
    [3,0,3,3,3,3,3,3,3,0,3,0],
    [0,3,3,3,3,3,3,3,3,3,0,0],
    [0,0,3,3,3,3,3,3,3,0,0,0],
    [0,3,3,3,3,3,3,3,3,3,0,0],
    [3,0,3,3,3,3,3,3,3,0,3,0],
    [0,0,0,3,3,3,3,3,0,0,0,0],
    [0,0,0,0,3,0,3,0,0,0,0,0],
    [0,0,0,3,0,0,0,3,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  fish: { grid: 12, pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,0,1,3,3,1,0,0,0],
    [0,0,0,0,1,3,3,3,3,1,0,0],
    [0,3,3,1,3,3,1,3,3,3,1,0],
    [3,3,3,1,3,3,3,3,3,3,3,1],
    [3,3,3,1,3,2,3,3,3,2,3,1],
    [0,3,3,1,3,3,3,3,3,3,1,0],
    [0,0,0,0,1,3,3,3,3,1,0,0],
    [0,0,0,0,0,1,3,3,1,0,0,0],
    [0,0,0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  pufferfish: { grid: 12, pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,0,0,0,0],
    [0,0,0,1,3,3,3,3,1,0,0,0],
    [0,0,1,3,3,3,3,3,3,1,0,0],
    [0,2,3,3,3,1,3,3,3,3,2,0],
    [0,1,3,3,3,3,3,3,3,3,1,0],
    [0,1,3,3,3,3,2,2,3,3,1,0],
    [0,2,3,3,3,3,3,3,3,3,2,0],
    [0,0,1,3,3,3,3,3,3,1,0,0],
    [0,0,0,1,3,3,3,3,1,0,0,0],
    [0,0,0,0,1,1,1,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  shark: { grid: 12, pixels: [
    [0,0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,0,0,0,0],
    [0,0,0,0,1,2,2,2,1,0,0,0],
    [0,0,0,1,2,2,2,2,2,1,0,0],
    [1,1,1,2,2,2,1,2,2,2,1,0],
    [0,1,2,2,2,2,2,2,2,2,2,1],
    [0,1,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,2,2,2,2,2,2,2,1,0],
    [0,0,0,1,2,2,2,2,2,1,0,0],
    [0,0,0,0,1,2,2,2,1,0,0,0],
    [0,0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  whale: { grid: 16, pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,1,3,3,3,3,3,1,0,0,0,0],
    [0,0,0,0,1,3,3,3,3,3,3,3,1,0,0,0],
    [0,0,0,1,3,3,3,3,3,3,3,3,3,1,0,0],
    [0,0,1,3,3,1,3,3,3,3,3,3,3,3,1,0],
    [1,1,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
    [1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,1,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
    [0,0,1,3,3,3,3,3,3,3,3,3,3,1,0,0],
    [0,0,0,1,3,3,2,2,2,2,3,3,1,0,0,0],
    [0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  jellyfish: { grid: 12, pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,0,0,0,0],
    [0,0,1,3,3,3,3,3,1,0,0,0],
    [0,1,3,3,3,3,3,3,3,1,0,0],
    [0,1,3,1,3,3,1,3,3,1,0,0],
    [0,0,1,3,3,3,3,3,1,0,0,0],
    [0,0,0,1,1,1,1,1,0,0,0,0],
    [0,0,3,0,3,0,3,0,3,0,0,0],
    [0,0,0,3,0,3,0,3,0,0,0,0],
    [0,0,0,0,3,0,3,0,0,0,0,0],
    [0,0,0,0,0,3,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  octopus: { grid: 12, pixels: [
    [0,0,0,0,1,1,1,1,0,0,0,0],
    [0,0,0,1,3,3,3,3,1,0,0,0],
    [0,0,1,3,3,3,3,3,3,1,0,0],
    [0,0,1,3,1,3,3,1,3,1,0,0],
    [0,0,1,3,3,3,3,3,3,1,0,0],
    [0,0,0,1,3,2,2,3,1,0,0,0],
    [0,0,1,0,1,1,1,1,0,1,0,0],
    [0,3,0,3,0,0,0,3,0,3,0,0],
    [3,0,3,0,0,0,0,0,3,0,3,0],
    [0,3,0,0,0,0,0,0,0,3,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  submarine: { grid: 12, pixels: [
    [0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,0,0,0,0,0],
    [0,0,0,0,0,1,3,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,1,2,2,2,2,2,2,2,2,1,0],
    [1,2,2,1,2,2,1,2,2,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,1],
    [0,1,2,2,2,2,2,2,2,2,1,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,0,0,0,0,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  seaweed: { grid: 12, pixels: [
    [0,0,0,0,3,0,0,0,0,0,0,0],
    [0,0,0,3,3,3,0,0,0,0,0,0],
    [0,0,0,0,3,3,0,0,0,0,0,0],
    [0,0,0,0,0,3,3,0,0,0,0,0],
    [0,0,0,0,3,3,0,0,0,0,0,0],
    [0,0,0,3,3,0,0,0,0,0,0,0],
    [0,0,0,0,3,3,0,0,0,0,0,0],
    [0,0,0,0,0,3,3,0,0,0,0,0],
    [0,0,0,0,3,3,0,0,0,0,0,0],
    [0,0,0,3,3,0,0,0,0,0,0,0],
    [0,0,0,0,2,0,0,0,0,0,0,0],
    [0,0,0,1,1,1,0,0,0,0,0,0],
  ]},
  coral: { grid: 12, pixels: [
    [0,0,0,3,0,0,0,3,0,0,0,0],
    [0,0,3,3,3,0,3,3,3,0,0,0],
    [0,0,3,3,3,0,3,3,3,0,0,0],
    [0,0,0,3,3,3,3,3,0,0,0,0],
    [0,0,0,0,3,3,3,0,0,0,0,0],
    [0,0,0,0,2,2,2,0,0,0,0,0],
    [0,0,0,0,0,2,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  wave: { grid: 12, pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,3,3,0,0,0,0,0,0,0],
    [0,0,3,3,3,3,0,0,3,3,0,0],
    [0,3,3,3,3,3,3,0,3,3,3,0],
    [3,3,3,2,2,3,3,3,3,3,3,3],
    [3,2,2,2,2,2,2,3,3,2,2,3],
    [2,2,2,2,2,2,2,2,2,2,2,2],
    [2,2,2,2,2,2,2,2,2,2,2,2],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  treasure: { grid: 12, pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,3,3,3,3,0,0,0,0],
    [0,0,0,3,3,3,3,3,3,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,1,2,2,2,3,3,2,2,2,1,0],
    [0,1,2,2,2,3,3,2,2,2,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,2,2,2,2,2,2,2,2,1,0],
    [0,1,2,2,2,2,2,2,2,2,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
  anchor: { grid: 12, pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,3,0,0,0,0,0,0],
    [0,0,0,0,3,3,3,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,2,0,0,1,0,0,2,0,0,0],
    [0,0,0,2,0,1,0,2,0,0,0,0],
    [0,0,0,0,2,1,2,0,0,0,0,0],
    [0,0,0,0,0,2,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]},
};

const COLOR_THEMES: Record<string, { name: string; palette: string[] }> = {
  green:  { name: 'green',  palette: ['transparent', '#0f380f', '#306230', '#8bac0f'] },
  blue:   { name: 'blue',   palette: ['transparent', '#0f2038', '#2a4a6a', '#64b5f6'] },
  pink:   { name: 'pink',   palette: ['transparent', '#380f20', '#6a2a4a', '#f48fb1'] },
  orange: { name: 'orange', palette: ['transparent', '#382a0f', '#6a4a2a', '#ffcc80'] },
  purple: { name: 'purple', palette: ['transparent', '#200f38', '#4a2a6a', '#ce93d8'] },
};

const PRIZE_EMOJIS = [
  '🏆','💎','🌟','🎉','🦄','🍕','🎸','🚀','👑','🌈',
  '🎪','🧸','🍦','🎯','🔮','🌺','🦋','🍀','🎠','🪩',
  '🐉','🎭','🌻','🧊','🪐','🦑','🎨','🍩','🫧','🪄',
];

const TOTAL_PAGES = 15;
const SPACE_END = 0.3;
const SKY_END = 0.55;
const SURFACE = 0.6;
const OCEAN_END = 0.95;

interface EnvItem {
  sprite: string;
  x: number;
  y: number;
  size: number;   // px for canvas render
  depth: number;
  opacity: number;
  flip?: boolean;
}

function generateEnvironment(): EnvItem[] {
  const items: EnvItem[] = [];

  // === SPACE (dense starfield + objects) ===
  for (let i = 0; i < 80; i++) {
    items.push({
      sprite: Math.random() > 0.4 ? 'star' : 'star_small',
      x: Math.random() * 100, y: Math.random() * SPACE_END,
      size: 24 + Math.random() * 40, depth: 0.2 + Math.random() * 0.8,
      opacity: 0.3 + Math.random() * 0.7,
    });
  }
  items.push({ sprite: 'moon', x: 12 + Math.random() * 20, y: 0.03, size: 100, depth: 0.35, opacity: 0.9 });
  items.push({ sprite: 'satellite', x: 72 + Math.random() * 15, y: 0.07, size: 72, depth: 0.6, opacity: 0.85 });
  items.push({ sprite: 'satellite', x: 20, y: 0.2, size: 56, depth: 0.7, opacity: 0.6 });
  items.push({ sprite: 'planet', x: 82, y: 0.15, size: 96, depth: 0.3, opacity: 0.7 });
  items.push({ sprite: 'planet', x: 15, y: 0.25, size: 64, depth: 0.45, opacity: 0.5 });
  items.push({ sprite: 'comet', x: 55 + Math.random() * 25, y: 0.05, size: 80, depth: 0.65, opacity: 0.8 });
  items.push({ sprite: 'comet', x: 20, y: 0.18, size: 60, depth: 0.5, opacity: 0.6 });
  items.push({ sprite: 'ufo', x: 65, y: 0.12, size: 64, depth: 0.55, opacity: 0.7 });

  // === SKY (lots of clouds, birds, airplane) ===
  for (let i = 0; i < 18; i++) {
    items.push({
      sprite: 'cloud', x: Math.random() * 110 - 5,
      y: SPACE_END + Math.random() * (SKY_END - SPACE_END),
      size: 80 + Math.random() * 80, depth: 0.4 + Math.random() * 0.5,
      opacity: 0.25 + Math.random() * 0.45,
    });
  }
  for (let i = 0; i < 12; i++) {
    items.push({
      sprite: 'bird', x: Math.random() * 100,
      y: SPACE_END + 0.03 + Math.random() * (SKY_END - SPACE_END - 0.06),
      size: 48 + Math.random() * 32, depth: 0.6 + Math.random() * 0.4,
      opacity: 0.55 + Math.random() * 0.3, flip: Math.random() > 0.5,
    });
  }
  items.push({ sprite: 'sun', x: 78, y: SPACE_END + 0.01, size: 110, depth: 0.25, opacity: 0.85 });
  items.push({ sprite: 'airplane', x: 22, y: SPACE_END + 0.08, size: 72, depth: 0.6, opacity: 0.75 });
  items.push({ sprite: 'airplane', x: 70, y: SKY_END - 0.06, size: 56, depth: 0.7, opacity: 0.5, flip: true });

  // === OCEAN SURFACE (waves) ===
  for (let i = 0; i < 12; i++) {
    items.push({
      sprite: 'wave', x: Math.random() * 110 - 5,
      y: SURFACE - 0.01 + Math.random() * 0.04,
      size: 72 + Math.random() * 56, depth: 0.5 + Math.random() * 0.4, opacity: 0.45 + Math.random() * 0.2,
    });
  }

  // === UNDERWATER (dense sea life) ===
  for (let i = 0; i < 20; i++) {
    items.push({
      sprite: ['fish', 'pufferfish'][Math.floor(Math.random() * 2)],
      x: Math.random() * 100,
      y: SURFACE + 0.04 + Math.random() * (OCEAN_END - SURFACE - 0.1),
      size: 48 + Math.random() * 48, depth: 0.4 + Math.random() * 0.5,
      opacity: 0.45 + Math.random() * 0.35, flip: Math.random() > 0.5,
    });
  }
  // Sharks
  items.push({ sprite: 'shark', x: 20 + Math.random() * 25, y: SURFACE + 0.1, size: 88, depth: 0.45, opacity: 0.65, flip: true });
  items.push({ sprite: 'shark', x: 60 + Math.random() * 20, y: SURFACE + 0.28, size: 72, depth: 0.55, opacity: 0.5 });
  // Whales
  items.push({ sprite: 'whale', x: 55 + Math.random() * 25, y: SURFACE + 0.16, size: 140, depth: 0.35, opacity: 0.55 });
  items.push({ sprite: 'whale', x: 10, y: SURFACE + 0.26, size: 100, depth: 0.5, opacity: 0.4, flip: true });
  // Jellyfish
  for (let i = 0; i < 10; i++) {
    items.push({
      sprite: 'jellyfish', x: Math.random() * 100,
      y: SURFACE + 0.06 + Math.random() * 0.25,
      size: 48 + Math.random() * 40, depth: 0.35 + Math.random() * 0.45, opacity: 0.35 + Math.random() * 0.35,
    });
  }
  // Octopi
  items.push({ sprite: 'octopus', x: 70, y: SURFACE + 0.2, size: 72, depth: 0.5, opacity: 0.6 });
  items.push({ sprite: 'octopus', x: 25, y: SURFACE + 0.3, size: 56, depth: 0.65, opacity: 0.5, flip: true });
  // Submarine
  items.push({ sprite: 'submarine', x: 35, y: SURFACE + 0.22, size: 80, depth: 0.6, opacity: 0.7 });
  // Sea floor: seaweed, coral, treasure, anchor
  for (let i = 0; i < 14; i++) {
    items.push({
      sprite: Math.random() > 0.5 ? 'seaweed' : 'coral',
      x: Math.random() * 100, y: OCEAN_END - 0.03 + Math.random() * 0.05,
      size: 56 + Math.random() * 40, depth: 0.75 + Math.random() * 0.2, opacity: 0.45 + Math.random() * 0.35,
    });
  }
  items.push({ sprite: 'treasure', x: 40, y: OCEAN_END + 0.01, size: 72, depth: 0.8, opacity: 0.75 });
  items.push({ sprite: 'anchor', x: 72, y: OCEAN_END + 0.01, size: 64, depth: 0.7, opacity: 0.6 });
  items.push({ sprite: 'anchor', x: 15, y: OCEAN_END - 0.01, size: 48, depth: 0.75, opacity: 0.5 });

  return items;
}

function drawSprite(canvas: HTMLCanvasElement, sprite: number[][], palette: string[], gridSize?: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const g = gridSize || sprite.length;
  const px = canvas.width / g;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < sprite.length; y++) {
    for (let x = 0; x < (sprite[y]?.length ?? 0); x++) {
      const c = sprite[y][x];
      if (c && c > 0) {
        ctx.fillStyle = palette[c] ?? palette[1];
        ctx.fillRect(x * px, y * px, px, px);
      }
    }
  }
}

// Pre-render env sprites to offscreen canvases
function renderEnvCanvases(palette: string[]): Record<string, HTMLCanvasElement> {
  const result: Record<string, HTMLCanvasElement> = {};
  for (const [name, data] of Object.entries(ENV_SPRITES)) {
    const canvas = document.createElement('canvas');
    const res = data.grid <= 8 ? 64 : data.grid <= 12 ? 96 : 128;
    canvas.width = res;
    canvas.height = res;
    drawSprite(canvas, data.pixels, palette, data.grid);
    result[name] = canvas;
  }
  return result;
}

function EnvSpriteImg({ src, size, opacity, flip }: { src: string; size: number; opacity: number; flip?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      style={{
        width: size, height: size, opacity,
        imageRendering: 'pixelated',
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
    />
  );
}

export default function ParachuteView() {
  const [character, setCharacter] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('chute-character') || 'boy';
    return 'boy';
  });
  const [colorTheme, setColorTheme] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('chute-color') || 'green';
    return 'green';
  });
  const [prize] = useState(() => PRIZE_EMOJIS[Math.floor(Math.random() * PRIZE_EMOJIS.length)]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [envDataUrls, setEnvDataUrls] = useState<Record<string, string>>({});
  const envItems = useMemo(() => generateEnvironment(), []);

  const theme = COLOR_THEMES[colorTheme] || COLOR_THEMES.green;

  useEffect(() => { localStorage.setItem('chute-character', character); }, [character]);
  useEffect(() => { localStorage.setItem('chute-color', colorTheme); }, [colorTheme]);

  // Draw character sprite
  useEffect(() => {
    if (canvasRef.current) drawSprite(canvasRef.current, SPRITES[character] || SPRITES.boy, theme.palette, 16);
  }, [character, theme.palette]);

  // Pre-render env sprites when palette changes
  useEffect(() => {
    const canvases = renderEnvCanvases(theme.palette);
    const urls: Record<string, string> = {};
    for (const [name, canvas] of Object.entries(canvases)) {
      urls[name] = canvas.toDataURL();
    }
    setEnvDataUrls(urls);
  }, [theme.palette]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return;
    setScrollProgress(el.scrollTop / max);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const p = scrollProgress;
  const inSpace = p < SPACE_END;
  const inSky = p >= SPACE_END && p < SURFACE;
  const inOcean = p >= SURFACE;
  const atBottom = p > 0.95;
  const parachuteDeployed = p >= SPACE_END && p < SURFACE;

  // More dramatic color transitions between zones
  const bgColor = useMemo(() => {
    // Space: very dark blue-black
    if (p < SPACE_END * 0.8) return 'rgb(3, 3, 15)';
    // Space→Sky transition
    if (p < SPACE_END) {
      const t = (p - SPACE_END * 0.8) / (SPACE_END * 0.2);
      return `rgb(${Math.round(3 + t * 30)}, ${Math.round(3 + t * 50)}, ${Math.round(15 + t * 60)})`;
    }
    // Sky: bright blue gradient
    if (p < SKY_END) {
      const t = (p - SPACE_END) / (SKY_END - SPACE_END);
      const r = Math.round(33 + t * 102); // → 135
      const g = Math.round(53 + t * 153); // → 206
      const b = Math.round(75 + t * 160); // → 235
      return `rgb(${r}, ${g}, ${b})`;
    }
    // Sky→Ocean surface transition
    if (p < SURFACE) {
      const t = (p - SKY_END) / (SURFACE - SKY_END);
      const r = Math.round(135 - t * 125); // → 10
      const g = Math.round(206 - t * 136); // → 70
      const b = Math.round(235 - t * 75);  // → 160
      return `rgb(${r}, ${g}, ${b})`;
    }
    // Ocean: getting darker as we descend
    const t = Math.min(1, (p - SURFACE) / (OCEAN_END - SURFACE));
    const r = Math.round(10 - t * 8);   // → 2
    const g = Math.round(70 - t * 55);  // → 15
    const b = Math.round(160 - t * 120); // → 40
    return `rgb(${r}, ${g}, ${b})`;
  }, [p]);

  const spriteStyle = useMemo(() => {
    if (inSpace) return { transform: `rotate(${Math.sin(p * 30) * 15}deg)` };
    if (parachuteDeployed) return { transform: `rotate(${Math.sin(p * 20) * 5}deg)` };
    return { transform: `rotate(${Math.sin(p * 15) * 8}deg)` };
  }, [p, inSpace, parachuteDeployed]);

  return (
    <div className="parachute-view" ref={containerRef} style={{ background: bgColor }}>
      <div className="parachute-track" style={{ height: `${TOTAL_PAGES * 100}vh` }}>
        {envItems.map((item, i) => {
          const totalH = TOTAL_PAGES * 100;
          const itemY = item.y * totalH;
          const parallaxOffset = p * totalH * (1 - item.depth);
          const finalY = itemY - parallaxOffset;
          const src = envDataUrls[item.sprite];
          if (!src) return null;

          return (
            <div key={i} className="parachute-env-item" style={{ left: `${item.x}%`, top: `${finalY}vh` }}>
              <EnvSpriteImg src={src} size={item.size} opacity={item.opacity} flip={item.flip} />
            </div>
          );
        })}

        <div className={`parachute-prize ${atBottom ? 'revealed' : ''}`}>
          <div className="parachute-prize-emoji">{prize}</div>
          <div className="parachute-prize-text">you found it!</div>
        </div>
      </div>

      <div className="parachute-sprite-container">
        {parachuteDeployed && (
          <div className="parachute-canopy">
            <svg viewBox="0 0 120 70" width="120" height="70">
              <path d="M 10 65 Q 60 -10 110 65" fill={theme.palette[3]} fillOpacity="0.8" stroke={theme.palette[1]} strokeWidth="2" />
              <line x1="10" y1="65" x2="55" y2="95" stroke={theme.palette[2]} strokeWidth="1.5" />
              <line x1="110" y1="65" x2="65" y2="95" stroke={theme.palette[2]} strokeWidth="1.5" />
              <line x1="60" y1="55" x2="60" y2="95" stroke={theme.palette[2]} strokeWidth="1.5" />
            </svg>
          </div>
        )}
        {inOcean && (
          <div className="parachute-bubbles">
            <span className="bubble b1">○</span>
            <span className="bubble b2">○</span>
            <span className="bubble b3">○</span>
          </div>
        )}
        <div className="parachute-sprite" style={spriteStyle}>
          <canvas ref={canvasRef} width={128} height={128} />
        </div>
      </div>

      {p < 0.02 && (
        <div className="parachute-hint">
          scroll down to fall!
          <div className="parachute-hint-arrow">↓</div>
        </div>
      )}

      {/* Splash effect at water entry */}
      {Math.abs(p - SURFACE) < 0.03 && (
        <div className="parachute-splash">
          <span>💦</span><span>💦</span><span>💦</span>
        </div>
      )}

      <div className="parachute-zone-label">
        {inSpace ? 'space' : inSky ? 'sky' : atBottom ? 'sea floor' : 'ocean'}
      </div>

      <div className="parachute-pickers">
        <div className="parachute-picker-group">
          {Object.keys(SPRITES).map(name => (
            <button key={name} className={`parachute-picker-btn ${character === name ? 'active' : ''}`} onClick={() => setCharacter(name)}>
              {name}
            </button>
          ))}
        </div>
        <div className="parachute-picker-group">
          {Object.entries(COLOR_THEMES).map(([key, t]) => (
            <button key={key} className={`parachute-color-btn ${colorTheme === key ? 'active' : ''}`} style={{ background: t.palette[3] }} onClick={() => setColorTheme(key)} title={t.name} />
          ))}
        </div>
      </div>
    </div>
  );
}
