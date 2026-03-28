#!/usr/bin/env python3
"""
Music server — serves the web app and API.
Audio files are streamed from Cloudflare R2.
Track metadata comes from track-meta.json.

Run: python3 server.py
"""

import http.server
import json
import os
import urllib.parse

PORT = int(os.environ.get("PORT", 8765))
R2_BASE = os.environ.get("R2_BASE", "https://pub-7f15cc5f085b475bbeca640a22ea6d7f.r2.dev")
META_FILE = "track-meta.json"
TRACKS_FILE = "tracks.json"


def get_tracks():
    meta = {}
    if os.path.exists(META_FILE):
        with open(META_FILE, "r") as f:
            meta = json.load(f)

    # Use tracks.json as the source of truth for track list
    if os.path.exists(TRACKS_FILE):
        with open(TRACKS_FILE, "r") as f:
            tracks_data = json.load(f)
        tracks = []
        for t in tracks_data:
            title = t["title"]
            filename = os.path.basename(t["file"])
            tracks.append({
                "title": title,
                "tags": meta.get(title, t.get("tags", [])),
                "file": f"{R2_BASE}/{urllib.parse.quote(filename)}",
            })
        return tracks

    return []


class MusicHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/tracks":
            tracks = get_tracks()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(tracks).encode())
        else:
            super().do_GET()

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print(f"Music server running at http://localhost:{PORT}")
    print(f"Audio streaming from {R2_BASE}")
    server = http.server.HTTPServer(("", PORT), MusicHandler)
    server.serve_forever()
