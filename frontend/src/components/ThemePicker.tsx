'use client';

import { useEffect } from 'react';
import { THEMES } from '../themes';

export function useTheme() {
  useEffect(() => {
    const theme = THEMES[0];
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);
}
