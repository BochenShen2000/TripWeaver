const fs = require("fs");
const path = require("path");
require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const OpenAI = require("openai");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const PORT = process.env.PORT || 3000;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const JWT_SECRET = process.env.JWT_SECRET || "dev_change_me_secret";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const DATA_DIR = path.join(__dirname, "data");
const ACTIVITIES_FILE = path.join(DATA_DIR, "activities.json");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const TRAVEL_POSTS_FILE = path.join(DATA_DIR, "travel_posts.json");
const FRIEND_REQUESTS_FILE = path.join(DATA_DIR, "friend_requests.json");
const FRIENDSHIPS_FILE = path.join(DATA_DIR, "friendships.json");
const DIRECT_MESSAGES_FILE = path.join(DATA_DIR, "direct_messages.json");
const CAMPUS_GROUPS_FILE = path.join(DATA_DIR, "campus_groups.json");
const OFFICIAL_POSTS_FILE = path.join(DATA_DIR, "official_posts.json");
const MOOK_GUIDES_FILE = path.join(DATA_DIR, "mook_guides.json");
const INTEREST_GROUPS_FILE = path.join(DATA_DIR, "interest_groups.json");
const LOCAL_EVENTS_FILE = path.join(DATA_DIR, "local_events.json");
const INSPIRATIONS_FILE = path.join(DATA_DIR, "inspirations.json");
const COLLAB_TRIPS_FILE = path.join(DATA_DIR, "collab_trips.json");
const AUTH_CODES_FILE = path.join(DATA_DIR, "auth_codes.json");
const OPEN_PUBLISH_KEY = process.env.OPEN_PUBLISH_KEY || "";
const OAUTH_PROVIDERS = new Set(["google", "apple", "wechat", "github"]);

const openai = OPENAI_API_KEY
  ? new OpenAI({
      apiKey: OPENAI_API_KEY,
    })
  : null;

const templates = [
  { interest: "city walk", area: "新加坡市中心", points: ["Bugis 街区散步", "Haji Lane 打卡", "Marina Bay 夜景"] },
  { interest: "city walk", area: "NTU附近", points: ["Yunnan Garden 散步", "Jurong Lake Garden", "Westgate 晚餐"] },
  { interest: "city walk", area: "东海岸", points: ["East Coast Park 海边步道", "海风骑行", "Katong 晚餐"] },
  { interest: "看展", area: "新加坡市中心", points: ["National Gallery", "SMU 附近咖啡", "Esplanade 河边散步"] },
  { interest: "看展", area: "NTU附近", points: ["NTU ADM 展区", "The Hive 打卡", "Jurong Point 晚餐"] },
  { interest: "看展", area: "东海岸", points: ["Gillman Barracks", "海边咖啡", "晚间散步"] },
  { interest: "咖啡", area: "新加坡市中心", points: ["Nylon Coffee Roasters", "Common Man Coffee Roasters", "Tiong Bahru Bakery"] },
  { interest: "咖啡", area: "NTU附近", points: ["Starbucks Jurong Point", "Ya Kun Kaya Toast Jurong Point", "Toast Box Jurong Point"] },
  { interest: "咖啡", area: "东海岸", points: ["Common Man Coffee Roasters Joo Chiat", "Hello Arigato Joo Chiat", "Five Oars Coffee Roasters"] },
  { interest: "美食", area: "新加坡市中心", points: ["Odette", "Burnt Ends", "Labyrinth"] },
  { interest: "美食", area: "NTU附近", points: ["Din Tai Fung Jem", "Beng Hiang Restaurant Jurong", "PUTIEN Jem"] },
  { interest: "美食", area: "东海岸", points: ["Long Beach Seafood Restaurant", "The Feather Blade", "Baba Chews"] },
  { interest: "ACG", area: "新加坡市中心", points: ["Plaza Singapura 逛店", "主题咖啡", "新加坡河夜景"] },
  { interest: "ACG", area: "NTU附近", points: ["Westgate 周边店铺", "主题桌游", "夜宵收尾"] },
  { interest: "ACG", area: "东海岸", points: ["活动店铺探店", "同好聚会点", "海边收尾"] },
];

const durations = {
  今天晚上: ["19:00", "20:15", "21:30"],
  周末半天: ["14:00", "16:00", "18:00"],
  周末全天: ["10:00", "14:00", "18:00"],
};

const budgetText = {
  低预算: "约 SGD 10-20/人",
  中预算: "约 SGD 25-45/人",
  高预算: "约 SGD 50+/人",
};

const fallbackByArea = {
  新加坡市中心: ["Bugis Junction", "National Gallery Singapore", "Marina Bay Sands"],
  NTU附近: ["Nanyang Technological University", "Yunnan Garden", "Jurong Point"],
  东海岸: ["East Coast Park", "Katong", "Bedok Jetty"],
};

const foodFallbackByArea = {
  新加坡市中心: ["Odette Singapore", "Burnt Ends Singapore", "Candlenut Dempsey"],
  NTU附近: ["Din Tai Fung Jem", "PUTIEN Jem", "Beng Hiang Restaurant Jurong"],
  东海岸: ["Long Beach Seafood Restaurant", "The Feather Blade", "Baba Chews"],
};

const coffeeFallbackByArea = {
  新加坡市中心: ["Nylon Coffee Roasters", "Common Man Coffee Roasters", "Tiong Bahru Bakery"],
  NTU附近: ["Starbucks Jurong Point", "Ya Kun Kaya Toast Jurong Point", "Toast Box Jurong Point"],
  东海岸: ["Common Man Coffee Roasters Joo Chiat", "Hello Arigato Joo Chiat", "Five Oars Coffee Roasters"],
};

const curatedPlaceCoordinates = {
  Odette: { lat: 1.290569, lng: 103.851196, matchedName: "Odette, National Gallery Singapore" },
  "Burnt Ends": { lat: 1.280363, lng: 103.841472, matchedName: "Burnt Ends, Dempsey Rd" },
  Labyrinth: { lat: 1.283391, lng: 103.860758, matchedName: "Labyrinth, Esplanade Mall" },
  "Din Tai Fung Jem": { lat: 1.333163, lng: 103.74384, matchedName: "Din Tai Fung, JEM" },
  "Beng Hiang Restaurant Jurong": { lat: 1.340258, lng: 103.706907, matchedName: "Beng Hiang Restaurant, Jurong Point" },
  "PUTIEN Jem": { lat: 1.333163, lng: 103.74384, matchedName: "PUTIEN, JEM" },
  "Long Beach Seafood Restaurant": { lat: 1.307563, lng: 103.931997, matchedName: "Long Beach Seafood Restaurant, East Coast" },
  "The Feather Blade": { lat: 1.311451, lng: 103.924938, matchedName: "The Feather Blade, East Coast" },
  "Baba Chews": { lat: 1.305901, lng: 103.904036, matchedName: "Baba Chews, Hotel Indigo Katong" },
  "Nylon Coffee Roasters": { lat: 1.283998, lng: 103.834662, matchedName: "Nylon Coffee Roasters, Everton Park" },
  "Common Man Coffee Roasters": { lat: 1.299118, lng: 103.841423, matchedName: "Common Man Coffee Roasters, Martin Rd" },
  "Tiong Bahru Bakery": { lat: 1.285153, lng: 103.826408, matchedName: "Tiong Bahru Bakery, Eng Hoon St" },
  "Starbucks Jurong Point": { lat: 1.339643, lng: 103.706262, matchedName: "Starbucks, Jurong Point" },
  "Ya Kun Kaya Toast Jurong Point": { lat: 1.33994, lng: 103.706526, matchedName: "Ya Kun Kaya Toast, Jurong Point" },
  "Toast Box Jurong Point": { lat: 1.339645, lng: 103.706315, matchedName: "Toast Box, Jurong Point" },
  "Common Man Coffee Roasters Joo Chiat": { lat: 1.309153, lng: 103.90372, matchedName: "Common Man Coffee Roasters, Joo Chiat" },
  "Hello Arigato Joo Chiat": { lat: 1.308247, lng: 103.90454, matchedName: "Hello Arigato, Joo Chiat" },
  "Five Oars Coffee Roasters": { lat: 1.305776, lng: 103.90512, matchedName: "Five Oars Coffee Roasters, East Coast Rd" },
};

function toIsoFuture(days, hour = 19, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function buildSeedLocalEvents() {
  return [
    {
      id: "EVT-SEED-SG-CITYWALK",
      title: "Marina Bay Night City Walk",
      category: "citywalk",
      city: "Singapore",
      country: "Singapore",
      venueName: "Marina Bay Waterfront",
      startAt: toIsoFuture(2, 19, 0),
      endAt: toIsoFuture(2, 21, 30),
      price: 0,
      currency: "SGD",
      ticketUrl: "https://www.eventbrite.com/d/singapore--singapore/city-walk/",
      tags: ["citywalk", "nightview", "friends"],
      source: "seed",
      creator: { id: "system", username: "system", displayName: "TripWeaver" },
      rsvps: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "EVT-SEED-TYO-ANIME",
      title: "Akihabara Anime Hunt Meetup",
      category: "acg",
      city: "Tokyo",
      country: "Japan",
      venueName: "Akihabara Station",
      startAt: toIsoFuture(6, 10, 0),
      endAt: toIsoFuture(6, 13, 0),
      price: 15,
      currency: "SGD",
      ticketUrl: "https://www.eventbrite.com/d/japan--tokyo/anime/",
      tags: ["acg", "anime", "shopping"],
      source: "seed",
      creator: { id: "system", username: "system", displayName: "TripWeaver" },
      rsvps: [],
      createdAt: new Date().toISOString(),
    },
  ];
}

function buildSeedInterestGroups() {
  return [
    {
      id: "IG-SEED-SG-FOOD",
      name: "Singapore Hawker Explorers",
      interest: "美食",
      city: "Singapore",
      country: "Singapore",
      description: "每周末探索熟食中心与隐藏小店。",
      campusOnly: false,
      creator: { id: "system", username: "system", displayName: "TripWeaver" },
      members: [{ id: "system", username: "system", displayName: "TripWeaver" }],
      messages: [],
      nextMeetupAt: toIsoFuture(3, 12, 0),
      createdAt: new Date().toISOString(),
    },
    {
      id: "IG-SEED-TYO-ART",
      name: "Tokyo Art + Coffee Circle",
      interest: "看展",
      city: "Tokyo",
      country: "Japan",
      description: "看展与咖啡结合的轻松社群。",
      campusOnly: false,
      creator: { id: "system", username: "system", displayName: "TripWeaver" },
      members: [{ id: "system", username: "system", displayName: "TripWeaver" }],
      messages: [],
      nextMeetupAt: toIsoFuture(8, 14, 0),
      createdAt: new Date().toISOString(),
    },
  ];
}

function buildSeedInspirations() {
  return [
    {
      id: "INS-SEED-TYO-5D",
      title: "东京5天高密度路线：浅草-上野-涩谷-下北泽",
      city: "Tokyo",
      country: "Japan",
      tags: ["tokyo", "citywalk", "food"],
      places: ["Senso-ji", "Ueno Park", "Shibuya Scramble"],
      content: "适合第一次去东京：每天 3-4 个点，步行与地铁结合，晚上安排居酒屋或拉面。",
      creator: { id: "system", username: "system", displayName: "TripWeaver" },
      likes: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "INS-SEED-SG-4D",
      title: "新加坡4日轻旅行：地标+文化街区+圣淘沙",
      city: "Singapore",
      country: "Singapore",
      tags: ["singapore", "family", "citywalk"],
      places: ["Merlion Park", "Haji Lane", "Sentosa"],
      content: "首访新加坡可直接抄作业，白天地标，傍晚滨海湾，夜间熟食中心收尾。",
      creator: { id: "system", username: "system", displayName: "TripWeaver" },
      likes: [],
      createdAt: new Date().toISOString(),
    },
  ];
}

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ACTIVITIES_FILE)) fs.writeFileSync(ACTIVITIES_FILE, "[]\n", "utf8");
  if (!fs.existsSync(EVENTS_FILE)) fs.writeFileSync(EVENTS_FILE, "[]\n", "utf8");
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]\n", "utf8");
  if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, "[]\n", "utf8");
  if (!fs.existsSync(TRAVEL_POSTS_FILE)) fs.writeFileSync(TRAVEL_POSTS_FILE, "[]\n", "utf8");
  if (!fs.existsSync(FRIEND_REQUESTS_FILE)) fs.writeFileSync(FRIEND_REQUESTS_FILE, "[]\n", "utf8");
  if (!fs.existsSync(FRIENDSHIPS_FILE)) fs.writeFileSync(FRIENDSHIPS_FILE, "[]\n", "utf8");
  if (!fs.existsSync(DIRECT_MESSAGES_FILE)) fs.writeFileSync(DIRECT_MESSAGES_FILE, "[]\n", "utf8");
  if (!fs.existsSync(CAMPUS_GROUPS_FILE)) fs.writeFileSync(CAMPUS_GROUPS_FILE, "[]\n", "utf8");
  if (!fs.existsSync(OFFICIAL_POSTS_FILE)) fs.writeFileSync(OFFICIAL_POSTS_FILE, "[]\n", "utf8");
  if (!fs.existsSync(MOOK_GUIDES_FILE)) fs.writeFileSync(MOOK_GUIDES_FILE, "[]\n", "utf8");
  if (!fs.existsSync(INTEREST_GROUPS_FILE)) fs.writeFileSync(INTEREST_GROUPS_FILE, "[]\n", "utf8");
  if (!fs.existsSync(LOCAL_EVENTS_FILE)) fs.writeFileSync(LOCAL_EVENTS_FILE, "[]\n", "utf8");
  if (!fs.existsSync(INSPIRATIONS_FILE)) fs.writeFileSync(INSPIRATIONS_FILE, "[]\n", "utf8");
  if (!fs.existsSync(COLLAB_TRIPS_FILE)) fs.writeFileSync(COLLAB_TRIPS_FILE, "[]\n", "utf8");
  if (!fs.existsSync(AUTH_CODES_FILE)) fs.writeFileSync(AUTH_CODES_FILE, "[]\n", "utf8");

  if (readJson(INTEREST_GROUPS_FILE).length === 0) writeJson(INTEREST_GROUPS_FILE, buildSeedInterestGroups());
  if (readJson(LOCAL_EVENTS_FILE).length === 0) writeJson(LOCAL_EVENTS_FILE, buildSeedLocalEvents());
  if (readJson(INSPIRATIONS_FILE).length === 0) writeJson(INSPIRATIONS_FILE, buildSeedInspirations());
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function appendJson(filePath, item) {
  const list = readJson(filePath);
  list.push(item);
  writeJson(filePath, list);
}

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    campusVerified: Boolean(user.campusVerified),
    campusName: user.campusName || "",
    createdAt: user.createdAt,
  };
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      displayName: user.displayName,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim();
}

function authMiddleware(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: "Unauthorized." });
  try {
    const claims = verifyToken(token);
    const users = readJson(USERS_FILE);
    const user = users.find((item) => item.id === claims.sub);
    if (!user) return res.status(401).json({ error: "Invalid token user." });
    req.user = user;
    return next();
  } catch (_err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

function getOptionalAuthedUser(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  try {
    const claims = verifyToken(token);
    const users = readJson(USERS_FILE);
    return users.find((item) => item.id === claims.sub) || null;
  } catch (_err) {
    return null;
  }
}

function normalizePair(a, b) {
  return [a, b].sort().join("|");
}

function getFriendsForUser(userId) {
  const friendships = readJson(FRIENDSHIPS_FILE);
  const users = readJson(USERS_FILE);
  const friendIds = friendships
    .filter((f) => f.pair.includes(userId))
    .map((f) => (f.userA === userId ? f.userB : f.userA));
  return users.filter((u) => friendIds.includes(u.id)).map(toPublicUser);
}

function isCampusEmail(email) {
  const value = String(email || "").toLowerCase();
  return value.endsWith(".edu") || value.includes(".ac.") || value.endsWith(".edu.sg");
}

function normalizeEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  if (!value || !value.includes("@")) return "";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value) ? value : "";
}

function normalizePhone(phone) {
  const raw = String(phone || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return "";
  let normalized = digits;
  if (normalized.startsWith("00")) normalized = `+${normalized.slice(2)}`;
  if (!normalized.startsWith("+")) normalized = `+${normalized}`;
  normalized = `+${normalized.replace(/[^\d]/g, "")}`;
  if (normalized.length < 8 || normalized.length > 16) return "";
  return normalized;
}

function parseCodeLoginIdentifier(identifier) {
  const text = String(identifier || "").trim();
  if (!text) return null;
  const email = normalizeEmail(text);
  if (email) return { kind: "email", value: email };
  const phone = normalizePhone(text);
  if (phone) return { kind: "phone", value: phone };
  return null;
}

function maskIdentifier(parsed) {
  if (!parsed) return "";
  if (parsed.kind === "email") {
    const [name = "", domain = ""] = parsed.value.split("@");
    const head = name.slice(0, 2);
    return `${head}***@${domain}`;
  }
  return `${parsed.value.slice(0, 3)}****${parsed.value.slice(-2)}`;
}

function normalizeUsernameBase(value) {
  const base = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
  return base || "user";
}

function makeUniqueUsername(base, users) {
  const clean = normalizeUsernameBase(base);
  if (!users.some((u) => u.username === clean)) return clean;
  let n = 1;
  while (users.some((u) => u.username === `${clean}${n}`)) n += 1;
  return `${clean}${n}`;
}

function findUserByIdentifier(users, identifier) {
  const raw = String(identifier || "").trim();
  if (!raw) return null;
  const username = raw.toLowerCase();
  const email = normalizeEmail(raw);
  const phone = normalizePhone(raw);
  return (
    users.find(
      (item) =>
        item.username === username ||
        (email && (item.email === email || item.campusEmail === email)) ||
        (phone && item.phone === phone),
    ) || null
  );
}

function cleanupAuthCodes(codes) {
  const now = Date.now();
  return (Array.isArray(codes) ? codes : []).filter((item) => {
    if (item.usedAt) return false;
    const expiresAt = new Date(item.expiresAt).getTime();
    return Number.isFinite(expiresAt) && expiresAt > now;
  });
}

function generateNumericCode(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(min + Math.random() * (max - min)));
}

function providerDisplayName(provider) {
  if (provider === "google") return "Google";
  if (provider === "apple") return "Apple";
  if (provider === "wechat") return "WeChat";
  if (provider === "github") return "GitHub";
  return "OAuth";
}

function normalizeGeo(geo) {
  if (!geo || typeof geo !== "object") return null;
  const lat = Number(geo.lat);
  const lng = Number(geo.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat,
    lng,
    label: geo.label ? String(geo.label) : "",
  };
}

function parseTags(raw, limit = 12) {
  if (Array.isArray(raw)) return raw.map((t) => String(t).trim()).filter(Boolean).slice(0, limit);
  return String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeBool(value) {
  if (typeof value === "boolean") return value;
  const text = String(value || "").toLowerCase();
  return text === "true" || text === "1" || text === "yes";
}

function canAccessCampusOnly(campusOnly, user) {
  if (!campusOnly) return true;
  return Boolean(user?.campusVerified);
}

function ensureIsoDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function getTripMemberIds(trip) {
  const ids = new Set([trip.owner?.id].filter(Boolean));
  for (const member of trip.members || []) {
    if (member?.id) ids.add(member.id);
  }
  return Array.from(ids);
}

function isTripMember(trip, userId) {
  return getTripMemberIds(trip).includes(userId);
}

function resolveSettlementForTrip(trip) {
  const memberIds = getTripMemberIds(trip);
  const balances = new Map(memberIds.map((id) => [id, 0]));
  for (const expense of trip.expenses || []) {
    const amount = Number(expense.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const participantsRaw = Array.isArray(expense.splitWith) && expense.splitWith.length ? expense.splitWith : memberIds;
    const participants = participantsRaw.filter((id) => memberIds.includes(id));
    if (!participants.length) continue;
    const share = amount / participants.length;
    for (const p of participants) balances.set(p, (balances.get(p) || 0) - share);
    if (memberIds.includes(expense.paidBy)) {
      balances.set(expense.paidBy, (balances.get(expense.paidBy) || 0) + amount);
    }
  }

  const creditors = [];
  const debtors = [];
  for (const [userId, value] of balances.entries()) {
    const rounded = Number(value.toFixed(2));
    if (rounded > 0.01) creditors.push({ userId, amount: rounded });
    if (rounded < -0.01) debtors.push({ userId, amount: Math.abs(rounded) });
  }
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const pay = Number(Math.min(debtor.amount, creditor.amount).toFixed(2));
    if (pay > 0) {
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: pay,
      });
    }
    debtor.amount = Number((debtor.amount - pay).toFixed(2));
    creditor.amount = Number((creditor.amount - pay).toFixed(2));
    if (debtor.amount <= 0.01) i += 1;
    if (creditor.amount <= 0.01) j += 1;
  }

  return {
    balances: Object.fromEntries(
      Array.from(balances.entries()).map(([id, value]) => [
        id,
        {
          net: Number(value.toFixed(2)),
        },
      ]),
    ),
    settlements,
    totalExpense: Number((trip.expenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0).toFixed(2)),
  };
}

function parseReservationText(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  let bookingType = "activity";
  if (lower.includes("flight") || lower.includes("航班")) bookingType = "flight";
  else if (lower.includes("hotel") || lower.includes("酒店")) bookingType = "hotel";
  else if (lower.includes("train") || lower.includes("rail") || lower.includes("火车")) bookingType = "transport";

  const dateMatch = raw.match(/\d{4}-\d{2}-\d{2}/);
  const timeMatch = raw.match(/\b\d{1,2}:\d{2}\b/);
  const refMatch = raw.match(/\b[A-Z0-9]{5,12}\b/);
  const amountMatch = raw.match(/(\d+(?:\.\d{1,2})?)\s?(SGD|USD|JPY|CNY|EUR)/i);
  return {
    title: raw.split("\n")[0].slice(0, 100),
    day: 1,
    time: timeMatch ? timeMatch[0] : "",
    note: raw.slice(0, 800),
    bookingType,
    bookingRef: refMatch ? refMatch[0] : "",
    date: dateMatch ? dateMatch[0] : "",
    amount: amountMatch ? Number(amountMatch[1]) : null,
    currency: amountMatch ? amountMatch[2].toUpperCase() : "",
  };
}

function canPublishExternal(req) {
  if (!OPEN_PUBLISH_KEY) return false;
  const key = req.headers["x-platform-key"];
  return key && String(key) === OPEN_PUBLISH_KEY;
}

function decodePolyline(encoded) {
  let index = 0;
  const coordinates = [];
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return coordinates;
}

function normalizeAreaToRegion(area) {
  if (area === "NTU附近") return "west singapore";
  if (area === "东海岸") return "east coast singapore";
  return "central singapore";
}

function normalizeInterestToCategory(interest) {
  if (interest === "咖啡") return "coffee shop";
  if (interest === "美食") return "restaurant";
  if (interest === "看展") return "art museum";
  if (interest === "ACG") return "anime shop";
  return "attraction";
}

function normalizeCountryToRegionCode(country) {
  const value = String(country || "").trim().toLowerCase();
  const map = {
    singapore: "SG",
    japan: "JP",
    korea: "KR",
    "south korea": "KR",
    china: "CN",
    thailand: "TH",
    malaysia: "MY",
    indonesia: "ID",
    vietnam: "VN",
    france: "FR",
    italy: "IT",
    spain: "ES",
    germany: "DE",
    uk: "GB",
    "united kingdom": "GB",
    usa: "US",
    "united states": "US",
    australia: "AU",
    canada: "CA",
  };
  return map[value] || "SG";
}

function inferInterestFromTags(tags, note) {
  const text = [...(Array.isArray(tags) ? tags : []), note || ""].join(" ").toLowerCase();
  if (text.includes("coffee") || text.includes("咖啡")) return "咖啡";
  if (text.includes("museum") || text.includes("展")) return "看展";
  if (text.includes("acg") || text.includes("anime")) return "ACG";
  if (text.includes("walk") || text.includes("citywalk")) return "city walk";
  return "美食";
}

async function generateRealtimePlaceQueries(context) {
  const {
    interest = "美食",
    area = "新加坡市中心",
    city = "Singapore",
    country = "Singapore",
    companion = "朋友",
    budget = "中预算",
    timeSlot = "周末半天",
  } = context || {};

  const fallback = [
    `${normalizeInterestToCategory(interest)} in ${city} ${country}`,
    `best ${normalizeInterestToCategory(interest)} ${city}`,
    `${interest} ${city}`,
  ];
  if (!openai) return fallback;

  try {
    const prompt = `You generate Google Places text search queries.
Return strict JSON with shape {"queries":["...","...","..."]}.
User intent:
- area: ${area}
- city: ${city}
- country: ${country}
- interest: ${interest}
- companion: ${companion}
- budget: ${budget}
- duration: ${timeSlot}
Constraints:
- 3 short queries
- each query must target real places in ${city}, ${country}
- no markdown`;

    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      input: prompt,
      max_output_tokens: 180,
    });
    const text = response.output_text || "";
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed.queries) && parsed.queries.length > 0) {
      return parsed.queries.slice(0, 5).map((q) => String(q));
    }
    return fallback;
  } catch (_err) {
    return fallback;
  }
}

function heuristicIntentFromMessages(messages) {
  const text = messages.map((m) => m.content || "").join(" ").toLowerCase();
  return {
    companion: "朋友",
    people: "3",
    budget: text.includes("便宜") || text.includes("低预算") ? "低预算" : "中预算",
    timeSlot: text.includes("周末") ? "周末半天" : "今天晚上",
    interest: text.includes("咖啡") ? "咖啡" : text.includes("展") ? "看展" : text.includes("acg") ? "ACG" : "美食",
    area: text.includes("东海岸") ? "东海岸" : text.includes("ntu") ? "NTU附近" : "新加坡市中心",
  };
}

async function summarizeIntentFromMessages(messages) {
  if (!messages.length) return null;
  if (!openai) return heuristicIntentFromMessages(messages);
  try {
    const transcript = messages
      .slice(-50)
      .map((m) => `${m.user?.displayName || m.user?.username || "user"}: ${m.content}`)
      .join("\n");

    const prompt = `Summarize group discussion into a route intent.
Return strict JSON only:
{"companion":"朋友","people":"3","budget":"低预算|中预算|高预算","timeSlot":"今天晚上|周末半天|周末全天","interest":"city walk|看展|咖啡|美食|ACG","area":"NTU附近|新加坡市中心|东海岸"}.
Transcript:
${transcript}`;

    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      input: prompt,
      max_output_tokens: 220,
    });
    const parsed = JSON.parse(response.output_text || "{}");
    if (!isValidIntent(parsed)) return heuristicIntentFromMessages(messages);
    return parsed;
  } catch (_err) {
    return heuristicIntentFromMessages(messages);
  }
}

function parseJsonLoose(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_err) {
    // Try to extract a JSON object/array block from model output.
  }
  const blockMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!blockMatch) return null;
  try {
    return JSON.parse(blockMatch[1]);
  } catch (_err) {
    return null;
  }
}

function pushPointCandidate(points, seen, raw, maxLen = 80) {
  let value = String(raw || "").trim();
  if (!value) return;
  value = value
    .replace(/^\s*(day|d)\s*\d+\s*[:：-]\s*/i, "")
    .replace(/^\s*[#*•\-–—]+\s*/, "")
    .replace(/^\s*\d{1,2}\s*[.)、\-]\s*/, "")
    .replace(/^\s*\d{1,2}[:：]\d{2}\s*/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!value || value.length < 2) return;
  if (/^\d+$/.test(value)) return;
  if (value.length > maxLen) value = value.slice(0, maxLen);
  const key = value.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  points.push(value);
}

function extractPointsFromStructuredDoc(doc, limit = 16) {
  const points = [];
  const seen = new Set();

  const walk = (node) => {
    if (!node || points.length >= limit) return;
    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
        if (points.length >= limit) break;
      }
      return;
    }
    if (typeof node === "string") {
      pushPointCandidate(points, seen, node);
      return;
    }
    if (typeof node !== "object") return;

    if (typeof node.point === "string") pushPointCandidate(points, seen, node.point);
    if (typeof node.name === "string") pushPointCandidate(points, seen, node.name);
    if (typeof node.place === "string") pushPointCandidate(points, seen, node.place);

    const keys = ["points", "route", "places", "geoPoints", "stops", "daysPlan", "days", "itinerary"];
    for (const key of keys) {
      if (node[key] !== undefined) walk(node[key]);
      if (points.length >= limit) break;
    }
  };

  walk(doc);
  return points.slice(0, limit);
}

function extractPointsHeuristicFromDocument(text, limit = 16) {
  const points = [];
  const seen = new Set();
  const normalized = String(text || "")
    .replace(/\r/g, "\n")
    .trim();
  if (!normalized) return points;

  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const splitRegex = /\s*(?:->|→|➡|=>|＞|>|｜|\||;|；|，|,)\s*/;

  for (const line of lines) {
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(line)) continue;

    let candidate = line;
    if (/^\s*(day|d)\s*\d+/i.test(candidate) && /[:：]/.test(candidate)) {
      candidate = candidate.split(/[:：]/).slice(1).join(" ");
    }

    const parts = candidate.split(splitRegex).map((part) => part.trim()).filter(Boolean);
    if (parts.length > 1) {
      for (const part of parts) {
        pushPointCandidate(points, seen, part);
        if (points.length >= limit) return points.slice(0, limit);
      }
      continue;
    }
    pushPointCandidate(points, seen, candidate);
    if (points.length >= limit) return points.slice(0, limit);
  }

  return points.slice(0, limit);
}

async function extractOrderedPointsFromDocument(documentText, context = {}, limit = 16) {
  const raw = String(documentText || "").trim();
  if (!raw) return [];

  const parsedJson = parseJsonLoose(raw);
  if (parsedJson) {
    const structured = extractPointsFromStructuredDoc(parsedJson, limit);
    if (structured.length >= 2) return structured;
  }

  if (openai) {
    try {
      const prompt = `Extract ordered travel place names from the document.
Return strict JSON only:
{"points":["..."]}
Rules:
- Keep original order.
- Keep only real-world places/venues/areas.
- Remove duplicates.
- 2 to ${limit} items.
Context city: ${context.city || ""}
Context country: ${context.country || ""}
Document:
${raw.slice(0, 6000)}`;
      const resp = await openai.responses.create({
        model: OPENAI_MODEL,
        input: prompt,
        max_output_tokens: 500,
      });
      const parsed = parseJsonLoose(resp.output_text || "");
      if (parsed && Array.isArray(parsed.points)) {
        const points = [];
        const seen = new Set();
        for (const p of parsed.points) {
          pushPointCandidate(points, seen, p);
          if (points.length >= limit) break;
        }
        if (points.length >= 2) return points;
      }
    } catch (_err) {
      // Fallback to heuristic extraction.
    }
  }

  return extractPointsHeuristicFromDocument(raw, limit);
}

function isImageDataUrl(dataUrl) {
  const raw = String(dataUrl || "").trim();
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(raw);
}

async function extractOrderedPointsFromImage(imageDataUrl, context = {}, limit = 16) {
  if (!openai) {
    throw new Error("OPENAI_API_KEY not configured for image extraction.");
  }
  const raw = String(imageDataUrl || "").trim();
  if (!isImageDataUrl(raw)) {
    throw new Error("imageDataUrl must be a valid image data URL.");
  }

  const prompt = `Extract ordered travel place names from this image.
Return strict JSON only:
{"points":["..."]}
Rules:
- Keep original order in the image.
- Keep only real-world places/venues/areas.
- Remove duplicates.
- 2 to ${limit} items.
Context city: ${context.city || ""}
Context country: ${context.country || ""}`;

  try {
    const resp = await openai.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: raw },
          ],
        },
      ],
      max_output_tokens: 600,
    });
    const parsed = parseJsonLoose(resp.output_text || "");
    if (!parsed || !Array.isArray(parsed.points)) {
      throw new Error("Image OCR parsing failed.");
    }
    const points = [];
    const seen = new Set();
    for (const p of parsed.points) {
      pushPointCandidate(points, seen, p);
      if (points.length >= limit) break;
    }
    if (points.length < 2) {
      throw new Error("Not enough points extracted from image.");
    }
    return points;
  } catch (err) {
    throw new Error(`Image place extraction failed: ${err.message}`);
  }
}

function buildTimeSlotByIndex(index) {
  const startMinutes = 9 * 60;
  const total = startMinutes + index * 150;
  const hour = Math.floor(total / 60) % 24;
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

const COUNTRY_HINT_GROUPS = [
  { key: "singapore", hints: ["singapore", "sg", "新加坡"] },
  { key: "japan", hints: ["japan", "jp", "日本"] },
  { key: "china", hints: ["china", "cn", "中国"] },
  { key: "south korea", hints: ["south korea", "korea", "kr", "韩国"] },
  { key: "thailand", hints: ["thailand", "th", "泰国"] },
  { key: "malaysia", hints: ["malaysia", "my", "马来西亚"] },
  { key: "indonesia", hints: ["indonesia", "id", "印尼", "印度尼西亚"] },
  { key: "vietnam", hints: ["vietnam", "vn", "越南"] },
  { key: "united states", hints: ["united states", "usa", "us", "美国"] },
  { key: "united kingdom", hints: ["united kingdom", "uk", "gb", "英国"] },
  { key: "france", hints: ["france", "fr", "法国"] },
  { key: "italy", hints: ["italy", "it", "意大利"] },
  { key: "spain", hints: ["spain", "es", "西班牙"] },
  { key: "germany", hints: ["germany", "de", "德国"] },
  { key: "australia", hints: ["australia", "au", "澳大利亚"] },
  { key: "canada", hints: ["canada", "ca", "加拿大"] },
];

function normalizeLooseText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveCountryGroupKey(text) {
  const normalized = normalizeLooseText(text);
  if (!normalized) return "";
  const group = COUNTRY_HINT_GROUPS.find((g) => g.hints.some((hint) => normalized.includes(normalizeLooseText(hint))));
  return group ? group.key : "";
}

function toRadians(degree) {
  return (degree * Math.PI) / 180;
}

function distanceKmBetween(a, b) {
  if (!a || !b) return null;
  if (!Number.isFinite(a.lat) || !Number.isFinite(a.lng) || !Number.isFinite(b.lat) || !Number.isFinite(b.lng)) {
    return null;
  }
  const earthKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return earthKm * c;
}

function computeTravelTypeScore(candidate, interest = "") {
  const primary = String(candidate.primaryType || "").toLowerCase();
  const types = Array.isArray(candidate.types) ? candidate.types.map((t) => String(t).toLowerCase()) : [];
  const combined = [primary, ...types].filter(Boolean);
  if (!combined.length) return 0;

  const unlikely = new Set([
    "beauty_salon",
    "corporate_office",
    "insurance_agency",
    "accounting",
    "lawyer",
    "car_repair",
    "hospital",
    "doctor",
    "dentist",
    "bank",
    "finance",
    "real_estate_agency",
    "moving_company",
    "storage",
    "school",
    "university",
    "courthouse",
    "government_office",
    "post_office",
  ]);

  const interestValue = String(interest || "").toLowerCase();
  let preferred = new Set(["tourist_attraction", "landmark", "park", "museum", "art_gallery", "point_of_interest"]);
  if (interestValue.includes("美食")) {
    preferred = new Set(["restaurant", "food_court", "meal_takeaway", "meal_delivery", "bar"]);
  } else if (interestValue.includes("咖啡")) {
    preferred = new Set(["cafe", "coffee_shop", "bakery"]);
  } else if (interestValue.includes("看展")) {
    preferred = new Set(["museum", "art_gallery", "tourist_attraction"]);
  } else if (interestValue.includes("acg") || interestValue.includes("anime")) {
    preferred = new Set(["book_store", "store", "shopping_mall", "tourist_attraction"]);
  }

  let score = 0;
  if (combined.some((t) => unlikely.has(t))) score -= 22;
  if (combined.some((t) => preferred.has(t))) score += 16;
  if (combined.includes("point_of_interest")) score += 3;
  if (combined.includes("store") && !combined.some((t) => unlikely.has(t))) score += 2;
  return score;
}

function computeDocumentCandidateLocalScore(candidate, context = {}) {
  const cityText = normalizeLooseText(context.city);
  const countryKey = resolveCountryGroupKey(context.country);
  const address = normalizeLooseText(candidate.matchedName || candidate.point || "");
  let score = 0;

  const matchedCountry = resolveCountryGroupKey(address);
  if (matchedCountry && countryKey) {
    if (matchedCountry === countryKey) score += 36;
    else score -= 75;
  }

  if (cityText) {
    if (address.includes(cityText)) {
      score += 22;
    } else {
      const cityTerms = cityText.split(/\s+/).filter((t) => t.length >= 3);
      if (cityTerms.some((term) => address.includes(term))) score += 8;
      else score -= 4;
    }
  }

  const center = context.cityCenter;
  if (center) {
    const distCenter = distanceKmBetween(candidate, center);
    if (Number.isFinite(distCenter)) {
      if (distCenter <= 40) score += 20;
      else if (distCenter <= 120) score += 12;
      else if (distCenter <= 300) score += 2;
      else if (distCenter <= 800) score -= 16;
      else score -= 45;
    }
  }

  if (candidate.source === "Google Places API") score += 6;
  if (candidate.source === "Google Geocoding API") score += 3;

  if (Number.isFinite(candidate.rating)) {
    score += Math.min(14, Number(candidate.rating) * 2);
  }

  score += computeTravelTypeScore(candidate, context.interest);

  return score;
}

function isCountryConflictedCandidate(candidate, targetCountryKey) {
  if (!targetCountryKey) return false;
  const address = normalizeLooseText(candidate.matchedName || candidate.point || "");
  const matchedCountry = resolveCountryGroupKey(address);
  if (!matchedCountry) return false;
  return matchedCountry !== targetCountryKey;
}

function computeDocumentTransitionScore(prevCandidate, nextCandidate) {
  const dist = distanceKmBetween(prevCandidate, nextCandidate);
  if (!Number.isFinite(dist)) return -2;
  if (dist <= 30) return 10;
  if (dist <= 120) return 6;
  if (dist <= 300) return 2;
  if (dist <= 900) return -8;
  if (dist <= 2500) return -20;
  return -38;
}

function dedupePlaceCandidates(candidates, limit = 8) {
  const deduped = [];
  const seen = new Set();
  for (const item of candidates) {
    if (!item || !Number.isFinite(item.lat) || !Number.isFinite(item.lng)) continue;
    const key = item.placeId || `${Number(item.lat).toFixed(5)}|${Number(item.lng).toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
    if (deduped.length >= limit) break;
  }
  return deduped;
}

function selectBestCandidatePath(groups) {
  if (!Array.isArray(groups) || !groups.length) return [];
  const n = groups.length;
  const dp = groups.map((g) => g.candidates.map(() => -Infinity));
  const prev = groups.map((g) => g.candidates.map(() => -1));

  for (let j = 0; j < groups[0].candidates.length; j += 1) {
    dp[0][j] = groups[0].candidates[j].localScore;
  }

  for (let i = 1; i < n; i += 1) {
    for (let j = 0; j < groups[i].candidates.length; j += 1) {
      const cur = groups[i].candidates[j];
      let bestScore = -Infinity;
      let bestPrevIdx = -1;
      for (let k = 0; k < groups[i - 1].candidates.length; k += 1) {
        const prevCandidate = groups[i - 1].candidates[k];
        const trans = computeDocumentTransitionScore(prevCandidate, cur);
        const total = dp[i - 1][k] + trans + cur.localScore;
        if (total > bestScore) {
          bestScore = total;
          bestPrevIdx = k;
        }
      }
      dp[i][j] = bestScore;
      prev[i][j] = bestPrevIdx;
    }
  }

  let bestFinalIdx = 0;
  let bestFinalScore = -Infinity;
  for (let j = 0; j < groups[n - 1].candidates.length; j += 1) {
    if (dp[n - 1][j] > bestFinalScore) {
      bestFinalScore = dp[n - 1][j];
      bestFinalIdx = j;
    }
  }

  const chosen = new Array(n);
  let idx = bestFinalIdx;
  for (let i = n - 1; i >= 0; i -= 1) {
    chosen[i] = groups[i].candidates[idx];
    idx = prev[i][idx];
    if (idx < 0 && i > 0) idx = 0;
  }
  return chosen;
}

async function buildRouteFromDocument(payload) {
  const documentText = String(payload.documentText || "").trim();
  const city = String(payload.city || "").trim();
  const country = String(payload.country || "").trim();
  const interest = String(payload.interest || "").trim() || "city walk";
  const fromCountry = String(payload.fromCountry || "").trim();
  const startDate = String(payload.startDate || "").trim();
  const endDate = String(payload.endDate || "").trim();
  const regionCode = normalizeCountryToRegionCode(country);
  const targetCountryKey = resolveCountryGroupKey(country);

  const extractedPoints = await extractOrderedPointsFromDocument(documentText, { city, country }, 16);
  if (extractedPoints.length < 2) {
    throw new Error("无法从文档中提取足够地点，请至少提供2个地点。");
  }

  let cityCenter = null;
  const cityCenterGeo = await geocodePlaceGlobal(city, city, country, regionCode);
  if (cityCenterGeo && Number.isFinite(cityCenterGeo.lat) && Number.isFinite(cityCenterGeo.lng)) {
    cityCenter = { lat: cityCenterGeo.lat, lng: cityCenterGeo.lng };
  }

  const groups = [];
  const unresolvedPoints = [];
  for (const point of extractedPoints) {
    const fullQuery = `${point} ${city} ${country}`.trim();
    const fallbackQuery = `${point} ${country}`.trim();
    const searches = [];
    searches.push(...(await googlePlacesSearch(fullQuery, { regionCode, maxResultCount: 8 })));
    if (searches.length < 4) {
      searches.push(...(await googlePlacesSearch(fallbackQuery, { regionCode, maxResultCount: 8 })));
    }

    const geo = await geocodePlaceGlobal(point, city, country, regionCode);
    if (geo) {
      searches.push({
        point,
        input: point,
        matchedName: geo.matchedName,
        lat: geo.lat,
        lng: geo.lng,
        verified: true,
        source: geo.source,
        placeId: null,
        primaryType: null,
        types: [],
        googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullQuery)}`,
        rating: null,
        userRatingCount: null,
      });
    }

    const scoredCandidates = dedupePlaceCandidates(searches, 8).map((candidate) => ({
      ...candidate,
      input: point,
      localScore: computeDocumentCandidateLocalScore(candidate, { city, country, cityCenter, interest }),
    }));

    if (!scoredCandidates.length) {
      unresolvedPoints.push(point);
      continue;
    }

    const hasNonConflict = scoredCandidates.some((candidate) => !isCountryConflictedCandidate(candidate, targetCountryKey));
    const hasUnknownCountry = scoredCandidates.some((candidate) => {
      const address = normalizeLooseText(candidate.matchedName || candidate.point || "");
      return !resolveCountryGroupKey(address);
    });

    if (!hasNonConflict && !hasUnknownCountry) {
      unresolvedPoints.push(point);
      continue;
    }

    const finalCandidates = hasNonConflict
      ? scoredCandidates.filter((candidate) => !isCountryConflictedCandidate(candidate, targetCountryKey))
      : scoredCandidates;

    if (!finalCandidates.length) {
      unresolvedPoints.push(point);
      continue;
    }
    groups.push({ input: point, candidates: finalCandidates });
  }

  if (groups.length < 2) {
    throw new Error("提取到了地点，但可验证地点不足2个，无法生成路径。");
  }

  const defaultDate = formatDateYmd(new Date());
  const routeBaseDate = formatDateYmd(new Date(startDate)) || defaultDate;
  let maxRouteDays = 1;
  if (startDate && endDate) {
    const span = computeTravelDayCount(startDate, endDate);
    if (Number.isFinite(span) && span > 0) maxRouteDays = span;
  }

  const selectedCandidates = selectBestCandidatePath(groups);
  const route = [];
  for (const candidate of selectedCandidates) {
    const textQuery = `${candidate.input || candidate.point} ${city} ${country}`.trim();
    const enriched = await enrichPlaceForItinerary(candidate, { city, country, interest, area: city });
    const stepIndex = route.length;
    const dayOffset = Math.min(Math.floor(stepIndex / 3), Math.max(0, maxRouteDays - 1));
    const stepDate = addDaysYmd(routeBaseDate, dayOffset);
    route.push({
      date: stepDate,
      time: buildTimeSlotByIndex(route.length),
      point: enriched.point || candidate.input || candidate.point,
      input: candidate.input || candidate.point,
      matchedName: enriched.matchedName || null,
      lat: enriched.lat,
      lng: enriched.lng,
      verified: Boolean(enriched.verified),
      source: enriched.source || "Document Route",
      placeId: enriched.placeId || null,
      primaryType: enriched.primaryType || null,
      types: enriched.types || [],
      googleMapsUri: enriched.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textQuery)}`,
      websiteUri: enriched.websiteUri || null,
      rating: enriched.rating || null,
      userRatingCount: enriched.userRatingCount || null,
      intro: enriched.intro || "",
      ticketing: enriched.ticketing || { required: false, confidence: "low" },
      booking: enriched.booking || null,
    });
  }

  if (route.length < 2) {
    throw new Error("提取到了地点，但可验证地点不足2个，无法生成路径。");
  }

  const builtPath = await buildRoutePath(route);
  const bookingLinks =
    startDate && endDate
      ? {
          flights: buildFlightLink(fromCountry || "Singapore", city || country, startDate, endDate),
          hotels: buildHotelLink(city || country, startDate, endDate),
          attractions: `https://www.klook.com/en-SG/search/result/?query=${encodeURIComponent(
            `${city} ${country} attractions tickets`,
          )}`,
        }
      : null;

  return {
    id: `DOC-ROUTE-${Date.now()}`,
    title: `文档逐点路线：${city}, ${country}`,
    route,
    routePath: builtPath.path,
    routeSummary: builtPath.summary,
    budgetEstimate: "按文档原计划",
    reason: `按文档顺序抽取 ${extractedPoints.length} 个地点，经过国家/城市匹配与路径连续性交叉验证后，成功校验 ${route.length} 个真实地点并连成路线。`,
    validationSummary: {
      total: route.length,
      verified: route.filter((s) => s.verified).length,
      replaced: 0,
      realtime: true,
      fromDocument: true,
      crossValidated: true,
      extracted: extractedPoints.length,
      unresolved: unresolvedPoints.length,
    },
    bookingLinks,
    documentMeta: {
      extractedPoints,
      unresolvedPoints,
    },
    generatedAt: new Date().toISOString(),
  };
}

async function buildRouteFromImage(payload) {
  const imageDataUrl = String(payload.imageDataUrl || "").trim();
  const city = String(payload.city || "").trim();
  const country = String(payload.country || "").trim();
  if (!imageDataUrl || !city || !country) {
    throw new Error("imageDataUrl, city, country are required.");
  }

  const points = await extractOrderedPointsFromImage(imageDataUrl, { city, country }, 16);
  const syntheticDocument = JSON.stringify({ points });
  const plan = await buildRouteFromDocument({
    ...payload,
    documentText: syntheticDocument,
  });

  return {
    ...plan,
    title: `图片逐点路线：${city}, ${country}`,
    reason: `根据图片抽取 ${points.length} 个地点并进行交叉验证，${plan.reason}`,
    validationSummary: {
      ...(plan.validationSummary || {}),
      fromImage: true,
    },
    documentMeta: {
      ...(plan.documentMeta || {}),
      extractedPoints: points,
      source: "image",
    },
  };
}

async function googlePlacesSearch(query, options = {}) {
  if (!GOOGLE_MAPS_API_KEY) return [];
  const regionCode = options.regionCode || "SG";
  const maxResultCount = Number.isFinite(Number(options.maxResultCount))
    ? Math.min(Math.max(Number(options.maxResultCount), 1), 20)
    : 6;
  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.rating,places.userRatingCount,places.googleMapsUri",
      },
      body: JSON.stringify({
        textQuery: query,
        regionCode,
        languageCode: "en",
        maxResultCount,
      }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    const places = Array.isArray(data.places) ? data.places : [];
    return places
      .filter((p) => p.location && Number.isFinite(p.location.latitude) && Number.isFinite(p.location.longitude))
      .map((p) => ({
        point: p.displayName?.text || p.formattedAddress || "Unknown Place",
        matchedName: p.formattedAddress || p.displayName?.text || "Unknown Place",
        lat: p.location.latitude,
        lng: p.location.longitude,
        verified: true,
        source: "Google Places API",
        placeId: p.id || null,
        primaryType: p.primaryType || null,
        types: Array.isArray(p.types) ? p.types : [],
        googleMapsUri: p.googleMapsUri || null,
        rating: p.rating || null,
        userRatingCount: p.userRatingCount || null,
      }));
  } catch (_err) {
    return [];
  }
}

async function googlePlaceDetails(placeId) {
  if (!GOOGLE_MAPS_API_KEY || !placeId) return null;
  try {
    const endpoint = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const response = await fetch(endpoint, {
      headers: {
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask":
          "id,displayName,formattedAddress,googleMapsUri,websiteUri,editorialSummary,primaryType,types,rating,userRatingCount",
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      placeId: data.id || placeId,
      displayName: data.displayName?.text || null,
      formattedAddress: data.formattedAddress || null,
      googleMapsUri: data.googleMapsUri || null,
      websiteUri: data.websiteUri || null,
      editorialSummary: data.editorialSummary?.text || null,
      primaryType: data.primaryType || null,
      types: Array.isArray(data.types) ? data.types : [],
      rating: data.rating || null,
      userRatingCount: data.userRatingCount || null,
    };
  } catch (_err) {
    return null;
  }
}

function inferTicketing(types = [], primaryType = "", name = "") {
  const combined = `${primaryType} ${(types || []).join(" ")} ${name}`.toLowerCase();
  const noTicketKeywords = [
    "restaurant",
    "food",
    "meal",
    "cafe",
    "coffee",
    "bakery",
    "bar",
    "pub",
    "hotel",
    "lodging",
    "shopping",
    "mall",
    "store",
    "supermarket",
    "park",
    "beach",
    "market",
  ];
  if (noTicketKeywords.some((k) => combined.includes(k))) {
    return {
      required: false,
      confidence: "medium",
    };
  }

  const strongPaidKeywords = [
    "museum",
    "aquarium",
    "amusement_park",
    "theme_park",
    "zoo",
    "art_gallery",
    "observation",
    "tower",
    "studio",
    "landmark",
    "historic",
    "palace",
    "castle",
  ];
  const weakPaidKeywords = ["tourist_attraction", "visitor_center", "event_venue"];
  const likelyPaid = strongPaidKeywords.some((k) => combined.includes(k));
  const maybePaid = weakPaidKeywords.some((k) => combined.includes(k));
  return {
    required: likelyPaid || maybePaid,
    confidence: likelyPaid ? "high" : maybePaid ? "medium" : "low",
  };
}

function buildTicketLinks(placeName, city, country, websiteUri) {
  const query = encodeURIComponent(`${placeName} ${city} ${country} ticket`);
  const klook = `https://www.klook.com/en-SG/search/result/?query=${query}`;
  const kkday = `https://www.kkday.com/en-sg/product/search?keyword=${query}`;
  return {
    klook,
    kkday,
    official: websiteUri || null,
  };
}

function buildHotelLink(city, checkin, checkout) {
  const params = new URLSearchParams({
    ss: city,
    checkin,
    checkout,
    group_adults: "2",
    no_rooms: "1",
    group_children: "0",
  });
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

function buildFlightLink(fromCity, toCity, departDate, returnDate) {
  const from = encodeURIComponent(fromCity || "Singapore");
  const to = encodeURIComponent(toCity || "Tokyo");
  const depart = encodeURIComponent(departDate);
  const back = encodeURIComponent(returnDate);
  return `https://www.google.com/travel/flights?hl=en#flt=${from}.${to}.${depart}*${to}.${from}.${back};c:SGD;e:1;sd:1;t:f`;
}

function buildEventbriteSearchLink(city, country, keyword) {
  const location = encodeURIComponent(`${city || ""} ${country || ""}`.trim());
  const q = encodeURIComponent(keyword || "events");
  return `https://www.eventbrite.com/d/${location}/${q}/`;
}

async function generatePlaceIntro(place, context = {}) {
  if (place.editorialSummary) return place.editorialSummary;
  const fallback = `${place.point} 位于 ${context.city || "目的地城市"}，交通方便，适合纳入多日行程。`;
  if (!openai) return fallback;
  try {
    const prompt = `Write one concise Chinese travel intro (35-60 Chinese characters).
Place: ${place.point}
Address: ${place.matchedName || ""}
Type: ${place.primaryType || ""}
Rating: ${place.rating || "n/a"}
City: ${context.city || ""}
Country: ${context.country || ""}
No markdown.`;
    const resp = await openai.responses.create({
      model: OPENAI_MODEL,
      input: prompt,
      max_output_tokens: 90,
    });
    const text = String(resp.output_text || "").trim();
    return text || fallback;
  } catch (_err) {
    return fallback;
  }
}

async function enrichPlaceForItinerary(place, context = {}) {
  const details = await googlePlaceDetails(place.placeId);
  const merged = {
    ...place,
    placeId: details?.placeId || place.placeId || null,
    matchedName: details?.formattedAddress || place.matchedName,
    googleMapsUri: details?.googleMapsUri || place.googleMapsUri || null,
    websiteUri: details?.websiteUri || null,
    primaryType: details?.primaryType || place.primaryType || null,
    types: details?.types || place.types || [],
    rating: details?.rating || place.rating || null,
    userRatingCount: details?.userRatingCount || place.userRatingCount || null,
    editorialSummary: details?.editorialSummary || null,
  };

  const intro = await generatePlaceIntro(
    {
      point: merged.point,
      matchedName: merged.matchedName,
      primaryType: merged.primaryType,
      rating: merged.rating,
      editorialSummary: merged.editorialSummary,
    },
    context,
  );
  const ticketing = inferTicketing(merged.types, merged.primaryType, merged.point);
  const booking = buildTicketLinks(merged.point, context.city || "", context.country || "", merged.websiteUri);

  return {
    ...merged,
    intro,
    ticketing,
    booking,
  };
}

async function findRealtimePlaces(context, options = {}) {
  const queries = await generateRealtimePlaceQueries(context);
  const regionCode = options.regionCode || "SG";
  const targetCount = Number(options.targetCount) > 0 ? Number(options.targetCount) : 3;
  const maxCollect = Math.max(targetCount * 3, 9);
  const all = [];
  for (const q of queries) {
    const found = await googlePlacesSearch(q, { regionCode });
    all.push(...found);
    if (all.length >= maxCollect) break;
  }

  const dedup = [];
  const seen = new Set();
  for (const place of all) {
    const key = `${place.point}|${place.lat.toFixed(5)}|${place.lng.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(place);
    if (dedup.length >= targetCount) break;
  }
  const enriched = [];
  for (const place of dedup) {
    const full = await enrichPlaceForItinerary(place, context);
    enriched.push(full);
  }
  return enriched;
}

async function buildRoutePath(route) {
  const valid = route.filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
  if (!GOOGLE_MAPS_API_KEY || valid.length < 2) {
    return { path: valid.map((r) => ({ lat: r.lat, lng: r.lng })), summary: null };
  }

  const origin = `${valid[0].lat},${valid[0].lng}`;
  const destination = `${valid[valid.length - 1].lat},${valid[valid.length - 1].lng}`;
  const waypoints = valid.slice(1, -1).map((v) => `${v.lat},${v.lng}`).join("|");
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    origin,
  )}&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(
    waypoints,
  )}&mode=transit&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return { path: valid.map((r) => ({ lat: r.lat, lng: r.lng })), summary: null };
    const data = await response.json();
    const firstRoute = Array.isArray(data.routes) ? data.routes[0] : null;
    if (!firstRoute) return { path: valid.map((r) => ({ lat: r.lat, lng: r.lng })), summary: null };

    const points = firstRoute.overview_polyline?.points;
    const path = points ? decodePolyline(points) : valid.map((r) => ({ lat: r.lat, lng: r.lng }));

    let distanceMeters = 0;
    let durationSeconds = 0;
    for (const leg of firstRoute.legs || []) {
      distanceMeters += leg.distance?.value || 0;
      durationSeconds += leg.duration?.value || 0;
    }

    return {
      path,
      summary: {
        mode: "transit",
        distanceKm: distanceMeters ? Number((distanceMeters / 1000).toFixed(1)) : null,
        durationMin: durationSeconds ? Math.round(durationSeconds / 60) : null,
      },
    };
  } catch (_err) {
    return { path: valid.map((r) => ({ lat: r.lat, lng: r.lng })), summary: null };
  }
}

function isValidIntent(intent) {
  const required = ["companion", "people", "budget", "timeSlot", "interest", "area"];
  return required.every((key) => intent[key] !== undefined && intent[key] !== null && intent[key] !== "");
}

function pickTemplate(interest, area) {
  const exact = templates.filter((item) => item.interest === interest && item.area === area);
  if (exact.length > 0) return exact[Math.floor(Math.random() * exact.length)];
  const fallback = templates.find((item) => item.interest === interest);
  return fallback || templates[0];
}

async function geocodePlaceInSingapore(place) {
  const curated = curatedPlaceCoordinates[place];
  if (curated) {
    return {
      input: place,
      matchedName: curated.matchedName,
      lat: curated.lat,
      lng: curated.lng,
      verified: true,
      source: "Curated Place Catalog",
    };
  }

  const query = `${place}, Singapore`;

  if (GOOGLE_MAPS_API_KEY) {
    try {
      const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query,
      )}&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&region=sg`;
      const googleResp = await fetch(googleUrl);
      if (googleResp.ok) {
        const googleData = await googleResp.json();
        if (googleData.status === "OK" && Array.isArray(googleData.results) && googleData.results.length > 0) {
          const top = googleData.results[0];
          return {
            input: place,
            matchedName: top.formatted_address,
            lat: Number(top.geometry.location.lat),
            lng: Number(top.geometry.location.lng),
            verified: true,
            source: "Google Geocoding API",
          };
        }
      }
    } catch (_err) {
      // Ignore and fallback to Nominatim.
    }
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "ai-activity-launcher-demo/1.0",
        Accept: "application/json",
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const top = data[0];
    return {
      input: place,
      matchedName: top.display_name,
      lat: Number(top.lat),
      lng: Number(top.lon),
      verified: true,
      source: "OpenStreetMap Nominatim",
    };
  } catch (_err) {
    return null;
  }
}

function getFallbackPoints(area, interest) {
  if (interest === "美食") {
    return foodFallbackByArea[area] || foodFallbackByArea["新加坡市中心"];
  }
  if (interest === "咖啡") {
    return coffeeFallbackByArea[area] || coffeeFallbackByArea["新加坡市中心"];
  }
  return fallbackByArea[area] || fallbackByArea["新加坡市中心"];
}

async function validateRoute(route, area, interest) {
  const validated = [];
  for (const stop of route) {
    const found = await geocodePlaceInSingapore(stop.point);
    if (found) {
      validated.push({
        ...stop,
        ...found,
      });
      continue;
    }
    validated.push({
      ...stop,
      input: stop.point,
      matchedName: null,
      lat: null,
      lng: null,
      verified: false,
      source: "OpenStreetMap Nominatim",
    });
  }

  const hasInvalid = validated.some((stop) => !stop.verified);
  if (!hasInvalid) {
    return { route: validated, validationSummary: { total: validated.length, verified: validated.length, replaced: 0 } };
  }

  const fallbackPoints = getFallbackPoints(area, interest);
  let replaced = 0;
  for (let i = 0; i < validated.length; i += 1) {
    if (validated[i].verified) continue;
    for (const fallbackName of fallbackPoints) {
      const fallback = await geocodePlaceInSingapore(fallbackName);
      if (!fallback) continue;
      validated[i] = {
        ...validated[i],
        point: fallbackName,
        ...fallback,
      };
      replaced += 1;
      break;
    }
  }

  const verifiedCount = validated.filter((stop) => stop.verified).length;
  return {
    route: validated,
    validationSummary: {
      total: validated.length,
      verified: verifiedCount,
      replaced,
    },
  };
}

async function generatePlan(intent) {
  const times = durations[intent.timeSlot] || durations["周末半天"];
  const planDate = formatDateYmd(new Date());
  let validated;

  const realtimePlaces = await findRealtimePlaces(
    {
      interest: intent.interest,
      area: intent.area,
      city: "Singapore",
      country: "Singapore",
      companion: intent.companion,
      budget: intent.budget,
      timeSlot: intent.timeSlot,
    },
    { regionCode: "SG", targetCount: 3 },
  );
  if (realtimePlaces.length >= 3) {
    const realtimeRoute = realtimePlaces.slice(0, 3).map((place, index) => ({
      date: planDate,
      time: times[index] || "TBD",
      point: place.point,
      input: place.point,
      matchedName: place.matchedName,
      lat: place.lat,
      lng: place.lng,
      verified: true,
      source: place.source,
      placeId: place.placeId || null,
      primaryType: place.primaryType || null,
      types: place.types || [],
      googleMapsUri: place.googleMapsUri || null,
      websiteUri: place.websiteUri || null,
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      intro: place.intro || "",
      ticketing: place.ticketing || { required: false, confidence: "low" },
      booking: place.booking || null,
    }));
    validated = {
      route: realtimeRoute,
      validationSummary: {
        total: realtimeRoute.length,
        verified: realtimeRoute.length,
        replaced: 0,
        realtime: true,
      },
    };
  } else {
    const template = pickTemplate(intent.interest, intent.area);
    const rawRoute = template.points.map((point, index) => ({
      date: planDate,
      time: times[index] || "TBD",
      point,
    }));
    validated = await validateRoute(rawRoute, intent.area, intent.interest);
    const enrichedFallbackRoute = [];
    for (const stop of validated.route) {
      const full = await enrichPlaceForItinerary(
        {
          point: stop.point,
          matchedName: stop.matchedName,
          lat: stop.lat,
          lng: stop.lng,
          verified: stop.verified,
          source: stop.source,
        },
        { city: "Singapore", country: "Singapore", area: intent.area, interest: intent.interest },
      );
      enrichedFallbackRoute.push({
        ...stop,
        intro: full.intro,
        ticketing: full.ticketing,
        booking: full.booking,
        googleMapsUri: full.googleMapsUri || null,
        websiteUri: full.websiteUri || null,
      });
    }
    validated.route = enrichedFallbackRoute;
  }

  const travelPath = await buildRoutePath(validated.route);

  return {
    id: `PLAN-${Date.now()}`,
    title: `${intent.companion}${intent.people}人 ${intent.timeSlot}${intent.interest}路线`,
    route: validated.route,
    budgetEstimate: budgetText[intent.budget] || "预算待定",
    reason: `基于${intent.interest}偏好、${intent.area}范围和${intent.timeSlot}时长，优先给出移动成本低、可执行性高的3站路线。全部点位已做真实地点校验。`,
    validationSummary: validated.validationSummary,
    routePath: travelPath.path,
    routeSummary: travelPath.summary,
    intent,
    generatedAt: new Date().toISOString(),
  };
}

function formatDateYmd(dateObj) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return "";
  return dateObj.toISOString().slice(0, 10);
}

function addDaysYmd(baseYmd, days = 0) {
  const base = String(baseYmd || "").trim();
  if (!base) return "";
  const date = new Date(`${base}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return base;
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function computeTravelDayCount(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 1;
  const diffMs = end.getTime() - start.getTime();
  const days = Math.floor(diffMs / (24 * 3600 * 1000)) + 1;
  return Math.min(Math.max(days, 1), 6);
}

async function geocodePlaceGlobal(place, city, country, regionCode) {
  const query = `${place}, ${city}, ${country}`;

  if (GOOGLE_MAPS_API_KEY) {
    try {
      const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query,
      )}&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&region=${encodeURIComponent(regionCode || "SG")}`;
      const googleResp = await fetch(googleUrl);
      if (googleResp.ok) {
        const googleData = await googleResp.json();
        if (googleData.status === "OK" && Array.isArray(googleData.results) && googleData.results.length > 0) {
          const top = googleData.results[0];
          return {
            input: place,
            matchedName: top.formatted_address,
            lat: Number(top.geometry.location.lat),
            lng: Number(top.geometry.location.lng),
            verified: true,
            source: "Google Geocoding API",
          };
        }
      }
    } catch (_err) {
      // Ignore and fallback to Nominatim.
    }
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "ai-activity-launcher-demo/1.0",
        Accept: "application/json",
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const top = data[0];
    return {
      input: place,
      matchedName: top.display_name,
      lat: Number(top.lat),
      lng: Number(top.lon),
      verified: true,
      source: "OpenStreetMap Nominatim",
    };
  } catch (_err) {
    return null;
  }
}

function pickMookGuideForDestination(toCountry, toCity) {
  const guides = readJson(MOOK_GUIDES_FILE);
  if (!guides.length) return null;
  const cityVal = String(toCity || "").toLowerCase();
  const countryVal = String(toCountry || "").toLowerCase();

  const cityExact = guides.find(
    (g) => String(g.city || "").toLowerCase() === cityVal && String(g.country || "").toLowerCase() === countryVal,
  );
  if (cityExact) return cityExact;

  const cityContains = guides.find(
    (g) => String(g.city || "").toLowerCase().includes(cityVal) && String(g.country || "").toLowerCase() === countryVal,
  );
  if (cityContains) return cityContains;

  const countryOnly = guides.find((g) => String(g.country || "").toLowerCase() === countryVal);
  return countryOnly || null;
}

function flattenGuideGeoPool(guide) {
  const seen = new Set();
  const pool = [];
  for (const dayPlan of guide.daysPlan || []) {
    for (const p of dayPlan.geoPoints || []) {
      const key = String(p.name || "").toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      pool.push(p);
    }
  }
  return pool;
}

function toTravelStopFromPlace(place, idx, date) {
  const timeSlots = ["09:30", "13:00", "17:00"];
  return {
    date: date || formatDateYmd(new Date()),
    time: timeSlots[idx] || "TBD",
    point: place.point,
    input: place.point,
    matchedName: place.matchedName,
    lat: place.lat,
    lng: place.lng,
    verified: Boolean(place.verified),
    source: place.source || "MOOK Curated GeoPoint",
    placeId: place.placeId || null,
    primaryType: place.primaryType || null,
    types: place.types || [],
    googleMapsUri: place.googleMapsUri || null,
    websiteUri: place.websiteUri || null,
    rating: place.rating || null,
    userRatingCount: place.userRatingCount || null,
    intro: place.intro || "",
    ticketing: place.ticketing || { required: false, confidence: "low" },
    booking: place.booking || null,
  };
}

async function buildTravelRouteFromMookFallback(post, dayCount, interest, regionCode) {
  const guide = pickMookGuideForDestination(post.toCountry, post.toCity);
  if (!guide) {
    throw new Error("Insufficient realtime places for this destination.");
  }

  const geoPool = flattenGuideGeoPool(guide);
  if (!geoPool.length) {
    throw new Error("No fallback geo points available for this destination.");
  }

  const start = new Date(post.startDate);
  const dailyRoutes = [];
  for (let day = 0; day < dayCount; day += 1) {
    const dayPlan = guide.daysPlan[day % guide.daysPlan.length];
    const dayGeo = Array.isArray(dayPlan?.geoPoints) && dayPlan.geoPoints.length ? dayPlan.geoPoints : geoPool;
    const picks = [];
    for (let step = 0; step < 3; step += 1) {
      const sourcePoint = dayGeo[step] || geoPool[(day * 3 + step) % geoPool.length];
      picks.push(sourcePoint);
    }

    const enriched = [];
    for (const p of picks) {
      const found = await geocodePlaceGlobal(p.name, post.toCity, post.toCountry, regionCode);
      const basePlace = {
        point: p.name,
        matchedName: found?.matchedName || `${p.name}, ${post.toCity}, ${post.toCountry}`,
        lat: Number.isFinite(found?.lat) ? found.lat : p.lat,
        lng: Number.isFinite(found?.lng) ? found.lng : p.lng,
        verified: Boolean(found || (Number.isFinite(p.lat) && Number.isFinite(p.lng))),
        source: found?.source || "MOOK Curated GeoPoint",
        primaryType: p.type || null,
        types: p.type ? [String(p.type)] : [],
        googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${p.name} ${post.toCity} ${post.toCountry}`,
        )}`,
      };
      const full = await enrichPlaceForItinerary(basePlace, {
        city: post.toCity,
        country: post.toCountry,
        interest,
        area: post.toCity,
      });
      enriched.push(full);
    }

    const d = new Date(start);
    d.setDate(start.getDate() + day);
    const dayDate = formatDateYmd(d);
    const route = enriched.map((place, idx) => toTravelStopFromPlace(place, idx, dayDate));
    const builtPath = await buildRoutePath(route);
    dailyRoutes.push({
      day: day + 1,
      date: dayDate,
      route,
      routePath: builtPath.path,
      routeSummary: builtPath.summary,
      source: `MOOK:${guide.id}`,
      dayTitle: dayPlan?.title || `Day ${day + 1}`,
    });
  }

  return {
    guide,
    dailyRoutes,
  };
}

async function generateTravelRoutePlan(post) {
  const interest = inferInterestFromTags(post.tags, post.note);
  const dayCount = computeTravelDayCount(post.startDate, post.endDate);
  const regionCode = normalizeCountryToRegionCode(post.toCountry);
  const targetCount = Math.max(dayCount * 3, 9);
  const places = await findRealtimePlaces(
    {
      interest,
      area: post.toCity,
      city: post.toCity,
      country: post.toCountry,
      companion: "朋友",
      budget: post.budget || "中预算",
      timeSlot: "周末全天",
    },
    { regionCode, targetCount },
  );

  let dailyRoutes = [];
  let usedRealtimePlaces = false;
  let routeReasonPrefix = "实时搜索真实门店";
  if (places.length >= 3) {
    usedRealtimePlaces = true;
    const start = new Date(post.startDate);
    for (let day = 0; day < dayCount; day += 1) {
      const picks = [];
      for (let step = 0; step < 3; step += 1) {
        const idx = (day * 3 + step) % places.length;
        picks.push(places[idx]);
      }
      const d = new Date(start);
      d.setDate(start.getDate() + day);
      const dayDate = formatDateYmd(d);
      const route = picks.map((place, idx) => toTravelStopFromPlace({ ...place, verified: true }, idx, dayDate));
      const builtPath = await buildRoutePath(route);
      dailyRoutes.push({
        day: day + 1,
        date: dayDate,
        route,
        routePath: builtPath.path,
        routeSummary: builtPath.summary,
        source: "Google Places",
      });
    }
  } else {
    const fallback = await buildTravelRouteFromMookFallback(post, dayCount, interest, regionCode);
    dailyRoutes = fallback.dailyRoutes;
    routeReasonPrefix = `MOOK兜底(${fallback.guide.id}) + 地理编码校验`;
  }

  const firstDay = dailyRoutes[0];
  const firstDayVerified = firstDay.route.filter((s) => s.verified).length;
  const bookingLinks = {
    flights: buildFlightLink(post.fromCountry || "Singapore", post.toCity || post.toCountry, post.startDate, post.endDate),
    hotels: buildHotelLink(post.toCity || post.toCountry, post.startDate, post.endDate),
    attractions: `https://www.klook.com/en-SG/search/result/?query=${encodeURIComponent(
      `${post.toCity} ${post.toCountry} attractions tickets`,
    )}`,
  };
  return {
    id: `TRAVEL-PLAN-${Date.now()}`,
    travelPostId: post.id,
    title: `${post.toCountry} ${post.toCity} ${dayCount}日路线（第1天预览）`,
    route: firstDay.route,
    routePath: firstDay.routePath,
    routeSummary: firstDay.routeSummary,
    bookingLinks,
    budgetEstimate: post.budget || "预算待定",
    validationSummary: {
      total: firstDay.route.length,
      verified: firstDayVerified,
      replaced: 0,
      realtime: usedRealtimePlaces,
      multiDay: dayCount,
    },
    reason: `基于目的地 ${post.toCity}, ${post.toCountry} 与行程偏好，${routeReasonPrefix}并生成多日路线。`,
    dailyRoutes,
    generatedAt: new Date().toISOString(),
  };
}

async function discoverRealtimeLocalPlaces({ q, city, country, category, limit = 8 }) {
  const regionCode = normalizeCountryToRegionCode(country);
  const target = Math.min(Math.max(Number(limit) || 8, 3), 20);
  const querySeeds = [];
  if (q) querySeeds.push(`${q} in ${city} ${country}`);
  if (category) querySeeds.push(`${category} in ${city} ${country}`);
  if (!querySeeds.length) querySeeds.push(`${city} ${country} attractions`);

  const all = [];
  for (const query of querySeeds) {
    const found = await googlePlacesSearch(query, { regionCode });
    all.push(...found);
    if (all.length >= target * 2) break;
  }

  const dedup = [];
  const seen = new Set();
  for (const p of all) {
    const key = `${p.point}|${Number(p.lat).toFixed(5)}|${Number(p.lng).toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(p);
    if (dedup.length >= target) break;
  }

  const enriched = [];
  for (const place of dedup) {
    const full = await enrichPlaceForItinerary(place, { city, country, interest: category || q || "local" });
    enriched.push(full);
  }

  if (enriched.length >= 3) return enriched;

  const guide = pickMookGuideForDestination(country, city);
  if (!guide) return enriched;
  const geoPool = flattenGuideGeoPool(guide).slice(0, target);
  for (const g of geoPool) {
    const found = await geocodePlaceGlobal(g.name, city, country, regionCode);
    if (!found) continue;
    const full = await enrichPlaceForItinerary(
      {
        point: g.name,
        matchedName: found.matchedName,
        lat: found.lat,
        lng: found.lng,
        verified: true,
        source: found.source,
        primaryType: g.type,
        types: g.type ? [g.type] : [],
        googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${g.name} ${city} ${country}`)}`,
      },
      { city, country, interest: category || q || "local" },
    );
    enriched.push(full);
    if (enriched.length >= target) break;
  }

  return enriched.slice(0, target);
}

function createActivity(plan) {
  const code = `ACT-${Math.floor(1000 + Math.random() * 9000)}`;
  const tokenBase = Buffer.from(
    JSON.stringify({
      code,
      title: plan.title,
      createdAt: Date.now(),
    }),
  ).toString("base64url");

  return {
    code,
    title: plan.title,
    route: plan.route,
    budgetEstimate: plan.budgetEstimate,
    reason: plan.reason,
    members: `当前发起人 + 可邀请${Math.max(0, Number(plan.intent.people) - 1)}人`,
    schedule: plan.route
      .map((x) => {
        const datePart = x.date ? `${x.date} ` : "";
        return `${datePart}${x.time} ${x.point}`;
      })
      .join(" | "),
    joinToken: tokenBase.slice(0, 24),
    createdAt: new Date().toISOString(),
  };
}

ensureDataStore();
app.use(cors());
app.use(express.json({ limit: "12mb" }));
app.use(express.static(__dirname));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.get("/api/maps-config", (_req, res) => {
  res.json({
    enabled: Boolean(GOOGLE_MAPS_API_KEY),
    apiKey: GOOGLE_MAPS_API_KEY,
  });
});

app.post("/api/auth/register", async (req, res) => {
  const { username, password, displayName, email } = req.body || {};
  if (!username || !password || !displayName) {
    return res.status(400).json({ error: "username, password, displayName are required." });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const normalizedUsername = String(username).trim().toLowerCase();
  const normalizedEmail = normalizeEmail(email);
  if (email && !normalizedEmail) {
    return res.status(400).json({ error: "Email format invalid." });
  }
  const users = readJson(USERS_FILE);
  if (users.some((user) => user.username === normalizedUsername)) {
    return res.status(409).json({ error: "Username already exists." });
  }
  if (normalizedEmail && users.some((user) => user.email === normalizedEmail || user.campusEmail === normalizedEmail)) {
    return res.status(409).json({ error: "Email already exists." });
  }
  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = {
    id: `USR-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    username: normalizedUsername,
    displayName: String(displayName).trim(),
    passwordHash,
    email: normalizedEmail,
    phone: "",
    oauthAccounts: {},
    campusVerified: false,
    campusName: "",
    campusEmail: "",
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeJson(USERS_FILE, users);
  const token = createToken(user);
  return res.status(201).json({ token, user: toPublicUser(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const { identifier, username, password } = req.body || {};
  const loginIdentifier = identifier || username;
  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: "identifier and password are required." });
  }
  const users = readJson(USERS_FILE);
  const user = findUserByIdentifier(users, loginIdentifier);
  if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid username/email or password." });
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid username/email or password." });
  const token = createToken(user);
  return res.json({ token, user: toPublicUser(user) });
});

app.post("/api/auth/request-code", (req, res) => {
  const { identifier } = req.body || {};
  const parsed = parseCodeLoginIdentifier(identifier);
  if (!parsed) {
    return res.status(400).json({ error: "identifier must be a valid email or phone number." });
  }

  const ttlMs = 10 * 60 * 1000;
  const code = generateNumericCode(6);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs).toISOString();

  const existing = cleanupAuthCodes(readJson(AUTH_CODES_FILE)).filter((item) => item.identifier !== parsed.value);
  existing.push({
    id: `OTP-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    identifier: parsed.value,
    kind: parsed.kind,
    code,
    createdAt: now.toISOString(),
    expiresAt,
    usedAt: "",
  });
  writeJson(AUTH_CODES_FILE, existing);

  return res.json({
    ok: true,
    identifierHint: maskIdentifier(parsed),
    expiresInSeconds: Math.floor(ttlMs / 1000),
    debugCode: code,
  });
});

app.post("/api/auth/code-login", (req, res) => {
  const { identifier, code, displayName } = req.body || {};
  if (!identifier || !code) {
    return res.status(400).json({ error: "identifier and code are required." });
  }
  const parsed = parseCodeLoginIdentifier(identifier);
  if (!parsed) {
    return res.status(400).json({ error: "identifier must be a valid email or phone number." });
  }

  const rawCodes = cleanupAuthCodes(readJson(AUTH_CODES_FILE));
  const codeValue = String(code).trim();
  const idx = rawCodes.findIndex((item) => item.identifier === parsed.value && item.code === codeValue);
  if (idx < 0) {
    writeJson(AUTH_CODES_FILE, rawCodes);
    return res.status(401).json({ error: "Invalid or expired code." });
  }

  rawCodes.splice(idx, 1);
  writeJson(AUTH_CODES_FILE, rawCodes);

  const users = readJson(USERS_FILE);
  let user =
    users.find((u) => (parsed.kind === "email" ? u.email === parsed.value || u.campusEmail === parsed.value : u.phone === parsed.value)) ||
    null;
  let created = false;

  if (!user) {
    const base = parsed.kind === "email" ? parsed.value.split("@")[0] : `u${parsed.value.slice(-6)}`;
    user = {
      id: `USR-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      username: makeUniqueUsername(base, users),
      displayName: String(displayName || "").trim() || (parsed.kind === "email" ? parsed.value.split("@")[0] : `用户${parsed.value.slice(-4)}`),
      passwordHash: "",
      email: parsed.kind === "email" ? parsed.value : "",
      phone: parsed.kind === "phone" ? parsed.value : "",
      oauthAccounts: {},
      campusVerified: false,
      campusName: "",
      campusEmail: "",
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    created = true;
  } else {
    if (parsed.kind === "email" && !user.email) user.email = parsed.value;
    if (parsed.kind === "phone" && !user.phone) user.phone = parsed.value;
  }

  writeJson(USERS_FILE, users);
  const token = createToken(user);
  return res.json({ token, user: toPublicUser(user), created });
});

app.post("/api/auth/oauth/mock", (req, res) => {
  const { provider, oauthUserId, displayName, email } = req.body || {};
  const normalizedProvider = String(provider || "").trim().toLowerCase();
  if (!OAUTH_PROVIDERS.has(normalizedProvider)) {
    return res.status(400).json({ error: "Unsupported provider." });
  }
  if (!oauthUserId) {
    return res.status(400).json({ error: "oauthUserId is required." });
  }

  const normalizedEmail = normalizeEmail(email);
  const users = readJson(USERS_FILE);
  let user =
    users.find((u) => u.oauthAccounts && u.oauthAccounts[normalizedProvider] === String(oauthUserId)) ||
    null;

  if (!user && normalizedEmail) {
    user = users.find((u) => u.email === normalizedEmail || u.campusEmail === normalizedEmail) || null;
  }

  if (!user) {
    const baseName = String(displayName || `${normalizedProvider}_user`).trim();
    user = {
      id: `USR-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      username: makeUniqueUsername(`${normalizedProvider}_${baseName}`, users),
      displayName: baseName || `${providerDisplayName(normalizedProvider)} 用户`,
      passwordHash: "",
      email: normalizedEmail,
      phone: "",
      oauthAccounts: {
        [normalizedProvider]: String(oauthUserId),
      },
      campusVerified: false,
      campusName: "",
      campusEmail: "",
      createdAt: new Date().toISOString(),
    };
    users.push(user);
  } else {
    if (!user.oauthAccounts || typeof user.oauthAccounts !== "object") user.oauthAccounts = {};
    user.oauthAccounts[normalizedProvider] = String(oauthUserId);
    if (normalizedEmail && !user.email) user.email = normalizedEmail;
    if (displayName && String(displayName).trim()) user.displayName = String(displayName).trim();
  }

  writeJson(USERS_FILE, users);
  const token = createToken(user);
  return res.json({ token, user: toPublicUser(user), provider: normalizedProvider });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  return res.json({ user: toPublicUser(req.user) });
});

app.post("/api/campus/verify", authMiddleware, (req, res) => {
  const { campusEmail, campusName, studentId } = req.body || {};
  if (!campusEmail || !campusName) {
    return res.status(400).json({ error: "campusEmail and campusName are required." });
  }
  if (!isCampusEmail(campusEmail)) {
    return res.status(400).json({ error: "Campus email format invalid." });
  }
  const users = readJson(USERS_FILE);
  const idx = users.findIndex((u) => u.id === req.user.id);
  if (idx < 0) return res.status(404).json({ error: "User not found." });
  users[idx].campusVerified = true;
  users[idx].campusEmail = String(campusEmail).trim().toLowerCase();
  users[idx].campusName = String(campusName).trim();
  users[idx].studentId = studentId ? String(studentId).trim() : "";
  writeJson(USERS_FILE, users);
  return res.json({ user: toPublicUser(users[idx]), campusVerified: true, campusName: users[idx].campusName });
});

app.get("/api/friends", authMiddleware, (req, res) => {
  const friends = getFriendsForUser(req.user.id);
  const requests = readJson(FRIEND_REQUESTS_FILE)
    .filter((r) => (r.toUserId === req.user.id || r.fromUserId === req.user.id) && r.status === "pending")
    .slice(-100)
    .reverse();
  return res.json({ friends, requests });
});

app.post("/api/friends/request", authMiddleware, (req, res) => {
  const { toUsername } = req.body || {};
  if (!toUsername) return res.status(400).json({ error: "toUsername is required." });
  const users = readJson(USERS_FILE);
  const target = users.find((u) => u.username === String(toUsername).trim().toLowerCase());
  if (!target) return res.status(404).json({ error: "Target user not found." });
  if (target.id === req.user.id) return res.status(400).json({ error: "Cannot add yourself." });

  const friendships = readJson(FRIENDSHIPS_FILE);
  if (friendships.some((f) => f.pair === normalizePair(req.user.id, target.id))) {
    return res.status(409).json({ error: "Already friends." });
  }

  const requests = readJson(FRIEND_REQUESTS_FILE);
  const exists = requests.find(
    (r) => r.status === "pending" && normalizePair(r.fromUserId, r.toUserId) === normalizePair(req.user.id, target.id),
  );
  if (exists) return res.status(409).json({ error: "Request already pending." });

  const request = {
    id: `FR-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    fromUserId: req.user.id,
    toUserId: target.id,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  requests.push(request);
  writeJson(FRIEND_REQUESTS_FILE, requests);
  return res.status(201).json(request);
});

app.post("/api/friends/request/:id/respond", authMiddleware, (req, res) => {
  const { accept } = req.body || {};
  const requests = readJson(FRIEND_REQUESTS_FILE);
  const idx = requests.findIndex((r) => r.id === req.params.id && r.toUserId === req.user.id);
  if (idx < 0) return res.status(404).json({ error: "Friend request not found." });
  if (requests[idx].status !== "pending") return res.status(400).json({ error: "Request already handled." });

  requests[idx].status = accept ? "accepted" : "rejected";
  requests[idx].respondedAt = new Date().toISOString();
  writeJson(FRIEND_REQUESTS_FILE, requests);

  if (accept) {
    const friendships = readJson(FRIENDSHIPS_FILE);
    const pair = normalizePair(requests[idx].fromUserId, requests[idx].toUserId);
    if (!friendships.some((f) => f.pair === pair)) {
      friendships.push({
        id: `FS-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
        pair,
        userA: requests[idx].fromUserId,
        userB: requests[idx].toUserId,
        createdAt: new Date().toISOString(),
      });
      writeJson(FRIENDSHIPS_FILE, friendships);
    }
  }
  return res.json(requests[idx]);
});

app.get("/api/im/dm/:userId/messages", authMiddleware, (req, res) => {
  const otherUserId = req.params.userId;
  const pair = normalizePair(req.user.id, otherUserId);
  const messages = readJson(DIRECT_MESSAGES_FILE).filter((m) => m.pair === pair);
  return res.json(messages.slice(-200));
});

app.post("/api/im/dm/:userId/messages", authMiddleware, (req, res) => {
  const otherUserId = req.params.userId;
  const users = readJson(USERS_FILE);
  const target = users.find((u) => u.id === otherUserId);
  if (!target) return res.status(404).json({ error: "Target user not found." });

  const { content, geo } = req.body || {};
  if (!content || !String(content).trim()) return res.status(400).json({ error: "Message content is required." });

  const pair = normalizePair(req.user.id, otherUserId);
  const message = {
    id: `DM-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    pair,
    fromUserId: req.user.id,
    toUserId: otherUserId,
    content: String(content).trim().slice(0, 2000),
    geo: normalizeGeo(geo),
    user: toPublicUser(req.user),
    createdAt: new Date().toISOString(),
  };
  appendJson(DIRECT_MESSAGES_FILE, message);
  io.to(`user:${otherUserId}`).emit("im:dm_message", message);
  io.to(`user:${req.user.id}`).emit("im:dm_message", message);
  return res.status(201).json(message);
});

app.post("/api/campus/groups", authMiddleware, (req, res) => {
  if (!req.user.campusVerified || !req.user.campusName) {
    return res.status(403).json({ error: "Campus verification required." });
  }
  const { name, description, geo } = req.body || {};
  if (!name) return res.status(400).json({ error: "name is required." });

  const groups = readJson(CAMPUS_GROUPS_FILE);
  const group = {
    id: `CG-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    name: String(name).trim(),
    description: String(description || "").trim(),
    campusName: req.user.campusName,
    geo: normalizeGeo(geo),
    creator: toPublicUser(req.user),
    members: [toPublicUser(req.user)],
    messages: [],
    createdAt: new Date().toISOString(),
  };
  groups.push(group);
  writeJson(CAMPUS_GROUPS_FILE, groups);
  return res.status(201).json(group);
});

app.get("/api/campus/groups", authMiddleware, (req, res) => {
  const groups = readJson(CAMPUS_GROUPS_FILE);
  const campusName = req.user.campusName ? String(req.user.campusName).toLowerCase() : "";
  const visible = groups.filter((g) => (campusName ? String(g.campusName).toLowerCase() === campusName : true));
  return res.json(visible.slice(-100).reverse());
});

app.post("/api/campus/groups/:id/join", authMiddleware, (req, res) => {
  if (!req.user.campusVerified || !req.user.campusName) {
    return res.status(403).json({ error: "Campus verification required." });
  }
  const groups = readJson(CAMPUS_GROUPS_FILE);
  const idx = groups.findIndex((g) => g.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Group not found." });
  if (String(groups[idx].campusName).toLowerCase() !== String(req.user.campusName).toLowerCase()) {
    return res.status(403).json({ error: "Campus mismatch." });
  }

  const user = toPublicUser(req.user);
  if (!groups[idx].members.some((m) => m.id === user.id)) groups[idx].members.push(user);
  writeJson(CAMPUS_GROUPS_FILE, groups);
  return res.json(groups[idx]);
});

app.get("/api/campus/groups/:id/messages", authMiddleware, (req, res) => {
  const groups = readJson(CAMPUS_GROUPS_FILE);
  const group = groups.find((g) => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: "Group not found." });
  if (!group.members.some((m) => m.id === req.user.id)) return res.status(403).json({ error: "Not a group member." });
  return res.json(group.messages.slice(-200));
});

app.post("/api/campus/groups/:id/messages", authMiddleware, (req, res) => {
  const { content, geo } = req.body || {};
  if (!content || !String(content).trim()) return res.status(400).json({ error: "Message content is required." });
  const groups = readJson(CAMPUS_GROUPS_FILE);
  const idx = groups.findIndex((g) => g.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Group not found." });
  if (!groups[idx].members.some((m) => m.id === req.user.id)) return res.status(403).json({ error: "Not a group member." });

  const message = {
    id: `CGM-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    content: String(content).trim().slice(0, 2000),
    user: toPublicUser(req.user),
    geo: normalizeGeo(geo),
    createdAt: new Date().toISOString(),
  };
  groups[idx].messages.push(message);
  writeJson(CAMPUS_GROUPS_FILE, groups);
  io.to(`campus_group:${groups[idx].id}`).emit("campus_group:new_message", { groupId: groups[idx].id, message });
  return res.status(201).json(message);
});

app.post("/api/im/summarize-plan", authMiddleware, async (req, res) => {
  const { scope = "global", groupId, dmUserId, limit = 50 } = req.body || {};
  let messages = [];
  const safeLimit = Math.min(Number(limit) || 50, 200);
  if (scope === "global") {
    messages = readJson(MESSAGES_FILE).slice(-safeLimit);
  } else if (scope === "campus_group") {
    const groups = readJson(CAMPUS_GROUPS_FILE);
    const group = groups.find((g) => g.id === groupId);
    if (!group) return res.status(404).json({ error: "Group not found." });
    if (!group.members.some((m) => m.id === req.user.id)) return res.status(403).json({ error: "Not a group member." });
    messages = Array.isArray(group.messages) ? group.messages.slice(-safeLimit) : [];
  } else if (scope === "interest_group") {
    const groups = readJson(INTEREST_GROUPS_FILE);
    const group = groups.find((g) => g.id === groupId);
    if (!group) return res.status(404).json({ error: "Group not found." });
    if (!Array.isArray(group.members) || !group.members.some((m) => m.id === req.user.id)) {
      return res.status(403).json({ error: "Not a group member." });
    }
    messages = Array.isArray(group.messages) ? group.messages.slice(-safeLimit) : [];
  } else if (scope === "dm") {
    if (!dmUserId) return res.status(400).json({ error: "dmUserId required for dm scope." });
    const pair = normalizePair(req.user.id, dmUserId);
    messages = readJson(DIRECT_MESSAGES_FILE)
      .filter((m) => m.pair === pair)
      .slice(-safeLimit);
  } else {
    return res.status(400).json({ error: "Invalid scope." });
  }

  if (!messages.length) return res.status(400).json({ error: "No messages to summarize." });
  const intent = await summarizeIntentFromMessages(messages);
  if (!intent) return res.status(500).json({ error: "Failed to summarize intent." });
  const plan = await generatePlan(intent);
  return res.json({ intent, plan, messageCount: messages.length });
});

app.post("/api/official/posts", authMiddleware, (req, res) => {
  const { title, content, source, tags, geo } = req.body || {};
  if (!title || !content) return res.status(400).json({ error: "title and content are required." });
  const post = {
    id: `OFF-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    title: String(title).trim(),
    content: String(content).trim(),
    source: String(source || "official").trim(),
    tags: Array.isArray(tags) ? tags.map((t) => String(t)).slice(0, 12) : [],
    geo: normalizeGeo(geo),
    publisher: toPublicUser(req.user),
    createdAt: new Date().toISOString(),
  };
  appendJson(OFFICIAL_POSTS_FILE, post);
  return res.status(201).json(post);
});

app.get("/api/official/posts", (_req, res) => {
  const posts = readJson(OFFICIAL_POSTS_FILE).slice(-200).reverse();
  return res.json(posts);
});

app.get("/api/aggregated/feed", (_req, res) => {
  const official = readJson(OFFICIAL_POSTS_FILE)
    .slice(-100)
    .map((p) => ({ type: "official", ...p }));
  const travel = readJson(TRAVEL_POSTS_FILE)
    .slice(-100)
    .map((p) => ({ type: "travel", ...p }));
  const inspirations = readJson(INSPIRATIONS_FILE)
    .slice(-100)
    .map((p) => ({ type: "inspiration", ...p }));
  const events = readJson(LOCAL_EVENTS_FILE)
    .slice(-100)
    .map((p) => ({ type: "local_event", ...p }));
  const merged = [...official, ...travel, ...inspirations, ...events].sort(
    (a, b) => new Date(b.createdAt || b.startAt) - new Date(a.createdAt || a.startAt),
  );
  return res.json(merged.slice(0, 200));
});

app.post("/api/open/publish", (req, res) => {
  if (!canPublishExternal(req)) return res.status(401).json({ error: "Invalid platform key." });
  const { type, title, content, source, tags, geo, city, country, category, startAt, endAt, venueName, ticketUrl } = req.body || {};
  if (!type) return res.status(400).json({ error: "type is required." });
  if (type === "official") {
    if (!title || !content) return res.status(400).json({ error: "title and content are required." });
    const post = {
      id: `OFF-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      title: String(title).trim(),
      content: String(content).trim(),
      source: String(source || "external").trim(),
      tags: Array.isArray(tags) ? tags.map((t) => String(t)).slice(0, 12) : [],
      geo: normalizeGeo(geo),
      publisher: { id: "external", username: "external_platform", displayName: "External Platform" },
      createdAt: new Date().toISOString(),
    };
    appendJson(OFFICIAL_POSTS_FILE, post);
    return res.status(201).json(post);
  }
  if (type === "local_event") {
    if (!title || !city || !country || !startAt || !endAt) {
      return res.status(400).json({ error: "title, city, country, startAt, endAt are required." });
    }
    const event = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      title: String(title).trim(),
      category: String(category || "event").trim(),
      city: String(city).trim(),
      country: String(country).trim(),
      venueName: String(venueName || "").trim(),
      startAt: ensureIsoDateTime(startAt) || startAt,
      endAt: ensureIsoDateTime(endAt) || endAt,
      description: String(content || "").trim(),
      price: 0,
      currency: "SGD",
      ticketUrl: String(ticketUrl || "").trim() || buildEventbriteSearchLink(city, country, title),
      tags: parseTags(tags),
      source: String(source || "external").trim(),
      creator: { id: "external", username: "external_platform", displayName: "External Platform" },
      rsvps: [],
      createdAt: new Date().toISOString(),
      geo: normalizeGeo(geo),
    };
    appendJson(LOCAL_EVENTS_FILE, event);
    return res.status(201).json(event);
  }
  if (type === "inspiration") {
    if (!title || !content || !city || !country) {
      return res.status(400).json({ error: "title, content, city, country are required." });
    }
    const inspiration = {
      id: `INS-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      title: String(title).trim(),
      content: String(content).trim().slice(0, 5000),
      city: String(city).trim(),
      country: String(country).trim(),
      tags: parseTags(tags),
      places: [],
      source: String(source || "external").trim(),
      creator: { id: "external", username: "external_platform", displayName: "External Platform" },
      likes: [],
      geo: normalizeGeo(geo),
      createdAt: new Date().toISOString(),
    };
    appendJson(INSPIRATIONS_FILE, inspiration);
    return res.status(201).json(inspiration);
  }
  return res.status(400).json({ error: "Unsupported publish type." });
});

app.get("/api/open/feed", (_req, res) => {
  const official = readJson(OFFICIAL_POSTS_FILE)
    .slice(-100)
    .map((p) => ({ type: "official", ...p }));
  const travel = readJson(TRAVEL_POSTS_FILE)
    .slice(-100)
    .map((p) => ({ type: "travel", ...p }));
  const inspirations = readJson(INSPIRATIONS_FILE)
    .slice(-100)
    .map((p) => ({ type: "inspiration", ...p }));
  const events = readJson(LOCAL_EVENTS_FILE)
    .slice(-100)
    .map((p) => ({ type: "local_event", ...p }));
  const merged = [...official, ...travel, ...inspirations, ...events].sort(
    (a, b) => new Date(b.createdAt || b.startAt) - new Date(a.createdAt || a.startAt),
  );
  return res.json(merged.slice(0, 200));
});

app.get("/api/mook/guides", (req, res) => {
  const { country, city, tag, minDays, maxDays, q } = req.query;
  let guides = readJson(MOOK_GUIDES_FILE);

  if (country) {
    const val = String(country).toLowerCase();
    guides = guides.filter((g) => String(g.country || "").toLowerCase().includes(val));
  }
  if (city) {
    const val = String(city).toLowerCase();
    guides = guides.filter((g) => String(g.city || "").toLowerCase().includes(val));
  }
  if (tag) {
    const val = String(tag).toLowerCase();
    guides = guides.filter((g) => Array.isArray(g.tags) && g.tags.some((t) => String(t).toLowerCase().includes(val)));
  }
  if (minDays) {
    const min = Number(minDays);
    if (Number.isFinite(min)) guides = guides.filter((g) => Number(g.days) >= min);
  }
  if (maxDays) {
    const max = Number(maxDays);
    if (Number.isFinite(max)) guides = guides.filter((g) => Number(g.days) <= max);
  }
  if (q) {
    const val = String(q).toLowerCase();
    guides = guides.filter((g) => {
      const text = `${g.title || ""} ${g.summary || ""} ${(g.tags || []).join(" ")}`.toLowerCase();
      return text.includes(val);
    });
  }

  return res.json(guides);
});

app.get("/api/mook/guides/:id", (req, res) => {
  const guide = readJson(MOOK_GUIDES_FILE).find((g) => g.id === req.params.id);
  if (!guide) return res.status(404).json({ error: "Guide not found." });
  return res.json(guide);
});

app.get("/api/discovery/places", async (req, res) => {
  const { q, city = "Singapore", country = "Singapore", category = "", limit = 8 } = req.query;
  if (!q && !category) return res.status(400).json({ error: "q or category is required." });
  try {
    const places = await discoverRealtimeLocalPlaces({
      q: String(q || "").trim(),
      city: String(city).trim(),
      country: String(country).trim(),
      category: String(category || "").trim(),
      limit: Number(limit) || 8,
    });
    return res.json(places);
  } catch (err) {
    return res.status(500).json({ error: `Discovery failed: ${err.message}` });
  }
});

app.get("/api/interest/groups", (req, res) => {
  const { city, country, interest, q } = req.query;
  const user = getOptionalAuthedUser(req);
  let groups = readJson(INTEREST_GROUPS_FILE);

  if (city) groups = groups.filter((g) => String(g.city || "").toLowerCase().includes(String(city).toLowerCase()));
  if (country) groups = groups.filter((g) => String(g.country || "").toLowerCase().includes(String(country).toLowerCase()));
  if (interest) groups = groups.filter((g) => String(g.interest || "").toLowerCase().includes(String(interest).toLowerCase()));
  if (q) {
    const key = String(q).toLowerCase();
    groups = groups.filter((g) => `${g.name || ""} ${g.description || ""}`.toLowerCase().includes(key));
  }
  groups = groups.filter((g) => canAccessCampusOnly(Boolean(g.campusOnly), user));
  return res.json(groups.slice(-200).reverse());
});

app.post("/api/interest/groups", authMiddleware, (req, res) => {
  const { name, interest, city, country, description, campusOnly, nextMeetupAt } = req.body || {};
  if (!name || !interest || !city || !country) {
    return res.status(400).json({ error: "name, interest, city, country are required." });
  }
  const campusGate = normalizeBool(campusOnly);
  if (campusGate && !req.user.campusVerified) {
    return res.status(403).json({ error: "Campus verified user required for campusOnly group." });
  }

  const groups = readJson(INTEREST_GROUPS_FILE);
  const group = {
    id: `IG-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    name: String(name).trim(),
    interest: String(interest).trim(),
    city: String(city).trim(),
    country: String(country).trim(),
    description: String(description || "").trim(),
    campusOnly: campusGate,
    creator: toPublicUser(req.user),
    members: [toPublicUser(req.user)],
    messages: [],
    nextMeetupAt: ensureIsoDateTime(nextMeetupAt) || toIsoFuture(7, 19, 0),
    createdAt: new Date().toISOString(),
  };
  groups.push(group);
  writeJson(INTEREST_GROUPS_FILE, groups);
  return res.status(201).json(group);
});

app.post("/api/interest/groups/:id/join", authMiddleware, (req, res) => {
  const groups = readJson(INTEREST_GROUPS_FILE);
  const idx = groups.findIndex((g) => g.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Group not found." });
  if (!canAccessCampusOnly(Boolean(groups[idx].campusOnly), req.user)) {
    return res.status(403).json({ error: "Campus verification required." });
  }
  const user = toPublicUser(req.user);
  if (!groups[idx].members.some((m) => m.id === user.id)) groups[idx].members.push(user);
  writeJson(INTEREST_GROUPS_FILE, groups);
  return res.json(groups[idx]);
});

app.get("/api/interest/groups/:id/messages", authMiddleware, (req, res) => {
  const groups = readJson(INTEREST_GROUPS_FILE);
  const group = groups.find((g) => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: "Group not found." });
  if (!Array.isArray(group.members) || !group.members.some((m) => m.id === req.user.id)) {
    return res.status(403).json({ error: "Not a group member." });
  }
  return res.json(Array.isArray(group.messages) ? group.messages.slice(-200) : []);
});

app.post("/api/interest/groups/:id/messages", authMiddleware, (req, res) => {
  const { content, geo } = req.body || {};
  if (!content || !String(content).trim()) return res.status(400).json({ error: "Message content is required." });
  const groups = readJson(INTEREST_GROUPS_FILE);
  const idx = groups.findIndex((g) => g.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Group not found." });
  if (!Array.isArray(groups[idx].members) || !groups[idx].members.some((m) => m.id === req.user.id)) {
    return res.status(403).json({ error: "Not a group member." });
  }
  if (!Array.isArray(groups[idx].messages)) groups[idx].messages = [];
  const message = {
    id: `IGM-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    content: String(content).trim().slice(0, 2000),
    user: toPublicUser(req.user),
    geo: normalizeGeo(geo),
    createdAt: new Date().toISOString(),
  };
  groups[idx].messages.push(message);
  writeJson(INTEREST_GROUPS_FILE, groups);
  io.to(`interest_group:${groups[idx].id}`).emit("interest_group:new_message", { groupId: groups[idx].id, message });
  return res.status(201).json(message);
});

app.get("/api/local/events", (req, res) => {
  const { city, country, category, q } = req.query;
  let events = readJson(LOCAL_EVENTS_FILE);
  if (city) events = events.filter((e) => String(e.city || "").toLowerCase().includes(String(city).toLowerCase()));
  if (country) events = events.filter((e) => String(e.country || "").toLowerCase().includes(String(country).toLowerCase()));
  if (category) events = events.filter((e) => String(e.category || "").toLowerCase().includes(String(category).toLowerCase()));
  if (q) {
    const key = String(q).toLowerCase();
    events = events.filter((e) => `${e.title || ""} ${e.venueName || ""} ${(e.tags || []).join(" ")}`.toLowerCase().includes(key));
  }
  events.sort((a, b) => new Date(a.startAt || a.createdAt) - new Date(b.startAt || b.createdAt));
  return res.json(events.slice(0, 200));
});

app.post("/api/local/events", authMiddleware, (req, res) => {
  const { title, category, city, country, venueName, startAt, endAt, price, currency, ticketUrl, tags, description } = req.body || {};
  if (!title || !category || !city || !country || !startAt || !endAt) {
    return res.status(400).json({ error: "title, category, city, country, startAt, endAt are required." });
  }
  const sAt = ensureIsoDateTime(startAt);
  const eAt = ensureIsoDateTime(endAt);
  if (!sAt || !eAt) return res.status(400).json({ error: "Invalid startAt/endAt datetime." });

  const events = readJson(LOCAL_EVENTS_FILE);
  const event = {
    id: `EVT-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    title: String(title).trim(),
    category: String(category).trim(),
    city: String(city).trim(),
    country: String(country).trim(),
    venueName: String(venueName || "").trim(),
    startAt: sAt,
    endAt: eAt,
    description: String(description || "").trim(),
    price: Number.isFinite(Number(price)) ? Number(price) : 0,
    currency: String(currency || "SGD").trim().toUpperCase(),
    ticketUrl: String(ticketUrl || "").trim() || buildEventbriteSearchLink(city, country, title),
    tags: parseTags(tags),
    source: "user",
    creator: toPublicUser(req.user),
    rsvps: [],
    createdAt: new Date().toISOString(),
  };
  events.push(event);
  writeJson(LOCAL_EVENTS_FILE, events);
  return res.status(201).json(event);
});

app.post("/api/local/events/:id/rsvp", authMiddleware, (req, res) => {
  const { status } = req.body || {};
  const finalStatus = String(status || "interested");
  if (!["interested", "going", "not_going"].includes(finalStatus)) {
    return res.status(400).json({ error: "status must be interested|going|not_going." });
  }
  const events = readJson(LOCAL_EVENTS_FILE);
  const idx = events.findIndex((e) => e.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Event not found." });

  const user = toPublicUser(req.user);
  const rsvpIdx = (events[idx].rsvps || []).findIndex((r) => r.userId === user.id);
  const rsvp = {
    userId: user.id,
    user,
    status: finalStatus,
    updatedAt: new Date().toISOString(),
  };
  if (rsvpIdx >= 0) events[idx].rsvps[rsvpIdx] = rsvp;
  else events[idx].rsvps.push(rsvp);
  writeJson(LOCAL_EVENTS_FILE, events);
  return res.json(events[idx]);
});

app.get("/api/inspirations", (req, res) => {
  const { city, country, tag, q } = req.query;
  let posts = readJson(INSPIRATIONS_FILE);
  if (city) posts = posts.filter((p) => String(p.city || "").toLowerCase().includes(String(city).toLowerCase()));
  if (country) posts = posts.filter((p) => String(p.country || "").toLowerCase().includes(String(country).toLowerCase()));
  if (tag) posts = posts.filter((p) => (p.tags || []).some((t) => String(t).toLowerCase().includes(String(tag).toLowerCase())));
  if (q) {
    const key = String(q).toLowerCase();
    posts = posts.filter((p) => `${p.title || ""} ${p.content || ""} ${(p.tags || []).join(" ")}`.toLowerCase().includes(key));
  }
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return res.json(posts.slice(0, 200));
});

app.post("/api/inspirations", authMiddleware, (req, res) => {
  const { title, content, city, country, tags, places } = req.body || {};
  if (!title || !content || !city || !country) {
    return res.status(400).json({ error: "title, content, city, country are required." });
  }
  const posts = readJson(INSPIRATIONS_FILE);
  const post = {
    id: `INS-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    title: String(title).trim(),
    content: String(content).trim().slice(0, 5000),
    city: String(city).trim(),
    country: String(country).trim(),
    tags: parseTags(tags),
    places: parseTags(places, 16),
    creator: toPublicUser(req.user),
    likes: [],
    createdAt: new Date().toISOString(),
  };
  posts.push(post);
  writeJson(INSPIRATIONS_FILE, posts);
  return res.status(201).json(post);
});

app.post("/api/inspirations/:id/like", authMiddleware, (req, res) => {
  const posts = readJson(INSPIRATIONS_FILE);
  const idx = posts.findIndex((p) => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Inspiration not found." });
  if (!Array.isArray(posts[idx].likes)) posts[idx].likes = [];
  const userId = req.user.id;
  if (posts[idx].likes.includes(userId)) {
    posts[idx].likes = posts[idx].likes.filter((id) => id !== userId);
  } else {
    posts[idx].likes.push(userId);
  }
  writeJson(INSPIRATIONS_FILE, posts);
  return res.json(posts[idx]);
});

app.get("/api/collab/trips", authMiddleware, (req, res) => {
  const trips = readJson(COLLAB_TRIPS_FILE)
    .filter((t) => isTripMember(t, req.user.id))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return res.json(trips.slice(0, 200));
});

app.post("/api/collab/trips", authMiddleware, (req, res) => {
  const { title, destinationCity, destinationCountry, startDate, endDate, currency = "SGD", memberIds } = req.body || {};
  if (!title || !destinationCity || !destinationCountry || !startDate || !endDate) {
    return res.status(400).json({ error: "title, destinationCity, destinationCountry, startDate, endDate are required." });
  }
  const users = readJson(USERS_FILE);
  const extraMemberIds = parseTags(memberIds, 20);
  const extraMembers = users.filter((u) => extraMemberIds.includes(u.id)).map(toPublicUser);
  const memberMap = new Map();
  memberMap.set(req.user.id, toPublicUser(req.user));
  for (const m of extraMembers) memberMap.set(m.id, m);

  const trips = readJson(COLLAB_TRIPS_FILE);
  const trip = {
    id: `CLT-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    title: String(title).trim(),
    destinationCity: String(destinationCity).trim(),
    destinationCountry: String(destinationCountry).trim(),
    startDate: String(startDate),
    endDate: String(endDate),
    currency: String(currency || "SGD").trim().toUpperCase(),
    owner: toPublicUser(req.user),
    members: Array.from(memberMap.values()),
    items: [],
    expenses: [],
    createdAt: new Date().toISOString(),
  };
  trips.push(trip);
  writeJson(COLLAB_TRIPS_FILE, trips);
  return res.status(201).json(trip);
});

app.post("/api/collab/trips/:id/join", authMiddleware, (req, res) => {
  const trips = readJson(COLLAB_TRIPS_FILE);
  const idx = trips.findIndex((t) => t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Trip not found." });
  const user = toPublicUser(req.user);
  if (!trips[idx].members.some((m) => m.id === user.id)) trips[idx].members.push(user);
  writeJson(COLLAB_TRIPS_FILE, trips);
  return res.json(trips[idx]);
});

app.get("/api/collab/trips/:id", authMiddleware, (req, res) => {
  const trip = readJson(COLLAB_TRIPS_FILE).find((t) => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found." });
  if (!isTripMember(trip, req.user.id)) return res.status(403).json({ error: "Not a trip member." });
  return res.json(trip);
});

app.post("/api/collab/trips/:id/items", authMiddleware, async (req, res) => {
  const trips = readJson(COLLAB_TRIPS_FILE);
  const idx = trips.findIndex((t) => t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Trip not found." });
  if (!isTripMember(trips[idx], req.user.id)) return res.status(403).json({ error: "Not a trip member." });

  const { day, time, title, note, placeName, bookingType, bookingUrl, bookingRef } = req.body || {};
  if (!title || !day) return res.status(400).json({ error: "title and day are required." });

  let geo = null;
  if (placeName) {
    const regionCode = normalizeCountryToRegionCode(trips[idx].destinationCountry);
    geo = await geocodePlaceGlobal(placeName, trips[idx].destinationCity, trips[idx].destinationCountry, regionCode);
  }

  const item = {
    id: `CLI-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    day: Number(day),
    time: String(time || "").trim(),
    title: String(title).trim(),
    note: String(note || "").trim(),
    placeName: String(placeName || "").trim(),
    bookingType: String(bookingType || "activity").trim(),
    bookingUrl: String(bookingUrl || "").trim(),
    bookingRef: String(bookingRef || "").trim(),
    geo: geo
      ? {
          matchedName: geo.matchedName,
          lat: geo.lat,
          lng: geo.lng,
          source: geo.source,
        }
      : null,
    creator: toPublicUser(req.user),
    createdAt: new Date().toISOString(),
  };
  trips[idx].items.push(item);
  trips[idx].items.sort((a, b) => (a.day - b.day) * 1000 + String(a.time).localeCompare(String(b.time)));
  writeJson(COLLAB_TRIPS_FILE, trips);
  return res.status(201).json(item);
});

app.post("/api/collab/trips/:id/import-reservation", authMiddleware, async (req, res) => {
  const trips = readJson(COLLAB_TRIPS_FILE);
  const idx = trips.findIndex((t) => t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Trip not found." });
  if (!isTripMember(trips[idx], req.user.id)) return res.status(403).json({ error: "Not a trip member." });
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: "text is required." });

  const parsed = parseReservationText(text);
  if (!parsed) return res.status(400).json({ error: "Reservation text parse failed." });

  const item = {
    id: `CLI-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    day: Number(parsed.day || 1),
    time: parsed.time || "",
    title: parsed.title,
    note: parsed.note,
    placeName: "",
    bookingType: parsed.bookingType,
    bookingUrl: "",
    bookingRef: parsed.bookingRef || "",
    geo: null,
    creator: toPublicUser(req.user),
    createdAt: new Date().toISOString(),
    imported: true,
  };
  trips[idx].items.push(item);

  if (Number.isFinite(parsed.amount) && parsed.amount > 0) {
    trips[idx].expenses.push({
      id: `CLE-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      title: `${parsed.bookingType} reservation`,
      amount: parsed.amount,
      currency: parsed.currency || trips[idx].currency || "SGD",
      category: parsed.bookingType,
      paidBy: req.user.id,
      splitWith: getTripMemberIds(trips[idx]),
      note: `Imported from reservation text${parsed.bookingRef ? ` (${parsed.bookingRef})` : ""}`,
      creator: toPublicUser(req.user),
      createdAt: new Date().toISOString(),
      imported: true,
    });
  }

  writeJson(COLLAB_TRIPS_FILE, trips);
  return res.status(201).json({ item, importedExpense: Number.isFinite(parsed.amount) ? parsed.amount : null });
});

app.post("/api/collab/trips/:id/expenses", authMiddleware, (req, res) => {
  const trips = readJson(COLLAB_TRIPS_FILE);
  const idx = trips.findIndex((t) => t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Trip not found." });
  if (!isTripMember(trips[idx], req.user.id)) return res.status(403).json({ error: "Not a trip member." });

  const { title, amount, category, splitWith, paidBy, note, currency } = req.body || {};
  if (!title || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: "title and positive amount are required." });
  }
  const memberIds = getTripMemberIds(trips[idx]);
  const splitIds = parseTags(splitWith, 30).filter((id) => memberIds.includes(id));
  const payer = paidBy && memberIds.includes(String(paidBy)) ? String(paidBy) : req.user.id;
  const expense = {
    id: `CLE-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    title: String(title).trim(),
    amount: Number(amount),
    currency: String(currency || trips[idx].currency || "SGD").trim().toUpperCase(),
    category: String(category || "general").trim(),
    paidBy: payer,
    splitWith: splitIds.length ? splitIds : memberIds,
    note: String(note || "").trim(),
    creator: toPublicUser(req.user),
    createdAt: new Date().toISOString(),
  };
  trips[idx].expenses.push(expense);
  writeJson(COLLAB_TRIPS_FILE, trips);
  return res.status(201).json(expense);
});

app.get("/api/collab/trips/:id/summary", authMiddleware, (req, res) => {
  const trips = readJson(COLLAB_TRIPS_FILE);
  const trip = trips.find((t) => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found." });
  if (!isTripMember(trip, req.user.id)) return res.status(403).json({ error: "Not a trip member." });

  const summary = resolveSettlementForTrip(trip);
  const users = new Map((trip.members || []).map((m) => [m.id, m]));
  users.set(trip.owner?.id, trip.owner);
  const settlements = summary.settlements.map((s) => ({
    fromUserId: s.fromUserId,
    from: users.get(s.fromUserId)?.displayName || s.fromUserId,
    toUserId: s.toUserId,
    to: users.get(s.toUserId)?.displayName || s.toUserId,
    amount: s.amount,
    currency: trip.currency || "SGD",
  }));
  return res.json({
    tripId: trip.id,
    totalExpense: summary.totalExpense,
    currency: trip.currency || "SGD",
    balances: summary.balances,
    settlements,
  });
});

app.post("/api/travel/posts", authMiddleware, (req, res) => {
  const { fromCountry, toCountry, toCity, startDate, endDate, budget, note, tags, geo } = req.body || {};
  if (!fromCountry || !toCountry || !toCity || !startDate || !endDate) {
    return res.status(400).json({ error: "fromCountry, toCountry, toCity, startDate, endDate are required." });
  }
  const posts = readJson(TRAVEL_POSTS_FILE);
  const post = {
    id: `TRIP-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    fromCountry: String(fromCountry).trim(),
    toCountry: String(toCountry).trim(),
    toCity: String(toCity).trim(),
    startDate,
    endDate,
    budget: budget || "",
    note: String(note || "").trim(),
    tags: Array.isArray(tags) ? tags.slice(0, 8).map((t) => String(t)) : [],
    geo: normalizeGeo(geo),
    creator: toPublicUser(req.user),
    members: [toPublicUser(req.user)],
    createdAt: new Date().toISOString(),
  };
  posts.push(post);
  writeJson(TRAVEL_POSTS_FILE, posts);
  return res.status(201).json(post);
});

app.get("/api/travel/posts", (req, res) => {
  const { toCountry, toCity } = req.query;
  let posts = readJson(TRAVEL_POSTS_FILE);
  if (toCountry) {
    const country = String(toCountry).toLowerCase();
    posts = posts.filter((p) => p.toCountry.toLowerCase().includes(country));
  }
  if (toCity) {
    const city = String(toCity).toLowerCase();
    posts = posts.filter((p) => p.toCity.toLowerCase().includes(city));
  }
  return res.json(posts.slice(-100).reverse());
});

app.post("/api/travel/posts/:id/join", authMiddleware, (req, res) => {
  const postId = req.params.id;
  const posts = readJson(TRAVEL_POSTS_FILE);
  const idx = posts.findIndex((p) => p.id === postId);
  if (idx < 0) return res.status(404).json({ error: "Travel post not found." });

  const user = toPublicUser(req.user);
  const exists = posts[idx].members.some((m) => m.id === user.id);
  if (!exists) posts[idx].members.push(user);

  writeJson(TRAVEL_POSTS_FILE, posts);
  return res.json(posts[idx]);
});

app.post("/api/travel/posts/:id/route", authMiddleware, async (req, res) => {
  const posts = readJson(TRAVEL_POSTS_FILE);
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Travel post not found." });
  try {
    const plan = await generateTravelRoutePlan(post);
    return res.json({ postId: post.id, plan });
  } catch (err) {
    return res.status(500).json({ error: `Travel route generation failed: ${err.message}` });
  }
});

app.post("/api/travel/doc-route", async (req, res) => {
  const { documentText, city, country } = req.body || {};
  if (!documentText || !city || !country) {
    return res.status(400).json({ error: "documentText, city, country are required." });
  }
  try {
    const plan = await buildRouteFromDocument(req.body || {});
    return res.json({ plan });
  } catch (err) {
    return res.status(400).json({ error: `Document route generation failed: ${err.message}` });
  }
});

app.post("/api/travel/image-route", async (req, res) => {
  const { imageDataUrl, city, country } = req.body || {};
  if (!imageDataUrl || !city || !country) {
    return res.status(400).json({ error: "imageDataUrl, city, country are required." });
  }
  try {
    const plan = await buildRouteFromImage(req.body || {});
    return res.json({ plan });
  } catch (err) {
    return res.status(400).json({ error: `Image route generation failed: ${err.message}` });
  }
});

app.get("/api/travel/matches", authMiddleware, (req, res) => {
  const { toCountry, toCity, startDate, endDate } = req.query;
  const posts = readJson(TRAVEL_POSTS_FILE);

  const matched = posts
    .filter((p) => {
      if (toCountry && !p.toCountry.toLowerCase().includes(String(toCountry).toLowerCase())) return false;
      if (toCity && !p.toCity.toLowerCase().includes(String(toCity).toLowerCase())) return false;
      if (startDate && p.endDate < String(startDate)) return false;
      if (endDate && p.startDate > String(endDate)) return false;
      return true;
    })
    .slice(-50)
    .reverse();

  return res.json(matched);
});

app.get("/api/events", (_req, res) => {
  const events = readJson(EVENTS_FILE);
  res.json(events.slice(-100));
});

app.get("/api/im/messages", authMiddleware, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 200);
  const messages = readJson(MESSAGES_FILE);
  return res.json(messages.slice(-limit));
});

app.post("/api/im/messages", authMiddleware, (req, res) => {
  const { content, geo } = req.body || {};
  if (!content || !String(content).trim()) {
    return res.status(400).json({ error: "Message content is required." });
  }
  const message = {
    id: `MSG-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    content: String(content).trim().slice(0, 2000),
    user: toPublicUser(req.user),
    geo: normalizeGeo(geo),
    createdAt: new Date().toISOString(),
  };
  appendJson(MESSAGES_FILE, message);
  io.to("global").emit("im:new_message", message);
  return res.status(201).json(message);
});

app.post("/api/events", (req, res) => {
  const { name, payload } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: "Missing event name." });
  }
  const event = {
    name,
    payload: payload || {},
    at: new Date().toISOString(),
  };
  appendJson(EVENTS_FILE, event);
  return res.status(201).json(event);
});

app.post("/api/generate-plan", async (req, res) => {
  const intent = req.body || {};
  if (!isValidIntent(intent)) {
    return res.status(400).json({ error: "Invalid intent. Required: companion, people, budget, timeSlot, interest, area." });
  }
  try {
    const plan = await generatePlan(intent);
    appendJson(EVENTS_FILE, { name: "plan_generated", payload: { title: plan.title, intent }, at: new Date().toISOString() });
    return res.status(201).json(plan);
  } catch (err) {
    return res.status(500).json({ error: `Plan generation failed: ${err.message}` });
  }
});

app.post("/api/create-activity", (req, res) => {
  const plan = req.body || {};
  if (!plan.title || !plan.route || !plan.intent) {
    return res.status(400).json({ error: "Invalid plan payload." });
  }
  const activity = createActivity(plan);
  const activities = readJson(ACTIVITIES_FILE);
  activities.push(activity);
  writeJson(ACTIVITIES_FILE, activities);
  appendJson(EVENTS_FILE, { name: "activity_created", payload: { code: activity.code, title: activity.title }, at: new Date().toISOString() });
  return res.status(201).json(activity);
});

app.get("/api/activities/:code", (req, res) => {
  const code = req.params.code;
  const activity = readJson(ACTIVITIES_FILE).find((item) => item.code === code);
  if (!activity) {
    return res.status(404).json({ error: "Activity not found." });
  }
  return res.json(activity);
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Unauthorized"));
  try {
    const claims = verifyToken(token);
    const users = readJson(USERS_FILE);
    const user = users.find((item) => item.id === claims.sub);
    if (!user) return next(new Error("Invalid user"));
    socket.user = user;
    return next();
  } catch (_err) {
    return next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  socket.join("global");
  socket.join(`user:${socket.user.id}`);
  if (socket.user.campusName) {
    socket.join(`campus:${socket.user.campusName}`);
  }
  socket.emit("im:welcome", {
    user: toPublicUser(socket.user),
    now: new Date().toISOString(),
  });

  socket.on("campus_group:join", ({ groupId }) => {
    if (!groupId) return;
    const groups = readJson(CAMPUS_GROUPS_FILE);
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    if (!group.members.some((m) => m.id === socket.user.id)) return;
    socket.join(`campus_group:${groupId}`);
  });

  socket.on("interest_group:join", ({ groupId }) => {
    if (!groupId) return;
    const groups = readJson(INTEREST_GROUPS_FILE);
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    if (!Array.isArray(group.members) || !group.members.some((m) => m.id === socket.user.id)) return;
    socket.join(`interest_group:${groupId}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
