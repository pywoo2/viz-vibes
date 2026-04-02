import json
import os
import random
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
PET_TODOS_KEY = "_pet_todos.json"
COUNTER_KEY = "_counter.json"
COUNTER_LOG_KEY = "_counter_log.json"
BLOG_LIKES_KEY = "_blog_likes.json"
BLOG_COMMENTS_KEY = "_blog_comments.json"

DEFAULT_PET = {
    "name": "tamagotchi",
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


class TodoBody(BaseModel):
    text: str
    author: str = "anonymous"


class RenameBody(BaseModel):
    name: str


class PetInteractBody(BaseModel):
    feed: int = 0
    play: int = 0
    clean: int = 0


class TrackLikeDelta(BaseModel):
    delta: int


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


@app.post("/api/tracks/{title:path}/like/batch")
def batch_like_track(title: str, body: TrackLikeDelta):
    title = urllib.parse.unquote(title)
    if body.delta == 0:
        likes = load_likes()
        return {"title": title, "likes": likes.get(title, 0)}
    tracks = list_tracks_from_r2()
    titles = [t["title"] for t in tracks]
    if title not in titles:
        raise HTTPException(status_code=404, detail="Track not found")
    likes = load_likes()
    likes[title] = max(likes.get(title, 0) + body.delta, 0)
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
    """Apply time-based stat decay since lastDecay.
    Every 2-minute interval has a 50% chance of -1 to each stat.
    """
    now = datetime.now(timezone.utc)
    last = datetime.fromisoformat(pet["lastDecay"])
    intervals = int((now - last).total_seconds() / 120)  # 2-minute intervals
    if intervals >= 1:
        for _ in range(intervals):
            if random.random() < 0.5:
                pet["hunger"] = min(100, pet["hunger"] + 1)
            if random.random() < 0.5:
                pet["happiness"] = max(0, pet["happiness"] - 1)
            if random.random() < 0.5:
                pet["cleanliness"] = max(0, pet["cleanliness"] - 1)
        # Lose 1 progress per hour per stat at 0
        hours = intervals // 30  # 30 two-minute intervals per hour
        if hours >= 1:
            zero_stats = (1 if pet["happiness"] <= 0 else 0) + (1 if pet["cleanliness"] <= 0 else 0) + (1 if pet["hunger"] >= 100 else 0)
            pet["totalInteractions"] = max(0, pet["totalInteractions"] - zero_stats * hours)
        pet["lastDecay"] = now.isoformat()
    return pet


def get_stage(total_interactions: int) -> str:
    if total_interactions < 150:
        return "egg"
    if total_interactions < 600:
        return "baby"
    if total_interactions < 3000:
        return "kid"
    if total_interactions < 15000:
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
    pet["hunger"] = max(0, pet["hunger"] - 5)
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
    pet["happiness"] = min(100, pet["happiness"] + 5)
    pet["totalInteractions"] += 1
    pet["hunger"] = min(100, pet["hunger"] + 2)
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
    pet["cleanliness"] = min(100, pet["cleanliness"] + 5)
    pet["totalInteractions"] += 1
    pet["lastCleaned"] = datetime.now(timezone.utc).isoformat()
    pet["stage"] = get_stage(pet["totalInteractions"])
    pet["mood"] = get_mood(pet)
    if not save_pet(pet):
        raise HTTPException(status_code=500, detail="Failed to persist pet state")
    return pet


@app.post("/api/pet/interact")
def interact_pet(body: PetInteractBody):
    total = body.feed + body.play + body.clean
    if total == 0:
        return load_pet()
    pet = load_pet()
    pet = apply_decay(pet)
    now = datetime.now(timezone.utc).isoformat()
    if body.feed > 0:
        pet["hunger"] = max(0, pet["hunger"] - 5 * body.feed)
        pet["lastFed"] = now
    if body.play > 0:
        pet["happiness"] = min(100, pet["happiness"] + 5 * body.play)
        pet["hunger"] = min(100, pet["hunger"] + 2 * body.play)
        pet["lastPlayed"] = now
    if body.clean > 0:
        pet["cleanliness"] = min(100, pet["cleanliness"] + 5 * body.clean)
        pet["lastCleaned"] = now
    pet["totalInteractions"] += total
    pet["stage"] = get_stage(pet["totalInteractions"])
    pet["mood"] = get_mood(pet)
    if not save_pet(pet):
        raise HTTPException(status_code=500, detail="Failed to persist pet state")
    return pet


@app.post("/api/pet/rename")
def rename_pet(body: RenameBody):
    name = body.name.strip()[:20]
    if not name:
        raise HTTPException(status_code=400, detail="Name must be 1-20 characters")
    pet = load_pet()
    pet = apply_decay(pet)
    pet["name"] = name
    pet["stage"] = get_stage(pet["totalInteractions"])
    pet["mood"] = get_mood(pet)
    if not save_pet(pet):
        raise HTTPException(status_code=500, detail="Failed to persist pet state")
    return pet


# ── Pet community todo log ─────────────────────────────────────────


def load_pet_todos() -> list[dict]:
    """Read _pet_todos.json from R2."""
    try:
        s3 = get_r2_client()
        response = s3.get_object(Bucket=R2_BUCKET, Key=PET_TODOS_KEY)
        return json.loads(response["Body"].read().decode("utf-8"))
    except Exception:
        return []


def save_pet_todos(todos: list[dict]) -> bool:
    """Write _pet_todos.json to R2."""
    try:
        s3 = get_r2_client()
        s3.put_object(
            Bucket=R2_BUCKET,
            Key=PET_TODOS_KEY,
            Body=json.dumps(todos, indent=2).encode("utf-8"),
            ContentType="application/json",
        )
        return True
    except Exception as e:
        print(f"[save_pet_todos] Failed to write _pet_todos.json to R2: {e}")
        return False


@app.get("/api/pet/todos")
def get_pet_todos():
    todos = load_pet_todos()
    # oldest first
    todos.sort(key=lambda t: t.get("timestamp", ""))
    return todos[-20:]


@app.post("/api/pet/todos")
def add_pet_todo(body: TodoBody):
    text = body.text.strip()
    if not text or len(text) > 100:
        raise HTTPException(status_code=400, detail="Text must be 1-100 characters")
    author = body.author.strip()[:30] or "anonymous"
    todos = load_pet_todos()
    new_todo = {
        "text": text,
        "author": author,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    todos.append(new_todo)
    # Keep newest 20
    todos.sort(key=lambda t: t.get("timestamp", ""))
    todos = todos[-20:]
    if not save_pet_todos(todos):
        raise HTTPException(status_code=500, detail="Failed to persist todo")
    return new_todo


# ── Shared counter ────────────────────────────────────────────────


def load_counter() -> dict:
    try:
        s3 = get_r2_client()
        response = s3.get_object(Bucket=R2_BUCKET, Key=COUNTER_KEY)
        return json.loads(response["Body"].read().decode("utf-8"))
    except Exception:
        return {"value": 0}


def save_counter(counter: dict) -> bool:
    try:
        s3 = get_r2_client()
        s3.put_object(
            Bucket=R2_BUCKET,
            Key=COUNTER_KEY,
            Body=json.dumps(counter).encode("utf-8"),
            ContentType="application/json",
        )
        return True
    except Exception as e:
        print(f"[save_counter] Failed: {e}")
        return False


def load_counter_log() -> list[dict]:
    try:
        s3 = get_r2_client()
        response = s3.get_object(Bucket=R2_BUCKET, Key=COUNTER_LOG_KEY)
        return json.loads(response["Body"].read().decode("utf-8"))
    except Exception:
        return []


def save_counter_log(log: list[dict]) -> bool:
    try:
        s3 = get_r2_client()
        s3.put_object(
            Bucket=R2_BUCKET,
            Key=COUNTER_LOG_KEY,
            Body=json.dumps(log).encode("utf-8"),
            ContentType="application/json",
        )
        return True
    except Exception as e:
        print(f"[save_counter_log] Failed: {e}")
        return False


def append_counter_log(action: str):
    log = load_counter_log()
    log.append({"action": action, "timestamp": datetime.now(timezone.utc).isoformat()})
    log = log[-50:]
    save_counter_log(log)


@app.get("/api/counter")
def get_counter():
    return load_counter()


@app.get("/api/counter/log")
def get_counter_log():
    return load_counter_log()


@app.post("/api/counter/increment")
def increment_counter():
    counter = load_counter()
    counter["value"] += 1
    if not save_counter(counter):
        raise HTTPException(status_code=500, detail="Failed to persist counter")
    append_counter_log("+1")
    return counter


@app.post("/api/counter/decrement")
def decrement_counter():
    counter = load_counter()
    counter["value"] -= 1
    if not save_counter(counter):
        raise HTTPException(status_code=500, detail="Failed to persist counter")
    append_counter_log("−1")
    return counter


class CounterDelta(BaseModel):
    delta: int


@app.post("/api/counter/add")
def add_counter(body: CounterDelta):
    counter = load_counter()
    counter["value"] += body.delta
    if not save_counter(counter):
        raise HTTPException(status_code=500, detail="Failed to persist counter")
    if body.delta != 0:
        append_counter_log(f"{body.delta:+d}")
    return counter


@app.post("/api/counter/reset")
def reset_counter():
    counter = {"value": 0}
    if not save_counter(counter):
        raise HTTPException(status_code=500, detail="Failed to persist counter")
    append_counter_log("reset")
    return counter


# ── Blog likes & comments ────────────────────────────────────────────


class BlogCommentBody(BaseModel):
    text: str
    name: str = "anonymous"


def load_blog_likes() -> dict[str, int]:
    try:
        s3 = get_r2_client()
        response = s3.get_object(Bucket=R2_BUCKET, Key=BLOG_LIKES_KEY)
        return json.loads(response["Body"].read().decode("utf-8"))
    except Exception:
        return {}


def save_blog_likes(likes: dict[str, int]) -> bool:
    try:
        s3 = get_r2_client()
        s3.put_object(
            Bucket=R2_BUCKET,
            Key=BLOG_LIKES_KEY,
            Body=json.dumps(likes, indent=2).encode("utf-8"),
            ContentType="application/json",
        )
        return True
    except Exception as e:
        print(f"[save_blog_likes] Failed: {e}")
        return False


def load_blog_comments() -> dict[str, list[dict]]:
    try:
        s3 = get_r2_client()
        response = s3.get_object(Bucket=R2_BUCKET, Key=BLOG_COMMENTS_KEY)
        return json.loads(response["Body"].read().decode("utf-8"))
    except Exception:
        return {}


def save_blog_comments(comments: dict[str, list[dict]]) -> bool:
    try:
        s3 = get_r2_client()
        s3.put_object(
            Bucket=R2_BUCKET,
            Key=BLOG_COMMENTS_KEY,
            Body=json.dumps(comments, indent=2).encode("utf-8"),
            ContentType="application/json",
        )
        return True
    except Exception as e:
        print(f"[save_blog_comments] Failed: {e}")
        return False


@app.get("/api/blog/{slug}/likes")
def get_blog_likes(slug: str):
    likes = load_blog_likes()
    return {"slug": slug, "likes": likes.get(slug, 0)}


@app.post("/api/blog/{slug}/like")
def like_blog(slug: str):
    likes = load_blog_likes()
    likes[slug] = likes.get(slug, 0) + 1
    if not save_blog_likes(likes):
        raise HTTPException(status_code=500, detail="Failed to persist like")
    return {"slug": slug, "likes": likes[slug]}


@app.get("/api/blog/{slug}/comments")
def get_blog_comments(slug: str):
    comments = load_blog_comments()
    return comments.get(slug, [])


@app.post("/api/blog/{slug}/comments")
def add_blog_comment(slug: str, body: BlogCommentBody):
    text = body.text.strip()
    if not text or len(text) > 500:
        raise HTTPException(status_code=400, detail="Comment must be 1-500 characters")
    name = body.name.strip()[:30] or "anonymous"
    comments = load_blog_comments()
    if slug not in comments:
        comments[slug] = []
    new_comment = {
        "text": text,
        "name": name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    comments[slug].append(new_comment)
    if not save_blog_comments(comments):
        raise HTTPException(status_code=500, detail="Failed to persist comment")
    return new_comment
