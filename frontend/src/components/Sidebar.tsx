'use client';

import { useState, useCallback } from 'react';
import { Track } from '../hooks/useAudioPlayer';
import ThemePicker from './ThemePicker';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SidebarProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  loading: boolean;
  error: boolean;
  collapsed: boolean;
  onPlayTrack: (index: number) => void;
  onToggleCollapse: () => void;
  onUpdateTrackLikes: (index: number, likes: number) => void;
}

export default function Sidebar({
  tracks,
  currentIndex,
  isPlaying,
  loading,
  error,
  collapsed,
  onPlayTrack,
  onToggleCollapse,
  onUpdateTrackLikes,
}: SidebarProps) {
  const [likingTracks, setLikingTracks] = useState<Set<number>>(new Set());

  const handleLike = useCallback(
    async (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      if (likingTracks.has(index)) return;

      const track = tracks[index];
      const prevLikes = track.likes || 0;
      const newLikes = prevLikes + 1;

      // Optimistic update
      onUpdateTrackLikes(index, newLikes);
      setLikingTracks((prev) => new Set(prev).add(index));

      try {
        await fetch(
          `${API_URL}/api/tracks/${encodeURIComponent(track.title)}/like`,
          { method: 'POST' }
        );
      } catch {
        // Revert on error
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

  return (
    <div id="sidebar" className={collapsed ? 'collapsed' : ''}>
      <div id="sidebar-header">
        {!collapsed && (
          <>
            <h2>Songs</h2>
            <ThemePicker />
          </>
        )}
        <button
          className="collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '\u25B6' : '\u25C0'}
        </button>
      </div>
      {!collapsed && (
        <div id="track-list-wrapper">
          {!loading && tracks.length > 0 && (
            <ul id="track-list">
              {tracks.map((track, i) => (
                <li
                  key={i}
                  className={i === currentIndex ? 'active' : ''}
                  style={{ animationDelay: `${i * 0.06}s` }}
                  onClick={() => onPlayTrack(i)}
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
                    <span className="track-num">{i + 1}</span>
                  )}
                  <div className="track-info">
                    <div className="name">{track.title}</div>
                  </div>
                  <button
                    className={`like-btn ${likingTracks.has(i) ? 'liked' : ''}`}
                    onClick={(e) => handleLike(e, i)}
                    title="Like"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    {(track.likes || 0) > 0 && (
                      <span className="like-count">{track.likes}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!loading && tracks.length === 0 && (
            <div id="empty-state">
              No tracks yet.
              <br />
              Drop audio files in the <code>music/</code> folder.
            </div>
          )}
          {loading && !error && (
            <div id="empty-state">Loading tracks...</div>
          )}
          {error && (
            <div id="empty-state">
              No tracks yet.
              <br />
              Drop audio files in the <code>music/</code> folder.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
