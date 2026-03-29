'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Track } from '../hooks/useAudioPlayer';
import { VISUALIZER_MODES } from './Visualizer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SidebarProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  loading: boolean;
  error: boolean;
  onPlayTrack: (index: number) => void;
  onUpdateTrackLikes: (index: number, likes: number) => void;
  isCollapsed: boolean;
  onCollapse: () => void;
  className?: string;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  vizMode?: string;
  onVizModeChange?: (mode: string) => void;
  colorMode?: string;
  onColorModeChange?: (mode: string) => void;
}

export default function Sidebar({
  tracks,
  currentIndex,
  isPlaying,
  loading,
  error,
  onPlayTrack,
  onUpdateTrackLikes,
  isCollapsed,
  onCollapse,
  className,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  vizMode,
  onVizModeChange,
  colorMode,
  onColorModeChange,
}: SidebarProps) {
  const [likingTracks, setLikingTracks] = useState<Set<number>>(new Set());
  const [heartPulsingTracks, setHeartPulsingTracks] = useState<Set<number>>(new Set());
  const [downloadingTracks, setDownloadingTracks] = useState<Set<number>>(new Set());
  const sidebarRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Effect 1: Mouse-tracking specular highlight — uses refs to avoid re-renders
  const handleSidebarMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = sidebarRef.current?.getBoundingClientRect();
    const highlight = highlightRef.current;
    if (!rect || !highlight) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      highlight.style.background = `radial-gradient(ellipse 300px 300px at ${x}% ${y}%, rgba(255,255,255,0.06) 0%, transparent 70%)`;
    });
  }, []);

  const handleSidebarMouseLeave = useCallback(() => {
    const highlight = highlightRef.current;
    if (highlight) {
      highlight.style.background = '';
    }
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Effect 2: Track list hover — glass ripple effect
  const handleTrackMouseMove = useCallback((e: React.MouseEvent<HTMLLIElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    e.currentTarget.style.background = `radial-gradient(circle at ${x}% 50%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)`;
  }, []);

  const handleTrackMouseLeave = useCallback((e: React.MouseEvent<HTMLLIElement>) => {
    e.currentTarget.style.background = '';
  }, []);

  const handleLike = useCallback(
    async (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      if (likingTracks.has(index)) return;

      const track = tracks[index];
      const prevLikes = track.likes || 0;
      const newLikes = prevLikes + 1;

      // Effect 7: Trigger heart pulse animation
      setHeartPulsingTracks((prev) => new Set(prev).add(index));
      setTimeout(() => {
        setHeartPulsingTracks((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }, 500);

      // Optimistic update
      onUpdateTrackLikes(index, newLikes);
      setLikingTracks((prev) => new Set(prev).add(index));

      try {
        const res = await fetch(
          `${API_URL}/api/tracks/${encodeURIComponent(track.title)}/like`,
          { method: 'POST' }
        );
        if (!res.ok) {
          // Server returned an error — revert optimistic update
          onUpdateTrackLikes(index, prevLikes);
        }
      } catch {
        // Network error — revert optimistic update
        onUpdateTrackLikes(index, prevLikes);
      } finally {
        setLikingTracks((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }
    },
    [tracks, likingTracks, onUpdateTrackLikes]
  );

  const handleDownload = useCallback(
    async (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      e.preventDefault();
      const track = tracks[index];
      if (!track.url || downloadingTracks.has(index)) return;

      setDownloadingTracks((prev) => new Set(prev).add(index));
      try {
        const res = await fetch(track.url);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = track.url.split('.').pop()?.split('?')[0] || 'mp3';
        a.download = track.file || `${track.title}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        // silently fail
      } finally {
        setDownloadingTracks((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }
    },
    [tracks, downloadingTracks]
  );

  return (
    <div
      id="sidebar"
      className={className || undefined}
      style={isCollapsed ? { overflow: 'hidden' } : undefined}
      ref={sidebarRef}
      onMouseMove={isCollapsed ? undefined : handleSidebarMouseMove}
      onMouseLeave={isCollapsed ? undefined : handleSidebarMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Mobile drawer handle — visible only on small screens via CSS */}
      <div className="mobile-drawer-handle">
        <div className="handle-pill" />
        <span className="mobile-drawer-label">{tracks.length > 0 ? `${tracks.length} songs` : 'Songs'}</span>
      </div>
      {/* Mobile "Now Playing" indicator — shows above viz picker when a song is playing */}
      {currentIndex >= 0 && tracks[currentIndex] && (
        <div className="drawer-now-playing">
          <div className={`drawer-eq ${!isPlaying ? 'paused' : ''}`}>
            <div className="eq-bar" />
            <div className="eq-bar" />
            <div className="eq-bar" />
          </div>
          <span>now playing — {tracks[currentIndex].title}</span>
        </div>
      )}
      {/* Mobile viz picker — horizontal scroll row */}
      <div className="mobile-viz-row">
        <div className="mobile-viz-label">visualizer</div>
        <div className="mobile-viz-options">
          {VISUALIZER_MODES.map(m => (
            <button
              key={m.id}
              className={`mobile-viz-btn ${vizMode === m.id ? 'active' : ''}`}
              onClick={() => onVizModeChange?.(m.id)}
            >
              {m.label.toLowerCase()}
            </button>
          ))}
        </div>
        <div className="mobile-viz-label">color</div>
        <div className="mobile-viz-options">
          <button className={`mobile-viz-btn ${colorMode === 'mono' ? 'active' : ''}`} onClick={() => onColorModeChange?.('mono')}>mono</button>
          <button className={`mobile-viz-btn ${colorMode === 'rainbow' ? 'active' : ''}`} onClick={() => onColorModeChange?.('rainbow')}>rainbow</button>
          <button className={`mobile-viz-btn ${colorMode === 'inverted' ? 'active' : ''}`} onClick={() => onColorModeChange?.('inverted')}>inverted</button>
          <button className={`mobile-viz-btn ${colorMode === 'red' ? 'active' : ''}`} onClick={() => onColorModeChange?.('red')}>red</button>
        </div>
      </div>
      {isCollapsed ? (
        <div id="sidebar-header" style={{ justifyContent: 'center' }}>
          <button className="collapse-sidebar-btn" onClick={onCollapse} title="Expand sidebar">{'\u25B6'}</button>
        </div>
      ) : (
        <>
        {/* Mouse-tracking specular highlight overlay */}
        <div
          ref={highlightRef}
          className="glass-highlight"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, willChange: 'background' }}
        />
        <div id="sidebar-header">
          <h2>{tracks.length > 0 ? `${tracks.length} songs` : 'songs'}</h2>
          <button className="collapse-sidebar-btn" onClick={onCollapse} title="Collapse sidebar">{'\u25C0'}</button>
        </div>
      <div id="track-list-wrapper">
        {!loading && tracks.length > 0 && (
          <>
          <div className="sort-hint">sorted by most liked — tap the heart</div>
          <ul id="track-list">
            {tracks.map((track, i) => (
              <li
                key={i}
                className={i === currentIndex ? 'active' : ''}
                style={{ animationDelay: `${i * 0.06}s` }}
                onClick={() => onPlayTrack(i)}
                onMouseMove={handleTrackMouseMove}
                onMouseLeave={handleTrackMouseLeave}
              >
                {i === currentIndex ? (
                  <div
                    className={`now-playing-indicator ${!isPlaying ? 'paused' : ''}`}
                  >
                    <div className="bar" />
                    <div className="bar" />
                    <div className="bar" />
                  </div>
                ) : (
                  <div className="track-num-wrap">
                    <span className="track-num">{i + 1}</span>
                    <span className="play-hover-icon">
                      <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </div>
                )}
                <div className="track-info">
                  <div className="name">{track.title}</div>
                </div>
                <button
                  className={`like-btn ${likingTracks.has(i) ? 'liked' : ''} ${heartPulsingTracks.has(i) ? 'heart-pulsing' : ''}`}
                  onClick={(e) => handleLike(e, i)}
                  title="Like"
                  aria-label="Like this track"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  {(track.likes || 0) > 0 && (
                    <span className="like-count">{track.likes}</span>
                  )}
                </button>
                <button
                  className={`download-btn ${downloadingTracks.has(i) ? 'downloading' : ''}`}
                  onClick={(e) => handleDownload(e, i)}
                  title="Download"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M5 20h14v-2H5v2zm7-18v12.17l5.59-5.59L19 10l-7 7-7-7 1.41-1.41L11 14.17V2h2z" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          </>
        )}
        {!loading && tracks.length === 0 && (
          <div id="empty-state">
            No tracks yet.
            <br />
            Drop audio files in the <code>music/</code> folder.
          </div>
        )}
        {loading && !error && (
          <div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}
        {error && (
          <div id="empty-state">
            No tracks yet.
            <br />
            Drop audio files in the <code>music/</code> folder.
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
