'use client';

import { useAudioPlayer } from '../hooks/useAudioPlayer';
import Sidebar from '../components/Sidebar';
import PlayerBar from '../components/PlayerBar';
import Visualizer from '../components/Visualizer';

export default function Home() {
  const player = useAudioPlayer();

  const currentTrack =
    player.currentIndex >= 0 ? player.tracks[player.currentIndex] : null;

  return (
    <>
      <Sidebar
        tracks={player.tracks}
        currentIndex={player.currentIndex}
        isPlaying={player.isPlaying}
        loading={player.loading}
        error={player.error}
        onPlayTrack={player.playTrack}
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
    </>
  );
}
