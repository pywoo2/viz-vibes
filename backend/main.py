import json
import os
import urllib.parse

import boto3
from botocore.config import Config
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

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
    except s3.exceptions.NoSuchKey:
        return {}
    except Exception:
        return {}


def save_likes(likes: dict[str, int]) -> None:
    """Save likes to _likes.json in the R2 bucket."""
    s3 = get_r2_client()
    s3.put_object(
        Bucket=R2_BUCKET,
        Key=LIKES_KEY,
        Body=json.dumps(likes, indent=2).encode("utf-8"),
        ContentType="application/json",
    )


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


@app.post("/api/tracks/{title}/like")
def like_track(title: str):
    tracks = list_tracks_from_r2()
    titles = [t["title"] for t in tracks]
    if title not in titles:
        raise HTTPException(status_code=404, detail="Track not found")
    likes = load_likes()
    likes[title] = likes.get(title, 0) + 1
    save_likes(likes)
    return {"title": title, "likes": likes[title]}


@app.post("/api/tracks/{title}/unlike")
def unlike_track(title: str):
    tracks = list_tracks_from_r2()
    titles = [t["title"] for t in tracks]
    if title not in titles:
        raise HTTPException(status_code=404, detail="Track not found")
    likes = load_likes()
    likes[title] = max(likes.get(title, 0) - 1, 0)
    save_likes(likes)
    return {"title": title, "likes": likes[title]}
