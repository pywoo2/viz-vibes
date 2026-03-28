'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const R2_BASE = 'https://pub-7f15cc5f085b475bbeca640a22ea6d7f.r2.dev/art';

const ART_IMAGES = [
  { src: `${R2_BASE}/vitruvian-man.jpg`, alt: 'Vitruvian Man — Da Vinci' },
  { src: `${R2_BASE}/fibonacci-spiral.svg`, alt: 'Fibonacci Spiral' },
  { src: `${R2_BASE}/classical-orders.png`, alt: 'Classical Architectural Orders' },
  { src: `${R2_BASE}/paradiso-canto31.jpg`, alt: 'Paradiso — Gustave Doré' },
  { src: `${R2_BASE}/euler-identity.svg`, alt: "Euler's Identity" },
  { src: `${R2_BASE}/circuit-schematic.svg`, alt: 'Circuit Schematic' },
];

interface FiguresLayerProps {
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  visible: boolean;
}

export default function FiguresLayer({ visible }: FiguresLayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cycle = useCallback(() => {
    setOpacity(0);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % ART_IMAGES.length);
      setOpacity(1);
    }, 2000);
  }, []);

  useEffect(() => {
    if (!visible) return;
    setOpacity(1);
    timerRef.current = setInterval(cycle, 12000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setOpacity(0);
    };
  }, [visible, cycle]);

  if (!visible) return null;

  const image = ART_IMAGES[currentIndex];

  return (
    <div
      id="figures-layer"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: opacity,
        transition: 'opacity 2s ease',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt={image.alt}
        style={{
          maxWidth: '50vw',
          maxHeight: '60vh',
          objectFit: 'contain',
          opacity: 0.07,
          filter: 'grayscale(100%) brightness(3) contrast(0.6)',
          mixBlendMode: 'screen',
          userSelect: 'none',
        }}
      />
    </div>
  );
}
