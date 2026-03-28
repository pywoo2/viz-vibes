'use client';

import { VISUALIZER_MODES } from './Visualizer';

interface VisualizerPickerProps {
  mode: string;
  onModeChange: (mode: string) => void;
  clickEffect: string;
  onClickEffectChange: (effect: string) => void;
  figuresVisible: boolean;
  onToggleFigures: () => void;
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
};

const CLICK_EFFECTS = [
  { id: 'ripple', label: 'Ripple' },
  { id: 'burst', label: 'Burst' },
  { id: 'shockwave', label: 'Shockwave' },
  { id: 'none', label: 'None' },
];

const clickEffectIcons: Record<string, React.ReactNode> = {
  ripple: (
    <svg viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="3" />
      <circle cx="10" cy="10" r="6" />
      <circle cx="10" cy="10" r="9" />
    </svg>
  ),
  burst: (
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
  ),
  shockwave: (
    <svg viewBox="0 0 20 20">
      <path d="M4 10a6 6 0 0 1 12 0" fill="none" />
      <path d="M2 10a8 8 0 0 1 16 0" fill="none" opacity="0.5" />
    </svg>
  ),
  none: (
    <svg viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="7" />
      <line x1="5" y1="15" x2="15" y2="5" />
    </svg>
  ),
};

export default function VisualizerPicker({ mode, onModeChange, clickEffect, onClickEffectChange, figuresVisible, onToggleFigures }: VisualizerPickerProps) {
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
      {CLICK_EFFECTS.map((e) => (
        <button
          key={e.id}
          className={`viz-mode-btn${clickEffect === e.id ? ' active' : ''}`}
          onClick={() => onClickEffectChange(e.id)}
          title={e.label}
        >
          {clickEffectIcons[e.id]}
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
    </div>
  );
}
