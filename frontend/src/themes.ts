export interface Theme {
  name: string;
  label: string;
  dotColor: string;
  vars: Record<string, string>;
}

export const THEMES: Theme[] = [
  {
    name: 'mono',
    label: 'Mono',
    dotColor: '#ffffff',
    vars: {
      '--bg': '#0a0a0a',
      '--bg-sidebar': '#0a0a0a',
      '--bg-bar': '#0a0a0a',
      '--bg-card': '#1a1a1a',
      '--bg-hover': 'rgba(255, 255, 255, 0.04)',
      '--bg-active': 'rgba(255, 255, 255, 0.07)',
      '--border': 'rgba(255, 255, 255, 0.06)',
      '--border-bar': 'rgba(255, 255, 255, 0.06)',
      '--fg': '#e0e0e0',
      '--fg-bright': '#ffffff',
      '--fg-dim': '#707070',
      '--fg-muted': '#404040',
      '--fg-subtle': '#585858',
      '--accent': '#ffffff',
      '--accent-dim': '#a0a0a0',
      '--accent2': '#808080',
      '--btn-bg': '#ffffff',
      '--btn-bg-hover': '#f0f0f0',
      '--btn-fg': '#0a0a0a',
      '--progress-bg': 'rgba(255, 255, 255, 0.1)',
      '--progress-hover': 'rgba(255, 255, 255, 0.15)',
      '--grad-start': '#ffffff',
      '--grad-mid': '#808080',
      '--grad-end': '#ffffff',
      '--slider-thumb': '#ffffff',
      '--slider-thumb-hover': '#f0f0f0',
      '--glow': 'rgba(255, 255, 255, 0.15)',
      '--glass-bg': 'rgba(10, 10, 10, 0.7)',
      '--glass-border': 'rgba(255, 255, 255, 0.08)',
      '--glass-blur': '40px',
      '--glass-hover': 'rgba(10, 10, 10, 0.8)',
      '--accent-rgb': '255, 255, 255',
      '--accent2-rgb': '128, 128, 128',
    },
  },
];
