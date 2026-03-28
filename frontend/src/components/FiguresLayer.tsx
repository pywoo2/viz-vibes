'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const R2_BASE = 'https://pub-7f15cc5f085b475bbeca640a22ea6d7f.r2.dev/art';

const ART_IMAGES = [
  // Original collection
  { src: `${R2_BASE}/vitruvian-man.jpg`, alt: 'Vitruvian Man — Da Vinci' },
  { src: `${R2_BASE}/fibonacci-spiral.svg`, alt: 'Fibonacci Spiral' },
  { src: `${R2_BASE}/classical-orders.png`, alt: 'Classical Architectural Orders' },
  { src: `${R2_BASE}/paradiso-canto31.jpg`, alt: 'Paradiso — Gustave Doré' },
  { src: `${R2_BASE}/euler-identity.svg`, alt: "Euler's Identity" },
  { src: `${R2_BASE}/circuit-schematic.svg`, alt: 'Circuit Schematic' },
  { src: `${R2_BASE}/cyclopaedia-architecture.jpg`, alt: 'Cyclopædia Table of Architecture (1728)' },
  // Computer Science collection
  { src: `${R2_BASE}/binary-search-tree.svg`, alt: 'Binary Search Tree' },
  { src: `${R2_BASE}/merge-sort.svg`, alt: 'Merge Sort Algorithm' },
  { src: `${R2_BASE}/quicksort-diagram.svg`, alt: 'Quicksort Diagram' },
  { src: `${R2_BASE}/turing-machine.svg`, alt: 'Turing Machine' },
  { src: `${R2_BASE}/dfa-example.svg`, alt: 'Deterministic Finite Automaton' },
  { src: `${R2_BASE}/konigsberg-graph.svg`, alt: 'Königsberg Bridges Graph' },
  { src: `${R2_BASE}/big-o-complexity.svg`, alt: 'Big O Complexity Comparison' },
  { src: `${R2_BASE}/logic-gates.svg`, alt: 'Logic Gates' },
  { src: `${R2_BASE}/hash-table.svg`, alt: 'Hash Table with Chaining' },
  { src: `${R2_BASE}/neural-network.svg`, alt: 'Artificial Neural Network' },
  { src: `${R2_BASE}/stack-lifo.svg`, alt: 'Stack (LIFO) Data Structure' },
  { src: `${R2_BASE}/von-neumann-architecture.svg`, alt: 'Von Neumann Architecture' },
  { src: `${R2_BASE}/osi-model.svg`, alt: 'OSI Model Layers' },
  { src: `${R2_BASE}/tcp-state-diagram.svg`, alt: 'TCP State Diagram' },
  { src: `${R2_BASE}/mandelbrot-components.svg`, alt: 'Mandelbrot Set Components' },
  { src: `${R2_BASE}/penrose-tiling.svg`, alt: 'Penrose Tiling' },
  { src: `${R2_BASE}/voronoi-diagram.svg`, alt: 'Voronoi Diagram' },
  { src: `${R2_BASE}/game-of-life-glider-gun.svg`, alt: "Conway's Game of Life — Gosper Glider Gun" },
  { src: `${R2_BASE}/lambda-calculus.svg`, alt: 'Lambda Calculus Symbol' },
  { src: `${R2_BASE}/ada-lovelace-note-g.jpg`, alt: "Ada Lovelace's Note G — First Algorithm" },
  { src: `${R2_BASE}/babbage-difference-engine.gif`, alt: 'Babbage Difference Engine' },
  { src: `${R2_BASE}/eniac-programming.jpg`, alt: 'ENIAC Programming (c. 1947)' },
  { src: `${R2_BASE}/jacquard-loom-cards.jpg`, alt: 'Jacquard Loom Punch Cards' },
  { src: `${R2_BASE}/tesla-coil-patent.png`, alt: 'Tesla Coil Patent Drawing' },
  { src: `${R2_BASE}/triode-schematic.svg`, alt: 'Vacuum Tube Triode Schematic' },
  { src: `${R2_BASE}/automata-theory.png`, alt: 'Automata Theory Overview' },
];

interface FiguresLayerProps {
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  visible: boolean;
}

interface ImageState {
  x: number;
  y: number;
  opacity: number;
  src: string;
  alt: string;
}

function randomPosition() {
  return { x: 15 + Math.random() * 70, y: 15 + Math.random() * 70 };
}

function pickRandomImage(exclude: string[]): { src: string; alt: string } {
  const available = ART_IMAGES.filter((img) => !exclude.includes(img.src));
  const pool = available.length > 0 ? available : ART_IMAGES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function FiguresLayer({ visible }: FiguresLayerProps) {
  const [images, setImages] = useState<ImageState[]>([]);
  const dragRef = useRef<{
    index: number;
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);
  const initializedRef = useRef(false);

  // Initialize images when becoming visible
  useEffect(() => {
    if (!visible) {
      setImages([]);
      initializedRef.current = false;
      return;
    }
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initial: ImageState[] = [];
    const usedSrcs: string[] = [];
    for (let i = 0; i < 3; i++) {
      const img = pickRandomImage(usedSrcs);
      usedSrcs.push(img.src);
      const pos = randomPosition();
      initial.push({ x: pos.x, y: pos.y, opacity: 0, src: img.src, alt: img.alt });
    }
    setImages(initial);

    // Staggered fade-in
    const timers: ReturnType<typeof setTimeout>[] = [];
    initial.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setImages((prev) =>
            prev.map((img, idx) => (idx === i ? { ...img, opacity: 1 } : img))
          );
        }, i * 800)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [visible]);

  // Staggered cycling: every ~15 seconds, replace one image
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setImages((prev) => {
        if (prev.length === 0) return prev;
        // Pick a random image to fade out
        const fadeIndex = Math.floor(Math.random() * prev.length);
        return prev.map((img, i) => (i === fadeIndex ? { ...img, opacity: 0 } : img));
      });

      // After fade-out transition (2s), replace with new image
      setTimeout(() => {
        setImages((prev) => {
          if (prev.length === 0) return prev;
          const fadedIndex = prev.findIndex((img) => img.opacity === 0);
          if (fadedIndex === -1) return prev;

          const usedSrcs = prev.map((img) => img.src);
          const newImg = pickRandomImage(usedSrcs);
          const pos = randomPosition();
          return prev.map((img, i) =>
            i === fadedIndex
              ? { x: pos.x, y: pos.y, opacity: 0, src: newImg.src, alt: newImg.alt }
              : img
          );
        });

        // Fade in the new image
        setTimeout(() => {
          setImages((prev) =>
            prev.map((img) => (img.opacity === 0 ? { ...img, opacity: 1 } : img))
          );
        }, 100);
      }, 2200);
    }, 15000);

    return () => clearInterval(interval);
  }, [visible]);

  // Drag handlers (document-level mousemove/mouseup)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      dragRef.current = {
        index,
        startX: e.clientX,
        startY: e.clientY,
        startPosX: images[index].x,
        startPosY: images[index].y,
      };
      document.body.style.cursor = 'grabbing';
    },
    [images]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const pctX = (dx / window.innerWidth) * 100;
      const pctY = (dy / window.innerHeight) * 100;
      setImages((prev) =>
        prev.map((img, i) =>
          i === drag.index
            ? { ...img, x: drag.startPosX + pctX, y: drag.startPosY + pctY }
            : img
        )
      );
    };

    const onMouseUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        document.body.style.cursor = '';
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  if (!visible) return null;

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
      }}
    >
      {images.map((img, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${img.src}-${index}`}
          src={img.src}
          alt={img.alt}
          style={{
            position: 'absolute',
            left: `${img.x}%`,
            top: `${img.y}%`,
            transform: 'translate(-50%, -50%)',
            maxWidth: '30vw',
            maxHeight: '35vh',
            opacity: img.opacity * 0.07,
            filter: 'grayscale(100%) brightness(3) contrast(0.6)',
            mixBlendMode: 'screen',
            cursor: dragRef.current?.index === index ? 'grabbing' : 'grab',
            pointerEvents: 'auto',
            transition: 'opacity 2s ease',
            userSelect: 'none',
          }}
          onMouseDown={(e) => handleMouseDown(e, index)}
          draggable={false}
        />
      ))}
    </div>
  );
}
