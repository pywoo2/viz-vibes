import json
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Viz Vibes API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

R2_BASE = os.environ.get(
    "R2_BASE", "https://pub-7f15cc5f085b475bbeca640a22ea6d7f.r2.dev"
)

DATA_DIR = Path(__file__).resolve().parent.parent
TRACKS_PATH = DATA_DIR / "tracks.json"
META_PATH = DATA_DIR / "track-meta.json"


def load_tracks() -> list[dict]:
    with open(TRACKS_PATH) as f:
        return json.load(f)


def load_meta() -> dict[str, list[str]]:
    if META_PATH.exists():
        with open(META_PATH) as f:
            return json.load(f)
    return {}


def save_meta(meta: dict[str, list[str]]) -> None:
    with open(META_PATH, "w") as f:
        json.dump(meta, f, indent=2)
        f.write("\n")


class TagsBody(BaseModel):
    tags: list[str]


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/tracks")
def get_tracks():
    tracks = load_tracks()
    meta = load_meta()
    result = []
    for t in tracks:
        title = t["title"]
        tags = meta.get(title, t.get("tags", []))
        result.append(
            {
                "title": title,
                "file": t["file"],
                "url": f"{R2_BASE}/{os.path.basename(t['file'])}",
                "tags": tags,
            }
        )
    return result


@app.post("/api/tracks/{title}/tags")
def update_tags(title: str, body: TagsBody):
    tracks = load_tracks()
    titles = [t["title"] for t in tracks]
    if title not in titles:
        raise HTTPException(status_code=404, detail="Track not found")
    meta = load_meta()
    meta[title] = body.tags
    save_meta(meta)
    return {"title": title, "tags": body.tags}
