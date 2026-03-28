'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background:
          'radial-gradient(ellipse 120% 80% at 10% 80%, rgba(var(--accent-rgb), 0.12) 0%, transparent 50%), ' +
          'radial-gradient(ellipse 100% 60% at 90% 20%, rgba(var(--accent2-rgb), 0.08) 0%, transparent 50%), ' +
          'var(--bg)',
      }}
    >
      <div
        style={{
          maxWidth: 600,
          width: '100%',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
          border: '1px solid var(--glass-border)',
          borderRadius: 20,
          padding: '48px 40px',
          boxShadow:
            '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        }}
      >
        <h1
          style={{
            fontSize: '1.8rem',
            fontWeight: 200,
            letterSpacing: '0.06em',
            textTransform: 'lowercase',
            marginBottom: 8,
            background:
              'linear-gradient(135deg, var(--grad-start) 0%, var(--grad-mid) 50%, var(--grad-end) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          about viz-vibes
        </h1>

        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--fg-dim)',
            lineHeight: 1.7,
            marginBottom: 32,
          }}
        >
          A music player and visualizer built as a creative experiment.
        </p>

        <Section title="the music">
          All songs are AI-generated — composed, arranged, and produced with
          artificial intelligence. I listen to them daily.
        </Section>

        <Section title="the tech">
          WebGL shaders power the audio-reactive visualizer. The frontend is
          Next.js, the backend is FastAPI, and audio streams from Cloudflare R2.
        </Section>

        <Section title="the design">
          Inspired by iOS liquid glass, with interactive effects throughout —
          mouse-tracking highlights, glass reflections, and fluid animations.
        </Section>

        <div
          style={{
            marginTop: 36,
            paddingTop: 24,
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <a
            href="https://www.linkedin.com/in/pywoo/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.82rem',
              color: 'var(--fg)',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'var(--accent)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--fg)')
            }
          >
            Made by Peter Woo
          </a>

          <Link
            href="/"
            style={{
              fontSize: '0.82rem',
              color: 'var(--fg-dim)',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'var(--fg-bright)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--fg-dim)')
            }
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2
        style={{
          fontSize: '0.72rem',
          fontWeight: 400,
          textTransform: 'lowercase',
          letterSpacing: '0.06em',
          color: 'var(--accent)',
          marginBottom: 6,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: '0.85rem',
          color: 'var(--fg)',
          lineHeight: 1.7,
          fontWeight: 300,
        }}
      >
        {children}
      </p>
    </div>
  );
}
