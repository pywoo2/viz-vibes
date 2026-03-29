'use client';

export default function AboutView() {
  return (
    <div className="blog-view">
      <div className="blog-content">
        <article className="blog-article">
          <h1>about viz-vibes</h1>

          <h2>the music</h2>
          <p>All songs are AI-generated.</p>

          <h2>the tech</h2>
          <p>
            WebGL shaders power the audio-reactive visualizer. The frontend is
            Next.js, the backend is FastAPI, and audio streams from Cloudflare R2.
          </p>

          <h2>the design</h2>
          <p>Inspired by iOS liquid glass and MySpace.</p>

          <h2>tips</h2>
          <p>
            Click and drag the floating images and notes to rotate them in 3D.
            Scroll to zoom. Switch visualizers and click effects on the right
            panel. Heart a song to vote — the list sorts by most liked.
          </p>

          <hr />

          <p>
            <a
              href="https://www.linkedin.com/in/pywoo/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Made by Peter Woo &rarr;
            </a>
          </p>
        </article>
      </div>
    </div>
  );
}
