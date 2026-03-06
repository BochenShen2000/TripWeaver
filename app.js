const form = document.getElementById("intent-form");
const planSection = document.getElementById("plan-section");
const planOutput = document.getElementById("plan-output");
const createActivityBtn = document.getElementById("create-activity");
const activitySection = document.getElementById("activity-section");
const activityOutput = document.getElementById("activity-output");
const shareBtn = document.getElementById("share-btn");
const copyBtn = document.getElementById("copy-btn");
const eventsLog = document.getElementById("events-log");

const mapSection = document.getElementById("map-section");
const mapLinks = document.getElementById("map-links");
const mapContainer = document.getElementById("route-map");
const mapStatus = document.getElementById("map-status");

const authStatus = document.getElementById("auth-status");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const logoutBtn = document.getElementById("logout-btn");

const imSection = document.getElementById("im-section");
const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

let currentPlan = null;
let currentActivity = null;
let mapConfig = { enabled: false, apiKey: "" };
let mapScriptLoaded = false;
let googleMap = null;
let googleMarkers = [];
let googlePath = null;
let infoWindow = null;
let googleAuthFailed = false;

let authToken = localStorage.getItem("auth_token") || "";
let currentUser = null;
let chatSocket = null;

const api = {
  async request(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(path, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.error || "Request failed");
    }
    return response.json();
  },
  generatePlan(intent) {
    return this.request("/api/generate-plan", {
      method: "POST",
      body: JSON.stringify(intent),
    });
  },
  createActivity(plan) {
    return this.request("/api/create-activity", {
      method: "POST",
      body: JSON.stringify(plan),
    });
  },
  async logEvent(name, payload = {}) {
    await this.request("/api/events", {
      method: "POST",
      body: JSON.stringify({ name, payload }),
    });
  },
  getEvents() {
    return this.request("/api/events");
  },
  getMapsConfig() {
    return this.request("/api/maps-config");
  },
  register(payload) {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login(payload) {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  me() {
    return this.request("/api/auth/me");
  },
  getMessages(limit = 100) {
    return this.request(`/api/im/messages?limit=${limit}`);
  },
  sendMessage(content) {
    return this.request("/api/im/messages", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },
};

function setAuth(token, user) {
  authToken = token || "";
  currentUser = user || null;

  if (authToken) {
    localStorage.setItem("auth_token", authToken);
  } else {
    localStorage.removeItem("auth_token");
  }

  renderAuthState();
}

function renderAuthState() {
  if (currentUser) {
    authStatus.textContent = `已登录：${currentUser.displayName} (@${currentUser.username})`;
    imSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
  } else {
    authStatus.textContent = "未登录";
    imSection.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    chatMessages.innerHTML = "";
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function appendMessage(message) {
  const wrapper = document.createElement("article");
  wrapper.className = "chat-item";

  const meta = document.createElement("div");
  meta.className = "chat-meta";
  const time = new Date(message.createdAt).toLocaleString();
  meta.textContent = `${message.user.displayName} (@${message.user.username}) · ${time}`;

  const content = document.createElement("p");
  content.className = "chat-content";
  content.innerHTML = escapeHtml(message.content);

  wrapper.appendChild(meta);
  wrapper.appendChild(content);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderMessages(messages) {
  chatMessages.innerHTML = "";
  messages.forEach(appendMessage);
}

function connectChatSocket() {
  if (!currentUser || !authToken || typeof io !== "function") return;
  if (chatSocket) {
    chatSocket.disconnect();
  }

  chatSocket = io({
    auth: { token: authToken },
  });

  chatSocket.on("im:new_message", (message) => {
    appendMessage(message);
  });
}

async function loadMessages() {
  if (!currentUser) return;
  const messages = await api.getMessages(100);
  renderMessages(messages);
}

function renderPlan(plan) {
  const validation = plan.validationSummary
    ? `${plan.validationSummary.verified}/${plan.validationSummary.total} 已验证`
    : "未返回校验信息";
  const routeHtml = plan.route
    .map((step) => {
      const mapsUrl = createGoogleMapsSearchUrl(step.point);
      const status = step.verified ? "真实地点" : "待确认";
      return `<li><strong>${step.time}</strong> - ${step.point}（${status}） <a href="${mapsUrl}" target="_blank" rel="noreferrer">Google 地图</a></li>`;
    })
    .join("");
  planOutput.innerHTML = `
    <h3>${plan.title}</h3>
    <p class="meta">预算估计：${plan.budgetEstimate}</p>
    <p class="meta">地点校验：${validation}</p>
    <ol>${routeHtml}</ol>
    <p class="why">${plan.reason}</p>
  `;
}

function createGoogleMapsSearchUrl(place) {
  const query = encodeURIComponent(`${place}, Singapore`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function loadGoogleMapsScript(apiKey) {
  if (mapScriptLoaded && window.google?.maps) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const callbackName = `initGoogleMap_${Date.now()}`;
    const timeoutId = setTimeout(() => {
      delete window[callbackName];
      reject(new Error("Google Maps initialization timeout."));
    }, 10000);

    window.gm_authFailure = () => {
      googleAuthFailed = true;
      clearTimeout(timeoutId);
      delete window[callbackName];
      reject(new Error("Google Maps authentication failed."));
    };

    window[callbackName] = () => {
      if (googleAuthFailed) return;
      clearTimeout(timeoutId);
      mapScriptLoaded = true;
      delete window[callbackName];
      resolve();
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      clearTimeout(timeoutId);
      delete window[callbackName];
      reject(new Error("Google Maps script failed to load."));
    };
    document.head.appendChild(script);
  });
}

function showMapStatus(text) {
  mapStatus.textContent = text;
  mapStatus.classList.remove("hidden");
}

function hideMapStatus() {
  mapStatus.textContent = "";
  mapStatus.classList.add("hidden");
}

async function ensureMapReady() {
  if (!mapConfig.enabled || !mapConfig.apiKey) {
    throw new Error("Google Maps API key missing.");
  }
  await loadGoogleMapsScript(mapConfig.apiKey);
  if (googleMap) return;
  googleMap = new google.maps.Map(mapContainer, {
    center: { lat: 1.3521, lng: 103.8198 },
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false,
  });
  infoWindow = new google.maps.InfoWindow();
}

function clearGoogleMapLayers() {
  googleMarkers.forEach((m) => m.setMap(null));
  googleMarkers = [];
  if (googlePath) {
    googlePath.setMap(null);
    googlePath = null;
  }
}

function makePopup(step, index) {
  return `
    <div style="font-size:12px;line-height:1.45;">
      <strong>第${index + 1}站 · ${step.point}</strong><br/>
      时间：${step.time}<br/>
      校验：${step.verified ? "真实地点" : "待确认"}<br/>
      匹配：${step.matchedName || "无"}
    </div>
  `;
}

async function renderMap(plan) {
  try {
    await ensureMapReady();
    hideMapStatus();
  } catch (err) {
    showMapStatus(
      `Google Maps 加载失败：${err.message}。请在 Google Cloud 启用 Maps JavaScript API、绑定 Billing，并将 HTTP referrer 加入白名单（如 http://localhost:3000/*）。`,
    );
    mapLinks.innerHTML = plan.route
      .map((step, index) => {
        const url = createGoogleMapsSearchUrl(step.point);
        return `<a href="${url}" target="_blank" rel="noreferrer">第${index + 1}站 · ${step.point}</a>`;
      })
      .join("");
    mapContainer.innerHTML = "";
    mapSection.classList.remove("hidden");
    return;
  }

  clearGoogleMapLayers();

  const validatedStops = plan.route.filter((step) => Number.isFinite(step.lat) && Number.isFinite(step.lng));
  if (!validatedStops.length) {
    mapLinks.innerHTML = `<a href="${createGoogleMapsSearchUrl("Singapore")}" target="_blank" rel="noreferrer">打开 Google Maps</a>`;
    googleMap.setCenter({ lat: 1.3521, lng: 103.8198 });
    googleMap.setZoom(11);
    mapSection.classList.remove("hidden");
    return;
  }

  const bounds = new google.maps.LatLngBounds();
  const path = [];
  validatedStops.forEach((step, index) => {
    const position = { lat: step.lat, lng: step.lng };
    path.push(position);
    bounds.extend(position);

    const marker = new google.maps.Marker({
      position,
      map: googleMap,
      label: `${index + 1}`,
      title: `${step.point} (${step.time})`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: step.verified ? "#0f4c81" : "#a66a09",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale: 11,
      },
    });
    marker.addListener("click", () => {
      infoWindow.setContent(makePopup(step, index));
      infoWindow.open({ map: googleMap, anchor: marker });
    });
    googleMarkers.push(marker);
  });

  googlePath = new google.maps.Polyline({
    path,
    geodesic: true,
    strokeColor: "#0f4c81",
    strokeOpacity: 0.9,
    strokeWeight: 4,
    map: googleMap,
  });

  googleMap.fitBounds(bounds);

  mapLinks.innerHTML = plan.route
    .map((step, index) => {
      const url = createGoogleMapsSearchUrl(step.point);
      const status = step.verified ? "已验证" : "待确认";
      return `<a href="${url}" target="_blank" rel="noreferrer">第${index + 1}站 · ${step.point}（${status}）</a>`;
    })
    .join("");

  mapSection.classList.remove("hidden");
}

function createActivity(plan) {
  return api.createActivity(plan);
}

function renderActivity(activity) {
  activityOutput.innerHTML = `
    <h3>${activity.title}</h3>
    <p class="meta">活动编号：${activity.code}</p>
    <p>行程：${activity.schedule}</p>
    <p>${activity.members}</p>
    <p>分享链接：<a href="${activity.link}" target="_blank" rel="noreferrer">${activity.link}</a></p>
  `;
}

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(registerForm).entries());
  try {
    const result = await api.register(data);
    setAuth(result.token, result.user);
    registerForm.reset();
    await loadMessages();
    connectChatSocket();
    alert("注册成功，已自动登录。");
  } catch (err) {
    alert(`注册失败: ${err.message}`);
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(loginForm).entries());
  try {
    const result = await api.login(data);
    setAuth(result.token, result.user);
    loginForm.reset();
    await loadMessages();
    connectChatSocket();
    alert("登录成功。");
  } catch (err) {
    alert(`登录失败: ${err.message}`);
  }
});

logoutBtn.addEventListener("click", () => {
  if (chatSocket) {
    chatSocket.disconnect();
    chatSocket = null;
  }
  setAuth("", null);
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) {
    alert("请先登录。");
    return;
  }
  const content = chatInput.value.trim();
  if (!content) return;
  try {
    await api.sendMessage(content);
    chatInput.value = "";
  } catch (err) {
    alert(`发送失败: ${err.message}`);
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const intent = Object.fromEntries(data.entries());
  try {
    await api.logEvent("input_submit", intent);
    currentPlan = await api.generatePlan(intent);
    renderPlan(currentPlan);
    renderMap(currentPlan);
    planSection.classList.remove("hidden");
    activitySection.classList.add("hidden");
    currentActivity = null;
    await refreshEvents();
  } catch (err) {
    alert(`生成失败: ${err.message}`);
  }
});

createActivityBtn.addEventListener("click", async () => {
  if (!currentPlan) return;
  try {
    currentActivity = await createActivity(currentPlan);
    currentActivity.link = `${location.origin}${location.pathname}?join=${currentActivity.joinToken}`;
    renderActivity(currentActivity);
    activitySection.classList.remove("hidden");
    await refreshEvents();
  } catch (err) {
    alert(`发起失败: ${err.message}`);
  }
});

shareBtn.addEventListener("click", async () => {
  if (!currentActivity) return;
  const text = `${currentActivity.title}\n${currentActivity.link}`;
  try {
    if (navigator.share) {
      await navigator.share({
        title: currentActivity.title,
        text,
        url: currentActivity.link,
      });
    } else {
      await navigator.clipboard.writeText(text);
      alert("当前环境不支持系统分享，已复制到剪贴板。");
    }
    await api.logEvent("shared", { code: currentActivity.code, method: "share" });
    await refreshEvents();
  } catch (err) {
    console.error(err);
  }
});

copyBtn.addEventListener("click", async () => {
  if (!currentActivity) return;
  await navigator.clipboard.writeText(currentActivity.link);
  alert("链接已复制。");
  await api.logEvent("shared", { code: currentActivity.code, method: "copy_link" });
  await refreshEvents();
});

async function refreshEvents() {
  try {
    const events = await api.getEvents();
    eventsLog.textContent = JSON.stringify(events, null, 2);
  } catch (err) {
    eventsLog.textContent = JSON.stringify([{ error: err.message }], null, 2);
  }
}

async function restoreSession() {
  if (!authToken) {
    renderAuthState();
    return;
  }
  try {
    const result = await api.me();
    currentUser = result.user;
    renderAuthState();
    await loadMessages();
    connectChatSocket();
  } catch (_err) {
    setAuth("", null);
  }
}

async function boot() {
  try {
    mapConfig = await api.getMapsConfig();
  } catch (_err) {
    mapConfig = { enabled: false, apiKey: "" };
  }
  await restoreSession();
  await refreshEvents();
}

boot();
