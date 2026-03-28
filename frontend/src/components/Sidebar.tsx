'use client';

import { Track } from '../hooks/useAudioPlayer';
import ThemePicker from './ThemePicker';

interface SidebarProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  loading: boolean;
  error: boolean;
  onPlayTrack: (index: number) => void;
}

export default function Sidebar({
  tracks,
  currentIndex,
  isPlaying,
  loading,
  error,
  onPlayTrack,
}: SidebarProps) {
  return (
    <div id="sidebar">
      <div id="sidebar-header">
        <h2>Songs</h2>
        <ThemePicker />
      </div>
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
                  {track.tags && track.tags.length > 0 && (
                    <div className="tags">
                      {track.tags.map((tag, j) => (
                        <span key={j} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
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
    </div>
  );
}
