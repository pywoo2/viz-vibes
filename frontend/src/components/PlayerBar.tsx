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
}: PlayerBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const seekFromEvent = useCallback(
    (e: MouseEvent) => {
      if (!duration || !progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) seekFromEvent(e);
    };
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [seekFromEvent]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const repeatClass =
    repeatMode === 1 ? 'active' : repeatMode === 2 ? 'repeat-one' : '';

  return (
    <div id="player-bar">
      {/* Left: now playing info */}
      <div id="np-info">
        <div className="np-text">
          <div
            className={`np-title ${!currentTrack ? 'np-empty-state' : ''}`}
            id="np-title"
          >
            {currentTrack ? currentTrack.title : 'select a track'}
          </div>
          {currentTrack?.tags && currentTrack.tags.length > 0 && (
            <div className="np-tags" id="np-tags">
              {currentTrack.tags.map((tag, i) => (
                <span key={i} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
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
            title={isPlaying ? 'Pause' : 'Play'}
            className={isPlaying ? 'pulsing' : ''}
            onClick={onTogglePlay}
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
        <svg viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
        </svg>
        <input
          type="range"
          id="volume-slider"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onSetVolume(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
}
