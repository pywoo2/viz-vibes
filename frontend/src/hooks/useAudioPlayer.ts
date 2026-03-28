'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export interface Track {
  title: string;
  file: string;
  url?: string;
  likes?: number;
}

export interface AudioPlayerState {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  shuffleOn: boolean;
  repeatMode: number; // 0=off, 1=repeat all, 2=repeat one
  currentTime: number;
  duration: number;
  volume: number;
  loading: boolean;
  error: boolean;
}

export interface AudioPlayerActions {
  playTrack: (index: number) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  updateTrackLikes: (index: number, likes: number) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useAudioPlayer(): AudioPlayerState & AudioPlayerActions & { analyserRef: React.RefObject<AnalyserNode | null> } {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const shuffleOrderRef = useRef<number[]>([]);
  const shufflePosRef = useRef(-1);
  const currentIndexRef = useRef(-1);
  const repeatModeRef = useRef(0);
  const shuffleOnRef = useRef(false);
  const tracksRef = useRef<Track[]>([]);
  const isPlayingRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { shuffleOnRef.current = shuffleOn; }, [shuffleOn]);
  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.volume = 0.8;
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    });

    audio.addEventListener('ended', () => {
      playNextInternal();
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch tracks
  useEffect(() => {
    fetch(`${API_URL}/api/tracks`)
      .then((r) => r.json())
      .then((data: Track[]) => {
        setTracks(data);
        tracksRef.current = data;
        setLoading(false);
        // Auto-select first track and load its source (don't autoplay)
        if (data.length > 0) {
          setCurrentIndex(0);
          currentIndexRef.current = 0;
          const audio = audioRef.current;
          if (audio) {
            audio.src = data[0].url || data[0].file;
          }
        }
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const buildShuffleOrder = useCallback(() => {
    const order = tracksRef.current.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    shuffleOrderRef.current = order;
    shufflePosRef.current = 0;
  }, []);

  const initAudioContext = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audioContextRef.current) return;
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch (err) {
      console.warn('Audio context init failed (visualizer disabled):', err);
    }
  }, []);

  const playTrack = useCallback((index: number) => {
    const audio = audioRef.current;
    if (!audio || !tracksRef.current[index]) return;
    initAudioContext();
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setCurrentIndex(index);
    currentIndexRef.current = index;
    const track = tracksRef.current[index];
    audio.src = track.url || track.file;
    audio.play().catch((err) => {
      console.error('Play failed:', err);
      // Retry without crossOrigin if CORS fails
      if (audio.crossOrigin) {
        console.warn('Retrying without crossOrigin...');
        audio.crossOrigin = null as unknown as string;
        audio.src = track.url || track.file;
        audio.play().catch(() => {});
      }
    });
    setIsPlaying(true);
    isPlayingRef.current = true;
  }, [initAudioContext]);

  const playNextInternal = useCallback(() => {
    const t = tracksRef.current;
    if (t.length === 0) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (repeatModeRef.current === 2) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }

    if (shuffleOnRef.current) {
      shufflePosRef.current++;
      if (shufflePosRef.current >= shuffleOrderRef.current.length) {
        if (repeatModeRef.current === 1) {
          buildShuffleOrder();
        } else {
          setIsPlaying(false);
          isPlayingRef.current = false;
          return;
        }
      }
      playTrack(shuffleOrderRef.current[shufflePosRef.current]);
    } else {
      const next = currentIndexRef.current + 1;
      if (next >= t.length) {
        if (repeatModeRef.current === 1) {
          playTrack(0);
        } else {
          setIsPlaying(false);
          isPlayingRef.current = false;
        }
      } else {
        playTrack(next);
      }
    }
  }, [playTrack, buildShuffleOrder]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (currentIndexRef.current < 0 && tracksRef.current.length > 0) {
      playTrack(0);
      return;
    }
    if (isPlayingRef.current) {
      audio.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      initAudioContext();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audio.play().catch(() => {});
      setIsPlaying(true);
      isPlayingRef.current = true;
    }
  }, [playTrack, initAudioContext]);

  const nextTrack = useCallback(() => {
    playNextInternal();
  }, [playNextInternal]);

  const prevTrack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || tracksRef.current.length === 0) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (shuffleOnRef.current) {
      shufflePosRef.current = Math.max(0, shufflePosRef.current - 1);
      playTrack(shuffleOrderRef.current[shufflePosRef.current]);
    } else {
      playTrack((currentIndexRef.current - 1 + tracksRef.current.length) % tracksRef.current.length);
    }
  }, [playTrack]);

  const toggleShuffle = useCallback(() => {
    const newVal = !shuffleOnRef.current;
    setShuffleOn(newVal);
    shuffleOnRef.current = newVal;
    if (newVal) buildShuffleOrder();
  }, [buildShuffleOrder]);

  const cycleRepeat = useCallback(() => {
    const next = (repeatModeRef.current + 1) % 3;
    setRepeatMode(next);
    repeatModeRef.current = next;
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = vol;
    }
    setVolumeState(vol);
  }, []);

  const updateTrackLikes = useCallback((index: number, likes: number) => {
    setTracks((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], likes };
      }
      return next;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
      if (e.code === 'ArrowRight') nextTrack();
      if (e.code === 'ArrowLeft') prevTrack();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [togglePlay, nextTrack, prevTrack]);

  return {
    tracks,
    currentIndex,
    isPlaying,
    shuffleOn,
    repeatMode,
    currentTime,
    duration,
    volume,
    loading,
    error,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleShuffle,
    cycleRepeat,
    seek,
    setVolume,
    updateTrackLikes,
    analyserRef,
  };
}
