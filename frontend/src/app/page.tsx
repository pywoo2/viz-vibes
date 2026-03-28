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
  const [showAbout, setShowAbout] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [noteName, setNoteName] = useState('');
  const [notesRefreshKey, setNotesRefreshKey] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const drawerTouchStartY = useRef<number | null>(null);
  const drawerTouchCurrentY = useRef<number | null>(null);
  const touchStartRef = useRef<number>(0);

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

  const submitNote = useCallback(() => {
    const text = noteText.trim();
    if (!text) return;
    const name = noteName.trim() || 'anonymous';
    fetch(`${API_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, name }),
    })
      .then((r) => {
        if (r.ok) {
          setNoteText('');
          setNoteName('');
          setNotesRefreshKey((k) => k + 1);
        }
      })
      .catch(() => {});
  }, [noteText, noteName]);

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
    <button className={`mobile-tracks-btn ${mobileDrawerOpen ? 'hidden' : ''}`} onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}>
      &#9835; {player.tracks.length} tracks
    </button>
    <button className="mobile-about-btn" onClick={() => setShowAbout(prev => !prev)}>
      i
    </button>
    <div
      className={`mobile-overlay ${mobileDrawerOpen ? 'visible' : ''}`}
      onClick={() => setMobileDrawerOpen(false)}
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
      {/* Visualizer spans full viewport behind everything */}
      <div id="visualizer-bg">
        <Visualizer analyser={player.analyserRef?.current ?? null} isPlaying={player.isPlaying} mode={vizMode} colorMode={colorMode} clickEffect={clickEffect} />
      </div>

      <FiguresLayer
        isPlaying={player.isPlaying}
        analyser={player.analyserRef?.current ?? null}
        visible={figuresVisible}
      />

      <NotesLayer visible={figuresVisible} refreshKey={notesRefreshKey} />

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

      <div className="note-input-container">
        <div className="note-disclaimer">* all notes are public on the site</div>
        <input
          type="text"
          placeholder="your name"
          maxLength={30}
          value={noteName}
          onChange={(e) => setNoteName(e.target.value)}
          className="note-name-input"
        />
        <input
          type="text"
          placeholder="leave a note..."
          maxLength={140}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitNote();
          }}
        />
        <button className="note-submit-btn" onClick={submitNote} title="Submit note">&rarr;</button>
      </div>

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
            <div className="about-section">
              <h3>tips</h3>
              <p>Click and drag the floating images and notes to rotate them in 3D. Scroll to zoom. Switch visualizers and click effects on the right panel. Heart a song to vote — the list sorts by most liked.</p>
            </div>
            <a href="https://www.linkedin.com/in/pywoo/" target="_blank" rel="noopener noreferrer" className="about-link">
              Made by Peter Woo &rarr;
            </a>
          </div>
        </div>
      )}
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
