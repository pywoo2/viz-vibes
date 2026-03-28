'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const R2_BASE = 'https://pub-7f15cc5f085b475bbeca640a22ea6d7f.r2.dev/art';

// Your personal photos (skipping HEIC — browsers can't display them)
const ART_IMAGES = [
  { src: `${R2_BASE}/325C5B5B-51A5-45B4-B0C6-F4B22C64A812.jpg`, alt: 'Photo' },
  { src: `${R2_BASE}/52D65897-3742-4A5A-AA57-DD809D372053.jpg`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_0076.JPG`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_0107.JPG`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_0181.jpg`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_0244.jpg`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_0338.PNG`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_0381.jpg`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_0384.JPG`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_0409.JPG`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_0878.JPG`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_0933.jpg`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_1111.PNG`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_1114.jpg`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_1129.PNG`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_1358.PNG`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_1700.jpg`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_1897.JPG`, alt: 'Photo' },
  { src: `${R2_BASE}/IMG_1966.jpg`, alt: 'Photo' },
];

interface FiguresLayerProps {
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  visible: boolean;
}

interface ImageState {
  x: number;
  y: number;
  rotateX: number;
  rotateY: number;
  scale: number;
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
    startRotX: number;
    startRotY: number;
  } | null>(null);
  const initializedRef = useRef(false);

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
      initial.push({ x: pos.x, y: pos.y, rotateX: 0, rotateY: 0, scale: 1, opacity: 0, src: img.src, alt: img.alt });
    }
    setImages(initial);

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

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setImages((prev) => {
        if (prev.length === 0) return prev;
        const fadeIndex = Math.floor(Math.random() * prev.length);
        return prev.map((img, i) => (i === fadeIndex ? { ...img, opacity: 0 } : img));
      });

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
              ? { x: pos.x, y: pos.y, rotateX: 0, rotateY: 0, scale: 1, opacity: 0, src: newImg.src, alt: newImg.alt }
              : img
          );
        });
        setTimeout(() => {
          setImages((prev) =>
            prev.map((img) => (img.opacity === 0 ? { ...img, opacity: 1 } : img))
          );
        }, 100);
      }, 2200);
    }, 15000);
    return () => clearInterval(interval);
  }, [visible]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = {
        index,
        startX: e.clientX,
        startY: e.clientY,
        startRotX: images[index].rotateX,
        startRotY: images[index].rotateY,
      };
    },
    [images]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent, index: number) => {
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setImages((prev) =>
        prev.map((img, i) =>
          i === index
            ? { ...img, scale: Math.max(0.3, Math.min(3, img.scale + delta)) }
            : img
        )
      );
    },
    []
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setImages((prev) =>
        prev.map((img, i) =>
          i === drag.index
            ? {
                ...img,
                rotateY: drag.startRotY + dx * 0.3,
                rotateX: drag.startRotX - dy * 0.3,
              }
            : img
        )
      );
    };

    const onMouseUp = () => {
      dragRef.current = null;
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
        pointerEvents: 'none',
        perspective: '1000px',
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
            transform: `translate(-50%, -50%) rotateX(${img.rotateX}deg) rotateY(${img.rotateY}deg) scale(${img.scale})`,
            maxWidth: '30vw',
            maxHeight: '35vh',
            opacity: img.opacity * 0.12,
            filter: 'grayscale(100%) brightness(3) contrast(0.6)',
            mixBlendMode: 'screen',
            cursor: dragRef.current?.index === index ? 'grabbing' : 'grab',
            pointerEvents: 'auto',
            transition: dragRef.current?.index === index ? 'none' : 'opacity 2s ease, transform 0.15s ease-out',
            userSelect: 'none',
            transformStyle: 'preserve-3d',
          }}
          onMouseDown={(e) => handleMouseDown(e, index)}
          onWheel={(e) => handleWheel(e, index)}
          draggable={false}
        />
      ))}
    </div>
  );
}
