'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useTheme } from '../components/ThemePicker';
import Sidebar from '../components/Sidebar';
import PlayerBar from '../components/PlayerBar';
import Visualizer from '../components/Visualizer';
import VisualizerPicker from '../components/VisualizerPicker';
import FiguresLayer from '../components/FiguresLayer';
import NotesLayer from '../components/NotesLayer';
import BlogView from '../components/BlogView';
import AboutView from '../components/AboutView';
import NotesView from '../components/NotesView';

type ViewMode = 'visualizer' | 'blog' | 'about' | 'notes';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const player = useAudioPlayer();
  useTheme();
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [vizMode, setVizMode] = useState('waveform');
  const [figuresVisible, setFiguresVisible] = useState(true);
  const [colorMode, setColorMode] = useState('mono');
  const [clickEffect, setClickEffect] = useState('ripple');
  const [activeView, setActiveView] = useState<ViewMode>('visualizer');
  const [showWarning, setShowWarning] = useState(true);
  const [notesRefreshKey, setNotesRefreshKey] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const drawerTouchStartY = useRef<number | null>(null);
  const drawerTouchCurrentY = useRef<number | null>(null);
  const touchStartRef = useRef<number>(0);
  const tracksPillRef = useRef<HTMLButtonElement>(null);

  // Swipe-to-close: track touch on the drawer and close if swiped down > 100px
  const handleDrawerTouchStart = useCallback((e: React.TouchEvent) => {
    drawerTouchStartY.current = e.touches[0].clientY;
    drawerTouchCurrentY.current = e.touches[0].clientY;
  }, []);

  const handleDrawerTouchMove = useCallback((e: React.TouchEvent) => {
    drawerTouchCurrentY.current = e.touches[0].clientY;
  }, []);

  const handleDrawerTouchEnd = useCallback(() => {
    if (drawerTouchStartY.current !== null && drawerTouchCurrentY.current !== null) {
      const delta = drawerTouchCurrentY.current - drawerTouchStartY.current;
      if (delta > 100) {
        setMobileDrawerOpen(false);
        tracksPillRef.current?.focus();
      }
    }
    drawerTouchStartY.current = null;
    drawerTouchCurrentY.current = null;
  }, []);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => document.body.classList.remove('drawer-open');
  }, [mobileDrawerOpen]);


  useEffect(() => {
    const stored = localStorage.getItem('sidebar-width');
    if (stored) setSidebarWidth(parseInt(stored));
    const collapsed = localStorage.getItem('sidebar-collapsed');
    if (collapsed === 'true') setIsCollapsed(true);
    const savedVizMode = localStorage.getItem('viz-mode');
    if (savedVizMode) setVizMode(savedVizMode);
    const savedColorMode = localStorage.getItem('color-mode');
    if (savedColorMode) setColorMode(savedColorMode);
    const savedClickEffect = localStorage.getItem('click-effect');
    if (savedClickEffect) setClickEffect(savedClickEffect);

    // On mobile, disable figures/notes by default for performance
    // On desktop, respect localStorage (default true)
    const savedFigures = localStorage.getItem('figures-visible');
    if (savedFigures === 'false') setFiguresVisible(false);
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
    <button className="mobile-menu-btn" onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}>
      {mobileDrawerOpen ? '\u2715' : '\u2630'}
    </button>
    <button ref={tracksPillRef} className={`mobile-tracks-btn ${mobileDrawerOpen ? 'hidden' : ''}`} onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}>
      {player.tracks.length === 0 ? 'loading...' : (
        currentTrack ? (
          <>
            <span className={`pill-eq ${!player.isPlaying ? 'paused' : ''}`}>
              <span className="eq-bar" />
              <span className="eq-bar" />
              <span className="eq-bar" />
            </span>
            {currentTrack.title}
          </>
        ) : `\u266B ${player.tracks.length} tracks`
      )}
    </button>
    <div
      className={`mobile-overlay ${mobileDrawerOpen ? 'visible' : ''}`}
      onClick={() => { setMobileDrawerOpen(false); tracksPillRef.current?.focus(); }}
    />
    <div className="ai-disclaimer">all music was created using ai</div>
    <div
      className="desktop-only"
      style={{
        display: 'grid',
        gridTemplateColumns: `${isCollapsed ? '40px' : `${sidebarWidth}px`} 1fr`,
        gridTemplateRows: 'minmax(0, 1fr) auto',
        height: '100vh',
        transition: isResizing ? 'none' : 'grid-template-columns 0.3s ease',
        position: 'relative',
      }}
    >
      {/* View toggle pill */}
      <div className="view-toggle-pill">
        {(['visualizer', 'blog', 'about', 'notes'] as ViewMode[]).map((view) => (
          <button
            key={view}
            className={`view-toggle-option ${activeView === view ? 'active' : ''}`}
            onClick={() => setActiveView(view)}
          >
            {view === 'notes' ? 'leave a note' : view}
          </button>
        ))}
      </div>

      {/* Visualizer spans full viewport behind everything */}
      {activeView === 'visualizer' && (
        <div id="visualizer-bg">
          <Visualizer analyser={player.analyserRef?.current ?? null} isPlaying={player.isPlaying} mode={vizMode} colorMode={colorMode} clickEffect={clickEffect} />
        </div>
      )}

      <FiguresLayer
        isPlaying={player.isPlaying}
        analyser={player.analyserRef?.current ?? null}
        visible={figuresVisible && activeView === 'visualizer'}
      />

      <NotesLayer visible={figuresVisible && activeView === 'visualizer'} refreshKey={notesRefreshKey} />

      {activeView === 'visualizer' && (
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
      )}

      <Sidebar
        tracks={player.tracks}
        currentIndex={player.currentIndex}
        isPlaying={player.isPlaying}
        loading={player.loading}
        error={player.error}
        onPlayTrack={(i: number) => { player.playTrack(i); setMobileDrawerOpen(false); }}
        onUpdateTrackLikes={player.updateTrackLikes}
        isCollapsed={isCollapsed}
        onCollapse={handleDoubleClick}
        className={mobileDrawerOpen ? 'mobile-open' : ''}
        onTouchStart={handleDrawerTouchStart}
        onTouchMove={handleDrawerTouchMove}
        onTouchEnd={handleDrawerTouchEnd}
        vizMode={vizMode}
        onVizModeChange={handleVizModeChange}
        colorMode={colorMode}
        onColorModeChange={handleColorModeChange}
      />

      <div
        className="resize-handle"
        onMouseDown={startResize}
        onDoubleClick={handleDoubleClick}
        style={{ left: isCollapsed ? 0 : sidebarWidth }}
      />

      <div id="main-area">
        {activeView === 'blog' && <BlogView />}
        {activeView === 'about' && <AboutView />}
        {activeView === 'notes' && <NotesView onNoteSubmitted={() => setNotesRefreshKey((k) => k + 1)} />}
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
        onAboutClick={() => { setActiveView(v => v === 'about' ? 'visualizer' : 'about'); }}
        onMiniBarTap={() => setMobileDrawerOpen(true)}
      />

    </div>
    {showWarning && (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 10000, background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ maxWidth: 400, textAlign: 'center', padding: 40 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 300, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.8)', textTransform: 'lowercase' as const, marginBottom: 16 }}>
            before you enter
          </h2>
          <p style={{ fontSize: '0.8rem', fontWeight: 400, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 28 }}>
            this site contains flashing lights and rapidly changing visuals that may be harmful to people with photosensitive epilepsy.
          </p>
          <button
            onClick={() => setShowWarning(false)}
            className="epilepsy-btn"
          >
            i understand, continue
          </button>
        </div>
      </div>
    )}
    </>
  );
}
