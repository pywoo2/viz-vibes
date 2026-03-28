'use client';

import { VISUALIZER_MODES } from './Visualizer';

interface VisualizerPickerProps {
  mode: string;
  onModeChange: (mode: string) => void;
  figuresVisible: boolean;
  onToggleFigures: () => void;
  colorMode: string;
  onColorModeChange: (mode: string) => void;
  clickEffect: string;
  onClickEffectChange: (effect: string) => void;
}

const icons: Record<string, React.ReactNode> = {
  noise: (
    <svg viewBox="0 0 20 20">
      <path d="M3 10c1-3 3-5 5-2s3 1 5-2 3-1 4 1" strokeLinecap="round" />
      <path d="M3 13c2-2 3-4 5-1s3 0 5-3 3 0 4 2" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  waveform: (
    <svg viewBox="0 0 20 20">
      <path d="M2 10 Q5 4, 7 10 T12 10 T17 10" strokeLinecap="round" />
    </svg>
  ),
  particles: (
    <svg viewBox="0 0 20 20">
      <circle cx="5" cy="6" r="1.5" fill="rgba(255,255,255,0.6)" stroke="none" />
      <circle cx="14" cy="4" r="1" fill="rgba(255,255,255,0.6)" stroke="none" />
      <circle cx="10" cy="10" r="1.8" fill="rgba(255,255,255,0.6)" stroke="none" />
      <circle cx="4" cy="14" r="1.2" fill="rgba(255,255,255,0.6)" stroke="none" />
      <circle cx="15" cy="13" r="1.4" fill="rgba(255,255,255,0.6)" stroke="none" />
      <circle cx="8" cy="16" r="1" fill="rgba(255,255,255,0.6)" stroke="none" />
    </svg>
  ),
  rings: (
    <svg viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="2" />
      <circle cx="10" cy="10" r="5" />
      <circle cx="10" cy="10" r="8" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 20 20">
      <line x1="0" y1="5" x2="20" y2="5" />
      <line x1="0" y1="10" x2="20" y2="10" />
      <line x1="0" y1="15" x2="20" y2="15" />
      <line x1="5" y1="0" x2="5" y2="20" />
      <line x1="10" y1="0" x2="10" y2="20" />
      <line x1="15" y1="0" x2="15" y2="20" />
    </svg>
  ),
  plasma: (
    <svg viewBox="0 0 20 20">
      <path d="M2 10 C4 4, 8 16, 10 10 S16 4, 18 10" strokeLinecap="round" />
      <path d="M2 13 C5 7, 9 17, 12 11 S17 6, 19 12" strokeLinecap="round" opacity="0.5" />
      <path d="M1 7 C4 13, 8 3, 11 9 S15 14, 18 8" strokeLinecap="round" opacity="0.3" />
    </svg>
  ),
};

const clickEffects = [
  { id: 'ripple', label: 'Ripple', icon: (
    <svg viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="3" />
      <circle cx="10" cy="10" r="6" />
      <circle cx="10" cy="10" r="9" />
    </svg>
  )},
  { id: 'burst', label: 'Burst', icon: (
    <svg viewBox="0 0 20 20">
      <line x1="10" y1="2" x2="10" y2="6" />
      <line x1="10" y1="14" x2="10" y2="18" />
      <line x1="2" y1="10" x2="6" y2="10" />
      <line x1="14" y1="10" x2="18" y2="10" />
      <line x1="4.3" y1="4.3" x2="7.1" y2="7.1" />
      <line x1="12.9" y1="12.9" x2="15.7" y2="15.7" />
      <line x1="15.7" y1="4.3" x2="12.9" y2="7.1" />
      <line x1="7.1" y1="12.9" x2="4.3" y2="15.7" />
    </svg>
  )},
  { id: 'shockwave', label: 'Shockwave', icon: (
    <svg viewBox="0 0 20 20">
      <path d="M3 10 A7 7 0 0 1 17 10" fill="none" />
      <path d="M5 10 A5 5 0 0 1 15 10" fill="none" />
      <path d="M7 10 A3 3 0 0 1 13 10" fill="none" />
    </svg>
  )},
  { id: 'none', label: 'None', icon: (
    <svg viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="7" />
      <line x1="5" y1="15" x2="15" y2="5" />
    </svg>
  )},
];

export default function VisualizerPicker({ mode, onModeChange, figuresVisible, onToggleFigures, colorMode, onColorModeChange, clickEffect, onClickEffectChange }: VisualizerPickerProps) {
  return (
    <div id="viz-picker">
      {VISUALIZER_MODES.map((m) => (
        <button
          key={m.id}
          className={`viz-mode-btn${mode === m.id ? ' active' : ''}`}
          onClick={() => onModeChange(m.id)}
          title={m.label}
        >
          {icons[m.id]}
        </button>
      ))}
      <div className="viz-picker-separator" />
      <button
        className={`viz-mode-btn${figuresVisible ? ' active' : ''}`}
        onClick={onToggleFigures}
        title="Art overlay"
      >
        <svg viewBox="0 0 20 20">
          <rect x="3" y="5" width="14" height="10" rx="1" />
          <line x1="3" y1="12" x2="8" y2="8" />
          <line x1="8" y1="8" x2="12" y2="11" />
          <line x1="12" y1="11" x2="17" y2="7" />
          <circle cx="14" cy="8" r="1.5" fill="rgba(255,255,255,0.4)" stroke="none" />
        </svg>
      </button>
      <div className="viz-picker-separator" />
      <button
        className={`viz-mode-btn${colorMode === 'mono' ? ' active' : ''}`}
        onClick={() => onColorModeChange('mono')}
        title="Monochrome"
      >
        <svg viewBox="0 0 20 20">
          <defs>
            <clipPath id="mono-left">
              <rect x="0" y="0" width="10" height="20" />
            </clipPath>
            <clipPath id="mono-right">
              <rect x="10" y="0" width="10" height="20" />
            </clipPath>
          </defs>
          <circle cx="10" cy="10" r="7" fill="white" clipPath="url(#mono-left)" stroke="none" />
          <circle cx="10" cy="10" r="7" fill="black" clipPath="url(#mono-right)" stroke="none" />
          <circle cx="10" cy="10" r="7" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
        </svg>
      </button>
      <button
        className={`viz-mode-btn${colorMode === 'rainbow' ? ' active' : ''}`}
        onClick={() => onColorModeChange('rainbow')}
        title="Rainbow"
      >
        <svg viewBox="0 0 20 20">
          <defs>
            <linearGradient id="rainbow-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff0000" />
              <stop offset="17%" stopColor="#ff8800" />
              <stop offset="33%" stopColor="#ffff00" />
              <stop offset="50%" stopColor="#00ff00" />
              <stop offset="67%" stopColor="#0088ff" />
              <stop offset="83%" stopColor="#4400ff" />
              <stop offset="100%" stopColor="#ff00ff" />
            </linearGradient>
          </defs>
          <circle cx="10" cy="10" r="7" fill="url(#rainbow-grad)" stroke="none" />
        </svg>
      </button>
      <div className="viz-picker-separator" />
      {clickEffects.map((effect) => (
        <button
          key={effect.id}
          className={`viz-mode-btn${clickEffect === effect.id ? ' active' : ''}`}
          onClick={() => onClickEffectChange(effect.id)}
          title={effect.label}
        >
          {effect.icon}
        </button>
      ))}
    </div>
  );
}
