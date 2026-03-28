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
  const [figuresVisible, setFiguresVisible] = useState(true);
  const [colorMode, setColorMode] = useState('mono');
  const [clickEffect, setClickEffect] = useState('ripple');
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
    const savedColorMode = localStorage.getItem('color-mode');
    if (savedColorMode) setColorMode(savedColorMode);
    const savedClickEffect = localStorage.getItem('click-effect');
    if (savedClickEffect) setClickEffect(savedClickEffect);
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

  const handleColorModeChange = useCallback((mode: string) => {
    setColorMode(mode);
    localStorage.setItem('color-mode', mode);
  }, []);

  const handleClickEffectChange = useCallback((effect: string) => {
    setClickEffect(effect);
    localStorage.setItem('click-effect', effect);
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
    <>
    <div className="mobile-block">
      <p>viz-vibes</p>
      <p className="mobile-sub">best experienced on desktop</p>
    </div>
    <div
      className="desktop-only"
      style={{
        display: 'grid',
        gridTemplateColumns: `${isCollapsed ? '40px' : `${sidebarWidth}px`} 1fr`,
        gridTemplateRows: 'minmax(0, 1fr) 80px',
        height: '100vh',
        transition: isResizing ? 'none' : 'grid-template-columns 0.3s ease',
        position: 'relative',
      }}
    >
      {/* Visualizer spans full viewport behind everything */}
      <div id="visualizer-bg">
        <Visualizer analyser={player.analyserRef?.current ?? null} isPlaying={player.isPlaying} mode={vizMode} colorMode={colorMode} clickEffect={clickEffect} />
      </div>

      <FiguresLayer
        isPlaying={player.isPlaying}
        analyser={player.analyserRef?.current ?? null}
        visible={figuresVisible}
      />

      <VisualizerPicker
        mode={vizMode}
        onModeChange={handleVizModeChange}
        figuresVisible={figuresVisible}
        onToggleFigures={handleToggleFigures}
        colorMode={colorMode}
        onColorModeChange={handleColorModeChange}
        clickEffect={clickEffect}
        onClickEffectChange={handleClickEffectChange}
      />

      <Sidebar
        tracks={player.tracks}
        currentIndex={player.currentIndex}
        isPlaying={player.isPlaying}
        loading={player.loading}
        error={player.error}
        onPlayTrack={player.playTrack}
        onUpdateTrackLikes={player.updateTrackLikes}
        isCollapsed={isCollapsed}
        onCollapse={handleDoubleClick}
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
        onAboutClick={() => { setShowAbout(prev => !prev); }}
      />

      {showAbout && (
        <div className="about-overlay" onClick={() => setShowAbout(false)}>
          <div className="about-card" onClick={(e) => e.stopPropagation()}>
            <button className="about-close" onClick={() => setShowAbout(false)}>&times;</button>
            <h2 className="about-title">about viz-vibes</h2>
            <div className="about-section">
              <h3>the music</h3>
              <p>All songs are AI-generated.</p>
            </div>
            <div className="about-section">
              <h3>the tech</h3>
              <p>WebGL shaders power the audio-reactive visualizer. The frontend is Next.js, the backend is FastAPI, and audio streams from Cloudflare R2.</p>
            </div>
            <div className="about-section">
              <h3>the design</h3>
              <p>Inspired by iOS liquid glass and MySpace.</p>
            </div>
            <a href="https://www.linkedin.com/in/pywoo/" target="_blank" rel="noopener noreferrer" className="about-link">
              Made by Peter Woo &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
