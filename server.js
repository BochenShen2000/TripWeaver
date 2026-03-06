const fs = require("fs");
const path = require("path");
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
const DATA_DIR = path.join(__dirname, "data");
const ACTIVITIES_FILE = path.join(DATA_DIR, "activities.json");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");

const templates = [
  { interest: "city walk", area: "新加坡市中心", points: ["Bugis 街区散步", "Haji Lane 打卡", "Marina Bay 夜景"] },
  { interest: "city walk", area: "NTU附近", points: ["Yunnan Garden 散步", "Jurong Lake Garden", "Westgate 晚餐"] },
  { interest: "city walk", area: "东海岸", points: ["East Coast Park 海边步道", "海风骑行", "Katong 晚餐"] },
  { interest: "看展", area: "新加坡市中心", points: ["National Gallery", "SMU 附近咖啡", "Esplanade 河边散步"] },
  { interest: "看展", area: "NTU附近", points: ["NTU ADM 展区", "The Hive 打卡", "Jurong Point 晚餐"] },
  { interest: "看展", area: "东海岸", points: ["Gillman Barracks", "海边咖啡", "晚间散步"] },
  { interest: "咖啡", area: "新加坡市中心", points: ["Tanjong Pagar 咖啡店", "书店停留", "晚餐聊天"] },
  { interest: "咖啡", area: "NTU附近", points: ["Pioneer 咖啡馆", "图书馆小坐", "Jurong East 小吃"] },
  { interest: "咖啡", area: "东海岸", points: ["Katong 咖啡店", "Joo Chiat 漫步", "海边吹风"] },
  { interest: "美食", area: "新加坡市中心", points: ["Maxwell 美食中心", "牛车水甜品", "Clarke Quay 河岸夜景"] },
  { interest: "美食", area: "NTU附近", points: ["Jurong Point 晚餐", "甜品补给", "周边散步"] },
  { interest: "美食", area: "东海岸", points: ["East Coast 海鲜", "Katong 甜点", "公园夜跑"] },
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

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ACTIVITIES_FILE)) fs.writeFileSync(ACTIVITIES_FILE, "[]\n", "utf8");
  if (!fs.existsSync(EVENTS_FILE)) fs.writeFileSync(EVENTS_FILE, "[]\n", "utf8");
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
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    `${place}, Singapore`,
  )}`;
  try {
    const response = await fetch(url, {
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

async function validateRoute(route, area) {
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

  const fallbackPoints = fallbackByArea[area] || fallbackByArea["新加坡市中心"];
  let replaced = 0;
  for (let i = 0; i < validated.length; i += 1) {
    if (validated[i].verified) continue;
    const fallbackName = fallbackPoints[i % fallbackPoints.length];
    const fallback = await geocodePlaceInSingapore(fallbackName);
    if (fallback) {
      validated[i] = {
        ...validated[i],
        point: fallbackName,
        ...fallback,
      };
      replaced += 1;
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
  const template = pickTemplate(intent.interest, intent.area);
  const times = durations[intent.timeSlot] || durations["周末半天"];
  const rawRoute = template.points.map((point, index) => ({
    time: times[index] || "TBD",
    point,
  }));
  const validated = await validateRoute(rawRoute, intent.area);

  return {
    id: `PLAN-${Date.now()}`,
    title: `${intent.companion}${intent.people}人 ${intent.timeSlot}${intent.interest}路线`,
    route: validated.route,
    budgetEstimate: budgetText[intent.budget] || "预算待定",
    reason: `基于${intent.interest}偏好、${intent.area}范围和${intent.timeSlot}时长，优先给出移动成本低、可执行性高的3站路线。全部点位已做真实地点校验。`,
    validationSummary: validated.validationSummary,
    intent,
    generatedAt: new Date().toISOString(),
  };
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
    schedule: plan.route.map((x) => `${x.time} ${x.point}`).join(" | "),
    joinToken: tokenBase.slice(0, 24),
    createdAt: new Date().toISOString(),
  };
}

ensureDataStore();
app.use(cors());
app.use(express.json());
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

app.get("/api/events", (_req, res) => {
  const events = readJson(EVENTS_FILE);
  res.json(events.slice(-100));
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
