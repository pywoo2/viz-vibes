'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useTheme } from '../components/ThemePicker';
import Sidebar from '../components/Sidebar';
import PlayerBar from '../components/PlayerBar';
import Visualizer from '../components/Visualizer';
import VisualizerPicker from '../components/VisualizerPicker';

export default function Home() {
  const player = useAudioPlayer();
  useTheme();
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [vizMode, setVizMode] = useState('noise');

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-width');
    if (stored) setSidebarWidth(parseInt(stored));
    const collapsed = localStorage.getItem('sidebar-collapsed');
    if (collapsed === 'true') setIsCollapsed(true);
    const savedVizMode = localStorage.getItem('viz-mode');
    if (savedVizMode) setVizMode(savedVizMode);
  }, []);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(400, startWidth + e.clientX - startX));
      setSidebarWidth(newWidth);
      localStorage.setItem('sidebar-width', String(newWidth));
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  const handleDoubleClick = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  const handleVizModeChange = useCallback((mode: string) => {
    setVizMode(mode);
    localStorage.setItem('viz-mode', mode);
  }, []);

  const currentTrack =
    player.currentIndex >= 0 ? player.tracks[player.currentIndex] : null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${isCollapsed ? '0px' : `${sidebarWidth}px`} 1fr`,
        gridTemplateRows: 'minmax(0, 1fr) 80px',
        height: '100vh',
        transition: isResizing ? 'none' : 'grid-template-columns 0.3s ease',
        position: 'relative',
      }}
    >
      {/* Visualizer spans full viewport behind everything */}
      <div id="visualizer-bg">
        <Visualizer analyser={player.analyserRef?.current ?? null} isPlaying={player.isPlaying} mode={vizMode} />
      </div>

      <VisualizerPicker mode={vizMode} onModeChange={handleVizModeChange} />

      <Sidebar
        tracks={player.tracks}
        currentIndex={player.currentIndex}
        isPlaying={player.isPlaying}
        loading={player.loading}
        error={player.error}
        onPlayTrack={player.playTrack}
        onUpdateTrackLikes={player.updateTrackLikes}
        isCollapsed={isCollapsed}
      />

      <div
        className="resize-handle"
        onMouseDown={startResize}
        onDoubleClick={handleDoubleClick}
        style={{ left: isCollapsed ? 0 : sidebarWidth }}
      />

      <div id="main-area"></div>

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
