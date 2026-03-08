import base64
import json
import math
import os
import random
import re
import sqlite3
import smtplib
import time
import uuid
from datetime import date, datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import parse_qs, urlparse

import bcrypt
import jwt
import requests
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

load_dotenv()

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = DATA_DIR / "app.db"


def env_float(name: str, default: float) -> float:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return float(raw)
    except Exception:
        return default


def env_int(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except Exception:
        return default


JWT_SECRET = os.getenv("JWT_SECRET", "replace_with_long_random_secret")
JWT_ALGO = "HS256"
JWT_EXPIRE_DAYS = 30
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPEN_PUBLISH_KEY = os.getenv("OPEN_PUBLISH_KEY", "demo_platform_key")
SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT_RAW = os.getenv("SMTP_PORT", "587").strip()
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASS = os.getenv("SMTP_PASS", "").strip()
SMTP_FROM = os.getenv("SMTP_FROM", "").strip()
SMTP_USE_TLS_RAW = os.getenv("SMTP_USE_TLS", "true").strip()
SMTP_USE_SSL_RAW = os.getenv("SMTP_USE_SSL", "false").strip()
AUTH_CODE_DEBUG_RAW = os.getenv("AUTH_CODE_DEBUG", "true").strip()
AUTH_CODE_SENDER_NAME = os.getenv("AUTH_CODE_SENDER_NAME", "TripWeaver").strip() or "TripWeaver"
PLACES_HTTP_TIMEOUT_SEC = max(1.5, min(12.0, env_float("PLACES_HTTP_TIMEOUT_SEC", 4.0)))
OPENAI_HTTP_TIMEOUT_SEC = max(1.5, min(12.0, env_float("OPENAI_HTTP_TIMEOUT_SEC", 4.0)))
DISCOVERY_BUDGET_SEC = max(2.0, min(20.0, env_float("DISCOVERY_BUDGET_SEC", 7.0)))
DISCOVERY_MAX_SEED_QUERIES = max(2, min(20, env_int("DISCOVERY_MAX_SEED_QUERIES", 6)))
PLACES_CACHE_TTL_SEC = max(30, min(3600, env_int("PLACES_CACHE_TTL_SEC", 300)))

EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
PHONE_RE = re.compile(r"^\+?[0-9][0-9\-\s]{5,18}$")

COLLECTION_FILES = {
    "messages": DATA_DIR / "messages.json",
    "travel_posts": DATA_DIR / "travel_posts.json",
    "campus_groups": DATA_DIR / "campus_groups.json",
    "friend_requests": DATA_DIR / "friend_requests.json",
    "friendships": DATA_DIR / "friendships.json",
    "direct_messages": DATA_DIR / "direct_messages.json",
    "interest_groups": DATA_DIR / "interest_groups.json",
    "local_events": DATA_DIR / "local_events.json",
    "inspirations": DATA_DIR / "inspirations.json",
    "official_posts": DATA_DIR / "official_posts.json",
    "collab_trips": DATA_DIR / "collab_trips.json",
    "activities": DATA_DIR / "activities.json",
    "events": DATA_DIR / "events.json",
    "mook_guides": DATA_DIR / "mook_guides.json",
}
USERS_JSON = DATA_DIR / "users.json"
PLACES_SEARCH_CACHE: Dict[str, Dict[str, Any]] = {}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def json_loads(value: Optional[str], default: Any) -> Any:
    if value is None:
        return default
    try:
        return json.loads(value)
    except Exception:
        return default


def to_int(value: Any, default: int) -> int:
    try:
        return int(value)
    except Exception:
        return default


def clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def parse_date(value: Any) -> Optional[date]:
    raw = str(value or "").strip()
    if not raw:
        return None
    try:
        if len(raw) == 10:
            return datetime.strptime(raw, "%Y-%m-%d").date()
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).date()
    except Exception:
        return None


def parse_datetime(value: Any) -> Optional[datetime]:
    raw = str(value or "").strip()
    if not raw:
        return None
    try:
        if len(raw) == 10:
            return datetime.strptime(raw, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def parse_hhmm(value: Any) -> Optional[Tuple[int, int]]:
    raw = normalize_text(value)
    if not raw:
        return None
    m = re.match(r"^(\d{1,2}):(\d{2})$", raw)
    if not m:
        return None
    hour = to_int(m.group(1), -1)
    minute = to_int(m.group(2), -1)
    if hour < 0 or hour > 23 or minute < 0 or minute > 59:
        return None
    return hour, minute


def ensure_iso_datetime(value: Any) -> Optional[str]:
    dt = parse_datetime(value)
    return dt.isoformat() if dt else None


def new_id(prefix: str) -> str:
    return f"{prefix}-{int(datetime.now().timestamp() * 1000)}-{random.randint(1000, 9999)}"


def normalize_text(value: Any) -> str:
    return str(value or "").strip()


def normalize_key(value: Any) -> str:
    return normalize_text(value).lower()


def normalize_email(value: Any) -> str:
    raw = normalize_text(value).lower()
    return raw if raw and EMAIL_RE.match(raw) else ""


def normalize_phone(value: Any) -> str:
    raw = normalize_text(value)
    if not raw:
        return ""
    compact = re.sub(r"[\s\-]", "", raw)
    return compact if PHONE_RE.match(raw) else ""


def normalize_pair(a: str, b: str) -> str:
    return "::".join(sorted([a, b]))


def parse_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    raw = normalize_key(value)
    if raw in {"1", "true", "yes", "y", "on", "是", "开启", "开"}:
        return True
    if raw in {"0", "false", "no", "n", "off", "否", "关闭", "关"}:
        return False
    return default


def normalize_privacy(value: Any, default: str = "私密") -> str:
    raw = normalize_key(value)
    if raw in {"公开", "public", "open", "global"}:
        return "公开"
    if raw in {"私密", "private", "secret"}:
        return "私密"
    if raw in {"好友可见", "friends", "friends_only"}:
        return "好友可见"
    return default


SMTP_PORT = clamp(to_int(SMTP_PORT_RAW, 587), 1, 65535)
SMTP_USE_TLS = parse_bool(SMTP_USE_TLS_RAW, True)
SMTP_USE_SSL = parse_bool(SMTP_USE_SSL_RAW, False)
AUTH_CODE_DEBUG = parse_bool(AUTH_CODE_DEBUG_RAW, True)


def init_db() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              username TEXT UNIQUE NOT NULL,
              display_name TEXT NOT NULL,
              password_hash TEXT NOT NULL,
              email TEXT,
              phone TEXT,
              oauth_accounts_json TEXT NOT NULL,
              campus_verified INTEGER NOT NULL DEFAULT 0,
              campus_name TEXT NOT NULL DEFAULT '',
              campus_email TEXT NOT NULL DEFAULT '',
              student_id TEXT NOT NULL DEFAULT '',
              preference_memory_json TEXT NOT NULL DEFAULT '{}',
              created_at TEXT NOT NULL
            )
            """
        )
        conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone)")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS auth_codes (
              id TEXT PRIMARY KEY,
              identifier TEXT NOT NULL,
              kind TEXT NOT NULL,
              code TEXT NOT NULL,
              created_at TEXT NOT NULL,
              expires_at TEXT NOT NULL,
              used_at TEXT NOT NULL DEFAULT ''
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS documents (
              collection TEXT NOT NULL,
              id TEXT NOT NULL,
              owner_id TEXT NOT NULL DEFAULT '',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              data_json TEXT NOT NULL,
              PRIMARY KEY (collection, id)
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_documents_collection_created ON documents(collection, created_at DESC)")


def read_json_file(path: Path) -> Any:
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return []


def users_count() -> int:
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("SELECT COUNT(*) FROM users").fetchone()
        return int(row[0] if row else 0)


def docs_count(collection: str) -> int:
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("SELECT COUNT(*) FROM documents WHERE collection=?", (collection,)).fetchone()
        return int(row[0] if row else 0)


def row_to_user(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "username": row["username"],
        "displayName": row["display_name"],
        "passwordHash": row["password_hash"],
        "email": row["email"] or "",
        "phone": row["phone"] or "",
        "oauthAccounts": json_loads(row["oauth_accounts_json"], {}),
        "campusVerified": bool(row["campus_verified"]),
        "campusName": row["campus_name"] or "",
        "campusEmail": row["campus_email"] or "",
        "studentId": row["student_id"] or "",
        "preferenceMemory": json_loads(row["preference_memory_json"], {}),
        "createdAt": row["created_at"],
    }


def to_public_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": user["id"],
        "username": user["username"],
        "displayName": user.get("displayName") or user.get("display_name") or "User",
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
        "campusVerified": bool(user.get("campusVerified")),
        "campusName": user.get("campusName", ""),
        "campusEmail": user.get("campusEmail", ""),
        "createdAt": user.get("createdAt") or now_iso(),
    }


def insert_user(user: Dict[str, Any]) -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO users(
              id, username, display_name, password_hash, email, phone,
              oauth_accounts_json, campus_verified, campus_name, campus_email,
              student_id, preference_memory_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                user["username"],
                user["displayName"],
                user.get("passwordHash", ""),
                user.get("email", "") or None,
                user.get("phone", "") or None,
                json_dumps(user.get("oauthAccounts", {})),
                1 if user.get("campusVerified") else 0,
                user.get("campusName", ""),
                user.get("campusEmail", ""),
                user.get("studentId", ""),
                json_dumps(user.get("preferenceMemory", {})),
                user.get("createdAt") or now_iso(),
            ),
        )


def update_user(user: Dict[str, Any]) -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            UPDATE users SET
              display_name=?, password_hash=?, email=?, phone=?, oauth_accounts_json=?,
              campus_verified=?, campus_name=?, campus_email=?, student_id=?, preference_memory_json=?
            WHERE id=?
            """,
            (
                user.get("displayName", "User"),
                user.get("passwordHash", ""),
                user.get("email", "") or None,
                user.get("phone", "") or None,
                json_dumps(user.get("oauthAccounts", {})),
                1 if user.get("campusVerified") else 0,
                user.get("campusName", ""),
                user.get("campusEmail", ""),
                user.get("studentId", ""),
                json_dumps(user.get("preferenceMemory", {})),
                user["id"],
            ),
        )


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    return row_to_user(row) if row else None


def find_user_by_identifier(identifier: str) -> Optional[Dict[str, Any]]:
    value = normalize_text(identifier)
    if not value:
        return None
    normalized_username = value.lower()
    normalized_email = normalize_email(value)
    normalized_phone = normalize_phone(value)
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            """
            SELECT * FROM users
            WHERE username=? OR email=? OR campus_email=? OR phone=?
            LIMIT 1
            """,
            (normalized_username, normalized_email or "", normalized_email or "", normalized_phone or ""),
        ).fetchone()
    return row_to_user(row) if row else None


def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM users WHERE username=? LIMIT 1", (normalize_text(username).lower(),)).fetchone()
    return row_to_user(row) if row else None


def list_users() -> List[Dict[str, Any]]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM users").fetchall()
    return [row_to_user(row) for row in rows]


def upsert_doc(collection: str, doc: Dict[str, Any], owner_id: str = "") -> Dict[str, Any]:
    data = dict(doc or {})
    if not data.get("id"):
        data["id"] = new_id("DOC")
    created_at = data.get("createdAt") or now_iso()
    updated_at = now_iso()
    data["createdAt"] = created_at
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO documents(collection, id, owner_id, created_at, updated_at, data_json)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(collection, id) DO UPDATE SET
              owner_id=excluded.owner_id,
              updated_at=excluded.updated_at,
              data_json=excluded.data_json
            """,
            (collection, data["id"], owner_id, created_at, updated_at, json_dumps(data)),
        )
    return data


def get_doc(collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT data_json FROM documents WHERE collection=? AND id=? LIMIT 1", (collection, doc_id)
        ).fetchone()
    if not row:
        return None
    return json_loads(row[0], {})


def list_docs(collection: str, limit: int = 200, desc: bool = True) -> List[Dict[str, Any]]:
    order = "DESC" if desc else "ASC"
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute(
            f"SELECT data_json FROM documents WHERE collection=? ORDER BY created_at {order} LIMIT ?",
            (collection, limit),
        ).fetchall()
    return [json_loads(row[0], {}) for row in rows]


def replace_doc(collection: str, doc_id: str, data: Dict[str, Any], owner_id: str = "") -> Dict[str, Any]:
    doc = dict(data)
    doc["id"] = doc_id
    return upsert_doc(collection, doc, owner_id=owner_id)


def delete_doc(collection: str, doc_id: str) -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM documents WHERE collection=? AND id=?", (collection, doc_id))


def migrate_json_to_db() -> None:
    if users_count() == 0 and USERS_JSON.exists():
        users = read_json_file(USERS_JSON)
        if isinstance(users, list):
            for raw in users:
                username = normalize_text(raw.get("username")).lower()
                if not username:
                    continue
                user = {
                    "id": raw.get("id") or new_id("USR"),
                    "username": username,
                    "displayName": normalize_text(raw.get("displayName") or raw.get("display_name") or username),
                    "passwordHash": raw.get("passwordHash") or raw.get("password_hash") or "",
                    "email": normalize_email(raw.get("email")),
                    "phone": normalize_phone(raw.get("phone")),
                    "oauthAccounts": raw.get("oauthAccounts") if isinstance(raw.get("oauthAccounts"), dict) else {},
                    "campusVerified": bool(raw.get("campusVerified")),
                    "campusName": normalize_text(raw.get("campusName")),
                    "campusEmail": normalize_email(raw.get("campusEmail")),
                    "studentId": normalize_text(raw.get("studentId")),
                    "preferenceMemory": raw.get("preferenceMemory") if isinstance(raw.get("preferenceMemory"), dict) else {},
                    "createdAt": raw.get("createdAt") or now_iso(),
                }
                try:
                    insert_user(user)
                except Exception:
                    continue

    for collection, path in COLLECTION_FILES.items():
        if docs_count(collection) > 0:
            continue
        data = read_json_file(path)
        if not isinstance(data, list):
            continue
        for raw in data:
            if not isinstance(raw, dict):
                continue
            if not raw.get("id"):
                raw["id"] = new_id(collection[:3].upper())
            if not raw.get("createdAt"):
                raw["createdAt"] = raw.get("at") or now_iso()
            upsert_doc(collection, raw)


# -----------------------------
# Auth helpers
# -----------------------------


def smtp_enabled() -> bool:
    return bool(SMTP_HOST and SMTP_FROM)


def send_auth_code_email(to_email: str, code: str, expires_minutes: int = 10) -> None:
    msg = EmailMessage()
    msg["Subject"] = f"{AUTH_CODE_SENDER_NAME} 邮箱验证码"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.set_content(
        "\n".join(
            [
                f"你的验证码是：{code}",
                f"{expires_minutes} 分钟内有效，请勿泄露给他人。",
                "",
                f"{AUTH_CODE_SENDER_NAME}",
            ]
        )
    )

    if SMTP_USE_SSL:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=12) as server:
            if SMTP_USER and SMTP_PASS:
                server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        return

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12) as server:
        if SMTP_USE_TLS:
            server.starttls()
        if SMTP_USER and SMTP_PASS:
            server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)


def create_token(user: Dict[str, Any]) -> str:
    payload = {
        "sub": user["id"],
        "username": user["username"],
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])


def get_auth_token(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return ""
    return auth.split(" ", 1)[1].strip()


def auth_user(request: Request) -> Dict[str, Any]:
    token = get_auth_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub")
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def optional_auth_user(request: Request) -> Optional[Dict[str, Any]]:
    token = get_auth_token(request)
    if not token:
        return None
    try:
        payload = decode_token(token)
    except Exception:
        return None
    return get_user_by_id(payload.get("sub"))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_password(password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def make_unique_username(base: str) -> str:
    seed = re.sub(r"[^a-zA-Z0-9_]+", "_", normalize_text(base).lower()).strip("_") or "user"
    users = {u["username"] for u in list_users()}
    if seed not in users:
        return seed
    for i in range(1, 10000):
        candidate = f"{seed}{i}"
        if candidate not in users:
            return candidate
    return f"{seed}_{uuid.uuid4().hex[:8]}"


# -----------------------------
# Preference memory
# -----------------------------


def ensure_preference_memory(user: Dict[str, Any]) -> Dict[str, Any]:
    memory = user.get("preferenceMemory")
    if not isinstance(memory, dict):
        memory = {}
    memory.setdefault("interactions", 0)
    memory.setdefault("updatedAt", None)
    memory.setdefault("recent", [])
    memory.setdefault("places", {})
    memory.setdefault("cities", {})
    memory.setdefault("categories", {})
    memory.setdefault("interests", {})
    memory.setdefault("manualPlaces", [])
    user["preferenceMemory"] = memory
    return memory


def get_pref_action_weight(action_type: str) -> float:
    key = normalize_key(action_type)
    if key in {"discover_tonight", "launch_group"}:
        return 5.0
    if key in {"discover_select", "route_join"}:
        return 4.0
    if key == "discover_buddy":
        return 3.0
    if key == "plan_view":
        return 2.0
    return 1.0


def update_score_bucket(bucket: Dict[str, float], key: str, value: float) -> None:
    k = normalize_key(key)
    if not k:
        return
    bucket[k] = round(float(bucket.get(k, 0.0)) + float(value), 3)


def track_preference_memory(memory: Dict[str, Any], action_type: str, places: List[Dict[str, Any]]) -> int:
    base_weight = get_pref_action_weight(action_type)
    now = now_iso()
    touched = 0
    for raw in (places or [])[:12]:
        name = normalize_text(raw.get("name") or raw.get("point"))
        if not name:
            continue
        city = normalize_text(raw.get("city"))
        country = normalize_text(raw.get("country"))
        category = normalize_text(raw.get("category") or raw.get("primaryType"))
        interest = normalize_text(raw.get("interest"))
        try:
            weight = float(raw.get("weight", 1.0))
        except Exception:
            weight = 1.0
        weight = max(0.2, min(8.0, weight))
        delta = base_weight * weight

        place_key = f"{normalize_key(name)}|{normalize_key(city)}|{normalize_key(country)}"
        existing = memory["places"].get(place_key, {})
        existing["name"] = existing.get("name") or name
        existing["city"] = existing.get("city") or city
        existing["country"] = existing.get("country") or country
        existing["category"] = existing.get("category") or category
        existing["count"] = int(existing.get("count", 0)) + 1
        existing["score"] = round(float(existing.get("score", 0.0)) + delta, 3)
        existing["lastAt"] = now
        memory["places"][place_key] = existing

        if city or country:
            city_key = f"{normalize_key(city)}|{normalize_key(country)}"
            update_score_bucket(memory["cities"], city_key, delta)
        if category:
            update_score_bucket(memory["categories"], category, delta)
        if interest:
            update_score_bucket(memory["interests"], interest, delta)

        memory["recent"].append(
            {
                "actionType": action_type,
                "name": name,
                "city": city,
                "country": country,
                "category": category,
                "interest": interest,
                "at": now,
            }
        )
        touched += 1

    memory["recent"] = (memory.get("recent") or [])[-160:]
    if touched > 0:
        memory["interactions"] = int(memory.get("interactions") or 0) + touched
        memory["updatedAt"] = now
    return touched


def parse_float(value: Any) -> Optional[float]:
    try:
        return float(value)
    except Exception:
        return None


def manual_place_dedup_key(item: Dict[str, Any]) -> str:
    place_id = normalize_text(item.get("placeId"))
    if place_id:
        return f"pid:{normalize_key(place_id)}"
    lat = parse_float(item.get("lat"))
    lng = parse_float(item.get("lng"))
    if lat is not None and lng is not None:
        return f"geo:{lat:.5f}|{lng:.5f}"
    return f"name:{normalize_key(item.get('name'))}|{normalize_key(item.get('city'))}|{normalize_key(item.get('country'))}"


def upsert_manual_place(memory: Dict[str, Any], raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not isinstance(raw, dict):
        return None
    name = normalize_text(raw.get("name") or raw.get("point") or raw.get("matchedName"))
    if not name:
        return None
    lat = parse_float(raw.get("lat"))
    lng = parse_float(raw.get("lng"))
    now = now_iso()
    source = normalize_text(raw.get("source") or "manual_input")

    item = {
        "name": name,
        "placeId": normalize_text(raw.get("placeId")),
        "lat": lat,
        "lng": lng,
        "city": normalize_text(raw.get("city")),
        "country": normalize_text(raw.get("country")),
        "address": normalize_text(raw.get("address")),
        "source": source,
        "lastAt": now,
        "count": 1,
        "score": 1.0,
    }
    key = manual_place_dedup_key(item)

    bucket = memory.get("manualPlaces")
    if not isinstance(bucket, list):
        bucket = []

    replaced = False
    for idx, existing in enumerate(bucket):
        if not isinstance(existing, dict):
            continue
        if manual_place_dedup_key(existing) != key:
            continue
        merged = dict(existing)
        merged["name"] = merged.get("name") or item["name"]
        merged["placeId"] = merged.get("placeId") or item["placeId"]
        merged["lat"] = merged.get("lat") if merged.get("lat") is not None else item["lat"]
        merged["lng"] = merged.get("lng") if merged.get("lng") is not None else item["lng"]
        merged["city"] = merged.get("city") or item["city"]
        merged["country"] = merged.get("country") or item["country"]
        merged["address"] = merged.get("address") or item["address"]
        merged["source"] = item["source"] or merged.get("source") or "manual_input"
        merged["count"] = int(merged.get("count") or 0) + 1
        merged["score"] = round(float(merged.get("score") or 0.0) + 1.0, 3)
        merged["lastAt"] = now
        bucket[idx] = merged
        item = merged
        replaced = True
        break

    if not replaced:
        bucket.append(item)

    bucket = [x for x in bucket if isinstance(x, dict)]
    bucket.sort(
        key=lambda x: (
            float(x.get("score") or 0.0),
            int(x.get("count") or 0),
            normalize_text(x.get("lastAt")),
        ),
        reverse=True,
    )
    memory["manualPlaces"] = bucket[:200]
    memory["updatedAt"] = now
    return item


def suggest_manual_places(memory: Dict[str, Any], q: str, city: str, country: str, limit: int) -> List[Dict[str, Any]]:
    bucket = memory.get("manualPlaces")
    if not isinstance(bucket, list):
        return []
    q_key = normalize_key(q)
    city_key = normalize_key(city)
    country_key = normalize_key(country)
    scored: List[Tuple[float, Dict[str, Any]]] = []

    for raw in bucket:
        if not isinstance(raw, dict):
            continue
        name = normalize_text(raw.get("name"))
        if not name:
            continue
        hay = " ".join(
            [
                name,
                normalize_text(raw.get("address")),
                normalize_text(raw.get("city")),
                normalize_text(raw.get("country")),
            ]
        )
        hay_key = normalize_key(hay)
        if q_key and q_key not in hay_key:
            continue

        score = float(raw.get("score") or 0.0) + float(raw.get("count") or 0.0) * 0.2
        if city_key and city_key == normalize_key(raw.get("city")):
            score += 3.0
        if country_key and country_key == normalize_key(raw.get("country")):
            score += 2.0
        if q_key and q_key and normalize_key(name).startswith(q_key):
            score += 1.5
        scored.append((score, raw))

    scored.sort(key=lambda x: x[0], reverse=True)
    out: List[Dict[str, Any]] = []
    for score, raw in scored[: clamp(limit, 1, 30)]:
        item = dict(raw)
        item["score"] = round(score, 3)
        out.append(item)
    return out


# -----------------------------
# Places + route generation
# -----------------------------


def normalize_country_to_region(country: str) -> str:
    c = normalize_key(country)
    mapping = {
        "singapore": "sg",
        "japan": "jp",
        "china": "cn",
        "korea": "kr",
        "south korea": "kr",
        "thailand": "th",
        "malaysia": "my",
        "indonesia": "id",
        "vietnam": "vn",
        "usa": "us",
        "united states": "us",
    }
    return mapping.get(c, "")


def parse_tags(value: Any, limit: int = 12) -> List[str]:
    if isinstance(value, list):
        return [normalize_text(v) for v in value if normalize_text(v)][:limit]
    return [p.strip() for p in str(value or "").split(",") if p.strip()][:limit]


def parse_text_list(value: Any, limit: int = 12) -> List[str]:
    if isinstance(value, list):
        items = []
        for v in value:
            if isinstance(v, dict):
                items.append(normalize_text(v.get("url") or v.get("link") or v.get("value")))
            else:
                items.append(normalize_text(v))
    else:
        raw = str(value or "")
        items = [normalize_text(v) for v in re.split(r"[\n,\uFF0C;；]+", raw)]
    out: List[str] = []
    seen: set = set()
    for item in items:
        if not item:
            continue
        key = normalize_key(item)
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
        if len(out) >= limit:
            break
    return out


def normalize_public_url(value: Any) -> str:
    text = normalize_text(value)
    if not text:
        return ""
    if len(text) > 1000:
        return ""
    try:
        parsed = urlparse(text)
    except Exception:
        return ""
    if parsed.scheme.lower() not in {"http", "https"}:
        return ""
    if not normalize_text(parsed.netloc):
        return ""
    return text


def parse_photo_urls(value: Any, limit: int = 9) -> List[str]:
    urls = parse_text_list(value, limit=max(3, limit * 2))
    out: List[str] = []
    seen: set = set()
    for item in urls:
        clean = normalize_public_url(item)
        if not clean:
            continue
        key = normalize_key(clean)
        if key in seen:
            continue
        seen.add(key)
        out.append(clean)
        if len(out) >= limit:
            break
    return out


def normalize_video_link(value: Any) -> Optional[Dict[str, str]]:
    clean = normalize_public_url(value)
    if not clean:
        return None
    parsed = urlparse(clean)
    host = normalize_key(parsed.netloc)
    path = parsed.path or ""
    query = parse_qs(parsed.query or "")

    if "youtu.be" in host:
        video_id = path.strip("/").split("/")[0] if path.strip("/") else ""
        if video_id:
            return {"url": f"https://www.youtube.com/watch?v={video_id}", "platform": "youtube"}
        return None

    if "youtube.com" in host:
        video_id = ""
        if path.startswith("/watch"):
            vals = query.get("v") or []
            video_id = normalize_text(vals[0]) if vals else ""
        elif path.startswith("/shorts/"):
            video_id = normalize_text(path.split("/shorts/")[-1].split("/")[0])
        elif path.startswith("/embed/"):
            video_id = normalize_text(path.split("/embed/")[-1].split("/")[0])
        if video_id:
            return {"url": f"https://www.youtube.com/watch?v={video_id}", "platform": "youtube"}
        return None

    if "bilibili.com" in host:
        # e.g. /video/BVxxxx 或 /video/avxxxx
        segs = [normalize_text(x) for x in path.split("/") if normalize_text(x)]
        if "video" in segs:
            idx = segs.index("video")
            vid = segs[idx + 1] if idx + 1 < len(segs) else ""
            if vid:
                return {"url": f"https://www.bilibili.com/video/{vid}", "platform": "bilibili"}
        return None

    if "b23.tv" in host:
        token = normalize_text(path.strip("/").split("/")[0])
        if token:
            return {"url": f"https://b23.tv/{token}", "platform": "bilibili"}
        return None

    return None


def parse_video_links(value: Any, limit: int = 4) -> List[Dict[str, str]]:
    raw_items = parse_text_list(value, limit=max(3, limit * 3))
    out: List[Dict[str, str]] = []
    seen: set = set()
    for raw in raw_items:
        normalized = normalize_video_link(raw)
        if not normalized:
            continue
        key = normalize_key(normalized.get("url"))
        if key in seen:
            continue
        seen.add(key)
        out.append(normalized)
        if len(out) >= limit:
            break
    return out


def parse_geo(value: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(value, dict):
        return None
    try:
        lat = float(value.get("lat"))
        lng = float(value.get("lng"))
    except Exception:
        return None
    return {"lat": lat, "lng": lng, "label": normalize_text(value.get("label"))}


def map_price_level(value: Any) -> str:
    try:
        n = int(value)
    except Exception:
        return "UNKNOWN"
    if n <= 0:
        return "FREE"
    if n == 1:
        return "INEXPENSIVE"
    if n == 2:
        return "MODERATE"
    if n == 3:
        return "EXPENSIVE"
    return "VERY_EXPENSIVE"


def allure_from_rating(rating: Any, count: Any) -> Dict[str, Any]:
    try:
        r = float(rating)
    except Exception:
        r = 0.0
    try:
        c = int(count)
    except Exception:
        c = 0
    score = int(round((r * 14.0) + min(30.0, math.log10(max(c, 1)) * 12.0))) if r > 0 else 58
    score = max(48, min(98, score))
    if score >= 86:
        level = "高热度"
    elif score >= 75:
        level = "推荐"
    else:
        level = "可尝试"
    return {"score": score, "level": level}


def type_is_ticket_required(types: List[str]) -> bool:
    ticket_types = {
        "museum",
        "tourist_attraction",
        "amusement_park",
        "aquarium",
        "art_gallery",
        "zoo",
        "movie_theater",
        "historical_landmark",
    }
    for t in types:
        if normalize_key(t) in ticket_types:
            return True
    return False


def make_klook_url(name: str, city: str, country: str) -> str:
    q = requests.utils.quote(f"{name} {city} {country}".strip())
    return f"https://www.klook.com/zh-CN/search/result/?query={q}"


def make_kkday_url(name: str, city: str, country: str) -> str:
    q = requests.utils.quote(f"{name} {city} {country}".strip())
    return f"https://www.kkday.com/zh-sg/product/search?keyword={q}"


def make_google_search_url(query: str) -> str:
    q = requests.utils.quote(normalize_text(query))
    return f"https://www.google.com/maps/search/?api=1&query={q}"


def make_photo_url(photo_ref: str) -> str:
    if not GOOGLE_MAPS_API_KEY or not photo_ref:
        return ""
    q = requests.utils.quote(photo_ref)
    return f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference={q}&key={GOOGLE_MAPS_API_KEY}"


def budget_alignment_score(price_level: str, budget: str) -> float:
    level = normalize_key(price_level)
    b = normalize_key(budget)
    if not level or not b:
        return 0.0
    if level in {"unknown"}:
        return 0.0
    if "低" in b or "budget" in b or "cheap" in b:
        if level in {"free", "inexpensive"}:
            return 8.0
        if level == "moderate":
            return 3.0
        return -5.0
    if "高" in b or "luxury" in b:
        if level in {"expensive", "very_expensive"}:
            return 7.0
        if level == "moderate":
            return 3.0
        return -2.0
    # medium budget
    if level == "moderate":
        return 8.0
    if level in {"inexpensive", "expensive"}:
        return 3.0
    return 0.0


def place_heat_bonus(rating: Any, review_count: Any) -> float:
    r = parse_float(rating) or 0.0
    c = to_int(review_count, 0)
    score = 0.0
    if r >= 4.7:
        score += 16.0
    elif r >= 4.5:
        score += 12.0
    elif r >= 4.3:
        score += 8.0
    elif r >= 4.0:
        score += 4.0
    if c >= 8000:
        score += 14.0
    elif c >= 3000:
        score += 10.0
    elif c >= 1000:
        score += 7.0
    elif c >= 300:
        score += 4.0
    return score


def interest_match_bonus(primary_type: str, interest: str) -> float:
    p = normalize_key(primary_type)
    i = normalize_key(interest)
    if not p or not i:
        return 0.0
    if p in i:
        return 10.0
    mapping = {
        "restaurant": ["美食", "聚餐", "dinner", "food"],
        "cafe": ["咖啡", "cafe", "下午茶", "chill"],
        "museum": ["看展", "逛展", "museum", "art"],
        "tourist_attraction": ["city walk", "地标", "打卡", "观光"],
        "park": ["野餐", "散步", "露营", "picnic"],
        "bar": ["夜生活", "nightlife", "微醺"],
        "shopping_mall": ["购物", "shopping"],
        "campground": ["露营", "camp"],
    }
    for typ, keys in mapping.items():
        if typ in p and any(k in i for k in [normalize_key(x) for x in keys]):
            return 8.0
    return 0.0


def time_slot_bonus(open_now: Any, time_slot: str) -> float:
    t = normalize_key(time_slot)
    if not t:
        return 0.0
    is_open = bool(open_now) if open_now is not None else None
    if ("今晚" in t or "晚上" in t or "night" in t) and is_open is True:
        return 6.0
    if ("今晚" in t or "晚上" in t or "night" in t) and is_open is False:
        return -6.0
    if ("周末" in t or "全天" in t) and is_open is True:
        return 2.0
    return 0.0


def compute_tripwow_score(payload: Dict[str, Any], interest: str, budget: str, time_slot: str) -> float:
    base = float((payload.get("allure") or {}).get("score") or 58)
    rating = payload.get("rating")
    reviews = payload.get("userRatingCount")
    primary_type = normalize_text(payload.get("primaryType"))
    price_level = normalize_text(payload.get("priceLevel"))
    open_now = payload.get("openNow")
    ticket_required = bool(((payload.get("ticketing") or {}).get("required")))

    score = base
    score += place_heat_bonus(rating, reviews)
    score += interest_match_bonus(primary_type, interest)
    score += budget_alignment_score(price_level, budget)
    score += time_slot_bonus(open_now, time_slot)
    if ticket_required:
        score += 1.2
    return round(score, 3)


def search_signal_line(place: Dict[str, Any], query_hint: str = "") -> str:
    rating = parse_float(place.get("rating"))
    reviews = to_int(place.get("userRatingCount"), 0)
    parts: List[str] = []
    if rating and rating > 0:
        parts.append(f"{rating:.1f}分")
    if reviews > 0:
        parts.append(f"{reviews}条评价")
    if normalize_text(place.get("openNow")) in {"True", "False"}:
        parts.append("营业中" if bool(place.get("openNow")) else "暂未营业")
    if query_hint:
        parts.append(f"匹配词：{query_hint}")
    return " · ".join(parts)


def polish_place_copy(place: Dict[str, Any], interest: str, query_hint: str = "") -> None:
    name = normalize_text(place.get("point"))
    city = normalize_text(place.get("city"))
    country = normalize_text(place.get("country"))
    primary_type = normalize_text(place.get("primaryType"))
    signal = search_signal_line(place, query_hint=query_hint)

    mood_map = {
        "restaurant": "氛围和出片都稳，适合今晚直接开吃",
        "cafe": "坐得住、聊得开，节奏轻松不赶",
        "museum": "内容密度高，适合边逛边聊有记忆点",
        "tourist_attraction": "打卡辨识度高，带朋友来不会踩空",
        "park": "适合放空和社交，体感舒服",
        "bar": "夜晚氛围在线，收尾体验更完整",
        "shopping_mall": "吃逛一体，容错率高",
        "campground": "自然场景加成，体验感明显",
    }
    mood = mood_map.get(normalize_key(primary_type), "现场体验稳定，适合作为路线重点站")
    interest_short = normalize_text(interest) or "本次主题"

    place["intro"] = f"{name}（{city}, {country}）：围绕“{interest_short}”筛出的高匹配地点，{mood}。"
    if signal:
        place["recommendReason"] = f"搜索信号：{signal}"
    elif not normalize_text(place.get("recommendReason")):
        place["recommendReason"] = "搜索信号：基于热度与口碑重排推荐"


def build_route_narrative(route: List[Dict[str, Any]], city: str, country: str, interest: str, companion: str, budget: str) -> Dict[str, Any]:
    top_names = [normalize_text(x.get("point")) for x in route[:3] if normalize_text(x.get("point"))]
    hook = f"这条路线不是“到此一游”，而是把 {interest} 做成一晚就能成局的高质量体验。"
    vibe = f"为 {companion} 设计，优先考虑真实口碑、可执行动线和预算（{budget}）。"
    insights = [
        f"搜索策略：{interest} + best + local favorites + {city} {country}",
        "重排逻辑：评分/评价量/时段可用性/预算匹配/兴趣匹配",
        f"强记忆点：{'、'.join(top_names) if top_names else '核心地标 + 高口碑门店'}",
    ]
    return {
        "hook": hook,
        "vibe": vibe,
        "searchInsights": insights,
        "llmEnhanced": False,
    }


def maybe_llm_polish_plan(
    route: List[Dict[str, Any]],
    city: str,
    country: str,
    interest: str,
    companion: str,
    budget: str,
    time_slot: str,
) -> Optional[Dict[str, Any]]:
    if not OPENAI_API_KEY or not route:
        return None
    compact_route = []
    for r in route[:10]:
        compact_route.append(
            {
                "point": normalize_text(r.get("point")),
                "primaryType": normalize_text(r.get("primaryType")),
                "rating": r.get("rating"),
                "userRatingCount": r.get("userRatingCount"),
                "date": normalize_text(r.get("date")),
                "time": normalize_text(r.get("time")),
            }
        )
    system_prompt = (
        "你是旅游产品的资深路线策展人。请把真实地点路线写得更有期待感，"
        "但不能虚构地点与事实。输出必须是严格 JSON。"
    )
    user_prompt = json_dumps(
        {
            "task": "润色路线推荐文案，提升兴奋感和成行欲望，保持真实可信。",
            "context": {
                "city": city,
                "country": country,
                "interest": interest,
                "companion": companion,
                "budget": budget,
                "timeSlot": time_slot,
            },
            "route": compact_route,
            "outputSchema": {
                "hook": "string",
                "overallReason": "string",
                "searchInsights": ["string"],
                "stops": [
                    {
                        "point": "string",
                        "intro": "string",
                        "recommendReason": "string",
                    }
                ],
            },
        }
    )
    try:
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": OPENAI_MODEL,
                "temperature": 0.7,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            },
            timeout=OPENAI_HTTP_TIMEOUT_SEC,
        )
        data = resp.json()
        content = (((data.get("choices") or [{}])[0].get("message") or {}).get("content") or "").strip()
        if not content:
            return None
        parsed = json.loads(content)
        if not isinstance(parsed, dict):
            return None
        return parsed
    except Exception:
        return None


def known_city_country_pairs() -> List[Tuple[str, str]]:
    pairs: List[Tuple[str, str]] = []
    guides = list_docs("mook_guides", limit=300)
    for g in guides:
        city = normalize_text(g.get("city"))
        country = normalize_text(g.get("country"))
        if city and country:
            pairs.append((city, country))
    base = [
        ("Singapore", "Singapore"),
        ("Tokyo", "Japan"),
        ("Osaka", "Japan"),
        ("Kyoto", "Japan"),
        ("Sapporo", "Japan"),
        ("Bangkok", "Thailand"),
        ("Seoul", "South Korea"),
        ("Shanghai", "China"),
        ("Beijing", "China"),
    ]
    for item in base:
        if item not in pairs:
            pairs.append(item)
    return pairs


def infer_city_country(area: str, city: str = "", country: str = "") -> Tuple[str, str]:
    if normalize_text(city) and normalize_text(country):
        return normalize_text(city), normalize_text(country)
    area_text = normalize_text(area)
    if "," in area_text:
        parts = [p.strip() for p in area_text.split(",") if p.strip()]
        if len(parts) >= 2:
            return parts[0], parts[-1]
    lower = area_text.lower()
    for c, k in known_city_country_pairs():
        if c.lower() in lower or k.lower() in lower:
            return c, k
    if "新加坡" in area_text or "ntu" in lower:
        return "Singapore", "Singapore"
    if city:
        return city, country or "Singapore"
    return "Singapore", "Singapore"


def normalize_interest_category(interest: str) -> str:
    text = normalize_key(interest)
    if not text:
        return "attractions"
    mapping = {
        "美食": "restaurant",
        "聚餐": "restaurant",
        "聚会吃饭": "restaurant",
        "聚会": "restaurant",
        "dinner": "restaurant",
        "group dining": "restaurant",
        "food": "restaurant",
        "ramen": "restaurant",
        "cafe": "cafe",
        "咖啡": "cafe",
        "桌游": "board game cafe",
        "桌上游戏": "board game cafe",
        "board game": "board game cafe",
        "boardgame": "board game cafe",
        "看展": "museum",
        "逛展": "museum",
        "展览": "museum",
        "art gallery": "museum",
        "museum": "museum",
        "露营": "campground",
        "camp": "campground",
        "camping": "campground",
        "野餐": "park",
        "picnic": "park",
        "公园": "park",
        "park": "park",
        "city walk": "tourist attractions",
        "citywalk": "tourist attractions",
        "shopping": "shopping mall",
        "购物": "shopping mall",
        "nightlife": "bar",
    }
    for key, val in mapping.items():
        if key in text:
            return val
    return text


def google_places_text_search(query: str, city: str, country: str, limit: int = 8, timeout_sec: Optional[float] = None) -> List[Dict[str, Any]]:
    if not GOOGLE_MAPS_API_KEY:
        return []
    cache_key = f"{normalize_key(query)}|{normalize_key(city)}|{normalize_key(country)}|{clamp(limit, 1, 20)}"
    now_ts = time.time()
    cached = PLACES_SEARCH_CACHE.get(cache_key)
    if cached and now_ts - float(cached.get("at") or 0) <= PLACES_CACHE_TTL_SEC:
        hit = cached.get("results")
        if isinstance(hit, list):
            return [dict(x) for x in hit if isinstance(x, dict)]

    region = normalize_country_to_region(country)
    params = {
        "query": query,
        "key": GOOGLE_MAPS_API_KEY,
        "language": "zh-CN",
    }
    if region:
        params["region"] = region
    try:
        resp = requests.get(
            "https://maps.googleapis.com/maps/api/place/textsearch/json",
            params=params,
            timeout=max(1.0, float(timeout_sec or PLACES_HTTP_TIMEOUT_SEC)),
        )
        data = resp.json()
    except Exception:
        if cached and isinstance(cached.get("results"), list):
            return [dict(x) for x in cached.get("results") if isinstance(x, dict)]
        return []
    results = data.get("results") or []
    trimmed = [r for r in results if isinstance(r, dict)][: clamp(limit, 1, 20)]
    PLACES_SEARCH_CACHE[cache_key] = {"at": now_ts, "results": trimmed}
    return trimmed


def google_places_nearby_search(lat: float, lng: float, radius: int = 350, keyword: str = "") -> List[Dict[str, Any]]:
    if not GOOGLE_MAPS_API_KEY:
        return []
    params: Dict[str, Any] = {
        "location": f"{lat},{lng}",
        "radius": clamp(to_int(radius, 350), 80, 3000),
        "key": GOOGLE_MAPS_API_KEY,
        "language": "zh-CN",
    }
    if normalize_text(keyword):
        params["keyword"] = normalize_text(keyword)
    try:
        resp = requests.get(
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
            params=params,
            timeout=12,
        )
        data = resp.json()
    except Exception:
        return []
    results = data.get("results") or []
    return [r for r in results if isinstance(r, dict)][:20]


def google_reverse_geocode_city_country(lat: float, lng: float) -> Tuple[str, str, str]:
    if not GOOGLE_MAPS_API_KEY:
        return "", "", ""
    params = {
        "latlng": f"{lat},{lng}",
        "language": "zh-CN",
        "key": GOOGLE_MAPS_API_KEY,
    }
    try:
        resp = requests.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params=params,
            timeout=max(1.0, PLACES_HTTP_TIMEOUT_SEC),
        )
        data = resp.json()
    except Exception:
        return "", "", ""
    results = data.get("results") if isinstance(data.get("results"), list) else []
    if not results:
        return "", "", ""
    city = ""
    country = ""
    display = normalize_text(results[0].get("formatted_address"))
    for result in results:
        components = result.get("address_components") if isinstance(result.get("address_components"), list) else []
        for comp in components:
            if not isinstance(comp, dict):
                continue
            types = comp.get("types") if isinstance(comp.get("types"), list) else []
            if not city and any(t in types for t in ["locality", "postal_town", "administrative_area_level_2", "sublocality", "administrative_area_level_1"]):
                city = normalize_text(comp.get("long_name"))
            if not country and "country" in types:
                country = normalize_text(comp.get("long_name"))
        if city and country:
            break
    return city, country, display


def nominatim_reverse_geocode_city_country(lat: float, lng: float) -> Tuple[str, str, str]:
    params = {
        "lat": f"{lat}",
        "lon": f"{lng}",
        "format": "jsonv2",
        "accept-language": "en",
    }
    headers = {"User-Agent": "TripWeaver/1.0 (contact@tripweaver.local)"}
    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params=params,
            headers=headers,
            timeout=max(1.0, PLACES_HTTP_TIMEOUT_SEC),
        )
        data = resp.json()
    except Exception:
        return "", "", ""
    address = data.get("address") if isinstance(data.get("address"), dict) else {}
    city = normalize_text(
        address.get("city")
        or address.get("town")
        or address.get("village")
        or address.get("municipality")
        or address.get("county")
        or address.get("state")
    )
    country = normalize_text(address.get("country"))
    display = normalize_text(data.get("display_name"))
    return city, country, display


def score_place_context(place: Dict[str, Any], city: str, country: str) -> float:
    address = normalize_key(place.get("formatted_address"))
    c = normalize_key(city)
    k = normalize_key(country)
    score = 0.0
    if c and c in address:
        score += 25
    if k and k in address:
        score += 35
    try:
        score += float(place.get("rating") or 0.0) * 5
    except Exception:
        pass
    try:
        score += min(20, math.log10(max(int(place.get("user_ratings_total") or 1), 1)) * 8)
    except Exception:
        pass
    return score


def build_place_payload(place: Dict[str, Any], city: str, country: str, category: str = "", reason: str = "") -> Dict[str, Any]:
    geo = place.get("geometry", {}).get("location", {})
    lat = geo.get("lat")
    lng = geo.get("lng")
    name = normalize_text(place.get("name") or "Unknown place")
    types = place.get("types") if isinstance(place.get("types"), list) else []
    rating = place.get("rating")
    reviews = place.get("user_ratings_total")
    ticket_required = type_is_ticket_required(types)
    address = normalize_text(place.get("formatted_address"))
    open_now = None
    if isinstance(place.get("opening_hours"), dict) and "open_now" in place.get("opening_hours"):
        open_now = bool(place["opening_hours"]["open_now"])
    photos = place.get("photos") if isinstance(place.get("photos"), list) else []
    photo_ref = ""
    if photos and isinstance(photos[0], dict):
        photo_ref = normalize_text(photos[0].get("photo_reference"))

    payload = {
        "point": name,
        "matchedName": name,
        "placeId": normalize_text(place.get("place_id")),
        "lat": float(lat) if isinstance(lat, (int, float)) else None,
        "lng": float(lng) if isinstance(lng, (int, float)) else None,
        "verified": True,
        "source": "Google Places",
        "intro": f"{name} 位于 {address or f'{city}, {country}'}，适合作为本次路线站点。",
        "primaryType": normalize_text(types[0] if types else category),
        "types": types,
        "rating": rating,
        "userRatingCount": reviews,
        "openNow": open_now,
        "priceLevel": map_price_level(place.get("price_level")),
        "vibeTags": [
            normalize_text(types[0] if types else category) or "本地推荐",
            "真实地点",
            "可成团",
        ],
        "ticketing": {
            "required": ticket_required,
        },
        "booking": {
            "official": make_google_search_url(f"{name} {city} {country}"),
            "klook": make_klook_url(name, city, country) if ticket_required else "",
            "kkday": make_kkday_url(name, city, country) if ticket_required else "",
        },
        "googleMapsUri": make_google_search_url(f"{name} {city} {country}"),
        "coverImageUrl": make_photo_url(photo_ref),
        "allure": allure_from_rating(rating, reviews),
        "city": city,
        "country": country,
        "recommendReason": reason,
    }
    return payload


def get_guide_points(city: str, country: str, limit: int = 10) -> List[str]:
    city_key = normalize_key(city)
    country_key = normalize_key(country)
    guides = list_docs("mook_guides", limit=200)
    points: List[str] = []
    for guide in guides:
        if city_key and city_key not in normalize_key(guide.get("city")):
            continue
        if country_key and country_key not in normalize_key(guide.get("country")):
            continue
        days_plan = guide.get("daysPlan") if isinstance(guide.get("daysPlan"), list) else []
        for day in days_plan:
            activities = day.get("activities") if isinstance(day, dict) and isinstance(day.get("activities"), list) else []
            for act in activities:
                name = normalize_text(act.get("placeName") if isinstance(act, dict) else "")
                if name and name not in points:
                    points.append(name)
                    if len(points) >= limit:
                        return points
    return points[:limit]


def fallback_places(city: str, country: str, interest: str, limit: int) -> List[Dict[str, Any]]:
    seed = get_guide_points(city, country, limit=limit)
    results: List[Dict[str, Any]] = []
    for idx, name in enumerate(seed):
        lat = 1.30 + (idx * 0.01)
        lng = 103.80 + (idx * 0.01)
        results.append(
            {
                "point": name,
                "matchedName": name,
                "placeId": f"fallback-{idx}",
                "lat": lat,
                "lng": lng,
                "verified": False,
                "source": "Fallback",
                "intro": f"{name}（离线候选），建议点击 Google 地图二次确认。",
                "primaryType": normalize_interest_category(interest),
                "types": [normalize_interest_category(interest)],
                "rating": None,
                "userRatingCount": None,
                "openNow": None,
                "priceLevel": "UNKNOWN",
                "vibeTags": ["候选", "请确认"],
                "ticketing": {"required": False},
                "booking": {
                    "official": make_google_search_url(f"{name} {city} {country}"),
                    "klook": "",
                    "kkday": "",
                },
                "googleMapsUri": make_google_search_url(f"{name} {city} {country}"),
                "coverImageUrl": "",
                "allure": {"score": 60, "level": "候选"},
                "city": city,
                "country": country,
            }
        )
    if results:
        return results[:limit]
    # last fallback
    defaults = ["City Center", "Main Landmark", "Popular Food Street", "Museum District", "River Walk"]
    out = []
    for i, d in enumerate(defaults[:limit]):
        out.append(
            {
                "point": d,
                "matchedName": d,
                "placeId": f"default-{i}",
                "lat": 1.30 + i * 0.008,
                "lng": 103.80 + i * 0.008,
                "verified": False,
                "source": "Fallback",
                "intro": "暂无实时地点，已给出可编辑候选。",
                "primaryType": "attraction",
                "types": ["attraction"],
                "rating": None,
                "userRatingCount": None,
                "openNow": None,
                "priceLevel": "UNKNOWN",
                "vibeTags": ["候选"],
                "ticketing": {"required": False},
                "booking": {"official": make_google_search_url(f"{d} {city} {country}"), "klook": "", "kkday": ""},
                "googleMapsUri": make_google_search_url(f"{d} {city} {country}"),
                "coverImageUrl": "",
                "allure": {"score": 55, "level": "候选"},
                "city": city,
                "country": country,
            }
        )
    return out


def discover_realtime_local_places(
    q: str,
    city: str,
    country: str,
    category: str,
    limit: int,
    seed_points: Optional[List[str]] = None,
    budget: str = "",
    time_slot: str = "",
) -> List[Dict[str, Any]]:
    city = normalize_text(city) or "Singapore"
    country = normalize_text(country) or "Singapore"
    category_norm = normalize_interest_category(category or q)
    target = clamp(limit, 3, 20)

    queries: List[Tuple[str, str]] = []
    if seed_points:
        for p in seed_points[:DISCOVERY_MAX_SEED_QUERIES]:
            p_text = normalize_text(p)
            if p_text:
                queries.append((f"{p_text} {city} {country}", p_text))
    else:
        q_text = normalize_text(q)
        if q_text:
            queries.append((f"{q_text} in {city} {country}", q_text))
        if category_norm:
            queries.append((f"best {category_norm} in {city} {country}", category_norm))
        queries.append((f"popular places in {city} {country}", "popular"))

    seen_queries: set = set()
    unique_queries: List[Tuple[str, str]] = []
    for query, reason in queries:
        qk = normalize_key(query)
        if not qk or qk in seen_queries:
            continue
        seen_queries.add(qk)
        unique_queries.append((query, reason))

    raw_candidates: List[Tuple[Dict[str, Any], str]] = []
    started = time.time()
    cap = max(target * 3, 18)
    for query, reason in unique_queries:
        elapsed = time.time() - started
        if elapsed >= DISCOVERY_BUDGET_SEC:
            break
        remaining = DISCOVERY_BUDGET_SEC - elapsed
        timeout_now = max(1.0, min(PLACES_HTTP_TIMEOUT_SEC, remaining))

        for item in google_places_text_search(query, city, country, limit=8, timeout_sec=timeout_now):
            raw_candidates.append((item, reason))
        if len(raw_candidates) >= cap:
            break

    if not raw_candidates:
        return fallback_places(city, country, category_norm or q, target)

    dedup: Dict[str, Tuple[Dict[str, Any], str]] = {}
    for raw, reason in raw_candidates:
        key = normalize_text(raw.get("place_id")) or f"{normalize_key(raw.get('name'))}|{normalize_key(raw.get('formatted_address'))}"
        if not key:
            continue
        if key not in dedup:
            dedup[key] = (raw, reason)

    scored: List[Tuple[float, Dict[str, Any], str]] = []
    for raw, reason in dedup.values():
        score = score_place_context(raw, city, country)
        scored.append((score, raw, reason))
    scored.sort(key=lambda x: x[0], reverse=True)

    candidates: List[Dict[str, Any]] = []
    used_names: set = set()
    for _score, raw, reason in scored:
        payload = build_place_payload(raw, city, country, category_norm, reason=f"匹配你的偏好：{reason}")
        payload["searchSignals"] = {
            "queryHint": reason,
            "baseScore": round(_score, 3),
        }
        payload["tripWowScore"] = compute_tripwow_score(payload, category_norm or q, budget, time_slot)
        polish_place_copy(payload, category_norm or q, query_hint=reason)
        name_key = normalize_key(payload.get("point"))
        if not payload.get("point") or name_key in used_names:
            continue
        used_names.add(name_key)
        candidates.append(payload)
        if len(candidates) >= target * 3:
            break

    candidates.sort(
        key=lambda x: (
            float(x.get("tripWowScore") or 0.0),
            float((x.get("allure") or {}).get("score") or 0),
            float((x.get("searchSignals") or {}).get("baseScore") or 0.0),
        ),
        reverse=True,
    )
    places = candidates[:target]

    if len(places) < target:
        fallback = fallback_places(city, country, category_norm or q, target)
        for p in fallback:
            k = normalize_key(p.get("point"))
            if k in used_names:
                continue
            used_names.add(k)
            p["tripWowScore"] = 50.0
            p["searchSignals"] = {"queryHint": "fallback", "baseScore": 0}
            polish_place_copy(p, category_norm or q, query_hint="fallback")
            places.append(p)
            if len(places) >= target:
                break

    return places[:target]


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    d1 = math.radians(lat2 - lat1)
    d2 = math.radians(lng2 - lng1)
    a = math.sin(d1 / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(d2 / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def route_summary(route: List[Dict[str, Any]]) -> Dict[str, Any]:
    path = [(r.get("lat"), r.get("lng")) for r in route if isinstance(r.get("lat"), (int, float)) and isinstance(r.get("lng"), (int, float))]
    if len(path) < 2:
        return {"distanceKm": 0, "durationMin": len(route) * 40}
    total_km = 0.0
    for i in range(1, len(path)):
        total_km += haversine_km(path[i - 1][0], path[i - 1][1], path[i][0], path[i][1])
    duration = int(round((total_km / 22.0) * 60 + len(route) * 22))
    return {"distanceKm": round(total_km, 1), "durationMin": max(duration, len(route) * 20)}


def schedule_stops(
    route: List[Dict[str, Any]],
    start_date: Optional[date],
    end_date: Optional[date],
    time_slot: str,
    start_time: str = "",
) -> List[Dict[str, Any]]:
    total = len(route)
    if total == 0:
        return route

    if start_date and end_date and end_date >= start_date:
        days = (end_date - start_date).days + 1
    elif start_date:
        days = 1
    else:
        raw = normalize_key(time_slot)
        if "多日" in raw or "days" in raw:
            days = 3
        elif "全天" in raw:
            days = 2
        else:
            days = 1
        start_date = date.today()

    days = max(1, min(10, days))
    if not start_date:
        start_date = date.today()

    preferred = parse_hhmm(start_time)
    if preferred:
        base_hour, base_minute = preferred
    else:
        raw = normalize_key(time_slot)
        if "今晚" in raw or "晚上" in raw:
            base_hour, base_minute = 19, 30
        elif "半天" in raw:
            base_hour, base_minute = 14, 0
        else:
            base_hour, base_minute = 10, 0

    day_counter: Dict[int, int] = {}
    for idx, stop in enumerate(route):
        day_idx = min(days - 1, int((idx * days) / max(total, 1)))
        stop["date"] = (start_date + timedelta(days=day_idx)).isoformat()
        seq = day_counter.get(day_idx, 0)
        day_counter[day_idx] = seq + 1
        total_min = base_hour * 60 + base_minute + seq * 120
        total_min = min(total_min, 23 * 60 + 30)
        hh = total_min // 60
        mm = total_min % 60
        stop["time"] = f"{hh:02d}:{mm:02d}"
    return route


def default_booking_links(city: str, country: str, from_country: str = "") -> Dict[str, str]:
    to_text = f"{city} {country}".strip()
    from_text = normalize_text(from_country)
    flight_query = f"{from_text} to {to_text}".strip() if from_text else to_text
    return {
        "flights": f"https://www.google.com/travel/flights?q={requests.utils.quote(flight_query)}",
        "hotels": f"https://www.booking.com/searchresults.html?ss={requests.utils.quote(to_text)}",
        "attractions": f"https://www.klook.com/zh-CN/search/result/?query={requests.utils.quote(to_text)}",
    }


def generate_plan(intent: Dict[str, Any], seed_points: Optional[List[str]] = None, document_meta: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    area = normalize_text(intent.get("area"))
    city, country = infer_city_country(area, city=normalize_text(intent.get("city")), country=normalize_text(intent.get("country")))
    interest = normalize_text(intent.get("interest") or "city walk")
    budget = normalize_text(intent.get("budget") or "中预算")
    people = normalize_text(intent.get("people") or "2")
    companion = normalize_text(intent.get("companion") or "朋友")
    time_slot = normalize_text(intent.get("timeSlot") or "周末半天")
    start_time = normalize_text(intent.get("startTime") or "")

    start_date = parse_date(intent.get("startDate"))
    end_date = parse_date(intent.get("endDate"))

    stop_count = 8 if seed_points and len(seed_points) >= 8 else 6
    if start_date and end_date:
        day_span = max(1, (end_date - start_date).days + 1)
        stop_count = clamp(day_span * 3, 4, 12)
    elif "今晚" in time_slot or "晚上" in time_slot:
        stop_count = 4

    places = discover_realtime_local_places(
        q=interest,
        city=city,
        country=country,
        category=interest,
        limit=stop_count,
        seed_points=seed_points,
        budget=budget,
        time_slot=time_slot,
    )

    if not places:
        raise HTTPException(status_code=500, detail="Failed to generate route")

    route = []
    unresolved_points: List[str] = []
    seed_pool = [normalize_text(p) for p in (seed_points or []) if normalize_text(p)]

    for idx, place in enumerate(places[:stop_count]):
        item = dict(place)
        if idx < len(seed_pool):
            item["input"] = seed_pool[idx]
            if normalize_key(item.get("input")) not in normalize_key(item.get("matchedName")):
                # still keep, but let client show original point
                pass
        route.append(item)

    if seed_pool:
        matched_inputs = {normalize_key(r.get("input") or r.get("point")) for r in route}
        unresolved_points = [p for p in seed_pool if normalize_key(p) not in matched_inputs]

    route = schedule_stops(route, start_date, end_date, time_slot, start_time)

    for stop in route:
        polish_place_copy(stop, interest, query_hint=normalize_text(((stop.get("searchSignals") or {}).get("queryHint"))))

    summary = route_summary(route)
    verified = len([r for r in route if r.get("verified")])
    route_path = [
        {"lat": r["lat"], "lng": r["lng"]}
        for r in route
        if isinstance(r.get("lat"), (int, float)) and isinstance(r.get("lng"), (int, float))
    ]

    narrative = build_route_narrative(route, city, country, interest, companion, budget)
    llm = maybe_llm_polish_plan(route, city, country, interest, companion, budget, time_slot)
    if llm:
        stop_map: Dict[str, Dict[str, Any]] = {}
        for s in llm.get("stops") if isinstance(llm.get("stops"), list) else []:
            if isinstance(s, dict) and normalize_text(s.get("point")):
                stop_map[normalize_key(s.get("point"))] = s
        for stop in route:
            key = normalize_key(stop.get("point"))
            match = stop_map.get(key)
            if not match:
                continue
            intro = normalize_text(match.get("intro"))
            rec = normalize_text(match.get("recommendReason"))
            if intro:
                stop["intro"] = intro
            if rec:
                stop["recommendReason"] = rec
        narrative["hook"] = normalize_text(llm.get("hook")) or narrative["hook"]
        narrative["vibe"] = normalize_text(llm.get("overallReason")) or narrative["vibe"]
        raw_insights = llm.get("searchInsights") if isinstance(llm.get("searchInsights"), list) else []
        if raw_insights:
            narrative["searchInsights"] = [normalize_text(x) for x in raw_insights if normalize_text(x)][:5]
        narrative["llmEnhanced"] = True

    title = f"{city} {interest} 路线"
    reason = f"{narrative.get('hook', '')} {narrative.get('vibe', '')}".strip()
    if not reason:
        reason = f"基于 {companion}（约{people}人）在 {city}, {country} 的偏好生成，覆盖真实地点并附带地图与购票入口。"

    plan = {
        "id": new_id("PLAN"),
        "title": title,
        "intent": {
            "companion": companion,
            "people": people,
            "budget": budget,
            "timeSlot": time_slot,
            "interest": interest,
            "area": area or f"{city}, {country}",
            "city": city,
            "country": country,
            "startDate": start_date.isoformat() if start_date else "",
            "endDate": end_date.isoformat() if end_date else "",
            "startTime": start_time,
            "fromCountry": normalize_text(intent.get("fromCountry")),
        },
        "route": route,
        "routePath": route_path,
        "routeSummary": summary,
        "budgetEstimate": budget,
        "reason": reason,
        "narrative": narrative,
        "validationSummary": {
            "total": len(route),
            "verified": verified,
            "replaced": 0,
            "realtime": True,
            "multiDay": len({r.get('date') for r in route if r.get('date')}),
        },
        "bookingLinks": default_booking_links(city, country, from_country=normalize_text(intent.get("fromCountry"))),
        "generatedAt": now_iso(),
    }

    if document_meta:
        doc_meta = dict(document_meta)
        doc_meta.setdefault("extractedPoints", seed_pool)
        doc_meta.setdefault("unresolvedPoints", unresolved_points)
        plan["documentMeta"] = doc_meta

    return plan


def parse_stop_datetime(stop: Dict[str, Any], fallback: datetime) -> datetime:
    d = normalize_text(stop.get("date"))
    t = normalize_text(stop.get("time")) or "19:30"
    if d:
        parsed = parse_datetime(f"{d}T{t}")
        if parsed:
            return parsed
        parsed = parse_datetime(f"{d}T{t}:00")
        if parsed:
            return parsed
    return fallback


def create_activity(plan: Dict[str, Any], user: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    code = f"ACT-{random.randint(1000, 9999)}"
    token = base64.urlsafe_b64encode(json_dumps({"code": code, "at": now_iso()}).encode("utf-8")).decode("utf-8")[:24]
    route = plan.get("route") if isinstance(plan.get("route"), list) else []
    schedule = " | ".join([f"{normalize_text(x.get('date'))} {normalize_text(x.get('time'))} {normalize_text(x.get('point'))}".strip() for x in route])
    intent = plan.get("intent") if isinstance(plan.get("intent"), dict) else {}
    launch_cfg = plan.get("launchConfig") if isinstance(plan.get("launchConfig"), dict) else {}
    city = normalize_text(intent.get("city"))
    country = normalize_text(intent.get("country"))
    if not city or not country:
        city, country = infer_city_country(normalize_text(intent.get("area")))

    fallback_start = datetime.now(timezone.utc) + timedelta(hours=2)
    first_stop = route[0] if route else {}
    last_stop = route[-1] if route else {}
    start_dt = parse_stop_datetime(first_stop, fallback_start)
    end_dt = parse_stop_datetime(last_stop, start_dt + timedelta(hours=3))
    start_override = parse_datetime(launch_cfg.get("startAt") or launch_cfg.get("startDateTime"))
    end_override = parse_datetime(launch_cfg.get("endAt") or launch_cfg.get("endDateTime"))
    if start_override:
        start_dt = start_override
    if end_override:
        end_dt = end_override
    if end_dt <= start_dt:
        end_dt = start_dt + timedelta(hours=1)

    venue_name = normalize_text(first_stop.get("point") or first_stop.get("matchedName") or "待定集合点")
    venue_override = normalize_text(launch_cfg.get("venueName") or launch_cfg.get("location"))
    if venue_override:
        venue_name = venue_override

    title = normalize_text(launch_cfg.get("title") or plan.get("title") or "活动")
    description = normalize_text(launch_cfg.get("description") or plan.get("reason"))
    calendar_name = normalize_text(launch_cfg.get("calendar") or "个人日历")
    privacy = normalize_privacy(launch_cfg.get("privacy"), default="私密")
    is_public = privacy == "公开"
    timezone_label = normalize_text(launch_cfg.get("timezone") or "GMT+08:00 新加坡")
    theme = normalize_text(launch_cfg.get("theme") or "量子")
    cover_image = normalize_text(launch_cfg.get("coverImage"))
    ticket_price_label = normalize_text(launch_cfg.get("ticketPrice") or "免费")
    price_value = 0.0
    if ticket_price_label and normalize_key(ticket_price_label) not in {"free", "免费"}:
        m = re.search(r"[-+]?\d+(?:\.\d+)?", ticket_price_label)
        if m:
            try:
                price_value = max(0.0, float(m.group(0)))
            except Exception:
                price_value = 0.0
    requires_approval = parse_bool(launch_cfg.get("requiresApproval"), default=False)
    attendee_limit = clamp(to_int(launch_cfg.get("attendeeLimit"), 50), 1, 5000)
    currency = normalize_text(launch_cfg.get("currency") or "SGD")

    geo = parse_geo({"lat": first_stop.get("lat"), "lng": first_stop.get("lng")})
    creator_public = to_public_user(user) if user else {"id": "system", "username": "system", "displayName": "TripWeaver"}
    owner_id = user["id"] if user else ""

    activity = {
        "id": new_id("ACT"),
        "code": code,
        "joinToken": token,
        "title": title,
        "city": city,
        "country": country,
        "venueName": venue_name,
        "startAt": start_dt.isoformat(),
        "endAt": end_dt.isoformat(),
        "route": route,
        "budgetEstimate": plan.get("budgetEstimate") or "预算待定",
        "reason": plan.get("reason") or "",
        "members": "当前发起人 + 可邀请同伴",
        "schedule": schedule,
        "link": f"/join/{token}",
        "createdAt": now_iso(),
        "calendar": calendar_name,
        "privacy": privacy,
        "isPublic": is_public,
        "timezone": timezone_label,
        "description": description,
        "theme": theme,
        "ticketPriceLabel": ticket_price_label or "免费",
        "requiresApproval": requires_approval,
        "attendeeLimit": attendee_limit,
        "coverImage": cover_image,
    }
    local_event = {
        "id": new_id("EVT"),
        "title": title,
        "category": "route_launch",
        "city": city,
        "country": country,
        "venueName": venue_name,
        "startAt": start_dt.isoformat(),
        "endAt": end_dt.isoformat(),
        "description": description,
        "price": price_value,
        "currency": currency,
        "ticketUrl": normalize_text(launch_cfg.get("ticketUrl")) or make_google_search_url(f"{title} {city} {country}"),
        "tags": parse_tags(["route", "路线", normalize_text(intent.get("interest")), theme]),
        "source": "activity_route",
        "creator": creator_public,
        "rsvps": [{"userId": user["id"], "status": "going", "at": now_iso(), "user": creator_public}] if user else [],
        "createdAt": now_iso(),
        "privacy": privacy,
        "isPublic": is_public,
        "geo": geo,
        "route": route,
        "routePath": plan.get("routePath") if isinstance(plan.get("routePath"), list) else [],
        "settings": {
            "calendar": calendar_name,
            "privacy": privacy,
            "isPublic": is_public,
            "timezone": timezone_label,
            "theme": theme,
            "ticketPriceLabel": ticket_price_label or "免费",
            "requiresApproval": requires_approval,
            "attendeeLimit": attendee_limit,
        },
    }
    upsert_doc("local_events", local_event, owner_id=owner_id)
    activity["localEventId"] = local_event["id"]
    upsert_doc("activities", activity, owner_id=owner_id)
    return activity


def extract_points_from_text(text: str, limit: int = 16) -> List[str]:
    raw = normalize_text(text)
    if not raw:
        return []
    parts = re.split(r"[\n\r;；|、,，]+", raw)
    points: List[str] = []
    seen: set = set()
    for part in parts:
        cleaned = part.strip()
        cleaned = re.sub(r"^(day|d)\s*\d+\s*[:：\-]\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"^[#*•\-–—]+\s*", "", cleaned)
        cleaned = re.sub(r"^\d{1,2}\s*[.)、\-]\s*", "", cleaned)
        cleaned = re.sub(r"^\d{1,2}[:：]\d{2}\s*", "", cleaned)
        cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
        if len(cleaned) < 2 or len(cleaned) > 80:
            continue
        if cleaned.isdigit():
            continue
        key = normalize_key(cleaned)
        if key in seen:
            continue
        seen.add(key)
        points.append(cleaned)
        if len(points) >= limit:
            break
    return points


def infer_intent_from_messages(messages: List[Dict[str, Any]]) -> Dict[str, Any]:
    text = " ".join([normalize_text(m.get("content")) for m in messages]).lower()
    budget = "中预算"
    if any(k in text for k in ["cheap", "low budget", "便宜", "穷游"]):
        budget = "低预算"
    elif any(k in text for k in ["luxury", "高预算", "高端"]):
        budget = "高预算"

    interest = "美食"
    if any(k in text for k in ["board game", "boardgame", "桌游", "桌上游戏"]):
        interest = "桌游"
    elif any(k in text for k in ["camping", "camp", "露营"]):
        interest = "露营"
    elif any(k in text for k in ["picnic", "野餐", "公园"]):
        interest = "野餐"
    elif any(k in text for k in ["group dining", "dinner", "聚餐", "聚会吃饭"]):
        interest = "聚餐"
    elif any(k in text for k in ["museum", "展", "gallery", "逛展", "展览"]):
        interest = "看展"
    elif any(k in text for k in ["cafe", "coffee", "咖啡"]):
        interest = "咖啡"
    elif any(k in text for k in ["city walk", "walk", "散步", "citywalk"]):
        interest = "city walk"

    city, country = infer_city_country(text)
    return {
        "companion": "朋友",
        "people": "3",
        "budget": budget,
        "timeSlot": "周末半天" if ("周末" in text or "weekend" in text) else "今天晚上",
        "interest": interest,
        "area": f"{city}, {country}",
        "city": city,
        "country": country,
    }


# -----------------------------
# App and error handling
# -----------------------------

init_db()
migrate_json_to_db()

app = FastAPI(title="TripWeaver Python Backend", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return JSONResponse(status_code=exc.status_code, content={"error": detail})


@app.exception_handler(Exception)
async def generic_exception_handler(_request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": str(exc) or "Internal server error"})


@app.on_event("startup")
def startup() -> None:
    init_db()
    migrate_json_to_db()


# -----------------------------
# Basic + static compatibility
# -----------------------------


@app.get("/api/health")
def health() -> Dict[str, Any]:
    return {"ok": True, "now": now_iso()}


@app.get("/api/maps-config")
def maps_config() -> Dict[str, Any]:
    return {
        "enabled": bool(GOOGLE_MAPS_API_KEY),
        "apiKey": GOOGLE_MAPS_API_KEY,
    }


@app.get("/socket.io/socket.io.js")
def socket_io_stub() -> Response:
    code = "window.io = window.io || undefined;"
    return Response(content=code, media_type="application/javascript")


# -----------------------------
# Generic events
# -----------------------------


@app.post("/api/events")
def post_event(payload: Dict[str, Any]) -> Dict[str, Any]:
    event = {
        "id": new_id("EV"),
        "name": normalize_text(payload.get("name") or "event"),
        "payload": payload.get("payload") if isinstance(payload.get("payload"), dict) else {},
        "at": now_iso(),
    }
    upsert_doc("events", event)
    return {"ok": True}


@app.get("/api/events")
def get_events() -> List[Dict[str, Any]]:
    return list_docs("events", limit=300)


# -----------------------------
# Auth
# -----------------------------


@app.post("/api/auth/register")
def auth_register(payload: Dict[str, Any]) -> Dict[str, Any]:
    username = normalize_text(payload.get("username")).lower()
    password = normalize_text(payload.get("password"))
    display_name = normalize_text(payload.get("displayName"))
    email = normalize_email(payload.get("email"))

    if not username or not password or not display_name:
        raise HTTPException(status_code=400, detail="username, password, displayName are required.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    if get_user_by_username(username):
        raise HTTPException(status_code=409, detail="Username already exists.")
    if email:
        for u in list_users():
            if u.get("email") == email or u.get("campusEmail") == email:
                raise HTTPException(status_code=409, detail="Email already exists.")

    user = {
        "id": new_id("USR"),
        "username": username,
        "displayName": display_name,
        "passwordHash": hash_password(password),
        "email": email,
        "phone": "",
        "oauthAccounts": {},
        "campusVerified": False,
        "campusName": "",
        "campusEmail": "",
        "studentId": "",
        "preferenceMemory": {},
        "createdAt": now_iso(),
    }
    insert_user(user)
    token = create_token(user)
    return {"token": token, "user": to_public_user(user)}


@app.post("/api/auth/login")
def auth_login(payload: Dict[str, Any]) -> Dict[str, Any]:
    identifier = normalize_text(payload.get("identifier") or payload.get("username"))
    password = normalize_text(payload.get("password"))
    if not identifier or not password:
        raise HTTPException(status_code=400, detail="identifier and password are required.")
    user = find_user_by_identifier(identifier)
    if not user or not check_password(password, user.get("passwordHash", "")):
        raise HTTPException(status_code=401, detail="Invalid username/email or password.")
    token = create_token(user)
    return {"token": token, "user": to_public_user(user)}


@app.post("/api/auth/request-code")
def auth_request_code(payload: Dict[str, Any]) -> Dict[str, Any]:
    identifier = normalize_text(payload.get("identifier"))
    email = normalize_email(identifier)
    phone = normalize_phone(identifier)
    if not email and not phone:
        raise HTTPException(status_code=400, detail="identifier must be a valid email or phone number.")
    kind = "email" if email else "phone"
    normalized = email or phone

    code = f"{random.randint(100000, 999999)}"
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=10)

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM auth_codes WHERE identifier=?", (normalized,))
        conn.execute(
            "INSERT INTO auth_codes(id, identifier, kind, code, created_at, expires_at, used_at) VALUES(?, ?, ?, ?, ?, ?, '')",
            (new_id("OTP"), normalized, kind, code, now.isoformat(), expires.isoformat()),
        )

    if kind == "email":
        hint = normalized[:2] + "***@" + normalized.split("@", 1)[1]
    else:
        hint = normalized[:3] + "****" + normalized[-2:]

    delivery = "debug"
    if kind == "email" and not smtp_enabled() and not AUTH_CODE_DEBUG:
        raise HTTPException(status_code=500, detail="未配置 SMTP，且关闭了调试验证码，无法发送邮箱验证码。")
    if kind == "phone" and not AUTH_CODE_DEBUG:
        raise HTTPException(status_code=501, detail="当前未接入短信服务，请改用邮箱验证码。")

    if kind == "email" and smtp_enabled():
        try:
            send_auth_code_email(email, code, expires_minutes=10)
            delivery = "email"
        except Exception:
            raise HTTPException(status_code=500, detail="验证码邮件发送失败，请检查 SMTP 配置。")

    result = {
        "ok": True,
        "identifierHint": hint,
        "expiresInSeconds": 600,
        "delivery": delivery,
    }
    if AUTH_CODE_DEBUG:
        result["debugCode"] = code
    return result


@app.post("/api/auth/email/request-code")
def auth_email_request_code(payload: Dict[str, Any]) -> Dict[str, Any]:
    email = normalize_email(payload.get("email") or payload.get("identifier"))
    if not email:
        raise HTTPException(status_code=400, detail="email is required.")
    return auth_request_code({"identifier": email})


@app.post("/api/auth/code-login")
def auth_code_login(payload: Dict[str, Any]) -> Dict[str, Any]:
    identifier = normalize_text(payload.get("identifier"))
    code = normalize_text(payload.get("code"))
    display_name = normalize_text(payload.get("displayName"))
    email = normalize_email(identifier)
    phone = normalize_phone(identifier)
    if not identifier or not code:
        raise HTTPException(status_code=400, detail="identifier and code are required.")
    if not email and not phone:
        raise HTTPException(status_code=400, detail="identifier must be a valid email or phone number.")
    normalized = email or phone

    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM auth_codes WHERE identifier=? AND code=? LIMIT 1", (normalized, code)).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid or expired code.")
        expires = parse_datetime(row["expires_at"])
        if not expires or datetime.now(timezone.utc) > expires:
            conn.execute("DELETE FROM auth_codes WHERE id=?", (row["id"],))
            raise HTTPException(status_code=401, detail="Invalid or expired code.")
        conn.execute("DELETE FROM auth_codes WHERE id=?", (row["id"],))

    user = find_user_by_identifier(normalized)
    created = False
    if not user:
        base = normalized.split("@", 1)[0] if email else f"u{normalized[-6:]}"
        user = {
            "id": new_id("USR"),
            "username": make_unique_username(base),
            "displayName": display_name or (normalized.split("@", 1)[0] if email else f"User{normalized[-4:]}") ,
            "passwordHash": "",
            "email": email,
            "phone": phone,
            "oauthAccounts": {},
            "campusVerified": False,
            "campusName": "",
            "campusEmail": "",
            "studentId": "",
            "preferenceMemory": {},
            "createdAt": now_iso(),
        }
        insert_user(user)
        created = True
    else:
        if email and not user.get("email"):
            user["email"] = email
        if phone and not user.get("phone"):
            user["phone"] = phone
        update_user(user)

    token = create_token(user)
    return {"token": token, "user": to_public_user(user), "created": created}


@app.post("/api/auth/email/code-login")
def auth_email_code_login(payload: Dict[str, Any]) -> Dict[str, Any]:
    email = normalize_email(payload.get("email") or payload.get("identifier"))
    code = normalize_text(payload.get("code"))
    display_name = normalize_text(payload.get("displayName"))
    if not email or not code:
        raise HTTPException(status_code=400, detail="email and code are required.")
    return auth_code_login({"identifier": email, "code": code, "displayName": display_name})


@app.post("/api/auth/oauth/mock")
def auth_oauth_mock(payload: Dict[str, Any]) -> Dict[str, Any]:
    provider = normalize_text(payload.get("provider")).lower()
    oauth_user_id = normalize_text(payload.get("oauthUserId"))
    display_name = normalize_text(payload.get("displayName"))
    email = normalize_email(payload.get("email"))

    if provider not in {"google", "apple", "wechat", "github"}:
        raise HTTPException(status_code=400, detail="Unsupported provider.")
    if not oauth_user_id:
        raise HTTPException(status_code=400, detail="oauthUserId is required.")

    users = list_users()
    user = None
    for u in users:
        accounts = u.get("oauthAccounts") or {}
        if accounts.get(provider) == oauth_user_id:
            user = u
            break
    if not user and email:
        for u in users:
            if u.get("email") == email or u.get("campusEmail") == email:
                user = u
                break

    if not user:
        base = display_name or f"{provider}_user"
        user = {
            "id": new_id("USR"),
            "username": make_unique_username(f"{provider}_{base}"),
            "displayName": base,
            "passwordHash": "",
            "email": email,
            "phone": "",
            "oauthAccounts": {provider: oauth_user_id},
            "campusVerified": False,
            "campusName": "",
            "campusEmail": "",
            "studentId": "",
            "preferenceMemory": {},
            "createdAt": now_iso(),
        }
        insert_user(user)
    else:
        accounts = user.get("oauthAccounts") or {}
        accounts[provider] = oauth_user_id
        user["oauthAccounts"] = accounts
        if email and not user.get("email"):
            user["email"] = email
        if display_name:
            user["displayName"] = display_name
        update_user(user)

    token = create_token(user)
    return {"token": token, "user": to_public_user(user), "provider": provider}


@app.get("/api/auth/me")
def auth_me(user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    return {"user": to_public_user(user)}


# -----------------------------
# IM + social base
# -----------------------------


@app.get("/api/im/messages")
def get_messages(limit: int = Query(default=100), user: Dict[str, Any] = Depends(auth_user)) -> List[Dict[str, Any]]:
    safe_limit = clamp(limit, 1, 300)
    messages = list_docs("messages", limit=safe_limit)
    return list(reversed(messages))


@app.post("/api/im/messages")
def post_message(payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    content = normalize_text(payload.get("content"))
    if not content:
        raise HTTPException(status_code=400, detail="Message content is required.")
    message = {
        "id": new_id("MSG"),
        "content": content[:2000],
        "user": to_public_user(user),
        "geo": parse_geo(payload.get("geo")),
        "createdAt": now_iso(),
    }
    upsert_doc("messages", message, owner_id=user["id"])
    return message


def get_friends_for_user(user_id: str) -> List[Dict[str, Any]]:
    friendships = list_docs("friendships", limit=2000)
    friend_ids: List[str] = []
    for f in friendships:
        if f.get("userA") == user_id:
            friend_ids.append(f.get("userB"))
        elif f.get("userB") == user_id:
            friend_ids.append(f.get("userA"))
    users = {u["id"]: u for u in list_users()}
    return [to_public_user(users[uid]) for uid in friend_ids if uid in users]


@app.get("/api/friends")
def get_friends(user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    requests = [
        r
        for r in list_docs("friend_requests", limit=2000)
        if r.get("status") == "pending" and (r.get("toUserId") == user["id"] or r.get("fromUserId") == user["id"])
    ]
    requests.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return {
        "friends": get_friends_for_user(user["id"]),
        "requests": requests[:100],
    }


@app.post("/api/friends/request")
def send_friend_request(payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    to_username = normalize_text(payload.get("toUsername")).lower()
    if not to_username:
        raise HTTPException(status_code=400, detail="toUsername is required.")
    target = get_user_by_username(to_username)
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found.")
    if target["id"] == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot add yourself.")

    pair = normalize_pair(user["id"], target["id"])
    if any(normalize_pair(f.get("userA", ""), f.get("userB", "")) == pair for f in list_docs("friendships", limit=3000)):
        raise HTTPException(status_code=409, detail="Already friends.")

    for req in list_docs("friend_requests", limit=3000):
        if req.get("status") == "pending" and normalize_pair(req.get("fromUserId", ""), req.get("toUserId", "")) == pair:
            raise HTTPException(status_code=409, detail="Request already pending.")

    request_doc = {
        "id": new_id("FR"),
        "fromUserId": user["id"],
        "toUserId": target["id"],
        "status": "pending",
        "createdAt": now_iso(),
    }
    upsert_doc("friend_requests", request_doc, owner_id=user["id"])
    return request_doc


@app.post("/api/friends/request/{request_id}/respond")
def respond_friend_request(request_id: str, payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    accept = bool(payload.get("accept"))
    req = get_doc("friend_requests", request_id)
    if not req or req.get("toUserId") != user["id"]:
        raise HTTPException(status_code=404, detail="Friend request not found.")
    if req.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Request already handled.")

    req["status"] = "accepted" if accept else "rejected"
    req["respondedAt"] = now_iso()
    replace_doc("friend_requests", request_id, req)

    if accept:
        pair = normalize_pair(req.get("fromUserId", ""), req.get("toUserId", ""))
        exists = any(normalize_pair(f.get("userA", ""), f.get("userB", "")) == pair for f in list_docs("friendships", limit=3000))
        if not exists:
            friendship = {
                "id": new_id("FS"),
                "pair": pair,
                "userA": req.get("fromUserId"),
                "userB": req.get("toUserId"),
                "createdAt": now_iso(),
            }
            upsert_doc("friendships", friendship)
    return req


@app.get("/api/im/dm/{user_id}/messages")
def get_dm_messages(user_id: str, user: Dict[str, Any] = Depends(auth_user)) -> List[Dict[str, Any]]:
    pair = normalize_pair(user["id"], user_id)
    messages = [m for m in list_docs("direct_messages", limit=5000) if m.get("pair") == pair]
    messages.sort(key=lambda x: x.get("createdAt", ""))
    return messages[-200:]


@app.post("/api/im/dm/{user_id}/messages")
def post_dm_messages(user_id: str, payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    target = get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found.")
    content = normalize_text(payload.get("content"))
    if not content:
        raise HTTPException(status_code=400, detail="Message content is required.")
    pair = normalize_pair(user["id"], user_id)
    message = {
        "id": new_id("DM"),
        "pair": pair,
        "fromUserId": user["id"],
        "toUserId": user_id,
        "content": content[:2000],
        "geo": parse_geo(payload.get("geo")),
        "user": to_public_user(user),
        "createdAt": now_iso(),
    }
    upsert_doc("direct_messages", message, owner_id=user["id"])
    return message


# -----------------------------
# Campus groups
# -----------------------------


@app.post("/api/campus/verify")
def campus_verify(payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    campus_email = normalize_email(payload.get("campusEmail"))
    campus_name = normalize_text(payload.get("campusName"))
    student_id = normalize_text(payload.get("studentId"))
    if not campus_email or not campus_name:
        raise HTTPException(status_code=400, detail="campusEmail and campusName are required.")
    if not (campus_email.endswith(".edu") or campus_email.endswith(".ac") or ".edu." in campus_email or ".ac." in campus_email):
        raise HTTPException(status_code=400, detail="Campus email format invalid.")

    user["campusVerified"] = True
    user["campusEmail"] = campus_email
    user["campusName"] = campus_name
    user["studentId"] = student_id
    update_user(user)
    return {"user": to_public_user(user), "campusVerified": True, "campusName": campus_name}


@app.post("/api/campus/groups")
def create_campus_group(payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    if not user.get("campusVerified") or not user.get("campusName"):
        raise HTTPException(status_code=403, detail="Campus verification required.")
    name = normalize_text(payload.get("name"))
    if not name:
        raise HTTPException(status_code=400, detail="name is required.")
    group = {
        "id": new_id("CG"),
        "name": name,
        "description": normalize_text(payload.get("description")),
        "campusName": user.get("campusName"),
        "geo": parse_geo(payload.get("geo")),
        "creator": to_public_user(user),
        "members": [to_public_user(user)],
        "messages": [],
        "createdAt": now_iso(),
    }
    upsert_doc("campus_groups", group, owner_id=user["id"])
    return group


@app.get("/api/campus/groups")
def get_campus_groups(user: Dict[str, Any] = Depends(auth_user)) -> List[Dict[str, Any]]:
    groups = list_docs("campus_groups", limit=200)
    campus_name = normalize_key(user.get("campusName"))
    visible = [g for g in groups if not campus_name or normalize_key(g.get("campusName")) == campus_name]
    return visible


@app.post("/api/campus/groups/{group_id}/join")
def join_campus_group(group_id: str, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    if not user.get("campusVerified") or not user.get("campusName"):
        raise HTTPException(status_code=403, detail="Campus verification required.")
    group = get_doc("campus_groups", group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found.")
    if normalize_key(group.get("campusName")) != normalize_key(user.get("campusName")):
        raise HTTPException(status_code=403, detail="Campus mismatch.")

    members = group.get("members") if isinstance(group.get("members"), list) else []
    if not any(m.get("id") == user["id"] for m in members if isinstance(m, dict)):
        members.append(to_public_user(user))
    group["members"] = members
    replace_doc("campus_groups", group_id, group)
    return group


@app.get("/api/campus/groups/{group_id}/messages")
def get_campus_group_messages(group_id: str, user: Dict[str, Any] = Depends(auth_user)) -> List[Dict[str, Any]]:
    group = get_doc("campus_groups", group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found.")
    members = group.get("members") if isinstance(group.get("members"), list) else []
    if not any(m.get("id") == user["id"] for m in members if isinstance(m, dict)):
        raise HTTPException(status_code=403, detail="Not a group member.")
    return (group.get("messages") if isinstance(group.get("messages"), list) else [])[-200:]


@app.post("/api/campus/groups/{group_id}/messages")
def post_campus_group_message(group_id: str, payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    group = get_doc("campus_groups", group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found.")
    content = normalize_text(payload.get("content"))
    if not content:
        raise HTTPException(status_code=400, detail="Message content is required.")
    members = group.get("members") if isinstance(group.get("members"), list) else []
    if not any(m.get("id") == user["id"] for m in members if isinstance(m, dict)):
        raise HTTPException(status_code=403, detail="Not a group member.")

    message = {
        "id": new_id("CGM"),
        "content": content[:2000],
        "user": to_public_user(user),
        "geo": parse_geo(payload.get("geo")),
        "createdAt": now_iso(),
    }
    msgs = group.get("messages") if isinstance(group.get("messages"), list) else []
    msgs.append(message)
    group["messages"] = msgs[-600:]
    replace_doc("campus_groups", group_id, group)
    return message


# -----------------------------
# Interest groups
# -----------------------------


INTEREST_VISIBILITY_PUBLIC = "public"
INTEREST_VISIBILITY_CAMPUS = "campus"
INTEREST_VISIBILITY_INVITE = "invite"


def normalize_interest_group_visibility(value: Any, default: str = INTEREST_VISIBILITY_PUBLIC) -> str:
    raw = normalize_key(value)
    if raw in {"public", "公开", "open", "all", "everyone"}:
        return INTEREST_VISIBILITY_PUBLIC
    if raw in {"campus", "school", "同校", "同个学校", "校园", "campus_only", "school_only"}:
        return INTEREST_VISIBILITY_CAMPUS
    if raw in {"invite", "invite_only", "invitation", "仅邀请", "受邀", "private"}:
        return INTEREST_VISIBILITY_INVITE
    return default


def resolve_interest_group_visibility(group: Dict[str, Any]) -> str:
    visibility = normalize_interest_group_visibility(group.get("visibility"), "")
    if visibility:
        return visibility
    if parse_bool(group.get("campusOnly"), False):
        return INTEREST_VISIBILITY_CAMPUS
    return INTEREST_VISIBILITY_PUBLIC


def is_interest_group_member(group: Dict[str, Any], user_id: str) -> bool:
    uid = normalize_text(user_id)
    if not uid:
        return False
    members = group.get("members") if isinstance(group.get("members"), list) else []
    return any(normalize_text(m.get("id")) == uid for m in members if isinstance(m, dict))


def can_access_campus_group(group: Dict[str, Any], user: Optional[Dict[str, Any]]) -> bool:
    if not user or not user.get("campusVerified"):
        return False
    group_campus = normalize_key(group.get("campusName"))
    if not group_campus:
        return True
    user_campus = normalize_key(user.get("campusName"))
    return bool(user_campus and user_campus == group_campus)


def parse_invite_usernames(value: Any) -> List[str]:
    items: List[str] = []
    if isinstance(value, list):
        raw_items = value
    else:
        raw_items = re.split(r"[,\n;，；\s]+", normalize_text(value))
    for raw in raw_items:
        text = normalize_text(raw).lstrip("@").lower()
        if text and text not in items:
            items.append(text)
    return items


def resolve_interest_group_invite_user_ids(payload: Dict[str, Any]) -> List[str]:
    user_ids: List[str] = []
    raw_user_ids = payload.get("inviteUserIds") if isinstance(payload.get("inviteUserIds"), list) else []
    for raw_uid in raw_user_ids:
        uid = normalize_text(raw_uid)
        if uid and uid not in user_ids:
            user_ids.append(uid)
    for username in parse_invite_usernames(payload.get("inviteUsernames")):
        target_user = get_user_by_username(username)
        if target_user and target_user["id"] not in user_ids:
            user_ids.append(target_user["id"])
    return user_ids


def can_access_interest_group(group: Dict[str, Any], user: Optional[Dict[str, Any]]) -> bool:
    visibility = resolve_interest_group_visibility(group)
    if visibility == INTEREST_VISIBILITY_PUBLIC:
        return True
    if not user:
        return False
    user_id = normalize_text(user.get("id"))
    if is_interest_group_member(group, user_id):
        return True
    creator = group.get("creator") if isinstance(group.get("creator"), dict) else {}
    if normalize_text(creator.get("id")) == user_id:
        return True
    if visibility == INTEREST_VISIBILITY_CAMPUS:
        return can_access_campus_group(group, user)
    if visibility == INTEREST_VISIBILITY_INVITE:
        allowed = group.get("allowedUserIds") if isinstance(group.get("allowedUserIds"), list) else []
        return any(normalize_text(uid) == user_id for uid in allowed)
    return True


def can_join_interest_group(group: Dict[str, Any], user: Dict[str, Any]) -> bool:
    visibility = resolve_interest_group_visibility(group)
    if visibility == INTEREST_VISIBILITY_PUBLIC:
        return True
    if visibility == INTEREST_VISIBILITY_CAMPUS:
        return can_access_campus_group(group, user)
    if visibility == INTEREST_VISIBILITY_INVITE:
        user_id = normalize_text(user.get("id"))
        if is_interest_group_member(group, user_id):
            return True
        creator = group.get("creator") if isinstance(group.get("creator"), dict) else {}
        if normalize_text(creator.get("id")) == user_id:
            return True
        allowed = group.get("allowedUserIds") if isinstance(group.get("allowedUserIds"), list) else []
        return any(normalize_text(uid) == user_id for uid in allowed)
    return True


def interest_group_join_denied_reason(group: Dict[str, Any]) -> str:
    visibility = resolve_interest_group_visibility(group)
    if visibility == INTEREST_VISIBILITY_CAMPUS:
        return "仅同校认证用户可加入该兴趣群。"
    if visibility == INTEREST_VISIBILITY_INVITE:
        return "该兴趣群仅限受邀用户加入。"
    return "当前用户无权限加入该兴趣群。"


@app.get("/api/interest/groups")
def get_interest_groups(
    request: Request,
    city: str = "",
    country: str = "",
    interest: str = "",
    q: str = "",
) -> List[Dict[str, Any]]:
    user = optional_auth_user(request)
    groups = list_docs("interest_groups", limit=500)
    if city:
        groups = [g for g in groups if normalize_key(city) in normalize_key(g.get("city"))]
    if country:
        groups = [g for g in groups if normalize_key(country) in normalize_key(g.get("country"))]
    if interest:
        groups = [g for g in groups if normalize_key(interest) in normalize_key(g.get("interest"))]
    if q:
        key = normalize_key(q)
        groups = [g for g in groups if key in normalize_key(f"{g.get('name', '')} {g.get('description', '')}")]
    groups = [g for g in groups if can_access_interest_group(g, user)]
    return groups


@app.post("/api/interest/groups")
def create_interest_group(payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    name = normalize_text(payload.get("name"))
    interest = normalize_text(payload.get("interest"))
    city = normalize_text(payload.get("city"))
    country = normalize_text(payload.get("country"))
    if not name or not interest or not city or not country:
        raise HTTPException(status_code=400, detail="name, interest, city, country are required.")

    legacy_campus_only = parse_bool(payload.get("campusOnly"), False)
    visibility = normalize_interest_group_visibility(
        payload.get("visibility"),
        INTEREST_VISIBILITY_CAMPUS if legacy_campus_only else INTEREST_VISIBILITY_PUBLIC,
    )
    if visibility == INTEREST_VISIBILITY_CAMPUS and not user.get("campusVerified"):
        raise HTTPException(status_code=403, detail="Campus verification required for campus-only group.")

    campus_name = normalize_text(payload.get("campusName") or (user.get("campusName") if visibility == INTEREST_VISIBILITY_CAMPUS else ""))
    if visibility == INTEREST_VISIBILITY_CAMPUS and not campus_name:
        raise HTTPException(status_code=400, detail="Campus name is required for campus-visibility group.")

    invited_user_ids = resolve_interest_group_invite_user_ids(payload)
    allowed_user_ids: List[str] = []
    if visibility == INTEREST_VISIBILITY_INVITE:
        allowed_user_ids.append(user["id"])
        for uid in invited_user_ids:
            if uid not in allowed_user_ids:
                allowed_user_ids.append(uid)
    invited_users: List[Dict[str, Any]] = []
    for uid in allowed_user_ids:
        if uid == user["id"]:
            continue
        invited_user = get_user_by_id(uid)
        if invited_user:
            invited_users.append(to_public_user(invited_user))

    group = {
        "id": new_id("IG"),
        "name": name,
        "interest": interest,
        "city": city,
        "country": country,
        "description": normalize_text(payload.get("description")),
        "visibility": visibility,
        "campusOnly": visibility == INTEREST_VISIBILITY_CAMPUS,
        "campusName": campus_name,
        "allowedUserIds": allowed_user_ids if visibility == INTEREST_VISIBILITY_INVITE else [],
        "invitedUsers": invited_users if visibility == INTEREST_VISIBILITY_INVITE else [],
        "creator": to_public_user(user),
        "members": [to_public_user(user)],
        "nextMeetupAt": ensure_iso_datetime(payload.get("nextMeetupAt")) or (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
        "nextActivity": None,
        "activities": [],
        "messages": [],
        "createdAt": now_iso(),
    }
    upsert_doc("interest_groups", group, owner_id=user["id"])
    return group


@app.post("/api/interest/groups/{group_id}/join")
def join_interest_group(group_id: str, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    group = get_doc("interest_groups", group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found.")
    if not can_join_interest_group(group, user):
        raise HTTPException(status_code=403, detail=interest_group_join_denied_reason(group))
    members = group.get("members") if isinstance(group.get("members"), list) else []
    if not any(m.get("id") == user["id"] for m in members if isinstance(m, dict)):
        members.append(to_public_user(user))
    group["members"] = members
    if resolve_interest_group_visibility(group) == INTEREST_VISIBILITY_INVITE:
        allowed = group.get("allowedUserIds") if isinstance(group.get("allowedUserIds"), list) else []
        if user["id"] not in allowed:
            allowed.append(user["id"])
        group["allowedUserIds"] = allowed
    replace_doc("interest_groups", group_id, group)
    return group


@app.get("/api/interest/groups/{group_id}/messages")
def get_interest_group_messages(group_id: str, user: Dict[str, Any] = Depends(auth_user)) -> List[Dict[str, Any]]:
    group = get_doc("interest_groups", group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found.")
    members = group.get("members") if isinstance(group.get("members"), list) else []
    if not any(m.get("id") == user["id"] for m in members if isinstance(m, dict)):
        raise HTTPException(status_code=403, detail="Not a group member.")
    return (group.get("messages") if isinstance(group.get("messages"), list) else [])[-200:]


@app.post("/api/interest/groups/{group_id}/messages")
def post_interest_group_message(group_id: str, payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    group = get_doc("interest_groups", group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found.")
    content = normalize_text(payload.get("content"))
    if not content:
        raise HTTPException(status_code=400, detail="Message content is required.")
    members = group.get("members") if isinstance(group.get("members"), list) else []
    if not any(m.get("id") == user["id"] for m in members if isinstance(m, dict)):
        raise HTTPException(status_code=403, detail="Not a group member.")

    message = {
        "id": new_id("IGM"),
        "content": content[:2000],
        "user": to_public_user(user),
        "geo": parse_geo(payload.get("geo")),
        "createdAt": now_iso(),
    }
    msgs = group.get("messages") if isinstance(group.get("messages"), list) else []
    msgs.append(message)
    group["messages"] = msgs[-600:]
    replace_doc("interest_groups", group_id, group)
    return message


def build_interest_group_activity(group: Dict[str, Any], payload: Dict[str, Any], user: Dict[str, Any]) -> Dict[str, Any]:
    theme = normalize_text(payload.get("theme") or payload.get("title"))
    if not theme:
        raise HTTPException(status_code=400, detail="Activity theme is required.")
    start_at = ensure_iso_datetime(payload.get("startAt"))
    if not start_at:
        raise HTTPException(status_code=400, detail="Activity startAt is required.")
    end_at = ensure_iso_datetime(payload.get("endAt"))

    venue_name = normalize_text(payload.get("venueName") or payload.get("placeName") or payload.get("locationName"))
    city = normalize_text(payload.get("city") or group.get("city"))
    country = normalize_text(payload.get("country") or group.get("country"))
    if not city or not country:
        raise HTTPException(status_code=400, detail="Activity city and country are required.")

    geo = parse_geo(payload.get("geo"))
    if not geo:
        lat = parse_float(payload.get("lat"))
        lng = parse_float(payload.get("lng"))
        if lat is not None and lng is not None:
            geo = {"lat": lat, "lng": lng, "label": normalize_text(payload.get("locationLabel") or venue_name)}

    maps_url = normalize_text(payload.get("googleMapsUri") or payload.get("mapsUrl"))
    if not maps_url:
        if geo:
            maps_url = f"https://www.google.com/maps?q={geo['lat']:.5f},{geo['lng']:.5f}"
        else:
            maps_url = make_google_search_url(f"{venue_name} {city} {country}")

    return {
        "id": new_id("IGA"),
        "theme": theme,
        "description": normalize_text(payload.get("description")),
        "startAt": start_at,
        "endAt": end_at,
        "venueName": venue_name,
        "city": city,
        "country": country,
        "geo": geo,
        "googleMapsUri": maps_url,
        "createdBy": to_public_user(user),
        "createdAt": now_iso(),
    }


def build_interest_activity_message(activity: Dict[str, Any], user: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
    title = normalize_text(activity.get("theme"))
    start_at = normalize_text(activity.get("startAt"))
    venue_name = normalize_text(activity.get("venueName"))
    city = normalize_text(activity.get("city"))
    country = normalize_text(activity.get("country"))
    location_text = " ".join([p for p in [venue_name, city, country] if p]).strip()
    summary = normalize_text(payload.get("content"))
    if not summary:
        summary = "\n".join(
            [
                f"【社群下次活动】{title}",
                f"时间：{start_at}",
                f"地点：{location_text or '地点待定'}",
                "已发布到群内，欢迎直接在此接龙报名。",
            ]
        )
    return {
        "id": new_id("IGM"),
        "kind": "interest_activity",
        "content": summary[:2000],
        "activity": activity,
        "user": to_public_user(user),
        "geo": activity.get("geo"),
        "createdAt": now_iso(),
    }


@app.post("/api/interest/groups/{group_id}/activities")
def post_interest_group_activity(group_id: str, payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    group = get_doc("interest_groups", group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found.")
    members = group.get("members") if isinstance(group.get("members"), list) else []
    if not any(m.get("id") == user["id"] for m in members if isinstance(m, dict)):
        raise HTTPException(status_code=403, detail="Not a group member.")

    activity = build_interest_group_activity(group, payload, user)
    message = build_interest_activity_message(activity, user, payload)

    activities = group.get("activities") if isinstance(group.get("activities"), list) else []
    activities.append(activity)
    group["activities"] = activities[-200:]
    group["nextActivity"] = activity
    group["nextMeetupAt"] = activity.get("startAt") or group.get("nextMeetupAt")

    messages = group.get("messages") if isinstance(group.get("messages"), list) else []
    messages.append(message)
    group["messages"] = messages[-600:]
    replace_doc("interest_groups", group_id, group)

    return {
        "ok": True,
        "groupId": group_id,
        "activity": activity,
        "message": message,
    }


# -----------------------------
# Travel posts + route
# -----------------------------


@app.post("/api/travel/posts")
def create_travel_post(payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    from_country = normalize_text(payload.get("fromCountry"))
    to_country = normalize_text(payload.get("toCountry"))
    to_city = normalize_text(payload.get("toCity"))
    start_date = normalize_text(payload.get("startDate"))
    end_date = normalize_text(payload.get("endDate"))
    if not from_country or not to_country or not to_city or not start_date or not end_date:
        raise HTTPException(status_code=400, detail="fromCountry, toCountry, toCity, startDate, endDate are required.")

    post = {
        "id": new_id("TR"),
        "fromCountry": from_country,
        "toCountry": to_country,
        "toCity": to_city,
        "startDate": start_date,
        "endDate": end_date,
        "budget": normalize_text(payload.get("budget")),
        "note": normalize_text(payload.get("note")),
        "tags": parse_tags(payload.get("tags")),
        "geo": parse_geo(payload.get("geo")),
        "creator": to_public_user(user),
        "members": [to_public_user(user)],
        "createdAt": now_iso(),
    }
    upsert_doc("travel_posts", post, owner_id=user["id"])
    return post


@app.get("/api/travel/posts")
def get_travel_posts(toCountry: str = "", toCity: str = "") -> List[Dict[str, Any]]:
    posts = list_docs("travel_posts", limit=500)
    if toCountry:
        posts = [p for p in posts if normalize_key(toCountry) in normalize_key(p.get("toCountry"))]
    if toCity:
        posts = [p for p in posts if normalize_key(toCity) in normalize_key(p.get("toCity"))]
    return posts


@app.post("/api/travel/posts/{post_id}/join")
def join_travel_post(post_id: str, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    post = get_doc("travel_posts", post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    members = post.get("members") if isinstance(post.get("members"), list) else []
    if not any(m.get("id") == user["id"] for m in members if isinstance(m, dict)):
        members.append(to_public_user(user))
    post["members"] = members
    replace_doc("travel_posts", post_id, post)
    return post


@app.post("/api/travel/posts/{post_id}/route")
def generate_travel_post_route(post_id: str, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    post = get_doc("travel_posts", post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    intent = {
        "companion": "朋友",
        "people": str(max(2, len(post.get("members") or []))),
        "budget": post.get("budget") or "中预算",
        "timeSlot": "多日旅行",
        "interest": (post.get("tags") or ["city walk"])[0],
        "area": f"{post.get('toCity', '')}, {post.get('toCountry', '')}",
        "city": post.get("toCity"),
        "country": post.get("toCountry"),
        "startDate": post.get("startDate"),
        "endDate": post.get("endDate"),
        "fromCountry": post.get("fromCountry"),
    }
    plan = generate_plan(intent)
    return {"plan": plan, "post": post}


@app.get("/api/travel/matches")
def get_travel_matches(toCountry: str = "", toCity: str = "", tag: str = "") -> List[Dict[str, Any]]:
    posts = list_docs("travel_posts", limit=500)
    if toCountry:
        posts = [p for p in posts if normalize_key(toCountry) in normalize_key(p.get("toCountry"))]
    if toCity:
        posts = [p for p in posts if normalize_key(toCity) in normalize_key(p.get("toCity"))]
    if tag:
        posts = [p for p in posts if any(normalize_key(tag) in normalize_key(t) for t in (p.get("tags") or []))]
    return posts[:200]


@app.post("/api/travel/doc-route")
def generate_doc_route(payload: Dict[str, Any], _user: Optional[Dict[str, Any]] = Depends(optional_auth_user)) -> Dict[str, Any]:
    city = normalize_text(payload.get("city"))
    country = normalize_text(payload.get("country"))
    interest = normalize_text(payload.get("interest"))
    doc_text = normalize_text(payload.get("documentText"))

    if not city or not country:
        raise HTTPException(status_code=400, detail="city and country are required.")

    extracted = extract_points_from_text(doc_text, limit=16)
    intent = {
        "companion": "朋友",
        "people": "3",
        "budget": "中预算",
        "timeSlot": "多日旅行" if (payload.get("startDate") and payload.get("endDate")) else "周末全天",
        "interest": interest or "city walk",
        "area": f"{city}, {country}",
        "city": city,
        "country": country,
        "startDate": normalize_text(payload.get("startDate")),
        "endDate": normalize_text(payload.get("endDate")),
        "fromCountry": normalize_text(payload.get("fromCountry")),
    }
    plan = generate_plan(
        intent,
        seed_points=extracted if extracted else None,
        document_meta={
            "source": "document",
            "extractedPoints": extracted,
            "unresolvedPoints": [],
        },
    )
    return {"plan": plan}


@app.post("/api/travel/image-route")
def generate_image_route(payload: Dict[str, Any], _user: Optional[Dict[str, Any]] = Depends(optional_auth_user)) -> Dict[str, Any]:
    city = normalize_text(payload.get("city"))
    country = normalize_text(payload.get("country"))
    interest = normalize_text(payload.get("interest"))
    if not city or not country:
        raise HTTPException(status_code=400, detail="city and country are required.")

    guide_points = get_guide_points(city, country, limit=8)
    intent = {
        "companion": "朋友",
        "people": "2",
        "budget": "中预算",
        "timeSlot": "周末全天",
        "interest": interest or "city walk",
        "area": f"{city}, {country}",
        "city": city,
        "country": country,
        "startDate": normalize_text(payload.get("startDate")),
        "endDate": normalize_text(payload.get("endDate")),
        "fromCountry": normalize_text(payload.get("fromCountry")),
    }
    plan = generate_plan(
        intent,
        seed_points=guide_points if guide_points else None,
        document_meta={
            "source": "image",
            "extractedPoints": guide_points,
            "unresolvedPoints": [],
        },
    )
    return {"plan": plan}


# -----------------------------
# Plan + activities
# -----------------------------


@app.post("/api/generate-plan")
def api_generate_plan(payload: Dict[str, Any], request: Request) -> Dict[str, Any]:
    required = ["companion", "people", "budget", "timeSlot", "interest", "area"]
    if not all(normalize_text(payload.get(k)) for k in required):
        # keep compatibility: if city/country present, allow empty area
        if not (normalize_text(payload.get("city")) and normalize_text(payload.get("country"))):
            raise HTTPException(status_code=400, detail="Invalid intent payload")

    seed_points_raw = payload.get("seedPoints") if isinstance(payload.get("seedPoints"), list) else []
    manual_places = payload.get("manualPlaces") if isinstance(payload.get("manualPlaces"), list) else []
    seed_points: List[str] = []
    for value in seed_points_raw:
        text = normalize_text(value)
        if text and text not in seed_points:
            seed_points.append(text)
    for item in manual_places:
        if not isinstance(item, dict):
            continue
        text = normalize_text(item.get("name") or item.get("point") or item.get("matchedName"))
        if text and text not in seed_points:
            seed_points.append(text)

    plan = generate_plan(payload, seed_points=seed_points if seed_points else None)

    user = optional_auth_user(request)
    if user:
        memory = ensure_preference_memory(user)
        for item in manual_places[:40]:
            if isinstance(item, dict):
                if not normalize_text(item.get("city")):
                    item["city"] = normalize_text(payload.get("city"))
                if not normalize_text(item.get("country")):
                    item["country"] = normalize_text(payload.get("country"))
                upsert_manual_place(memory, item)
        if seed_points and not manual_places:
            for name in seed_points[:20]:
                upsert_manual_place(
                    memory,
                    {
                        "name": name,
                        "city": normalize_text(payload.get("city")),
                        "country": normalize_text(payload.get("country")),
                        "source": "manual_seed",
                    },
                )
        route_places = plan.get("route") if isinstance(plan.get("route"), list) else []
        track_preference_memory(memory, "plan_view", route_places)
        user["preferenceMemory"] = memory
        update_user(user)

    return plan


@app.post("/api/create-activity")
def api_create_activity(payload: Dict[str, Any], request: Request) -> Dict[str, Any]:
    if not isinstance(payload, dict) or not isinstance(payload.get("route"), list) or not payload.get("route"):
        raise HTTPException(status_code=400, detail="Invalid plan payload")
    user = optional_auth_user(request)
    return create_activity(payload, user=user)


@app.get("/api/activities/{code}")
def get_activity_by_code(code: str) -> Dict[str, Any]:
    activities = list_docs("activities", limit=2000)
    target = next((a for a in activities if normalize_key(a.get("code")) == normalize_key(code)), None)
    if not target:
        raise HTTPException(status_code=404, detail="Activity not found.")
    return target


# -----------------------------
# Summarize messages -> plan
# -----------------------------


@app.post("/api/im/summarize-plan")
def summarize_plan(payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    scope = normalize_text(payload.get("scope") or "global")
    group_id = normalize_text(payload.get("groupId"))
    dm_user_id = normalize_text(payload.get("dmUserId"))
    limit = clamp(to_int(payload.get("limit"), 50), 1, 200)

    messages: List[Dict[str, Any]] = []
    if scope == "global":
        messages = list(reversed(list_docs("messages", limit=limit)))
    elif scope == "campus_group":
        group = get_doc("campus_groups", group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found.")
        members = group.get("members") if isinstance(group.get("members"), list) else []
        if not any(m.get("id") == user["id"] for m in members if isinstance(m, dict)):
            raise HTTPException(status_code=403, detail="Not a group member.")
        messages = (group.get("messages") if isinstance(group.get("messages"), list) else [])[-limit:]
    elif scope == "interest_group":
        group = get_doc("interest_groups", group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found.")
        members = group.get("members") if isinstance(group.get("members"), list) else []
        if not any(m.get("id") == user["id"] for m in members if isinstance(m, dict)):
            raise HTTPException(status_code=403, detail="Not a group member.")
        messages = (group.get("messages") if isinstance(group.get("messages"), list) else [])[-limit:]
    elif scope == "dm":
        if not dm_user_id:
            raise HTTPException(status_code=400, detail="dmUserId required for dm scope.")
        pair = normalize_pair(user["id"], dm_user_id)
        all_dms = [m for m in list_docs("direct_messages", limit=5000) if m.get("pair") == pair]
        all_dms.sort(key=lambda x: x.get("createdAt", ""))
        messages = all_dms[-limit:]
    else:
        raise HTTPException(status_code=400, detail="Invalid scope.")

    if not messages:
        raise HTTPException(status_code=400, detail="No messages to summarize.")

    intent = infer_intent_from_messages(messages)
    plan = generate_plan(intent)
    return {"intent": intent, "plan": plan, "messageCount": len(messages)}


# -----------------------------
# Local events + inspirations + official feed
# -----------------------------


@app.get("/api/local/events")
def get_local_events(city: str = "", country: str = "", category: str = "", q: str = "") -> List[Dict[str, Any]]:
    events = list_docs("local_events", limit=500)
    if city:
        events = [e for e in events if normalize_key(city) in normalize_key(e.get("city"))]
    if country:
        events = [e for e in events if normalize_key(country) in normalize_key(e.get("country"))]
    if category:
        events = [e for e in events if normalize_key(category) in normalize_key(e.get("category"))]
    if q:
        key = normalize_key(q)
        events = [e for e in events if key in normalize_key(f"{e.get('title', '')} {e.get('description', '')} {','.join(e.get('tags') or [])}")]
    filtered: List[Dict[str, Any]] = []
    for item in events:
        source = normalize_key(item.get("source"))
        cat = normalize_key(item.get("category"))
        if source == "activity_route" or "route" in cat:
            settings = item.get("settings") if isinstance(item.get("settings"), dict) else {}
            privacy = normalize_privacy(settings.get("privacy") or item.get("privacy"), default="私密")
            is_public = parse_bool(item.get("isPublic"), default=(privacy == "公开"))
            if not is_public:
                continue
        filtered.append(item)
    events = filtered
    return events


@app.get("/api/discovery/upcoming-routes")
def discovery_upcoming_routes(city: str = "", country: str = "", limit: int = 10) -> List[Dict[str, Any]]:
    safe_limit = clamp(limit, 1, 30)
    events = list_docs("local_events", limit=1200)
    now_dt = datetime.now(timezone.utc)
    result: List[Tuple[datetime, Dict[str, Any]]] = []

    for item in events:
        source = normalize_key(item.get("source"))
        category = normalize_key(item.get("category"))
        if source != "activity_route" and "route" not in category:
            continue
        settings = item.get("settings") if isinstance(item.get("settings"), dict) else {}
        privacy = normalize_privacy(settings.get("privacy") or item.get("privacy"), default="私密")
        is_public = parse_bool(item.get("isPublic"), default=(privacy == "公开"))
        if not is_public:
            continue
        if city and normalize_key(city) not in normalize_key(item.get("city")):
            continue
        if country and normalize_key(country) not in normalize_key(item.get("country")):
            continue

        start_dt = parse_datetime(item.get("startAt")) or parse_datetime(item.get("createdAt"))
        if not start_dt:
            continue
        if start_dt < now_dt - timedelta(hours=8):
            continue
        result.append((start_dt, item))

    result.sort(key=lambda x: x[0])
    return [item for _, item in result[:safe_limit]]


@app.post("/api/local/events")
def create_local_event(payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    title = normalize_text(payload.get("title"))
    city = normalize_text(payload.get("city"))
    country = normalize_text(payload.get("country"))
    start_at = ensure_iso_datetime(payload.get("startAt"))
    end_at = ensure_iso_datetime(payload.get("endAt"))
    if not title or not city or not country or not start_at or not end_at:
        raise HTTPException(status_code=400, detail="title, city, country, startAt, endAt are required.")

    event = {
        "id": new_id("EVT"),
        "title": title,
        "category": normalize_text(payload.get("category") or "event"),
        "city": city,
        "country": country,
        "venueName": normalize_text(payload.get("venueName")),
        "startAt": start_at,
        "endAt": end_at,
        "description": normalize_text(payload.get("description")),
        "price": float(payload.get("price") or 0),
        "currency": normalize_text(payload.get("currency") or "SGD"),
        "ticketUrl": normalize_text(payload.get("ticketUrl")) or make_google_search_url(f"{title} {city} {country}"),
        "tags": parse_tags(payload.get("tags")),
        "source": normalize_text(payload.get("source") or "user"),
        "creator": to_public_user(user),
        "rsvps": [],
        "createdAt": now_iso(),
        "geo": parse_geo(payload.get("geo")),
    }
    upsert_doc("local_events", event, owner_id=user["id"])
    return event


@app.post("/api/local/events/{event_id}/rsvp")
def rsvp_local_event(event_id: str, payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    status = normalize_text(payload.get("status") or "going").lower()
    if status not in {"going", "interested", "not_going"}:
        raise HTTPException(status_code=400, detail="Invalid RSVP status.")
    event = get_doc("local_events", event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    rsvps = event.get("rsvps") if isinstance(event.get("rsvps"), list) else []
    rsvps = [r for r in rsvps if r.get("userId") != user["id"]]
    rsvps.append({"userId": user["id"], "status": status, "at": now_iso(), "user": to_public_user(user)})
    event["rsvps"] = rsvps
    replace_doc("local_events", event_id, event)
    return event


def can_access_local_event_chat(event: Dict[str, Any], user_id: str) -> bool:
    creator = event.get("creator") if isinstance(event.get("creator"), dict) else {}
    if normalize_text(creator.get("id")) == user_id:
        return True
    rsvps = event.get("rsvps") if isinstance(event.get("rsvps"), list) else []
    for r in rsvps:
        if not isinstance(r, dict):
            continue
        if normalize_text(r.get("userId")) != user_id:
            continue
        status = normalize_key(r.get("status") or "going")
        if status in {"going", "interested"}:
            return True
    return False


@app.get("/api/local/events/joined")
def get_joined_local_events(user: Dict[str, Any] = Depends(auth_user), limit: int = 20) -> List[Dict[str, Any]]:
    safe_limit = clamp(limit, 1, 80)
    events = list_docs("local_events", limit=1200)
    now_dt = datetime.now(timezone.utc)
    collected: List[Tuple[datetime, Dict[str, Any]]] = []

    for item in events:
        if not can_access_local_event_chat(item, user["id"]):
            continue
        start_dt = parse_datetime(item.get("startAt")) or parse_datetime(item.get("createdAt")) or now_dt
        if start_dt < now_dt - timedelta(days=7):
            continue
        collected.append((start_dt, item))

    collected.sort(key=lambda x: x[0])
    return [event for _, event in collected[:safe_limit]]


@app.get("/api/local/events/{event_id}")
def get_local_event_detail(event_id: str, request: Request) -> Dict[str, Any]:
    event = get_doc("local_events", event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    user = optional_auth_user(request)
    if user and can_access_local_event_chat(event, user["id"]):
        return event
    # public-safe detail for not-joined users
    safe = dict(event)
    safe.pop("messages", None)
    return safe


@app.get("/api/local/events/{event_id}/messages")
def get_local_event_messages(event_id: str, user: Dict[str, Any] = Depends(auth_user)) -> List[Dict[str, Any]]:
    event = get_doc("local_events", event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    if not can_access_local_event_chat(event, user["id"]):
        raise HTTPException(status_code=403, detail="Not joined this event.")
    messages = event.get("messages") if isinstance(event.get("messages"), list) else []
    return messages[-300:]


@app.post("/api/local/events/{event_id}/messages")
def post_local_event_message(event_id: str, payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    event = get_doc("local_events", event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    if not can_access_local_event_chat(event, user["id"]):
        raise HTTPException(status_code=403, detail="Not joined this event.")
    content = normalize_text(payload.get("content"))
    if not content:
        raise HTTPException(status_code=400, detail="Message content is required.")
    message = {
        "id": new_id("EVM"),
        "content": content[:2000],
        "user": to_public_user(user),
        "geo": parse_geo(payload.get("geo")),
        "createdAt": now_iso(),
    }
    msgs = event.get("messages") if isinstance(event.get("messages"), list) else []
    msgs.append(message)
    event["messages"] = msgs[-600:]
    replace_doc("local_events", event_id, event)
    return message


@app.get("/api/inspirations")
def get_inspirations(city: str = "", country: str = "", tag: str = "", q: str = "") -> List[Dict[str, Any]]:
    posts = list_docs("inspirations", limit=500)
    if city:
        posts = [p for p in posts if normalize_key(city) in normalize_key(p.get("city"))]
    if country:
        posts = [p for p in posts if normalize_key(country) in normalize_key(p.get("country"))]
    if tag:
        key = normalize_key(tag)
        posts = [p for p in posts if any(key in normalize_key(t) for t in (p.get("tags") or []))]
    if q:
        key = normalize_key(q)
        posts = [
            p
            for p in posts
            if key
            in normalize_key(
                " ".join(
                    [
                        str(p.get("title", "")),
                        str(p.get("content", "")),
                        " ".join(p.get("photoUrls") if isinstance(p.get("photoUrls"), list) else []),
                        " ".join(
                            [
                                str(x.get("url", ""))
                                for x in (p.get("videoLinks") if isinstance(p.get("videoLinks"), list) else [])
                                if isinstance(x, dict)
                            ]
                        ),
                    ]
                )
            )
        ]
    normalized: List[Dict[str, Any]] = []
    for p in posts:
        item = dict(p)
        photos = parse_photo_urls(item.get("photoUrls") or item.get("photos") or item.get("images"), limit=9)
        videos = parse_video_links(item.get("videoLinks") or item.get("videos"), limit=4)
        item["photoUrls"] = photos
        item["videoLinks"] = videos
        item["coverImageUrl"] = normalize_public_url(item.get("coverImageUrl")) or (photos[0] if photos else "")
        normalized.append(item)
    return normalized


@app.post("/api/inspirations")
def create_inspiration(payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    title = normalize_text(payload.get("title"))
    content = normalize_text(payload.get("content"))
    city = normalize_text(payload.get("city"))
    country = normalize_text(payload.get("country"))
    if not title or not content or not city or not country:
        raise HTTPException(status_code=400, detail="title, content, city, country are required.")
    photo_urls = parse_photo_urls(payload.get("photoUrls") or payload.get("photos") or payload.get("images"), limit=9)
    cover = normalize_public_url(payload.get("coverImageUrl"))
    if cover and all(normalize_key(cover) != normalize_key(x) for x in photo_urls):
        photo_urls.insert(0, cover)
    video_links = parse_video_links(payload.get("videoLinks") or payload.get("videos"), limit=4)
    post = {
        "id": new_id("INS"),
        "title": title,
        "content": content[:5000],
        "city": city,
        "country": country,
        "tags": parse_tags(payload.get("tags")),
        "places": parse_tags(payload.get("places"), limit=20),
        "photoUrls": photo_urls,
        "videoLinks": video_links,
        "coverImageUrl": photo_urls[0] if photo_urls else "",
        "source": normalize_text(payload.get("source") or "user"),
        "creator": to_public_user(user),
        "likes": [],
        "geo": parse_geo(payload.get("geo")),
        "createdAt": now_iso(),
    }
    upsert_doc("inspirations", post, owner_id=user["id"])
    return post


@app.post("/api/inspirations/{post_id}/like")
def like_inspiration(post_id: str, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    post = get_doc("inspirations", post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Inspiration not found.")
    likes = post.get("likes") if isinstance(post.get("likes"), list) else []
    if user["id"] not in likes:
        likes.append(user["id"])
    post["likes"] = likes
    replace_doc("inspirations", post_id, post)
    return post


@app.post("/api/official/posts")
def create_official_post(payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    title = normalize_text(payload.get("title"))
    content = normalize_text(payload.get("content"))
    if not title or not content:
        raise HTTPException(status_code=400, detail="title and content are required.")
    post = {
        "id": new_id("OFF"),
        "title": title,
        "content": content,
        "source": normalize_text(payload.get("source") or "official"),
        "tags": parse_tags(payload.get("tags")),
        "geo": parse_geo(payload.get("geo")),
        "publisher": to_public_user(user),
        "createdAt": now_iso(),
    }
    upsert_doc("official_posts", post, owner_id=user["id"])
    return post


@app.get("/api/official/posts")
def get_official_posts() -> List[Dict[str, Any]]:
    return list_docs("official_posts", limit=200)


@app.get("/api/aggregated/feed")
def get_aggregated_feed() -> List[Dict[str, Any]]:
    official = [{"type": "official", **x} for x in list_docs("official_posts", limit=100)]
    travel = [{"type": "travel", **x} for x in list_docs("travel_posts", limit=100)]
    inspirations = [{"type": "inspiration", **x} for x in list_docs("inspirations", limit=100)]
    events = [{"type": "local_event", **x} for x in list_docs("local_events", limit=100)]
    merged = official + travel + inspirations + events
    merged.sort(key=lambda x: x.get("startAt") or x.get("createdAt") or "", reverse=True)
    return merged[:200]


@app.post("/api/open/publish")
def open_publish(payload: Dict[str, Any], request: Request) -> Dict[str, Any]:
    key = request.headers.get("x-platform-key", "")
    if key != OPEN_PUBLISH_KEY:
        raise HTTPException(status_code=401, detail="Invalid platform key.")

    doc_type = normalize_text(payload.get("type"))
    if doc_type == "official":
        title = normalize_text(payload.get("title"))
        content = normalize_text(payload.get("content"))
        if not title or not content:
            raise HTTPException(status_code=400, detail="title and content are required.")
        post = {
            "id": new_id("OFF"),
            "title": title,
            "content": content,
            "source": normalize_text(payload.get("source") or "external"),
            "tags": parse_tags(payload.get("tags")),
            "geo": parse_geo(payload.get("geo")),
            "publisher": {"id": "external", "username": "external_platform", "displayName": "External Platform"},
            "createdAt": now_iso(),
        }
        upsert_doc("official_posts", post)
        return post

    if doc_type == "local_event":
        title = normalize_text(payload.get("title"))
        city = normalize_text(payload.get("city"))
        country = normalize_text(payload.get("country"))
        start_at = ensure_iso_datetime(payload.get("startAt"))
        end_at = ensure_iso_datetime(payload.get("endAt"))
        if not title or not city or not country or not start_at or not end_at:
            raise HTTPException(status_code=400, detail="title, city, country, startAt, endAt are required.")
        event = {
            "id": new_id("EVT"),
            "title": title,
            "category": normalize_text(payload.get("category") or "event"),
            "city": city,
            "country": country,
            "venueName": normalize_text(payload.get("venueName")),
            "startAt": start_at,
            "endAt": end_at,
            "description": normalize_text(payload.get("content")),
            "price": 0,
            "currency": "SGD",
            "ticketUrl": normalize_text(payload.get("ticketUrl")) or make_google_search_url(f"{title} {city} {country}"),
            "tags": parse_tags(payload.get("tags")),
            "source": normalize_text(payload.get("source") or "external"),
            "creator": {"id": "external", "username": "external_platform", "displayName": "External Platform"},
            "rsvps": [],
            "createdAt": now_iso(),
            "geo": parse_geo(payload.get("geo")),
        }
        upsert_doc("local_events", event)
        return event

    if doc_type == "inspiration":
        title = normalize_text(payload.get("title"))
        content = normalize_text(payload.get("content"))
        city = normalize_text(payload.get("city"))
        country = normalize_text(payload.get("country"))
        if not title or not content or not city or not country:
            raise HTTPException(status_code=400, detail="title, content, city, country are required.")
        photo_urls = parse_photo_urls(payload.get("photoUrls") or payload.get("photos") or payload.get("images"), limit=9)
        cover = normalize_public_url(payload.get("coverImageUrl"))
        if cover and all(normalize_key(cover) != normalize_key(x) for x in photo_urls):
            photo_urls.insert(0, cover)
        video_links = parse_video_links(payload.get("videoLinks") or payload.get("videos"), limit=4)
        post = {
            "id": new_id("INS"),
            "title": title,
            "content": content[:5000],
            "city": city,
            "country": country,
            "tags": parse_tags(payload.get("tags")),
            "places": parse_tags(payload.get("places"), limit=20),
            "photoUrls": photo_urls,
            "videoLinks": video_links,
            "coverImageUrl": photo_urls[0] if photo_urls else "",
            "source": normalize_text(payload.get("source") or "external"),
            "creator": {"id": "external", "username": "external_platform", "displayName": "External Platform"},
            "likes": [],
            "geo": parse_geo(payload.get("geo")),
            "createdAt": now_iso(),
        }
        upsert_doc("inspirations", post)
        return post

    raise HTTPException(status_code=400, detail="Unsupported publish type.")


@app.get("/api/open/feed")
def open_feed() -> List[Dict[str, Any]]:
    return get_aggregated_feed()


@app.get("/api/mook/guides")
def mook_guides(country: str = "", city: str = "", tag: str = "", minDays: str = "", maxDays: str = "", q: str = "") -> List[Dict[str, Any]]:
    guides = list_docs("mook_guides", limit=500)
    if country:
        guides = [g for g in guides if normalize_key(country) in normalize_key(g.get("country"))]
    if city:
        guides = [g for g in guides if normalize_key(city) in normalize_key(g.get("city"))]
    if tag:
        key = normalize_key(tag)
        guides = [g for g in guides if any(key in normalize_key(t) for t in (g.get("tags") or []))]
    if minDays:
        min_days = to_int(minDays, 0)
        guides = [g for g in guides if to_int(g.get("days"), 0) >= min_days]
    if maxDays:
        max_days = to_int(maxDays, 999)
        guides = [g for g in guides if to_int(g.get("days"), 999) <= max_days]
    if q:
        key = normalize_key(q)
        guides = [g for g in guides if key in normalize_key(f"{g.get('title', '')} {g.get('summary', '')} {' '.join(g.get('tags') or [])}")]
    return guides


@app.get("/api/mook/guides/{guide_id}")
def mook_guide_detail(guide_id: str) -> Dict[str, Any]:
    guide = get_doc("mook_guides", guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found.")
    return guide


# -----------------------------
# Discovery + recommendations
# -----------------------------


@app.get("/api/discovery/places")
def discovery_places(
    q: str = "",
    city: str = "Singapore",
    country: str = "Singapore",
    category: str = "",
    limit: int = 8,
) -> List[Dict[str, Any]]:
    if not normalize_text(q) and not normalize_text(category):
        raise HTTPException(status_code=400, detail="q or category is required.")
    places = discover_realtime_local_places(
        q=normalize_text(q),
        city=normalize_text(city),
        country=normalize_text(country),
        category=normalize_text(category),
        limit=limit,
    )
    return places


@app.get("/api/places/reverse")
def reverse_place(
    lat: float,
    lng: float,
    city: str = "",
    country: str = "",
) -> Dict[str, Any]:
    if lat < -90 or lat > 90 or lng < -180 or lng > 180:
        raise HTTPException(status_code=400, detail="Invalid coordinates.")
    city_text = normalize_text(city)
    country_text = normalize_text(country)
    if not city_text or not country_text:
        inferred_city, inferred_country = infer_city_country(f"{city_text}, {country_text}".strip(", "))
        city_text = city_text or inferred_city
        country_text = country_text or inferred_country

    nearby = google_places_nearby_search(lat, lng, radius=350)
    if nearby:
        best = sorted(
            nearby,
            key=lambda p: haversine_km(
                lat,
                lng,
                float((p.get("geometry") or {}).get("location", {}).get("lat") or lat),
                float((p.get("geometry") or {}).get("location", {}).get("lng") or lng),
            ),
        )[0]
        payload = build_place_payload(best, city_text or "Unknown", country_text or "Unknown", category="", reason="地图标点就近匹配")
        if payload.get("lat") is None:
            payload["lat"] = lat
        if payload.get("lng") is None:
            payload["lng"] = lng
        return payload

    lat_fmt = f"{lat:.5f}"
    lng_fmt = f"{lng:.5f}"
    name = f"地图标点 {lat_fmt}, {lng_fmt}"
    return {
        "point": name,
        "matchedName": name,
        "placeId": "",
        "lat": lat,
        "lng": lng,
        "verified": False,
        "source": "Map Pin",
        "intro": "基于地图手动标点添加，建议后续确认具体门店。",
        "primaryType": "manual_point",
        "rating": None,
        "userRatingCount": None,
        "city": city_text,
        "country": country_text,
        "googleMapsUri": f"https://www.google.com/maps?q={lat_fmt},{lng_fmt}",
        "recommendReason": "手动地图标点",
    }


@app.get("/api/geo/reverse-location")
def reverse_location(lat: float, lng: float) -> Dict[str, Any]:
    if lat < -90 or lat > 90 or lng < -180 or lng > 180:
        raise HTTPException(status_code=400, detail="Invalid coordinates.")
    city, country, display = google_reverse_geocode_city_country(lat, lng)
    if not city or not country:
        nom_city, nom_country, nom_display = nominatim_reverse_geocode_city_country(lat, lng)
        city = city or nom_city
        country = country or nom_country
        display = display or nom_display
    return {
        "lat": lat,
        "lng": lng,
        "city": city,
        "country": country,
        "displayName": display,
    }


@app.get("/api/preferences/manual-places")
def get_manual_places(
    q: str = "",
    city: str = "",
    country: str = "",
    limit: int = 12,
    user: Dict[str, Any] = Depends(auth_user),
) -> List[Dict[str, Any]]:
    memory = ensure_preference_memory(user)
    return suggest_manual_places(memory, q, city, country, clamp(limit, 1, 30))


@app.post("/api/preferences/manual-places")
def save_manual_places(payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    memory = ensure_preference_memory(user)
    items = payload.get("places") if isinstance(payload.get("places"), list) else [payload]
    saved: List[Dict[str, Any]] = []

    for raw in items[:40]:
        item: Dict[str, Any]
        if isinstance(raw, dict):
            item = dict(raw)
        else:
            name = normalize_text(raw)
            if not name:
                continue
            item = {"name": name}
        item.setdefault("city", normalize_text(payload.get("city")))
        item.setdefault("country", normalize_text(payload.get("country")))
        merged = upsert_manual_place(memory, item)
        if merged:
            saved.append(merged)

    user["preferenceMemory"] = memory
    update_user(user)
    return {
        "ok": True,
        "saved": saved,
        "total": len(memory.get("manualPlaces") if isinstance(memory.get("manualPlaces"), list) else []),
        "updatedAt": memory.get("updatedAt"),
    }


@app.post("/api/preferences/track")
def preferences_track(payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    action_type = normalize_text(payload.get("actionType") or "generic")
    places = payload.get("places") if isinstance(payload.get("places"), list) else []
    memory = ensure_preference_memory(user)
    touched = track_preference_memory(memory, action_type, places)
    user["preferenceMemory"] = memory
    update_user(user)
    return {
        "ok": True,
        "touched": touched,
        "interactions": memory.get("interactions", 0),
        "updatedAt": memory.get("updatedAt"),
    }


def build_personalized_recommendations(user: Dict[str, Any], city: str, country: str, limit: int) -> List[Dict[str, Any]]:
    memory = ensure_preference_memory(user)
    interactions = int(memory.get("interactions") or 0)
    if interactions <= 0 or not isinstance(memory.get("places"), dict) or not memory.get("places"):
        fallback = discover_realtime_local_places(
            q="popular places",
            city=city or "Singapore",
            country=country or "Singapore",
            category="",
            limit=limit,
        )
        for f in fallback:
            f["recommendReason"] = "新用户默认热门推荐"
        return fallback

    top_places = sorted(
        list(memory.get("places", {}).values()),
        key=lambda x: float(x.get("score", 0)),
        reverse=True,
    )[:6]

    anchor_city = city
    anchor_country = country
    if not anchor_city or not anchor_country:
        city_scores = memory.get("cities", {}) if isinstance(memory.get("cities"), dict) else {}
        if city_scores:
            top_key = sorted(city_scores.items(), key=lambda x: float(x[1]), reverse=True)[0][0]
            parts = top_key.split("|")
            if len(parts) == 2:
                anchor_city = anchor_city or parts[0].title()
                anchor_country = anchor_country or parts[1].title()
    anchor_city = anchor_city or "Singapore"
    anchor_country = anchor_country or "Singapore"

    collected: List[Dict[str, Any]] = []
    for p in top_places:
        name = normalize_text(p.get("name"))
        if not name:
            continue
        pref_city = normalize_text(p.get("city")) or anchor_city
        pref_country = normalize_text(p.get("country")) or anchor_country
        found = discover_realtime_local_places(
            q=name,
            city=pref_city,
            country=pref_country,
            category=normalize_text(p.get("category")),
            limit=2,
            seed_points=[name],
        )
        for item in found:
            item["recommendReason"] = f"基于你最近常选：{name}"
            item["personalizedScore"] = int(float(item.get("allure", {}).get("score", 60)) + min(30, float(p.get("score", 0)) * 0.6))
            collected.append(item)

    if len(collected) < limit:
        extra = discover_realtime_local_places(
            q="popular places",
            city=anchor_city,
            country=anchor_country,
            category="",
            limit=limit,
        )
        for e in extra:
            e["recommendReason"] = e.get("recommendReason") or "根据你的历史偏好推荐"
            e["personalizedScore"] = int(e.get("allure", {}).get("score", 60))
            collected.append(e)

    dedup: Dict[str, Dict[str, Any]] = {}
    for item in collected:
        key = normalize_text(item.get("placeId")) or f"{normalize_key(item.get('point'))}|{item.get('lat')}|{item.get('lng')}"
        if key not in dedup or int(item.get("personalizedScore", 0)) > int(dedup[key].get("personalizedScore", 0)):
            dedup[key] = item

    ranked = list(dedup.values())
    ranked.sort(key=lambda x: int(x.get("personalizedScore", 0)), reverse=True)
    return ranked[:limit]


@app.get("/api/discovery/recommendations")
def discovery_recommendations(
    city: str = "",
    country: str = "",
    limit: int = 8,
    user: Dict[str, Any] = Depends(auth_user),
) -> List[Dict[str, Any]]:
    return build_personalized_recommendations(user, normalize_text(city), normalize_text(country), clamp(limit, 3, 12))


# -----------------------------
# Collab trips + expense summary
# -----------------------------


def trip_member_ids(trip: Dict[str, Any]) -> List[str]:
    ids: List[str] = []
    owner = trip.get("owner") if isinstance(trip.get("owner"), dict) else {}
    if owner.get("id"):
        ids.append(owner["id"])
    members = trip.get("members") if isinstance(trip.get("members"), list) else []
    for m in members:
        if isinstance(m, dict) and m.get("id") and m["id"] not in ids:
            ids.append(m["id"])
    return ids


def is_trip_member(trip: Dict[str, Any], user_id: str) -> bool:
    return user_id in trip_member_ids(trip)


@app.post("/api/collab/trips")
def create_collab_trip(payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    title = normalize_text(payload.get("title"))
    city = normalize_text(payload.get("destinationCity"))
    country = normalize_text(payload.get("destinationCountry"))
    start_date = normalize_text(payload.get("startDate"))
    end_date = normalize_text(payload.get("endDate"))
    if not title or not city or not country or not start_date or not end_date:
        raise HTTPException(status_code=400, detail="title, destinationCity, destinationCountry, startDate, endDate are required.")

    member_ids = parse_tags(payload.get("memberIds"), limit=20)
    users_map = {u["id"]: u for u in list_users()}
    members = [to_public_user(user)]
    for uid in member_ids:
        if uid in users_map and uid != user["id"]:
            members.append(to_public_user(users_map[uid]))

    trip = {
        "id": new_id("TRIP"),
        "title": title,
        "destinationCity": city,
        "destinationCountry": country,
        "startDate": start_date,
        "endDate": end_date,
        "currency": normalize_text(payload.get("currency") or "SGD"),
        "owner": to_public_user(user),
        "members": members,
        "items": [],
        "expenses": [],
        "createdAt": now_iso(),
    }
    upsert_doc("collab_trips", trip, owner_id=user["id"])
    return trip


@app.get("/api/collab/trips")
def get_collab_trips(user: Dict[str, Any] = Depends(auth_user)) -> List[Dict[str, Any]]:
    trips = list_docs("collab_trips", limit=500)
    visible = [t for t in trips if is_trip_member(t, user["id"])]
    return visible


@app.get("/api/collab/trips/{trip_id}")
def get_collab_trip(trip_id: str, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    trip = get_doc("collab_trips", trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    if not is_trip_member(trip, user["id"]):
        raise HTTPException(status_code=403, detail="Not a trip member.")
    return trip


@app.post("/api/collab/trips/{trip_id}/join")
def join_collab_trip(trip_id: str, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    trip = get_doc("collab_trips", trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    members = trip.get("members") if isinstance(trip.get("members"), list) else []
    if not any(m.get("id") == user["id"] for m in members if isinstance(m, dict)):
        members.append(to_public_user(user))
    trip["members"] = members
    replace_doc("collab_trips", trip_id, trip)
    return trip


@app.post("/api/collab/trips/{trip_id}/items")
def add_collab_item(trip_id: str, payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    trip = get_doc("collab_trips", trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    if not is_trip_member(trip, user["id"]):
        raise HTTPException(status_code=403, detail="Not a trip member.")

    title = normalize_text(payload.get("title"))
    day = to_int(payload.get("day"), 1)
    if not title:
        raise HTTPException(status_code=400, detail="title is required.")

    item = {
        "id": new_id("TI"),
        "day": max(1, day),
        "time": normalize_text(payload.get("time")),
        "title": title,
        "placeName": normalize_text(payload.get("placeName")),
        "bookingUrl": normalize_text(payload.get("bookingUrl")),
        "bookingType": normalize_text(payload.get("bookingType")) or "activity",
        "creator": to_public_user(user),
        "createdAt": now_iso(),
    }
    items = trip.get("items") if isinstance(trip.get("items"), list) else []
    items.append(item)
    trip["items"] = items
    replace_doc("collab_trips", trip_id, trip)
    return item


@app.post("/api/collab/trips/{trip_id}/expenses")
def add_collab_expense(trip_id: str, payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    trip = get_doc("collab_trips", trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    if not is_trip_member(trip, user["id"]):
        raise HTTPException(status_code=403, detail="Not a trip member.")

    title = normalize_text(payload.get("title"))
    amount = float(payload.get("amount") or 0)
    if not title or amount <= 0:
        raise HTTPException(status_code=400, detail="title and positive amount are required.")

    split_with = parse_tags(payload.get("splitWith"), limit=60)
    member_ids = trip_member_ids(trip)
    valid_split_with = [uid for uid in split_with if uid in member_ids] or member_ids

    expense = {
        "id": new_id("TE"),
        "title": title,
        "amount": round(amount, 2),
        "category": normalize_text(payload.get("category") or "other"),
        "paidBy": user["id"],
        "splitWith": valid_split_with,
        "creator": to_public_user(user),
        "createdAt": now_iso(),
    }
    expenses = trip.get("expenses") if isinstance(trip.get("expenses"), list) else []
    expenses.append(expense)
    trip["expenses"] = expenses
    replace_doc("collab_trips", trip_id, trip)
    return expense


def parse_reservation_text(text: str) -> Dict[str, str]:
    raw = normalize_text(text)
    low = raw.lower()
    booking_type = "activity"
    if "flight" in low or "航班" in low:
        booking_type = "flight"
    elif "hotel" in low or "酒店" in low:
        booking_type = "hotel"
    elif "train" in low or "rail" in low or "火车" in low:
        booking_type = "transport"

    ref_match = re.search(r"([A-Z]{2,3}\d{2,5}|[A-Z0-9]{5,10})", raw)
    date_match = re.search(r"(20\d{2}-\d{2}-\d{2})", raw)
    return {
        "bookingType": booking_type,
        "reference": ref_match.group(1) if ref_match else "",
        "date": date_match.group(1) if date_match else "",
    }


@app.post("/api/collab/trips/{trip_id}/import-reservation")
def import_reservation(trip_id: str, payload: Dict[str, Any], user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    trip = get_doc("collab_trips", trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    if not is_trip_member(trip, user["id"]):
        raise HTTPException(status_code=403, detail="Not a trip member.")

    text = normalize_text(payload.get("text"))
    if not text:
        raise HTTPException(status_code=400, detail="text is required.")

    parsed = parse_reservation_text(text)
    item = {
        "id": new_id("TI"),
        "day": 1,
        "time": "",
        "title": f"Imported {parsed['bookingType']} {parsed['reference'] or ''}".strip(),
        "placeName": "",
        "bookingUrl": "",
        "bookingType": parsed["bookingType"],
        "rawText": text[:2000],
        "creator": to_public_user(user),
        "createdAt": now_iso(),
    }
    items = trip.get("items") if isinstance(trip.get("items"), list) else []
    items.append(item)
    trip["items"] = items
    replace_doc("collab_trips", trip_id, trip)
    return {"ok": True, "item": item, "parsed": parsed}


def collab_summary(trip: Dict[str, Any]) -> Dict[str, Any]:
    member_ids = trip_member_ids(trip)
    balances: Dict[str, float] = {uid: 0.0 for uid in member_ids}
    expenses = trip.get("expenses") if isinstance(trip.get("expenses"), list) else []

    for expense in expenses:
        amount = float(expense.get("amount") or 0)
        if amount <= 0:
            continue
        paid_by = expense.get("paidBy")
        participants = expense.get("splitWith") if isinstance(expense.get("splitWith"), list) and expense.get("splitWith") else member_ids
        participants = [uid for uid in participants if uid in member_ids]
        if not participants:
            continue
        share = amount / len(participants)
        for uid in participants:
            balances[uid] = balances.get(uid, 0.0) - share
        if paid_by in balances:
            balances[paid_by] = balances.get(paid_by, 0.0) + amount

    debtors = [{"userId": uid, "amount": round(-val, 2)} for uid, val in balances.items() if val < -0.01]
    creditors = [{"userId": uid, "amount": round(val, 2)} for uid, val in balances.items() if val > 0.01]
    debtors.sort(key=lambda x: x["amount"], reverse=True)
    creditors.sort(key=lambda x: x["amount"], reverse=True)

    users_map = {u["id"]: u for u in list_users()}
    settlements = []
    i = 0
    j = 0
    while i < len(debtors) and j < len(creditors):
        d = debtors[i]
        c = creditors[j]
        pay = round(min(d["amount"], c["amount"]), 2)
        if pay > 0:
            settlements.append(
                {
                    "fromUserId": d["userId"],
                    "toUserId": c["userId"],
                    "from": (users_map.get(d["userId"], {}).get("displayName") or d["userId"]),
                    "to": (users_map.get(c["userId"], {}).get("displayName") or c["userId"]),
                    "amount": pay,
                    "currency": trip.get("currency") or "SGD",
                }
            )
        d["amount"] = round(d["amount"] - pay, 2)
        c["amount"] = round(c["amount"] - pay, 2)
        if d["amount"] <= 0.01:
            i += 1
        if c["amount"] <= 0.01:
            j += 1

    return {
        "tripId": trip.get("id"),
        "currency": trip.get("currency") or "SGD",
        "totalExpense": round(sum(float(e.get("amount") or 0) for e in expenses), 2),
        "settlements": settlements,
        "balances": {uid: {"net": round(val, 2)} for uid, val in balances.items()},
    }


@app.get("/api/collab/trips/{trip_id}/summary")
def get_collab_trip_summary(trip_id: str, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    trip = get_doc("collab_trips", trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    if not is_trip_member(trip, user["id"]):
        raise HTTPException(status_code=403, detail="Not a trip member.")
    return collab_summary(trip)


# -----------------------------
# Startup + static mount
# -----------------------------


@app.get("/")
def root() -> FileResponse:
    return FileResponse(ROOT / "index.html")


# Mount static files after API routes.
app.mount("/", StaticFiles(directory=str(ROOT), html=True), name="static")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=3000, reload=False)
