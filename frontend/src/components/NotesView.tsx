'use client';

import { useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface NotesViewProps {
  onNoteSubmitted: () => void;
}

export default function NotesView({ onNoteSubmitted }: NotesViewProps) {
  const [noteText, setNoteText] = useState('');
  const [noteName, setNoteName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitNote = useCallback(() => {
    const text = noteText.trim();
    if (!text) return;
    const name = noteName.trim() || 'anonymous';
    fetch(`${API_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, name }),
    })
      .then((r) => {
        if (r.ok) {
          setNoteText('');
          setNoteName('');
          setSubmitted(true);
          onNoteSubmitted();
          setTimeout(() => setSubmitted(false), 3000);
        }
      })
      .catch(() => {});
  }, [noteText, noteName, onNoteSubmitted]);

  return (
    <div className="notes-view">
      <div className="notes-view-content">
        <h1 className="notes-view-title">leave a note</h1>
        <p className="notes-view-subtitle">
          Notes are public and will float around the visualizer for everyone to see.
        </p>

        <div className="notes-view-card">
          <input
            type="text"
            placeholder="your name"
            maxLength={30}
            value={noteName}
            onChange={(e) => setNoteName(e.target.value)}
            className="notes-view-input"
          />
          <textarea
            placeholder="write something..."
            maxLength={140}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitNote();
              }
            }}
            className="notes-view-textarea"
            rows={4}
          />
          <div className="notes-view-footer">
            <span className="notes-view-count">{noteText.length}/140</span>
            <button
              className="notes-view-submit"
              onClick={submitNote}
              disabled={!noteText.trim()}
            >
              submit
            </button>
          </div>
          {submitted && (
            <div className="notes-view-success">
              <span className="notes-view-success-dot" />
              note posted!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
