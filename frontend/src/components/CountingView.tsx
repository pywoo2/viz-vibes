'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface LogEntry {
  action: string;
  timestamp: string;
}

interface Particle {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

let particleId = 0;

export default function CountingView() {
  const [count, setCount] = useState<number | null>(null);
  const [animClass, setAnimClass] = useState('');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [btnFlash, setBtnFlash] = useState<string>('');
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/counter`)
      .then(r => {
        if (!r.ok || !r.headers.get('content-type')?.includes('json')) throw new Error();
        return r.json();
      })
      .then(d => setCount(typeof d.value === 'number' ? d.value : 0))
      .catch(() => setCount(0));

    fetch(`${API_URL}/api/counter/log`)
      .then(r => {
        if (!r.ok || !r.headers.get('content-type')?.includes('json')) throw new Error();
        return r.json();
      })
      .then(d => { if (Array.isArray(d)) setLog(d); })
      .catch(() => {});
  }, []);

  const flash = useCallback((dir: 'up' | 'down' | 'reset') => {
    setAnimClass(`counter-flash-${dir}`);
    setTimeout(() => setAnimClass(''), 500);
  }, []);

  const spawnParticles = useCallback((text: string, color: string) => {
    const count = 3 + Math.floor(Math.random() * 3);
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleId++,
        text,
        x: (Math.random() - 0.5) * 120,
        y: 0,
        color,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, 800);
  }, []);

  const flashBtn = useCallback((which: string) => {
    setBtnFlash(which);
    setTimeout(() => setBtnFlash(''), 400);
  }, []);

  const addLogEntry = useCallback((action: string) => {
    setLog(prev => [...prev, { action, timestamp: new Date().toISOString() }].slice(-50));
  }, []);

  const handleIncrement = useCallback(async () => {
    flash('up');
    flashBtn('add');
    spawnParticles('+1', '#8bac0f');
    setCount(prev => (prev ?? 0) + 1);
    addLogEntry('+1');
    try {
      const r = await fetch(`${API_URL}/api/counter/increment`, { method: 'POST' });
      if (r.ok) { const data = await r.json(); if (typeof data.value === 'number') setCount(data.value); }
    } catch { /* optimistic update already applied */ }
  }, [flash, flashBtn, spawnParticles, addLogEntry]);

  const handleDecrement = useCallback(async () => {
    flash('down');
    flashBtn('sub');
    spawnParticles('−1', '#d44');
    setCount(prev => (prev ?? 0) - 1);
    addLogEntry('−1');
    try {
      const r = await fetch(`${API_URL}/api/counter/decrement`, { method: 'POST' });
      if (r.ok) { const data = await r.json(); if (typeof data.value === 'number') setCount(data.value); }
    } catch { /* optimistic update already applied */ }
  }, [flash, flashBtn, spawnParticles, addLogEntry]);

  const handleReset = useCallback(async () => {
    flash('reset');
    flashBtn('reset');
    spawnParticles('0', 'rgba(255,255,255,0.4)');
    setCount(0);
    addLogEntry('reset');
    try {
      const r = await fetch(`${API_URL}/api/counter/reset`, { method: 'POST' });
      if (r.ok) { const data = await r.json(); if (typeof data.value === 'number') setCount(data.value); }
    } catch { /* optimistic update already applied */ }
  }, [flash, flashBtn, spawnParticles, addLogEntry]);

  return (
    <div className="counting-view">
      <div className="counting-main" ref={mainRef}>
        <div className="counting-number-wrapper">
          <div className={`counting-number ${animClass}`}>
            {count === null ? '...' : String(count)}
          </div>
          <div className="counting-particles" aria-hidden>
            {particles.map(p => (
              <span
                key={p.id}
                className="counting-particle"
                style={{
                  '--px': `${p.x}px`,
                  color: p.color,
                } as React.CSSProperties}
              >
                {p.text}
              </span>
            ))}
          </div>
        </div>
        <div className="counting-buttons">
          <button className={`counting-btn counting-btn-sub ${btnFlash === 'sub' ? 'counting-btn-glow-sub' : ''}`} onClick={handleDecrement}>
            −1
          </button>
          <button className={`counting-btn counting-btn-reset ${btnFlash === 'reset' ? 'counting-btn-glow-reset' : ''}`} onClick={handleReset}>
            reset
          </button>
          <button className={`counting-btn counting-btn-add ${btnFlash === 'add' ? 'counting-btn-glow-add' : ''}`} onClick={handleIncrement}>
            +1
          </button>
        </div>
        <p className="counting-note">shared counter — everyone sees the same number</p>
      </div>
      <div className="counting-log">
        <div className="counting-log-header">action log</div>
        <div className="counting-log-messages" ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}>
          {log.length === 0 && (
            <div className="counting-log-empty">no actions yet...</div>
          )}
          {log.map((entry, i) => (
            <div key={i} className="counting-log-entry">
              <span className={`counting-log-action ${entry.action === '+1' ? 'add' : entry.action === '−1' ? 'sub' : 'reset'}`}>
                {entry.action}
              </span>
              {entry.timestamp && (
                <span className="counting-log-time">
                  {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                  {new Date(entry.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
