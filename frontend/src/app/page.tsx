'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useTheme } from '../components/ThemePicker';
import Sidebar from '../components/Sidebar';
import PlayerBar from '../components/PlayerBar';
import Visualizer from '../components/Visualizer';
import VisualizerPicker from '../components/VisualizerPicker';
import FiguresLayer from '../components/FiguresLayer';

export default function Home() {
  const player = useAudioPlayer();
  useTheme();
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [vizMode, setVizMode] = useState('noise');
  const [figuresVisible, setFiguresVisible] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-width');
    if (stored) setSidebarWidth(parseInt(stored));
    const collapsed = localStorage.getItem('sidebar-collapsed');
    if (collapsed === 'true') setIsCollapsed(true);
    const savedVizMode = localStorage.getItem('viz-mode');
    if (savedVizMode) setVizMode(savedVizMode);
    const savedFigures = localStorage.getItem('figures-visible');
    if (savedFigures === 'true') setFiguresVisible(true);
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

  const handleToggleFigures = useCallback(() => {
    setFiguresVisible(prev => {
      const next = !prev;
      localStorage.setItem('figures-visible', String(next));
      return next;
    });
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

      <FiguresLayer
        isPlaying={player.isPlaying}
        analyser={player.analyserRef?.current ?? null}
        visible={figuresVisible}
      />

      <VisualizerPicker mode={vizMode} onModeChange={handleVizModeChange} figuresVisible={figuresVisible} onToggleFigures={handleToggleFigures} />

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
        onAboutClick={() => setShowAbout(true)}
      />

      {showAbout && (
        <div className="about-overlay" onClick={() => setShowAbout(false)}>
          <div className="about-card" onClick={(e) => e.stopPropagation()}>
            <button className="about-close" onClick={() => setShowAbout(false)}>&times;</button>
            <h2 className="about-title">about viz-vibes</h2>
            <div className="about-section">
              <h3>the music</h3>
              <p>All songs are AI-generated — composed, arranged, and produced with artificial intelligence. I listen to them daily.</p>
            </div>
            <div className="about-section">
              <h3>the tech</h3>
              <p>WebGL shaders power the audio-reactive visualizer. The frontend is Next.js, the backend is FastAPI, and audio streams from Cloudflare R2.</p>
            </div>
            <div className="about-section">
              <h3>the design</h3>
              <p>Inspired by iOS liquid glass, with interactive effects throughout — mouse-tracking highlights, glass reflections, and fluid animations.</p>
            </div>
            <a href="https://www.linkedin.com/in/pywoo/" target="_blank" rel="noopener noreferrer" className="about-link">
              Made by Peter Woo &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
