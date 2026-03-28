'use client';

import { useRef, useCallback, useEffect } from 'react';
import { Track } from '../hooks/useAudioPlayer';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  shuffleOn: boolean;
  repeatMode: number;
  currentTime: number;
  duration: number;
  volume: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onSeek: (time: number) => void;
  onSetVolume: (vol: number) => void;
  onAboutClick?: () => void;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

export default function PlayerBar({
  currentTrack,
  isPlaying,
  shuffleOn,
  repeatMode,
  currentTime,
  duration,
  volume,
  onTogglePlay,
  onNext,
  onPrev,
  onToggleShuffle,
  onCycleRepeat,
  onSeek,
  onSetVolume,
  onAboutClick,
}: PlayerBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const barRef = useRef<HTMLDivElement>(null);
  const barHighlightRef = useRef<HTMLDivElement>(null);
  const barRafRef = useRef<number>(0);
  const playBtnRef = useRef<HTMLButtonElement>(null);

  const seekFromEvent = useCallback(
    (e: MouseEvent) => {
      if (!duration || !progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
    },
    [duration, onSeek]
  );

  const seekFromTouch = useCallback(
    (e: TouchEvent) => {
      if (!duration || !progressRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const rect = progressRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
    },
    [duration, onSeek]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDraggingRef.current = true;
      if (!duration || !progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
    },
    [duration, onSeek]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isDraggingRef.current = true;
      if (!duration || !progressRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const rect = progressRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
    },
    [duration, onSeek]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) seekFromEvent(e);
    };
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault();
        seekFromTouch(e);
      }
    };
    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [seekFromEvent, seekFromTouch]);

  // Effect 5: Mouse-tracking highlight on player bar — uses refs to avoid re-renders
  const handleBarMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = barRef.current?.getBoundingClientRect();
    const highlight = barHighlightRef.current;
    if (!rect || !highlight) return;
    cancelAnimationFrame(barRafRef.current);
    barRafRef.current = requestAnimationFrame(() => {
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      highlight.style.background = `radial-gradient(ellipse 400px 200px at ${x}% ${y}%, rgba(255,255,255,0.04) 0%, transparent 70%)`;
    });
  }, []);

  const handleBarMouseLeave = useCallback(() => {
    const highlight = barHighlightRef.current;
    if (highlight) {
      highlight.style.background = '';
    }
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(barRafRef.current);
  }, []);

  // Effect 3: Play button glass press — spring animation on click
  const handlePlayClick = useCallback(() => {
    const btn = playBtnRef.current;
    if (btn) {
      btn.classList.add('play-press');
      setTimeout(() => btn.classList.remove('play-press'), 400);
    }
    onTogglePlay();
  }, [onTogglePlay]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const repeatClass =
    repeatMode === 1 ? 'active' : repeatMode === 2 ? 'repeat-one' : '';

  return (
    <>
    <style>{`
      @keyframes infoGlow {
        0%, 100% { box-shadow: 0 0 12px rgba(255,255,255,0.25), 0 0 30px rgba(255,255,255,0.1); }
        50% { box-shadow: 0 0 20px rgba(255,255,255,0.45), 0 0 40px rgba(255,255,255,0.2), 0 0 60px rgba(255,255,255,0.08); }
      }
    `}</style>
    <div
      id="player-bar"
      ref={barRef}
      className={isPlaying ? 'is-playing' : ''}
      onMouseMove={handleBarMouseMove}
      onMouseLeave={handleBarMouseLeave}
    >
      {/* Mouse-tracking specular highlight overlay (effect 5) */}
      <div
        ref={barHighlightRef}
        className="glass-highlight"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, willChange: 'background' }}
      />

      {/* Left: now playing info */}
      <div id="np-info">
        <div className="np-text">
          <div
            key={currentTrack ? currentTrack.title : '__empty__'}
            className={`np-title np-title-animated ${!currentTrack ? 'np-empty-state' : ''}`}
            id="np-title"
          >
            {currentTrack ? currentTrack.title : 'select a track'}
          </div>
        </div>
      </div>

      {/* Center: controls + progress */}
      <div id="player-center">
        <div id="controls">
          <button
            id="shuffle-btn"
            title="Shuffle"
            className={shuffleOn ? 'active' : ''}
            onClick={onToggleShuffle}
          >
            <svg viewBox="0 0 24 24">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
            </svg>
          </button>
          <button id="prev-btn" title="Previous" onClick={onPrev}>
            <svg viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button
            id="play-btn"
            ref={playBtnRef}
            title={isPlaying ? 'Pause' : 'Play'}
            className={isPlaying ? 'pulsing' : ''}
            onClick={handlePlayClick}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button id="next-btn" title="Next" onClick={onNext}>
            <svg viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
          <button
            id="repeat-btn"
            title="Repeat"
            className={repeatClass}
            onClick={onCycleRepeat}
          >
            <svg viewBox="0 0 24 24">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
            </svg>
          </button>
        </div>
        <div id="progress-row">
          <span className="time" id="time-current">
            {fmt(currentTime)}
          </span>
          <div
            id="progress-container"
            ref={progressRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <div
              id="progress-bar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="time" id="time-total">
            {fmt(duration)}
          </span>
        </div>
      </div>

      {/* Right: volume */}
      <div id="player-right">
        {volume === 0 ? (
          <svg viewBox="0 0 24 24">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          </svg>
        ) : volume > 0.5 ? (
          <svg viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
        )}
        <input
          type="range"
          id="volume-slider"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onSetVolume(parseFloat(e.target.value))}
        />
        <button
          onClick={onAboutClick}
          title="About"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginLeft: 8,
            transition: 'color 0.15s, border-color 0.15s, background 0.15s, box-shadow 0.15s',
            boxShadow: '0 0 12px rgba(255, 255, 255, 0.25), 0 0 30px rgba(255, 255, 255, 0.1)',
            animation: 'infoGlow 2s ease-in-out infinite',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--fg-bright)';
            e.currentTarget.style.borderColor = 'var(--fg-muted)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--fg-subtle)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
        >
          i
        </button>
      </div>
    </div>
    </>
  );
}
