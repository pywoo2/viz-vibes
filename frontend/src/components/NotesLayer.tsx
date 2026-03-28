'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Note {
  text: string;
  timestamp: string;
}

interface NoteState {
  x: number;
  y: number;
  rotateX: number;
  rotateY: number;
  scale: number;
  opacity: number;
  text: string;
}

function randomPosition() {
  return { x: 15 + Math.random() * 70, y: 15 + Math.random() * 70 };
}

function pickRandomNote(notes: Note[], exclude: string[]): Note | null {
  const available = notes.filter((n) => !exclude.includes(n.text));
  const pool = available.length > 0 ? available : notes;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

interface NotesLayerProps {
  visible: boolean;
  refreshKey: number;
}

export default function NotesLayer({ visible, refreshKey }: NotesLayerProps) {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [displayed, setDisplayed] = useState<NoteState[]>([]);
  const dragRef = useRef<{
    index: number;
    startX: number;
    startY: number;
    startRotX: number;
    startRotY: number;
  } | null>(null);
  const initializedRef = useRef(false);
  const allNotesRef = useRef<Note[]>([]);

  // Keep ref in sync
  useEffect(() => {
    allNotesRef.current = allNotes;
  }, [allNotes]);

  // Fetch notes
  useEffect(() => {
    fetch(`${API_URL}/api/notes`)
      .then((r) => r.json())
      .then((data: Note[]) => setAllNotes(data))
      .catch(() => {});
  }, [refreshKey]);

  // Initialize displayed notes when visible and notes are loaded
  useEffect(() => {
    if (!visible) {
      setDisplayed([]);
      initializedRef.current = false;
      return;
    }
    if (initializedRef.current || allNotes.length === 0) return;
    initializedRef.current = true;

    const count = Math.min(3, allNotes.length);
    const initial: NoteState[] = [];
    const usedTexts: string[] = [];
    for (let i = 0; i < count; i++) {
      const note = pickRandomNote(allNotes, usedTexts);
      if (!note) break;
      usedTexts.push(note.text);
      const pos = randomPosition();
      initial.push({
        x: pos.x,
        y: pos.y,
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        opacity: 0,
        text: note.text,
      });
    }
    setDisplayed(initial);

    // Stagger fade-in
    const timers: ReturnType<typeof setTimeout>[] = [];
    initial.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setDisplayed((prev) =>
            prev.map((n, idx) => (idx === i ? { ...n, opacity: 1 } : n))
          );
        }, i * 800)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [visible, allNotes]);

  // Cycle notes every 15 seconds
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setDisplayed((prev) => {
        if (prev.length === 0) return prev;
        const fadeIndex = Math.floor(Math.random() * prev.length);
        return prev.map((n, i) => (i === fadeIndex ? { ...n, opacity: 0 } : n));
      });

      setTimeout(() => {
        setDisplayed((prev) => {
          if (prev.length === 0) return prev;
          const fadedIndex = prev.findIndex((n) => n.opacity === 0);
          if (fadedIndex === -1) return prev;
          const usedTexts = prev.map((n) => n.text);
          const newNote = pickRandomNote(allNotesRef.current, usedTexts);
          if (!newNote) return prev;
          const pos = randomPosition();
          return prev.map((n, i) =>
            i === fadedIndex
              ? {
                  x: pos.x,
                  y: pos.y,
                  rotateX: 0,
                  rotateY: 0,
                  scale: 1,
                  opacity: 0,
                  text: newNote.text,
                }
              : n
          );
        });
        setTimeout(() => {
          setDisplayed((prev) =>
            prev.map((n) => (n.opacity === 0 ? { ...n, opacity: 1 } : n))
          );
        }, 100);
      }, 2200);
    }, 15000);
    return () => clearInterval(interval);
  }, [visible]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = {
        index,
        startX: e.clientX,
        startY: e.clientY,
        startRotX: displayed[index].rotateX,
        startRotY: displayed[index].rotateY,
      };
    },
    [displayed]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent, index: number) => {
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setDisplayed((prev) =>
        prev.map((n, i) =>
          i === index
            ? { ...n, scale: Math.max(0.3, Math.min(3, n.scale + delta)) }
            : n
        )
      );
    },
    []
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setDisplayed((prev) =>
        prev.map((n, i) =>
          i === drag.index
            ? {
                ...n,
                rotateY: drag.startRotY + dx * 0.3,
                rotateX: drag.startRotX - dy * 0.3,
              }
            : n
        )
      );
    };

    const onMouseUp = () => {
      dragRef.current = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  if (!visible || displayed.length === 0) return null;

  return (
    <div
      id="notes-layer"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        perspective: '1000px',
      }}
    >
      {displayed.map((note, index) => (
        <div
          key={`${note.text}-${index}`}
          style={{
            position: 'absolute',
            left: `${note.x}%`,
            top: `${note.y}%`,
            transform: `translate(-50%, -50%) rotateX(${note.rotateX}deg) rotateY(${note.rotateY}deg) scale(${note.scale})`,
            opacity: note.opacity * 0.15,
            mixBlendMode: 'screen',
            cursor: dragRef.current?.index === index ? 'grabbing' : 'grab',
            pointerEvents: 'auto',
            transition:
              dragRef.current?.index === index
                ? 'none'
                : 'opacity 2s ease, transform 0.15s ease-out',
            userSelect: 'none',
            transformStyle: 'preserve-3d',
            fontSize: '0.9rem',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'rgba(255, 255, 255, 1)',
            maxWidth: '250px',
            textAlign: 'center',
          }}
          onMouseDown={(e) => handleMouseDown(e, index)}
          onWheel={(e) => handleWheel(e, index)}
        >
          {note.text}
        </div>
      ))}
    </div>
  );
}
