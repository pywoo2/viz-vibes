'use client';

import { useState, useEffect, useRef } from 'react';
import { THEMES, Theme } from '../themes';

interface ThemePickerProps {
  onThemeChange?: (theme: Theme) => void;
}

export default function ThemePicker({ onThemeChange }: ThemePickerProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('gruvbox');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'gruvbox';
    applyTheme(saved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  function applyTheme(name: string) {
    const theme = THEMES.find((t) => t.name === name);
    if (!theme) return;
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    setCurrent(name);
    localStorage.setItem('theme', name);
    onThemeChange?.(theme);
  }

  const currentTheme = THEMES.find((t) => t.name === current);
  const label = currentTheme?.label || current;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="theme-btn"
      >
        {label}
      </button>
      {open && (
        <div className="theme-dropdown">
          {THEMES.map((theme) => (
            <button
              key={theme.name}
              onClick={(e) => {
                e.stopPropagation();
                applyTheme(theme.name);
                setOpen(false);
              }}
              className={`theme-dropdown-item ${current === theme.name ? 'active' : ''}`}
            >
              <span
                className="theme-dot"
                style={{ background: theme.dotColor }}
              />
              {theme.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
