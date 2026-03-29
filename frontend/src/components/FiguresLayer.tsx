'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface MediaItem {
  src: string;
  type: 'image' | 'video';
}

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

function randomPosition(existing: { x: number; y: number }[] = []) {
  const minDist = 25; // minimum distance in viewport-percent between item centers
  for (let attempt = 0; attempt < 20; attempt++) {
    const x = 15 + Math.random() * 70;
    const y = 15 + Math.random() * 70;
    const tooClose = existing.some(
      (e) => Math.hypot(e.x - x, e.y - y) < minDist
    );
    if (!tooClose) return { x, y };
  }
  // fallback — best-effort after 20 tries
  return { x: 15 + Math.random() * 70, y: 15 + Math.random() * 70 };
}

// Shuffle-bag: cycle through all media before repeating any, like a deck of cards.
// Separate bags for images and videos so the "at least 1 video" constraint
// doesn't drain the video bag faster than the image bag.
function createShuffleBag(items: MediaItem[]): MediaItem[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

let imageBag: MediaItem[] = [];
let videoBag: MediaItem[] = [];

function pickFromBag(allMedia: MediaItem[], exclude: string[], preferType?: 'image' | 'video'): MediaItem | null {
  if (allMedia.length === 0) return null;

  const allImages = allMedia.filter((m) => m.type === 'image');
  const allVideos = allMedia.filter((m) => m.type === 'video');

  if (preferType === 'video' || (!preferType && Math.random() < 0.4)) {
    // Draw from video bag
    if (videoBag.length === 0) videoBag = createShuffleBag(allVideos);
    for (let tries = 0; tries < videoBag.length; tries++) {
      const item = videoBag.pop()!;
      if (!exclude.includes(item.src)) return item;
      // Put it at the front to try later
      videoBag.unshift(item);
    }
    // All videos excluded (only 3 showing), reshuffle
    videoBag = createShuffleBag(allVideos);
    return videoBag.pop() ?? null;
  }

  // Draw from image bag
  if (imageBag.length === 0) imageBag = createShuffleBag(allImages);
  for (let tries = 0; tries < imageBag.length; tries++) {
    const item = imageBag.pop()!;
    if (!exclude.includes(item.src)) return item;
    imageBag.unshift(item);
  }
  imageBag = createShuffleBag(allImages);
  return imageBag.pop() ?? null;
}

export default function FiguresLayer({ visible, colorMode }: FiguresLayerProps) {
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const allMediaRef = useRef<MediaItem[]>([]);
  const [images, setImages] = useState<MediaState[]>([]);

  // Fetch media list from API
  useEffect(() => {
    fetch(`${API_URL}/api/media`)
      .then((r) => r.json())
      .then((data: MediaItem[]) => {
        setAllMedia(data);
        allMediaRef.current = data;
      })
      .catch(() => {});
  }, []);
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
    if (initializedRef.current || allMedia.length === 0) return;
    initializedRef.current = true;

    const initial: MediaState[] = [];
    const usedSrcs: string[] = [];
    for (let i = 0; i < 3; i++) {
      // First slot is always a video
      const media = pickFromBag(allMediaRef.current, usedSrcs, i === 0 ? 'video' : undefined);
      if (!media) continue;
      usedSrcs.push(media.src);
      const pos = randomPosition(initial);
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
  }, [visible, allMedia]);

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
          const newMedia = pickFromBag(allMediaRef.current, usedSrcs, remainingVideos === 0 ? 'video' : undefined);
          if (!newMedia) return prev;
          const others = prev.filter((_, i) => i !== fadedIndex && prev[i].opacity > 0);
          const pos = randomPosition(others);
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
          opacity: colorMode === 'rainbow' ? media.opacity * 0.2 : colorMode === 'deep-red' ? media.opacity * 0.18 : media.opacity * 0.12,
          filter: colorMode === 'rainbow' ? 'brightness(1.5) contrast(0.8) saturate(1.2)' : colorMode === 'deep-red' ? 'sepia(100%) saturate(2) brightness(1.8) contrast(0.7) hue-rotate(-10deg)' : 'grayscale(100%) brightness(3) contrast(0.6)',
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
