'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import Sidebar from '../components/Sidebar';
import PlayerBar from '../components/PlayerBar';
import Visualizer from '../components/Visualizer';

export default function Home() {
  const player = useAudioPlayer();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') setSidebarCollapsed(true);
  }, []);

  const toggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  const currentTrack =
    player.currentIndex >= 0 ? player.tracks[player.currentIndex] : null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${sidebarCollapsed ? '56px' : '280px'} 1fr`,
        gridTemplateRows: '1fr 80px',
        height: '100vh',
        transition: 'grid-template-columns 0.3s ease',
      }}
    >
      <Sidebar
        tracks={player.tracks}
        currentIndex={player.currentIndex}
        isPlaying={player.isPlaying}
        loading={player.loading}
        error={player.error}
        collapsed={sidebarCollapsed}
        onPlayTrack={player.playTrack}
        onToggleCollapse={toggleCollapse}
        onUpdateTrackLikes={player.updateTrackLikes}
      />

      <div id="main-area">
        <header id="main-header">
          <h1>peter&apos;s music</h1>
          <p>made with ai, listened to daily</p>
        </header>
        <Visualizer />
      </div>

      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={player.isPlaying}
        shuffleOn={player.shuffleOn}
        repeatMode={player.repeatMode}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        onTogglePlay={player.togglePlay}
        onNext={player.nextTrack}
        onPrev={player.prevTrack}
        onToggleShuffle={player.toggleShuffle}
        onCycleRepeat={player.cycleRepeat}
        onSeek={player.seek}
        onSetVolume={player.setVolume}
      />
    </div>
  );
}
