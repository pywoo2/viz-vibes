'use client';

export default function AboutView() {
  return (
    <div className="about-view">
      <div className="about-view-content">
        <h1 className="about-view-title">about viz-vibes</h1>

        <div className="about-view-sections">
          <div className="about-view-section">
            <h2>the music</h2>
            <p>All songs are AI-generated.</p>
          </div>

          <div className="about-view-section">
            <h2>the tech</h2>
            <p>
              WebGL shaders power the audio-reactive visualizer. The frontend is
              Next.js, the backend is FastAPI, and audio streams from Cloudflare R2.
            </p>
          </div>

          <div className="about-view-section">
            <h2>the design</h2>
            <p>Inspired by MySpace.</p>
          </div>

          <div className="about-view-section">
            <h2>tips</h2>
            <p>
              Left-click and drag the floating images, videos, and notes to rotate
              them in 3D. Right-click and drag to move them around. Scroll to zoom.
              Switch visualizers and click effects on the right panel. Heart a song
              to vote — the list sorts by most liked.
            </p>
          </div>
        </div>

        <div className="about-view-footer">
          <a
            href="https://www.linkedin.com/in/pywoo/"
            target="_blank"
            rel="noopener noreferrer"
            className="about-view-author"
          >
            Made by Peter Woo &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
