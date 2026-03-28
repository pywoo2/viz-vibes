#!/usr/bin/env python3
"""Run this before pushing to regenerate tracks.json from the music/ folder."""
import json, os

MUSIC_DIR = "music"
META_FILE = "track-meta.json"
AUDIO_EXT = {".wav", ".mp3", ".ogg", ".flac", ".aac", ".m4a"}

meta = {}
if os.path.exists(META_FILE):
    with open(META_FILE) as f:
        meta = json.load(f)

tracks = []
for name in sorted(os.listdir(MUSIC_DIR)):
    if os.path.splitext(name)[1].lower() in AUDIO_EXT:
        title = os.path.splitext(name)[0]
        tracks.append({"title": title, "tags": meta.get(title, []), "file": f"{MUSIC_DIR}/{name}"})

with open("tracks.json", "w") as f:
    json.dump(tracks, f, indent=2)

print(f"Generated tracks.json with {len(tracks)} tracks")
