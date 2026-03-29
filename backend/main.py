import json
import os
import urllib.parse
from datetime import datetime, timezone

import boto3
from botocore.config import Config
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
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID", "ef3652801cc2430b2aae41452e8cd97e")
R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY", "")
R2_SECRET_KEY = os.environ.get("R2_SECRET_KEY", "")
R2_BUCKET = os.environ.get("R2_BUCKET", "peters-music")

AUDIO_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac", ".aac", ".m4a"}
LIKES_KEY = "_likes.json"
NOTES_KEY = "_notes.json"
PET_KEY = "_pet.json"

DEFAULT_PET = {
    "name": "viz",
    "hunger": 50,
    "happiness": 50,
    "cleanliness": 50,
    "age": 0,
    "totalInteractions": 0,
    "stage": "egg",
    "lastFed": None,
    "lastPlayed": None,
    "lastCleaned": None,
    "lastDecay": None,
    "born": None,
}


class NoteBody(BaseModel):
    text: str
    name: str = "anonymous"


def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def list_tracks_from_r2() -> list[dict]:
    """List audio files directly from R2 bucket."""
    try:
        s3 = get_r2_client()
        response = s3.list_objects_v2(Bucket=R2_BUCKET)
        tracks = []
        for obj in response.get("Contents", []):
            key = obj["Key"]
            ext = os.path.splitext(key)[1].lower()
            if ext in AUDIO_EXTENSIONS:
                title = os.path.splitext(key)[0]
                tracks.append({
                    "title": title,
                    "url": f"{R2_BASE}/{urllib.parse.quote(key, safe='(),')}",
                })
        return tracks
    except Exception:
        return []


def load_likes() -> dict[str, int]:
    """Load likes from _likes.json in the R2 bucket."""
    try:
        s3 = get_r2_client()
        response = s3.get_object(Bucket=R2_BUCKET, Key=LIKES_KEY)
        return json.loads(response["Body"].read().decode("utf-8"))
    except Exception:
        return {}


def load_notes() -> list[dict]:
    """Load notes from _notes.json in the R2 bucket."""
    try:
        s3 = get_r2_client()
        response = s3.get_object(Bucket=R2_BUCKET, Key=NOTES_KEY)
        return json.loads(response["Body"].read().decode("utf-8"))
    except Exception:
        return []


def save_notes(notes: list[dict]) -> bool:
    """Save notes to _notes.json in the R2 bucket. Returns True on success."""
    try:
        s3 = get_r2_client()
        s3.put_object(
            Bucket=R2_BUCKET,
            Key=NOTES_KEY,
            Body=json.dumps(notes, indent=2).encode("utf-8"),
            ContentType="application/json",
        )
        return True
    except Exception as e:
        print(f"[save_notes] Failed to write _notes.json to R2: {e}")
        return False


def save_likes(likes: dict[str, int]) -> bool:
    """Save likes to _likes.json in the R2 bucket. Returns True on success."""
    try:
        s3 = get_r2_client()
        s3.put_object(
            Bucket=R2_BUCKET,
            Key=LIKES_KEY,
            Body=json.dumps(likes, indent=2).encode("utf-8"),
            ContentType="application/json",
        )
        return True
    except Exception as e:
        print(f"[save_likes] Failed to write _likes.json to R2: {e}")
        return False


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/tracks")
def get_tracks():
    tracks = list_tracks_from_r2()
    likes = load_likes()
    result = [
        {
            "title": t["title"],
            "url": t["url"],
            "likes": likes.get(t["title"], 0),
        }
        for t in tracks
    ]
    # Sort by most liked (descending), then alphabetical by title
    result.sort(key=lambda t: (-t["likes"], t["title"]))
    return result


@app.post("/api/tracks/{title:path}/like")
def like_track(title: str):
    title = urllib.parse.unquote(title)
    tracks = list_tracks_from_r2()
    titles = [t["title"] for t in tracks]
    if title not in titles:
        raise HTTPException(status_code=404, detail="Track not found")
    likes = load_likes()
    likes[title] = likes.get(title, 0) + 1
    if not save_likes(likes):
        raise HTTPException(status_code=500, detail="Failed to persist like")
    return {"title": title, "likes": likes[title]}


@app.post("/api/tracks/{title:path}/unlike")
def unlike_track(title: str):
    title = urllib.parse.unquote(title)
    tracks = list_tracks_from_r2()
    titles = [t["title"] for t in tracks]
    if title not in titles:
        raise HTTPException(status_code=404, detail="Track not found")
    likes = load_likes()
    likes[title] = max(likes.get(title, 0) - 1, 0)
    if not save_likes(likes):
        raise HTTPException(status_code=500, detail="Failed to persist unlike")
    return {"title": title, "likes": likes[title]}


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
VIDEO_EXTENSIONS = {".mov", ".mp4", ".webm", ".m4v"}


@app.get("/api/media")
def list_media():
    """List all images and videos in the art/ folder of R2."""
    try:
        s3 = get_r2_client()
        result = []
        # List art/ prefix (images)
        response = s3.list_objects_v2(Bucket=R2_BUCKET, Prefix="art/")
        for obj in response.get("Contents", []):
            key = obj["Key"]
            if key == "art/" or key.endswith("/"):
                continue
            ext = os.path.splitext(key)[1].lower()
            if ext in IMAGE_EXTENSIONS:
                media_type = "image"
            elif ext in VIDEO_EXTENSIONS:
                media_type = "video"
            else:
                continue
            result.append({
                "src": f"{R2_BASE}/{urllib.parse.quote(key, safe='()/,')}",
                "type": media_type,
            })
        return result
    except Exception:
        return []


@app.get("/api/notes")
def get_notes():
    return load_notes()


@app.post("/api/notes")
def add_note(body: NoteBody):
    text = body.text.strip()
    if not text or len(text) > 140:
        raise HTTPException(
            status_code=400, detail="Note must be 1-140 characters"
        )
    notes = load_notes()
    name = body.name.strip()[:30] or "anonymous"
    new_note = {
        "text": text,
        "name": name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    notes.append(new_note)
    if not save_notes(notes):
        raise HTTPException(status_code=500, detail="Failed to persist note")
    return new_note


# ── Pet (shared Tamagotchi) ──────────────────────────────────────────


def load_pet() -> dict:
    """Read _pet.json from R2, return default if not found."""
    try:
        s3 = get_r2_client()
        response = s3.get_object(Bucket=R2_BUCKET, Key=PET_KEY)
        return json.loads(response["Body"].read().decode("utf-8"))
    except Exception:
        now = datetime.now(timezone.utc).isoformat()
        pet = {**DEFAULT_PET, "lastFed": now, "lastPlayed": now, "lastCleaned": now, "lastDecay": now, "born": now}
        save_pet(pet)
        return pet


def save_pet(pet: dict) -> bool:
    """Write _pet.json to R2."""
    try:
        s3 = get_r2_client()
        s3.put_object(
            Bucket=R2_BUCKET,
            Key=PET_KEY,
            Body=json.dumps(pet, indent=2).encode("utf-8"),
            ContentType="application/json",
        )
        return True
    except Exception as e:
        print(f"[save_pet] Failed to write _pet.json to R2: {e}")
        return False


def apply_decay(pet: dict) -> dict:
    """Apply time-based stat decay since lastDecay."""
    now = datetime.now(timezone.utc)
    last = datetime.fromisoformat(pet["lastDecay"])
    hours = (now - last).total_seconds() / 3600
    if hours >= 1:
        full_hours = int(hours)
        pet["hunger"] = min(100, pet["hunger"] + 5 * full_hours)
        pet["happiness"] = max(0, pet["happiness"] - 3 * full_hours)
        pet["cleanliness"] = max(0, pet["cleanliness"] - 2 * full_hours)
        pet["lastDecay"] = now.isoformat()
    return pet


def get_stage(total_interactions: int) -> str:
    if total_interactions < 50:
        return "egg"
    if total_interactions < 200:
        return "baby"
    if total_interactions < 1000:
        return "kid"
    if total_interactions < 5000:
        return "teen"
    return "adult"


def get_mood(pet: dict) -> str:
    mood_score = ((100 - pet["hunger"]) + pet["happiness"] + pet["cleanliness"]) / 3
    if mood_score > 70:
        return "happy"
    if mood_score > 40:
        return "neutral"
    return "sad"


@app.get("/api/pet")
def get_pet():
    pet = load_pet()
    pet = apply_decay(pet)
    pet["stage"] = get_stage(pet["totalInteractions"])
    pet["mood"] = get_mood(pet)
    if not save_pet(pet):
        raise HTTPException(status_code=500, detail="Failed to persist pet state")
    return pet


@app.post("/api/pet/feed")
def feed_pet():
    pet = load_pet()
    pet = apply_decay(pet)
    pet["hunger"] = max(0, pet["hunger"] - 20)
    pet["totalInteractions"] += 1
    pet["lastFed"] = datetime.now(timezone.utc).isoformat()
    pet["stage"] = get_stage(pet["totalInteractions"])
    pet["mood"] = get_mood(pet)
    if not save_pet(pet):
        raise HTTPException(status_code=500, detail="Failed to persist pet state")
    return pet


@app.post("/api/pet/play")
def play_pet():
    pet = load_pet()
    pet = apply_decay(pet)
    pet["happiness"] = min(100, pet["happiness"] + 15)
    pet["hunger"] = min(100, pet["hunger"] + 5)
    pet["totalInteractions"] += 1
    pet["lastPlayed"] = datetime.now(timezone.utc).isoformat()
    pet["stage"] = get_stage(pet["totalInteractions"])
    pet["mood"] = get_mood(pet)
    if not save_pet(pet):
        raise HTTPException(status_code=500, detail="Failed to persist pet state")
    return pet


@app.post("/api/pet/clean")
def clean_pet():
    pet = load_pet()
    pet = apply_decay(pet)
    pet["cleanliness"] = min(100, pet["cleanliness"] + 25)
    pet["totalInteractions"] += 1
    pet["lastCleaned"] = datetime.now(timezone.utc).isoformat()
    pet["stage"] = get_stage(pet["totalInteractions"])
    pet["mood"] = get_mood(pet)
    if not save_pet(pet):
        raise HTTPException(status_code=500, detail="Failed to persist pet state")
    return pet
