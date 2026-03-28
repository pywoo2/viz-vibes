'use client';

import { VISUALIZER_MODES } from './Visualizer';

interface VisualizerPickerProps {
  mode: string;
  onModeChange: (mode: string) => void;
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

export default function VisualizerPicker({ mode, onModeChange, figuresVisible, onToggleFigures }: VisualizerPickerProps) {
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
        title="Figures"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="12" cy="5" r="2.5" />
          <line x1="12" y1="7.5" x2="12" y2="16" />
          <line x1="8" y1="11" x2="16" y2="11" />
          <line x1="12" y1="16" x2="9" y2="22" />
          <line x1="12" y1="16" x2="15" y2="22" />
        </svg>
      </button>
    </div>
  );
}
