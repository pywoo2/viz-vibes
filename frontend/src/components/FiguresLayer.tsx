'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const R2_BASE = 'https://pub-7f15cc5f085b475bbeca640a22ea6d7f.r2.dev/art';

const ART_MEDIA = [
  // Photos
  { src: `${R2_BASE}/325C5B5B-51A5-45B4-B0C6-F4B22C64A812.jpg`, type: 'image' as const },
  { src: `${R2_BASE}/52D65897-3742-4A5A-AA57-DD809D372053.jpg`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_0076.JPG`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_0107.JPG`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_0181.jpg`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_0244.jpg`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_0338.PNG`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_0381.jpg`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_0384.JPG`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_0409.JPG`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_0413.jpg`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_0530.jpg`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_0757.jpg`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_0878.JPG`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_0933.jpg`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_1111.PNG`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_1114.jpg`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_1129.PNG`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_1358.PNG`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_1700.jpg`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_1769.jpg`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_1897.JPG`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_1914.jpg`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_1966.jpg`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_2250.jpg`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_2750.jpg`, type: 'image' as const },
  { src: `${R2_BASE}/IMG_3735%20(1).jpg`, type: 'image' as const },
  // Videos
  { src: `${R2_BASE}/videos/IMG_0451.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_0667.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_0683.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_1264.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_1303.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_1613.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_2075.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_2391.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_2668.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_2685.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_2769.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_2901.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_3027.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_3216.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_3238.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_3262.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_3606.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_3695.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_3785.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_3865.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_4217.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_4502.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_4862.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_5909.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_6285.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_6672.MOV`, type: 'video' as const },
  { src: `${R2_BASE}/videos/IMG_6693.MOV`, type: 'video' as const },
];

interface FiguresLayerProps {
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  visible: boolean;
  colorMode?: string;
}

interface MediaState {
  x: number;
  y: number;
  rotateX: number;
  rotateY: number;
  scale: number;
  opacity: number;
  src: string;
  type: 'image' | 'video';
}

function randomPosition() {
  return { x: 15 + Math.random() * 70, y: 15 + Math.random() * 70 };
}

function pickRandomMedia(exclude: string[], preferType?: 'image' | 'video'): { src: string; type: 'image' | 'video' } {
  const available = ART_MEDIA.filter((m) => !exclude.includes(m.src));
  const pool = available.length > 0 ? available : ART_MEDIA;
  if (preferType) {
    const typed = pool.filter((m) => m.type === preferType);
    if (typed.length > 0) return typed[Math.floor(Math.random() * typed.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function FiguresLayer({ visible, colorMode }: FiguresLayerProps) {
  const [images, setImages] = useState<MediaState[]>([]);
  const dragRef = useRef<{
    index: number;
    startX: number;
    startY: number;
    startRotX: number;
    startRotY: number;
    startPosX: number;
    startPosY: number;
    mode: 'rotate' | 'move';
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

    const initial: MediaState[] = [];
    const usedSrcs: string[] = [];
    for (let i = 0; i < 3; i++) {
      // First slot is always a video
      const media = pickRandomMedia(usedSrcs, i === 0 ? 'video' : undefined);
      usedSrcs.push(media.src);
      const pos = randomPosition();
      initial.push({ x: pos.x, y: pos.y, rotateX: 0, rotateY: 0, scale: 1, opacity: 0, src: media.src, type: media.type });
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

  // Cycle figures — 25s on mobile, 15s on desktop to reduce DOM updates
  useEffect(() => {
    if (!visible) return;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const cycleMs = isMobile ? 25000 : 15000;
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
          // If no videos remain after fade, force the replacement to be a video
          const remainingVideos = prev.filter((img, i) => i !== fadedIndex && img.opacity > 0 && img.type === 'video').length;
          const newMedia = pickRandomMedia(usedSrcs, remainingVideos === 0 ? 'video' : undefined);
          const pos = randomPosition();
          return prev.map((img, i) =>
            i === fadedIndex
              ? { x: pos.x, y: pos.y, rotateX: 0, rotateY: 0, scale: 1, opacity: 0, src: newMedia.src, type: newMedia.type }
              : img
          );
        });
        setTimeout(() => {
          setImages((prev) =>
            prev.map((img) => (img.opacity === 0 ? { ...img, opacity: 1 } : img))
          );
        }, 100);
      }, 2200);
    }, cycleMs);
    return () => clearInterval(interval);
  }, [visible]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      // Right-click = move, left-click = rotate
      const isMove = e.button === 2;
      dragRef.current = {
        index,
        startX: e.clientX,
        startY: e.clientY,
        startRotX: images[index].rotateX,
        startRotY: images[index].rotateY,
        startPosX: images[index].x,
        startPosY: images[index].y,
        mode: isMove ? 'move' : 'rotate',
      };
    },
    [images]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent browser context menu
  }, []);

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
      if (drag.mode === 'move') {
        const pctX = (dx / window.innerWidth) * 100;
        const pctY = (dy / window.innerHeight) * 100;
        setImages((prev) =>
          prev.map((img, i) =>
            i === drag.index
              ? { ...img, x: drag.startPosX + pctX, y: drag.startPosY + pctY }
              : img
          )
        );
      } else {
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
      }
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
      {images.map((media, index) => {
        const sharedStyle: React.CSSProperties = {
          position: 'absolute',
          left: `${media.x}%`,
          top: `${media.y}%`,
          transform: `translate(-50%, -50%) rotateX(${media.rotateX}deg) rotateY(${media.rotateY}deg) scale(${media.scale})`,
          maxWidth: '30vw',
          maxHeight: '35vh',
          opacity: colorMode === 'rainbow' ? media.opacity * 0.2 : media.opacity * 0.12,
          filter: colorMode === 'rainbow' ? 'brightness(1.5) contrast(0.8) saturate(1.2)' : 'grayscale(100%) brightness(3) contrast(0.6)',
          mixBlendMode: 'screen' as const,
          cursor: dragRef.current?.index === index ? 'grabbing' : 'grab',
          pointerEvents: 'auto' as const,
          transition: dragRef.current?.index === index ? 'none' : 'opacity 2s ease, transform 0.15s ease-out',
          userSelect: 'none' as const,
          transformStyle: 'preserve-3d' as const,
        };

        if (media.type === 'video') {
          return (
            <video
              key={`${media.src}-${index}`}
              src={media.src}
              style={sharedStyle}
              autoPlay
              loop
              muted
              playsInline
              onMouseDown={(e) => handleMouseDown(e, index)}
              onContextMenu={handleContextMenu}
              onWheel={(e) => handleWheel(e, index)}
              draggable={false}
            />
          );
        }

        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${media.src}-${index}`}
            src={media.src}
            alt="Photo"
            style={sharedStyle}
            onMouseDown={(e) => handleMouseDown(e, index)}
            onWheel={(e) => handleWheel(e, index)}
            draggable={false}
          />
        );
      })}
    </div>
  );
}
