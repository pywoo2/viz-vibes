# viz-vibes

A personal music player with a Spotify-style layout and multiple color themes.

**Live at: [viz-vibes.com](https://viz-vibes.com)**

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Frontend      │────▶│   Backend API    │     │  Cloudflare  │
│   (Next.js)     │     │   (FastAPI)      │     │  R2 Storage  │
│                 │     │                  │     │              │
│  viz-vibes.com  │     │  backend-prod... │     │  Audio files │
│  Railway        │     │  .up.railway.app │     │  (wav/mp3)   │
└─────────────────┘     └──────────────────┘     └──────────────┘
        │                        │                       ▲
        │                        │  GET /api/tracks      │
        │                        │  (returns R2 URLs)    │
        └────────────────────────┴───────────────────────┘
                          Browser streams audio directly from R2
```

## Infrastructure

| Component | Service | URL |
|-----------|---------|-----|
| **Frontend** | Railway (`peters-music` service) | [viz-vibes.com](https://viz-vibes.com) |
| **Backend** | Railway (`backend` service) | backend-production-8395b.up.railway.app |
| **Audio storage** | Cloudflare R2 (`peters-music` bucket) | pub-7f15cc5f085b475bbeca640a22ea6d7f.r2.dev |
| **Domain** | Cloudflare Registrar | viz-vibes.com |
| **DNS** | Cloudflare | CNAME → Railway |

## Adding Songs

1. **Upload the audio file to R2:**
   ```bash
   wrangler r2 object put "peters-music/Song Name.wav" --file "Song Name.wav" --content-type "audio/wav" --remote
   ```

2. **Add the track to `tracks.json`:**
   ```json
   {
     "title": "Song Name",
     "tags": [],
     "file": "music/Song Name.wav"
   }
   ```

3. **Optionally add tags in `track-meta.json`:**
   ```json
   {
     "Song Name": ["electronic", "chill"]
   }
   ```

4. **Redeploy the backend** (so it picks up the new tracks.json):
   ```bash
   cd backend && railway service link backend && railway up --detach
   ```

## Local Development

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# runs on http://localhost:3000
```

Frontend expects the API at `http://localhost:8000` by default. Set `NEXT_PUBLIC_API_URL` to override.

## Deploying

**Frontend:**
```bash
cd frontend
railway service link peters-music
railway up --detach
```

**Backend:**
```bash
cd backend
railway service link backend
railway up --detach
```

## Features

- Spotify-style layout: sidebar tracklist, main visualizer area, bottom player bar
- 6 color themes: Gruvbox, Nord, Rosé Pine, Tokyo Night, Catppuccin, Midnight
- Shuffle, repeat (off/all/one), volume control
- Keyboard shortcuts: Space (play/pause), Arrow keys (next/prev)
- Click + drag progress bar seeking
- Equalizer bars on active track
- Tags system for categorizing songs
- Audio streamed from Cloudflare R2 (zero egress fees)
- Download songs directly from the sidebar

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Backend:** FastAPI, Python
- **Storage:** Cloudflare R2
- **Hosting:** Railway
- **Domain:** Cloudflare
