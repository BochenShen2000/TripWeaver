const form = document.getElementById("intent-form");
const intentPresets = document.getElementById("intent-presets");
const intentGenerateFastBtn = document.getElementById("intent-generate-fast-btn");
const intentStartDatetimeInput = document.getElementById("intent-start-datetime");
const manualPlaceInput = document.getElementById("manual-place-input");
const manualPlaceAddBtn = document.getElementById("manual-place-add-btn");
const manualMapPinBtn = document.getElementById("manual-map-pin-btn");
const manualPlaceList = document.getElementById("manual-place-list");
const manualPlaceSuggestions = document.getElementById("manual-place-suggestions");
const planSection = document.getElementById("plan-section");
const planOutput = document.getElementById("plan-output");
const quickActivityPrivacySelect = document.getElementById("quick-activity-privacy");
const activityCreateSection = document.getElementById("activity-create-section");
const createActivityBtn = document.getElementById("create-activity");
const openActivityCreateBtn = document.getElementById("open-activity-create-btn");
const backPlanBtn = document.getElementById("back-plan-btn");
const tonightGroupBtn = document.getElementById("tonight-group-btn");
const activityLaunchForm = document.getElementById("activity-launch-form");
const activityCoverInput = document.getElementById("activity-cover-input");
const activityCoverPreview = document.getElementById("activity-cover-preview");
const activityThemeSelect = document.getElementById("activity-theme");
const activityThemeShuffleBtn = document.getElementById("activity-theme-shuffle-btn");
const activityCalendarSelect = document.getElementById("activity-calendar");
const activityPrivacySelect = document.getElementById("activity-privacy");
const activityCalendarPill = document.getElementById("activity-calendar-pill");
const activityPrivacyPill = document.getElementById("activity-privacy-pill");
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
const goAuthBtn = document.getElementById("go-auth-btn");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const codeLoginForm = document.getElementById("code-login-form");
const requestCodeBtn = document.getElementById("request-code-btn");
const oauthButtons = Array.from(document.querySelectorAll(".oauth-btn"));
const logoutBtn = document.getElementById("logout-btn");

const imSection = document.getElementById("im-section");
const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const travelForm = document.getElementById("travel-form");
const travelList = document.getElementById("travel-list");
const travelRefreshBtn = document.getElementById("travel-refresh-btn");
const travelFilterCountry = document.getElementById("travel-filter-country");
const travelFilterCity = document.getElementById("travel-filter-city");
const docRouteForm = document.getElementById("doc-route-form");
const docRoutePoints = document.getElementById("doc-route-points");
const imageRouteForm = document.getElementById("image-route-form");
const imageRouteFileInput = document.getElementById("image-route-file");
const summarizeGlobalBtn = document.getElementById("summarize-global-btn");
const summarizeCampusBtn = document.getElementById("summarize-campus-btn");

const friendRequestForm = document.getElementById("friend-request-form");
const chatCreateInterestToggleBtn = document.getElementById("chat-create-interest-toggle-btn");
const chatCreateInterestPanel = document.getElementById("chat-create-interest-panel");
const chatInterestCreateForm = document.getElementById("chat-interest-create-form");
const friendsList = document.getElementById("friends-list");
const chatGroupsList = document.getElementById("chat-groups-list");
const chatThreadTitle = document.getElementById("chat-thread-title");
const chatThreadMeta = document.getElementById("chat-thread-meta");
const chatThreadMessages = document.getElementById("chat-thread-messages");
const chatThreadForm = document.getElementById("chat-thread-form");
const chatThreadInput = document.getElementById("chat-thread-input");
const chatRouteContext = document.getElementById("chat-route-context");
const chatTopicChips = document.getElementById("chat-topic-chips");
const chatInsertTemplateBtn = document.getElementById("chat-insert-template-btn");
const chatSendCurrentPlanBtn = document.getElementById("chat-send-current-plan-btn");
const chatSummarizeThreadBtn = document.getElementById("chat-summarize-thread-btn");

const campusVerifyForm = document.getElementById("campus-verify-form");
const campusGroupCreateForm = document.getElementById("campus-group-create-form");
const campusGroupsList = document.getElementById("campus-groups-list");
const campusGroupMessageForm = document.getElementById("campus-group-message-form");

const communityForm = document.getElementById("community-form");
const communityFilterCity = document.getElementById("community-filter-city");
const communityFilterInterest = document.getElementById("community-filter-interest");
const communityRefreshBtn = document.getElementById("community-refresh-btn");
const communityList = document.getElementById("community-list");

const eventForm = document.getElementById("event-form");
const eventFilterCity = document.getElementById("event-filter-city");
const eventFilterCategory = document.getElementById("event-filter-category");
const eventRefreshBtn = document.getElementById("event-refresh-btn");
const eventList = document.getElementById("event-list");

const inspirationForm = document.getElementById("inspiration-form");
const inspirationFilterCity = document.getElementById("inspiration-filter-city");
const inspirationFilterTag = document.getElementById("inspiration-filter-tag");
const inspirationRefreshBtn = document.getElementById("inspiration-refresh-btn");
const inspirationList = document.getElementById("inspiration-list");

const discoverForm = document.getElementById("discover-form");
const discoverList = document.getElementById("discover-list");

const collabTripForm = document.getElementById("collab-trip-form");
const collabItemForm = document.getElementById("collab-item-form");
const collabExpenseForm = document.getElementById("collab-expense-form");
const collabImportForm = document.getElementById("collab-import-form");
const collabRefreshBtn = document.getElementById("collab-refresh-btn");
const collabList = document.getElementById("collab-list");
const collabSummary = document.getElementById("collab-summary");

const flowStatusDiscover = document.getElementById("flow-status-discover");
const flowStatusMatch = document.getElementById("flow-status-match");
const flowStatusPlan = document.getElementById("flow-status-plan");
const flowStatusLaunch = document.getElementById("flow-status-launch");
const flowStatusJoin = document.getElementById("flow-status-join");
const flowContext = document.getElementById("flow-context");
const flowNextBtn = document.getElementById("flow-next-btn");
const flowResetBtn = document.getElementById("flow-reset-btn");
const flowGoDiscoverBtn = document.getElementById("flow-go-discover-btn");
const flowGoMatchBtn = document.getElementById("flow-go-match-btn");
const flowGoPlanBtn = document.getElementById("flow-go-plan-btn");
const flowGoLaunchBtn = document.getElementById("flow-go-launch-btn");
const flowGoJoinBtn = document.getElementById("flow-go-join-btn");

const officialFilterQ = document.getElementById("official-filter-q");
const officialRefreshBtn = document.getElementById("official-refresh-btn");
const officialFeedList = document.getElementById("official-feed-list");
const exploreRecommendHint = document.getElementById("explore-recommend-hint");
const exploreBackFlowBtn = document.getElementById("explore-back-flow-btn");
const appToast = document.getElementById("app-toast");
const appTopbar = document.querySelector(".app-topbar");
const appScreenCompactTitle = document.getElementById("app-screen-title-compact");
const appScreenTitle = document.getElementById("app-screen-title");
const appScreenSubtitle = document.getElementById("app-screen-subtitle");
const flowProgressPill = document.getElementById("flow-progress-pill");
const authQuickPill = document.getElementById("auth-quick-pill");
const flowCoachStep = document.getElementById("flow-coach-step");
const flowCoachTitle = document.getElementById("flow-coach-title");
const flowCoachDesc = document.getElementById("flow-coach-desc");
const flowCoachPrimary = document.getElementById("flow-coach-primary");
const flowCoachSecondary = document.getElementById("flow-coach-secondary");
const exploreTabs = document.getElementById("explore-tabs");
const exploreTabButtons = Array.from(document.querySelectorAll(".explore-tab-btn[data-explore-target]"));
const explorePanels = Array.from(document.querySelectorAll(".explore-panel-section[data-explore-panel]"));
const exploreComposeCards = Array.from(document.querySelectorAll(".explore-panel-section .explore-compose-card"));

let currentPlan = null;
let currentActivity = null;
let mapConfig = { enabled: false, apiKey: "" };
let mapScriptLoaded = false;
let googleMap = null;
let googleMarkers = [];
let googlePath = null;
let infoWindow = null;
let googleAuthFailed = false;
let manualPlacesForIntent = [];
let manualMapPinMode = false;
let manualMapClickListener = null;
let manualSuggestTimer = null;
let activityCoverDataUrl = "";

let authToken = localStorage.getItem("auth_token") || "";
let currentUser = null;
let chatSocket = null;
let chatFriendsPayload = { friends: [], requests: [] };
let chatCampusGroups = [];
let chatInterestGroups = [];
let selectedChatTarget = null;
let lastDiscoverContext = { city: "", country: "", category: "", q: "" };

const FLOW_ORDER = ["discover", "match", "plan", "launch", "join"];
const FLOW_LABELS = {
  discover: "发现活动",
  match: "找到人",
  plan: "生成方案",
  launch: "发起活动",
  join: "报名成局",
};
let flowState = {
  steps: { discover: false, match: false, plan: false, launch: false, join: false },
  notes: { discover: "", match: "", plan: "", launch: "", join: "" },
};
const EXPLORE_PANELS = new Set(["official", "events", "nearby", "inspiration", "community", "campus"]);
const EXPLORE_SECTION_MAP = {
  official: "official-section",
  events: "events-section",
  nearby: "discover-section",
  inspiration: "inspiration-section",
  community: "community-section",
  campus: "campus-section",
};
const EXPLORE_PANEL_LABELS = {
  official: "官方聚合",
  events: "活动",
  nearby: "附近",
  inspiration: "灵感",
  community: "社群",
  campus: "校园",
};
const SCREEN_META = {
  plan: { title: "路线", subtitle: "AI 活动发起器" },
  explore: { title: "发现", subtitle: "活动与灵感" },
  social: { title: "聊天", subtitle: "好友与群聊" },
  account: { title: "账号", subtitle: "账户与安全" },
};
const INTENT_PRESETS = {
  tonight_food: {
    label: "今晚 city walk",
    intent: {
      companion: "朋友",
      people: "2",
      budget: "中预算",
      timeSlot: "今天晚上",
      interest: "city walk",
      city: "Singapore",
      country: "Singapore",
      area: "Singapore, Singapore",
    },
  },
  weekend_citywalk: {
    label: "周末咖啡+展",
    intent: {
      companion: "朋友",
      people: "2",
      budget: "中预算",
      timeSlot: "周末半天",
      interest: "咖啡+看展",
      city: "Singapore",
      country: "Singapore",
      area: "Singapore, Singapore",
    },
  },
  gallery_date: {
    label: "情侣约会",
    intent: {
      companion: "情侣",
      people: "2",
      budget: "中预算",
      timeSlot: "周末半天",
      interest: "夜景+餐厅",
      city: "Singapore",
      country: "Singapore",
      area: "Singapore, Singapore",
    },
  },
};
let currentExplorePanel = "official";
let exploreManualOverrideUntil = 0;
let toastTimer = null;
let topbarScrollRaf = 0;
const ROUTE_JOIN_PAYLOAD_RE = /\[ROUTE_JOIN_PAYLOAD\]([A-Za-z0-9_-]+)\[\/ROUTE_JOIN_PAYLOAD\]/;
let activeIntentPreset = "tonight_food";
let flowCoachPrimaryAction = null;
let flowCoachSecondaryAction = null;

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
  requestAuthCode(payload) {
    const email = String(payload?.email || payload?.identifier || "").trim();
    return this.request("/api/auth/email/request-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  codeLogin(payload) {
    return this.request("/api/auth/email/code-login", {
      method: "POST",
      body: JSON.stringify({
        email: payload?.email || payload?.identifier || "",
        code: payload?.code || "",
        displayName: payload?.displayName || "",
      }),
    });
  },
  oauthLoginMock(payload) {
    return this.request("/api/auth/oauth/mock", {
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
  createTravelPost(payload) {
    return this.request("/api/travel/posts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getTravelPosts(params = {}) {
    const query = new URLSearchParams();
    if (params.toCountry) query.set("toCountry", params.toCountry);
    if (params.toCity) query.set("toCity", params.toCity);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.request(`/api/travel/posts${suffix}`);
  },
  joinTravelPost(postId) {
    return this.request(`/api/travel/posts/${encodeURIComponent(postId)}/join`, {
      method: "POST",
    });
  },
  generateTravelRoute(postId) {
    return this.request(`/api/travel/posts/${encodeURIComponent(postId)}/route`, {
      method: "POST",
    });
  },
  generateDocRoute(payload) {
    return this.request("/api/travel/doc-route", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  generateImageRoute(payload) {
    return this.request("/api/travel/image-route", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  summarizePlan(payload) {
    return this.request("/api/im/summarize-plan", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  verifyCampus(payload) {
    return this.request("/api/campus/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getFriends() {
    return this.request("/api/friends");
  },
  sendFriendRequest(toUsername) {
    return this.request("/api/friends/request", {
      method: "POST",
      body: JSON.stringify({ toUsername }),
    });
  },
  respondFriendRequest(id, accept) {
    return this.request(`/api/friends/request/${encodeURIComponent(id)}/respond`, {
      method: "POST",
      body: JSON.stringify({ accept }),
    });
  },
  sendDm(userId, payload) {
    return this.request(`/api/im/dm/${encodeURIComponent(userId)}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getDmMessages(userId) {
    return this.request(`/api/im/dm/${encodeURIComponent(userId)}/messages`);
  },
  createCampusGroup(payload) {
    return this.request("/api/campus/groups", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getCampusGroups() {
    return this.request("/api/campus/groups");
  },
  joinCampusGroup(groupId) {
    return this.request(`/api/campus/groups/${encodeURIComponent(groupId)}/join`, {
      method: "POST",
    });
  },
  sendCampusGroupMessage(groupId, payload) {
    return this.request(`/api/campus/groups/${encodeURIComponent(groupId)}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getCampusGroupMessages(groupId) {
    return this.request(`/api/campus/groups/${encodeURIComponent(groupId)}/messages`);
  },
  getInterestGroups(params = {}) {
    const query = new URLSearchParams();
    if (params.city) query.set("city", params.city);
    if (params.interest) query.set("interest", params.interest);
    if (params.country) query.set("country", params.country);
    if (params.q) query.set("q", params.q);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.request(`/api/interest/groups${suffix}`);
  },
  createInterestGroup(payload) {
    return this.request("/api/interest/groups", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  joinInterestGroup(groupId) {
    return this.request(`/api/interest/groups/${encodeURIComponent(groupId)}/join`, {
      method: "POST",
    });
  },
  getInterestGroupMessages(groupId) {
    return this.request(`/api/interest/groups/${encodeURIComponent(groupId)}/messages`);
  },
  sendInterestGroupMessage(groupId, payload) {
    return this.request(`/api/interest/groups/${encodeURIComponent(groupId)}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getLocalEvents(params = {}) {
    const query = new URLSearchParams();
    if (params.city) query.set("city", params.city);
    if (params.country) query.set("country", params.country);
    if (params.category) query.set("category", params.category);
    if (params.q) query.set("q", params.q);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.request(`/api/local/events${suffix}`);
  },
  createLocalEvent(payload) {
    return this.request("/api/local/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  rsvpLocalEvent(eventId, status) {
    return this.request(`/api/local/events/${encodeURIComponent(eventId)}/rsvp`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  },
  getInspirations(params = {}) {
    const query = new URLSearchParams();
    if (params.city) query.set("city", params.city);
    if (params.country) query.set("country", params.country);
    if (params.tag) query.set("tag", params.tag);
    if (params.q) query.set("q", params.q);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.request(`/api/inspirations${suffix}`);
  },
  createInspiration(payload) {
    return this.request("/api/inspirations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  likeInspiration(id) {
    return this.request(`/api/inspirations/${encodeURIComponent(id)}/like`, {
      method: "POST",
    });
  },
  discoverPlaces(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.city) query.set("city", params.city);
    if (params.country) query.set("country", params.country);
    if (params.category) query.set("category", params.category);
    if (params.limit) query.set("limit", params.limit);
    return this.request(`/api/discovery/places?${query.toString()}`);
  },
  getDiscoveryRecommendations(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", params.limit);
    if (params.city) query.set("city", params.city);
    if (params.country) query.set("country", params.country);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.request(`/api/discovery/recommendations${suffix}`);
  },
  trackPreference(payload) {
    return this.request("/api/preferences/track", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getManualPlaces(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.city) query.set("city", params.city);
    if (params.country) query.set("country", params.country);
    query.set("limit", String(params.limit || 12));
    return this.request(`/api/preferences/manual-places?${query.toString()}`);
  },
  saveManualPlaces(payload) {
    return this.request("/api/preferences/manual-places", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  reversePlace(params = {}) {
    const query = new URLSearchParams();
    query.set("lat", String(params.lat));
    query.set("lng", String(params.lng));
    if (params.city) query.set("city", params.city);
    if (params.country) query.set("country", params.country);
    return this.request(`/api/places/reverse?${query.toString()}`);
  },
  getAggregatedFeed() {
    return this.request("/api/aggregated/feed");
  },
  createCollabTrip(payload) {
    return this.request("/api/collab/trips", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getCollabTrips() {
    return this.request("/api/collab/trips");
  },
  joinCollabTrip(tripId) {
    return this.request(`/api/collab/trips/${encodeURIComponent(tripId)}/join`, {
      method: "POST",
    });
  },
  addCollabItem(tripId, payload) {
    return this.request(`/api/collab/trips/${encodeURIComponent(tripId)}/items`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  addCollabExpense(tripId, payload) {
    return this.request(`/api/collab/trips/${encodeURIComponent(tripId)}/expenses`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  importReservation(tripId, text) {
    return this.request(`/api/collab/trips/${encodeURIComponent(tripId)}/import-reservation`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },
  getCollabSummary(tripId) {
    return this.request(`/api/collab/trips/${encodeURIComponent(tripId)}/summary`);
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
  if (!currentUser) {
    renderManualSuggestions([]);
  } else {
    loadManualPlaceSuggestions(manualPlaceInput?.value || "").catch(() => {});
  }
}

function renderAuthState() {
  if (currentUser) {
    authStatus.textContent = `已登录：${currentUser.displayName} (@${currentUser.username})`;
    imSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    if (goAuthBtn) goAuthBtn.classList.add("hidden");
  } else {
    authStatus.textContent = "未登录";
    imSection.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    if (goAuthBtn) goAuthBtn.classList.remove("hidden");
    chatMessages.innerHTML = "";
  }
  if (authQuickPill) {
    authQuickPill.textContent = currentUser ? currentUser.displayName : "游客模式";
    authQuickPill.classList.toggle("online", Boolean(currentUser));
  }
  updateFlowCoach();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function inferToastTone(message) {
  const text = String(message || "");
  if (/(失败|错误|invalid|failed|error)/i.test(text)) return "error";
  if (/(成功|已|完成|ready|done)/i.test(text)) return "success";
  return "info";
}

function showToast(message, tone = "") {
  if (!appToast) return;
  const text = String(message || "").trim();
  if (!text) return;
  const resolvedTone = tone || inferToastTone(text);
  appToast.textContent = text;
  appToast.classList.remove("hidden", "error", "success", "info");
  appToast.classList.add(resolvedTone);
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    appToast.classList.add("hidden");
  }, 2400);
}

function closeComposeCardForElement(element) {
  const card = element?.closest?.(".explore-compose-card");
  if (card) card.open = false;
}

function syncTopbarScreen() {
  if (!appScreenTitle && !appScreenSubtitle && !appScreenCompactTitle) return;
  const screen = window.location.hash.replace("#", "") || "plan";
  const screenMeta = { ...(SCREEN_META[screen] || SCREEN_META.plan) };
  if (screen === "explore") {
    const panelLabel = EXPLORE_PANEL_LABELS[currentExplorePanel] || "官方聚合";
    screenMeta.subtitle = `发现 · ${panelLabel}`;
  }
  if (appScreenCompactTitle) appScreenCompactTitle.textContent = screenMeta.title;
  if (appScreenTitle) appScreenTitle.textContent = screenMeta.title;
  if (appScreenSubtitle) appScreenSubtitle.textContent = screenMeta.subtitle;
}

function syncTopbarTitleMode() {
  if (!appTopbar) return;
  const collapsed = window.scrollY > 36;
  appTopbar.classList.toggle("is-collapsed", collapsed);
}

function requestTopbarTitleModeSync() {
  if (topbarScrollRaf) return;
  topbarScrollRaf = window.requestAnimationFrame(() => {
    topbarScrollRaf = 0;
    syncTopbarTitleMode();
  });
}

function updateFlowProgressPill() {
  if (!flowProgressPill) return;
  const done = FLOW_ORDER.reduce((count, step) => count + (flowState.steps[step] ? 1 : 0), 0);
  flowProgressPill.textContent = `流程 ${done}/${FLOW_ORDER.length}`;
}

function setFlowCoachConfig(config = {}) {
  if (!flowCoachStep || !flowCoachTitle || !flowCoachDesc || !flowCoachPrimary || !flowCoachSecondary) return;
  flowCoachStep.textContent = config.step || "下一步建议";
  flowCoachTitle.textContent = config.title || "继续推进主流程";
  flowCoachDesc.textContent = config.desc || "按推荐步骤继续操作。";

  flowCoachPrimary.textContent = config.primaryLabel || "继续";
  flowCoachPrimary.disabled = typeof config.primaryAction !== "function";
  flowCoachPrimaryAction = typeof config.primaryAction === "function" ? config.primaryAction : null;

  if (config.secondaryLabel && typeof config.secondaryAction === "function") {
    flowCoachSecondary.classList.remove("hidden");
    flowCoachSecondary.textContent = config.secondaryLabel;
    flowCoachSecondary.disabled = false;
    flowCoachSecondaryAction = config.secondaryAction;
  } else {
    flowCoachSecondary.classList.add("hidden");
    flowCoachSecondaryAction = null;
  }
}

function updateFlowCoach() {
  if (!flowCoachTitle) return;
  if (!currentUser) {
    setFlowCoachConfig({
      step: "启动前准备",
      title: "先登录，再开始完整流程",
      desc: "登录后才能发起活动、发送群聊与成团分享。",
      primaryLabel: "去登录",
      primaryAction: () => openAuthPage(),
      secondaryLabel: "先去发现",
      secondaryAction: () => jumpToFlowStep("discover"),
    });
    return;
  }

  const nextStep = getNextFlowStep();
  if (!nextStep) {
    setFlowCoachConfig({
      step: "流程完成",
      title: "已跑通从发现到成局",
      desc: "可以复用当前路线继续发起今晚成团，或重置流程再做新局。",
      primaryLabel: currentPlan ? "今晚就去成团" : "重置流程",
      primaryAction: currentPlan ? () => launchTonightGroup({ scene: currentPlan.title || "今晚路线" }) : () => resetFlowState(),
      secondaryLabel: "重置流程",
      secondaryAction: () => resetFlowState(),
    });
    return;
  }

  if (nextStep === "discover") {
    setFlowCoachConfig({
      step: "1/5 发现活动",
      title: "先选一个地点或活动切口",
      desc: "从发现中心选一个更具体的场景，后续成团会更快。",
      primaryLabel: "去发现",
      primaryAction: () => jumpToFlowStep("discover"),
      secondaryLabel: "按预设生成路线",
      secondaryAction: () => generatePlanFromIntentForm("流程助手快速生成", "flow_coach_generate"),
    });
    return;
  }

  if (nextStep === "match") {
    const canSendPlan = Boolean(currentPlan && selectedChatTarget);
    setFlowCoachConfig({
      step: "2/5 找到人",
      title: canSendPlan ? "把路线发进当前会话" : "先进入社交会话找搭子",
      desc: canSendPlan
        ? "你已选中会话，可直接抛出路线并收集多方需求。"
        : "选择好友或群聊，先把时间/预算/必去点聊清楚。",
      primaryLabel: canSendPlan ? "发送当前路线" : "去社交",
      primaryAction: canSendPlan
        ? async () => {
            await sendCurrentPlanToSelectedChat();
            showToast("已发送当前路线到会话。");
          }
        : () => jumpToFlowStep("match"),
      secondaryLabel: "插入讨论模板",
      secondaryAction: async () => {
        await openChatTarget(selectedChatTarget || { type: "global", id: "global", name: "Global 群聊" });
        navigateToScreen("social", "social-section");
        appendSnippetToThreadInput(routeDiscussionTemplate);
      },
    });
    return;
  }

  if (nextStep === "plan") {
    setFlowCoachConfig({
      step: "3/5 生成方案",
      title: currentPlan ? "当前路线已可执行" : "生成可执行路线",
      desc: currentPlan ? "你可以继续优化路线，或直接进入发起活动。" : "把需求转成时间顺序和地图点位。",
      primaryLabel: currentPlan ? "查看路线" : "生成路线",
      primaryAction: currentPlan
        ? () => navigateToScreen("plan", "plan-section")
        : () => generatePlanFromIntentForm("流程助手生成路线", "flow_coach_generate"),
      secondaryLabel: "去输入需求",
      secondaryAction: () => navigateToScreen("plan", "intent-section"),
    });
    return;
  }

  if (nextStep === "launch") {
    setFlowCoachConfig({
      step: "4/5 发起活动",
      title: "把路线变成可报名活动",
      desc: "建议直接发“今晚就去”，同步群聊并带报名链接。",
      primaryLabel: currentPlan ? "今晚就去成团" : "先生成路线",
      primaryAction: currentPlan ? () => launchTonightGroup({ scene: currentPlan.title || "今晚路线" }) : () => jumpToFlowStep("plan"),
      secondaryLabel: currentPlan ? "仅创建活动" : "去发现",
      secondaryAction: currentPlan
        ? () => createAndRenderActivityFromPlan(currentPlan, true)
        : () => jumpToFlowStep("discover"),
    });
    return;
  }

  if (nextStep === "join") {
    const hasPlan = Boolean(currentPlan && Array.isArray(currentPlan.route) && currentPlan.route.length);
    setFlowCoachConfig({
      step: "5/5 报名成局",
      title: "把活动分享出去，拉人报名",
      desc: currentActivity
        ? "活动已创建，直接分享链接即可成局。"
        : hasPlan
          ? "先创建活动，再做分享与报名。"
          : "当前还没有路线，请先生成路线后再成团。",
      primaryLabel: currentActivity ? "去分享活动" : hasPlan ? "先创建活动" : "先生成路线",
      primaryAction: currentActivity
        ? () => shareBtn.click()
        : hasPlan
          ? () => createAndRenderActivityFromPlan(currentPlan, true)
          : () => jumpToFlowStep("plan"),
      secondaryLabel: currentActivity ? "去活动页" : "去活动广场",
      secondaryAction: () => (currentActivity ? navigateToScreen("plan", "activity-section") : jumpToFlowStep("join")),
    });
  }
}

async function runFlowCoachAction(which = "primary") {
  const btn = which === "secondary" ? flowCoachSecondary : flowCoachPrimary;
  const action = which === "secondary" ? flowCoachSecondaryAction : flowCoachPrimaryAction;
  if (!btn || typeof action !== "function") return;
  const text = btn.textContent;
  btn.disabled = true;
  btn.textContent = "处理中...";
  try {
    await action();
  } catch (err) {
    alert(err?.message || "执行失败，请重试。");
  } finally {
    btn.disabled = false;
    btn.textContent = text;
    updateFlowCoach();
  }
}

function renderItemMore(summary, bodyHtml) {
  return `
    <details class="item-more">
      <summary>${escapeHtml(summary)}</summary>
      <div class="item-more-body">${bodyHtml}</div>
    </details>
  `;
}

function formatRatingText(rating, userRatingCount) {
  const value = Number(rating);
  const count = Number(userRatingCount);
  if (!Number.isFinite(value)) return "暂无评分";
  const safeCount = Number.isFinite(count) ? count : 0;
  return `${value.toFixed(1)} (${safeCount.toLocaleString()})`;
}

function formatPriceLevel(priceLevel) {
  const key = String(priceLevel || "").toUpperCase();
  if (key.includes("FREE")) return "免费";
  if (key.includes("INEXPENSIVE")) return "价格友好";
  if (key.includes("MODERATE")) return "中等消费";
  if (key.includes("EXPENSIVE")) return "偏高消费";
  if (key.includes("VERY_EXPENSIVE")) return "高端消费";
  return "价格未知";
}

function renderTagChips(tags = []) {
  const clean = Array.isArray(tags)
    ? tags
        .map((tag) => String(tag || "").trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];
  if (!clean.length) return "";
  return `<div class="travel-tags">${clean.map((tag) => `<span class="travel-tag">${escapeHtml(tag)}</span>`).join("")}</div>`;
}

function renderPlaceHero(place, fallbackLabel = "推荐地点") {
  const imageUrl = String(place?.coverImageUrl || place?.photoUrl || "").trim();
  const allureLevel = String(place?.allure?.level || "").trim();
  const allureScore = Number(place?.allure?.score);
  const badges = [];
  if (allureLevel) {
    badges.push(
      `<span class="place-hero-badge primary">${escapeHtml(allureLevel)}${Number.isFinite(allureScore) ? ` ${allureScore}` : ""}</span>`,
    );
  }
  const sourceLabel = String(place?.source || "").trim();
  if (sourceLabel) {
    badges.push(`<span class="place-hero-badge">${escapeHtml(sourceLabel)}</span>`);
  }
  if (!imageUrl) {
    return `
      <div class="place-hero place-hero-fallback">
        <div class="place-hero-overlay">${badges.join("")}</div>
        <strong>${escapeHtml(fallbackLabel)}</strong>
      </div>
    `;
  }
  return `
    <div class="place-hero">
      <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(fallbackLabel)}" loading="lazy" />
      <div class="place-hero-overlay">${badges.join("")}</div>
    </div>
  `;
}

if (appToast) {
  window.alert = (message) => {
    showToast(message);
  };
}

function normalizeFlowNote(note) {
  return String(note || "").trim().slice(0, 80);
}

function getNextFlowStep() {
  for (const step of FLOW_ORDER) {
    if (!flowState.steps[step]) return step;
  }
  return "";
}

function renderFlowState() {
  const statusEls = {
    discover: flowStatusDiscover,
    match: flowStatusMatch,
    plan: flowStatusPlan,
    launch: flowStatusLaunch,
    join: flowStatusJoin,
  };
  const nextStep = getNextFlowStep();

  for (const step of FLOW_ORDER) {
    const done = Boolean(flowState.steps[step]);
    const note = normalizeFlowNote(flowState.notes[step]);
    const statusEl = statusEls[step];
    if (statusEl) statusEl.textContent = done ? `已完成${note ? ` · ${note}` : ""}` : "待开始";
  }

  document.querySelectorAll(".flow-step-card").forEach((card) => {
    const step = card.getAttribute("data-flow-step");
    card.classList.toggle("done", Boolean(step && flowState.steps[step]));
    card.classList.toggle("current", Boolean(step) && step === nextStep);
  });

  if (flowContext) {
    const doneSummary = FLOW_ORDER.filter((step) => flowState.steps[step]).map((step) => {
      const note = normalizeFlowNote(flowState.notes[step]);
      return `${FLOW_LABELS[step]}${note ? `（${note}）` : ""}`;
    });
    if (!doneSummary.length) {
      flowContext.textContent = "先从“发现活动”开始，选一个感兴趣的活动或地点。";
    } else if (!nextStep) {
      flowContext.textContent = `已完成全流程：${doneSummary.join(" → ")}。`;
    } else {
      flowContext.textContent = `已完成：${doneSummary.join(" → ")}。下一步：${FLOW_LABELS[nextStep]}。`;
    }
  }

  if (flowNextBtn) {
    if (nextStep) {
      flowNextBtn.disabled = false;
      flowNextBtn.textContent = `继续：${FLOW_LABELS[nextStep]}`;
      flowNextBtn.setAttribute("data-next-step", nextStep);
    } else {
      flowNextBtn.disabled = true;
      flowNextBtn.textContent = "流程已完成";
      flowNextBtn.setAttribute("data-next-step", "");
    }
  }
  updateFlowProgressPill();
  updateExploreRecommendHint();
  updateFlowCoach();
}

function markFlowStep(step, note = "") {
  if (!FLOW_ORDER.includes(step)) return;
  const normalized = normalizeFlowNote(note);
  let changed = false;
  if (!flowState.steps[step]) {
    flowState.steps[step] = true;
    changed = true;
  }
  if (normalized && flowState.notes[step] !== normalized) {
    flowState.notes[step] = normalized;
    changed = true;
  }
  if (changed) {
    renderFlowState();
    maybeApplyRecommendedExplorePanel(false);
  }
}

function resetFlowState() {
  flowState = {
    steps: { discover: false, match: false, plan: false, launch: false, join: false },
    notes: { discover: "", match: "", plan: "", launch: "", join: "" },
  };
  renderFlowState();
  maybeApplyRecommendedExplorePanel(true);
}

function applyExplorePanel(panel) {
  if (!EXPLORE_PANELS.has(panel)) return;
  const changed = panel !== currentExplorePanel;
  currentExplorePanel = panel;
  explorePanels.forEach((section) => {
    const target = section.getAttribute("data-explore-panel");
    section.classList.toggle("explore-panel-hidden", target !== panel);
  });
  exploreTabButtons.forEach((btn) => {
    const active = btn.getAttribute("data-explore-target") === panel;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
  return changed;
}

function syncExploreComposeCards(activePanel, openPrimaryCard = false) {
  const cardsInPanel = [];
  exploreComposeCards.forEach((card) => {
    const panel = card.closest(".explore-panel-section")?.getAttribute("data-explore-panel") || "";
    if (panel !== activePanel) {
      card.open = false;
      return;
    }
    cardsInPanel.push(card);
  });
  if (!openPrimaryCard || !cardsInPanel.length) return;
  const primaryCard = cardsInPanel.find((card) => card.getAttribute("data-compose-primary") === "true") || cardsInPanel[0];
  cardsInPanel.forEach((card) => {
    card.open = card === primaryCard;
  });
}

function setExplorePanel(panel, persist = true, manual = false, recommendationMode = false) {
  if (!EXPLORE_PANELS.has(panel)) return;
  if (manual) exploreManualOverrideUntil = Date.now() + 90 * 1000;
  const changed = applyExplorePanel(panel);
  if (recommendationMode) {
    syncExploreComposeCards(panel, true);
  } else if (changed) {
    syncExploreComposeCards(panel, false);
  }
  if (persist) {
    localStorage.setItem("explore_panel", panel);
  }
  if (changed || window.location.hash.replace("#", "") === "explore") {
    syncTopbarScreen();
  }
  if (panel === "nearby") {
    loadPersonalizedRecommendations({ force: false }).catch(() => {});
  }
}

function inferExplorePanelFromNote(note = "") {
  const t = String(note || "").toLowerCase();
  if (!t) return "";
  if (t.includes("校园")) return "campus";
  if (t.includes("社群") || t.includes("同好")) return "community";
  if (t.includes("附近") || t.includes("地点") || t.includes("商户")) return "nearby";
  if (t.includes("灵感")) return "inspiration";
  if (t.includes("活动") || t.includes("报名")) return "events";
  if (t.includes("官方") || t.includes("聚合")) return "official";
  return "";
}

function getRecommendedExplorePanel() {
  const nextStep = getNextFlowStep();
  const discoverNote = flowState.notes.discover || "";
  const joinNote = flowState.notes.join || "";
  const launchNote = flowState.notes.launch || "";
  const noteBased = inferExplorePanelFromNote(`${discoverNote} ${joinNote} ${launchNote}`);

  if (nextStep === "join") return "events";
  if (nextStep === "discover") return noteBased || "official";
  if (nextStep === "match") {
    if (noteBased === "campus" || noteBased === "community") return noteBased;
    return "community";
  }
  if (nextStep === "plan") return noteBased || "official";
  if (nextStep === "launch") return "events";
  return noteBased || "official";
}

function updateExploreRecommendHint() {
  if (!exploreRecommendHint) return;
  const panel = getRecommendedExplorePanel();
  exploreRecommendHint.textContent = `智能推荐：${EXPLORE_PANEL_LABELS[panel] || "官方聚合"}`;
}

function maybeApplyRecommendedExplorePanel(force = false) {
  const panel = getRecommendedExplorePanel();
  if (!EXPLORE_PANELS.has(panel)) return;
  if (!force && Date.now() < exploreManualOverrideUntil) {
    updateExploreRecommendHint();
    return;
  }
  if (panel !== currentExplorePanel) {
    setExplorePanel(panel, false, false, true);
  } else {
    syncExploreComposeCards(panel, true);
  }
  updateExploreRecommendHint();
}

function syncExploreFloatingButton() {
  if (!exploreBackFlowBtn) return;
  const currentScreen = window.location.hash.replace("#", "") || "plan";
  const exploreActive = currentScreen === "explore";
  exploreBackFlowBtn.classList.toggle("hidden", !exploreActive);
}

function navigateToScreen(screen, sectionId = "") {
  const targetHash = `#${screen}`;
  if (window.location.hash !== targetHash) {
    window.location.hash = screen;
  }
  setTimeout(() => {
    if (!sectionId) return;
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 80);
}

function buildAuthPageUrl() {
  const currentPath = `${window.location.pathname || "/"}${window.location.search || ""}${window.location.hash || ""}`;
  return `/auth.html?next=${encodeURIComponent(currentPath || "/")}`;
}

function openAuthPage() {
  window.location.href = buildAuthPageUrl();
}

function jumpToFlowStep(step) {
  if (step === "discover") {
    const panel = getRecommendedExplorePanel();
    const sectionId = EXPLORE_SECTION_MAP[panel] || "official-section";
    setExplorePanel(panel, false, false, true);
    navigateToScreen("explore", sectionId);
  } else if (step === "match") {
    navigateToScreen("social", "social-section");
  } else if (step === "plan") {
    navigateToScreen("plan", currentPlan ? "plan-section" : "intent-section");
  } else if (step === "launch") {
    navigateToScreen("plan", currentPlan ? "plan-section" : "intent-section");
  } else if (step === "join") {
    setExplorePanel("events");
    navigateToScreen("explore", "events-section");
  }
}

function applyIntentToForm(intent) {
  if (!form || !intent) return;
  for (const [key, value] of Object.entries(intent)) {
    const field = form.elements.namedItem(key);
    if (field && typeof field.value !== "undefined") field.value = value;
  }
  if (intent.startDate && intent.startTime && intentStartDatetimeInput) {
    intentStartDatetimeInput.value = `${intent.startDate}T${intent.startTime}`;
  }
}

function deriveAreaFromCityCountry(city, country) {
  const c = String(city || "").trim();
  const k = String(country || "").trim();
  return [c, k].filter(Boolean).join(", ");
}

function normalizeManualPlace(raw = {}) {
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  return {
    name: String(raw.name || raw.point || raw.matchedName || "").trim(),
    placeId: String(raw.placeId || "").trim(),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    city: String(raw.city || "").trim(),
    country: String(raw.country || "").trim(),
    address: String(raw.address || raw.matchedName || "").trim(),
    source: String(raw.source || "manual_input").trim(),
  };
}

function manualPlaceKey(place = {}) {
  if (place.placeId) return `pid:${place.placeId.toLowerCase()}`;
  if (Number.isFinite(place.lat) && Number.isFinite(place.lng)) return `geo:${place.lat.toFixed(5)}|${place.lng.toFixed(5)}`;
  return `name:${String(place.name || "").trim().toLowerCase()}|${String(place.city || "").trim().toLowerCase()}|${String(place.country || "").trim().toLowerCase()}`;
}

function upsertManualPlace(place) {
  const normalized = normalizeManualPlace(place);
  if (!normalized.name) return false;
  if (!normalized.city) normalized.city = String(form?.elements?.namedItem("city")?.value || "").trim();
  if (!normalized.country) normalized.country = String(form?.elements?.namedItem("country")?.value || "").trim();
  const key = manualPlaceKey(normalized);
  const idx = manualPlacesForIntent.findIndex((item) => manualPlaceKey(item) === key);
  if (idx >= 0) {
    manualPlacesForIntent[idx] = { ...manualPlacesForIntent[idx], ...normalized };
    return false;
  }
  manualPlacesForIntent.push(normalized);
  return true;
}

function collectIntentFromForm() {
  const intent = Object.fromEntries(new FormData(form).entries());
  const dt = String(intent.startDateTime || "").trim();
  if (dt.includes("T")) {
    const [datePart, timePart] = dt.split("T");
    if (datePart) intent.startDate = datePart;
    if (timePart) intent.startTime = timePart.slice(0, 5);
  }
  delete intent.startDateTime;

  intent.companion = String(intent.companion || "朋友").trim() || "朋友";
  intent.people = String(intent.people || "2").trim() || "2";
  intent.budget = String(intent.budget || "中预算").trim() || "中预算";
  intent.timeSlot = String(intent.timeSlot || "今天晚上").trim() || "今天晚上";
  intent.interest = String(intent.interest || "city walk").trim() || "city walk";
  intent.city = String(intent.city || "").trim();
  intent.country = String(intent.country || "").trim();
  intent.area = String(intent.area || "").trim() || deriveAreaFromCityCountry(intent.city, intent.country);
  intent.endDate = String(intent.endDate || "").trim();
  intent.fromCountry = String(intent.fromCountry || "").trim();
  intent.startDate = String(intent.startDate || "").trim();
  intent.startTime = String(intent.startTime || "").trim();

  if (manualPlacesForIntent.length) {
    intent.seedPoints = manualPlacesForIntent.map((p) => p.name).filter(Boolean);
    intent.manualPlaces = manualPlacesForIntent.map((p) => ({
      name: p.name,
      placeId: p.placeId || "",
      lat: Number.isFinite(p.lat) ? p.lat : null,
      lng: Number.isFinite(p.lng) ? p.lng : null,
      city: p.city || intent.city,
      country: p.country || intent.country,
      address: p.address || "",
      source: p.source || "manual_input",
    }));
  }
  return intent;
}

function renderManualPlaces() {
  if (!manualPlaceList) return;
  if (!manualPlacesForIntent.length) {
    manualPlaceList.innerHTML = `<span class="meta">还没有手动地点，可输入或点地图添加。</span>`;
    return;
  }
  manualPlaceList.innerHTML = manualPlacesForIntent
    .map((place, index) => {
      const location = [place.city, place.country].filter(Boolean).join(", ");
      const label = location ? `${place.name} · ${location}` : place.name;
      return `<button type="button" class="intent-manual-chip remove" data-manual-remove="${index}" title="移除">${escapeHtml(label)} ×</button>`;
    })
    .join("");
}

function renderManualSuggestions(places = []) {
  if (!manualPlaceSuggestions) return;
  if (!places.length) {
    manualPlaceSuggestions.innerHTML = "";
    return;
  }
  manualPlaceSuggestions.innerHTML = places
    .map((place, index) => {
      const location = [place.city, place.country].filter(Boolean).join(", ");
      const label = location ? `${place.name} · ${location}` : place.name;
      return `<button type="button" class="intent-manual-chip" data-manual-suggest="${index}">${escapeHtml(label)}</button>`;
    })
    .join("");
}

async function saveManualPlacesForAccount(places = []) {
  if (!currentUser || !places.length) return;
  const city = String(form?.elements?.namedItem("city")?.value || "").trim();
  const country = String(form?.elements?.namedItem("country")?.value || "").trim();
  try {
    await api.saveManualPlaces({
      city,
      country,
      places,
    });
  } catch (_err) {
    // Ignore save failures and keep local editing experience.
  }
}

async function loadManualPlaceSuggestions(q = "") {
  if (!currentUser) {
    renderManualSuggestions([]);
    return;
  }
  const city = String(form?.elements?.namedItem("city")?.value || "").trim();
  const country = String(form?.elements?.namedItem("country")?.value || "").trim();
  try {
    const result = await api.getManualPlaces({
      q: String(q || "").trim(),
      city,
      country,
      limit: 12,
    });
    const dedupKeys = new Set(manualPlacesForIntent.map((item) => manualPlaceKey(item)));
    const suggestions = Array.isArray(result)
      ? result
          .map((item) => normalizeManualPlace(item))
          .filter((item) => item.name && !dedupKeys.has(manualPlaceKey(item)))
          .slice(0, 8)
      : [];
    renderManualSuggestions(suggestions);
    if (manualPlaceSuggestions) {
      manualPlaceSuggestions.dataset.suggestPayload = JSON.stringify(suggestions);
    }
  } catch (_err) {
    renderManualSuggestions([]);
  }
}

function parseManualSuggestionsFromDataset() {
  if (!manualPlaceSuggestions) return [];
  try {
    const parsed = JSON.parse(manualPlaceSuggestions.dataset.suggestPayload || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

async function addManualPlaceFromTextInput() {
  const raw = String(manualPlaceInput?.value || "").trim();
  if (!raw) return;
  const added = upsertManualPlace({
    name: raw,
    city: String(form?.elements?.namedItem("city")?.value || "").trim(),
    country: String(form?.elements?.namedItem("country")?.value || "").trim(),
    source: "manual_text",
  });
  renderManualPlaces();
  manualPlaceInput.value = "";
  if (added) {
    await saveManualPlacesForAccount([manualPlacesForIntent[manualPlacesForIntent.length - 1]]);
    showToast("已添加手动地点");
  }
  await loadManualPlaceSuggestions("");
}

async function resolveAndAddManualMapPoint(lat, lng) {
  const city = String(form?.elements?.namedItem("city")?.value || "").trim();
  const country = String(form?.elements?.namedItem("country")?.value || "").trim();
  let place = null;
  try {
    const result = await api.reversePlace({ lat, lng, city, country });
    place = normalizeManualPlace({
      name: result.point || result.matchedName || `地图标点 ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      placeId: result.placeId || "",
      lat: result.lat,
      lng: result.lng,
      city: result.city || city,
      country: result.country || country,
      address: result.matchedName || "",
      source: "map_pin",
    });
  } catch (_err) {
    place = normalizeManualPlace({
      name: `地图标点 ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng,
      city,
      country,
      source: "map_pin",
    });
  }
  const added = upsertManualPlace(place);
  renderManualPlaces();
  if (added) {
    await saveManualPlacesForAccount([place]);
  }
  showToast(`已添加：${place.name}`);
}

async function toggleManualMapPinMode() {
  if (!manualMapPinBtn) return;
  if (!mapConfig.enabled || !mapConfig.apiKey) {
    showToast("Google Maps 未配置，无法地图标点。", "error");
    return;
  }
  try {
    await ensureMapReady();
  } catch (err) {
    showToast(`地图不可用：${err.message}`, "error");
    return;
  }

  manualMapPinMode = !manualMapPinMode;
  manualMapPinBtn.classList.toggle("active", manualMapPinMode);
  manualMapPinBtn.textContent = manualMapPinMode ? "标点中（点地图）" : "地图标点";

  if (manualMapClickListener) {
    manualMapClickListener.remove();
    manualMapClickListener = null;
  }
  if (!manualMapPinMode || !googleMap) return;

  manualMapClickListener = googleMap.addListener("click", async (event) => {
    if (!manualMapPinMode) return;
    const lat = Number(event?.latLng?.lat?.());
    const lng = Number(event?.latLng?.lng?.());
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    await resolveAndAddManualMapPoint(lat, lng);
  });
  showToast("地图标点已开启，点击地图即可添加地点。");
}

function setActiveIntentPreset(presetKey) {
  if (!INTENT_PRESETS[presetKey]) return;
  activeIntentPreset = presetKey;
  if (!intentPresets) return;
  intentPresets.querySelectorAll(".intent-preset-btn[data-preset]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-preset") === presetKey);
  });
}

function applyIntentPreset(presetKey, silent = false) {
  const preset = INTENT_PRESETS[presetKey];
  if (!preset) return;
  applyIntentToForm(preset.intent);
  setActiveIntentPreset(presetKey);
  const label = preset.label || "预设";
  if (!silent) showToast(`已切换预设：${label}`);
}

async function generatePlanFromIntentForm(note = "手动输入需求", eventName = "input_submit") {
  const intent = collectIntentFromForm();
  await api.logEvent(eventName, intent);
  const plan = await api.generatePlan(intent);
  await applyGeneratedPlan(plan, note);
  currentActivity = null;
  await refreshEvents();
  return plan;
}

function buildIntentFromSeed(seed = {}) {
  const tags = Array.isArray(seed.tags)
    ? seed.tags
    : String(seed.tags || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  const tagPool = [...tags, seed.category, seed.interest, seed.title, seed.description, seed.content]
    .filter(Boolean)
    .join(" ");
  return {
    companion: "朋友",
    people: "2",
    budget: "中预算",
    timeSlot: "周末半天",
    interest: pickInterestFromTags([tagPool]),
    city: seed.city || seed.toCity || "Singapore",
    country: seed.country || seed.toCountry || "Singapore",
    area: areaFromCity(seed.city || seed.toCity || "Singapore", seed.country || seed.toCountry || "Singapore"),
  };
}

async function applyGeneratedPlan(plan, note = "") {
  currentPlan = plan;
  renderPlan(currentPlan);
  await renderMap(currentPlan);
  planSection.classList.remove("hidden");
  activitySection.classList.add("hidden");
  markFlowStep("plan", note || currentPlan.title || "路线已生成");
  trackPreferenceAction("plan_view", buildTrackedPlacesFromPlan(currentPlan, 6), {
    note: note || "",
    source: "apply_generated_plan",
  });
  navigateToScreen("plan", "plan-section");
}

async function startBuddyDiscussion(prefillText = "") {
  navigateToScreen("social", "social-section");
  if (!currentUser) {
    alert("请先登录后找搭子。");
    return;
  }
  try {
    await openChatTarget({ type: "global", id: "global", name: "Global 群聊" });
    if (prefillText) {
      appendSnippetToThreadInput(`【找搭子】${prefillText}`);
    }
    markFlowStep("match", prefillText || "已进入路线讨论");
  } catch (err) {
    alert(`打开聊天失败: ${err.message}`);
  }
}

function getTonightDateTimeLabel() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d} 19:30`;
}

function buildTonightLaunchMessage(plan, activity, scene = "") {
  const routePreview = Array.isArray(plan?.route)
    ? plan.route
        .slice(0, 4)
        .map((step, idx) => `${idx + 1}. ${formatStopDateTime(step)} ${step.point}`)
        .join("\n")
    : "";
  const sceneLine = scene ? `主题：${scene}\n` : "";
  return [
    "【今晚就去｜一键成团】",
    `活动：${plan?.title || "今晚路线"}`,
    sceneLine.trim(),
    `集合时间：${getTonightDateTimeLabel()}`,
    `预算：${plan?.budgetEstimate || "待定"}`,
    "路线预览：",
    routePreview || "请先补充路线",
    `报名链接：${activity?.link || ""}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildTonightDiscussionTemplate(plan) {
  const firstStop = Array.isArray(plan?.route) && plan.route.length ? plan.route[0].point : "待定";
  return `【今晚就去讨论模板】
我是否参加：可参加 / 待定
我预计到达时间：
我可接受预算：
我希望追加地点：
集合点建议：${firstStop}
交通建议：`;
}

async function createAndRenderActivityFromPlan(plan, focusPlanScreen = true, launchConfig = null) {
  const effectiveLaunchConfig = launchConfig || buildQuickLaunchConfig();
  currentActivity = await createActivity(plan, effectiveLaunchConfig);
  currentActivity.link = `${location.origin}${location.pathname}?join=${currentActivity.joinToken}`;
  renderActivity(currentActivity);
  activitySection.classList.remove("hidden");
  if (focusPlanScreen) {
    navigateToScreen("plan", "activity-section");
  }
  await refreshEvents();
  return currentActivity;
}

async function launchTonightGroup(options = {}) {
  const { seed = null, scene = "" } = options;
  if (!currentUser) {
    openAuthPage();
    alert("请先登录后发起今晚成团。");
    return;
  }
  try {
    let plan = currentPlan;
    if (seed) {
      const intent = buildIntentFromSeed(seed);
      applyIntentToForm(intent);
      plan = await api.generatePlan(intent);
      await applyGeneratedPlan(plan, `今晚就去 · ${scene || seed.title || "快速成团"}`);
    } else if (!plan) {
      const intent = Object.fromEntries(new FormData(form).entries());
      plan = await api.generatePlan(intent);
      await applyGeneratedPlan(plan, "今晚就去 · 快速成团");
    }
    const activity = await createAndRenderActivityFromPlan(plan, false);

    await openChatTarget({ type: "global", id: "global", name: "Global 群聊" });
    await sendContentToSelectedChat(appendRouteJoinPayloadToMessage(buildTonightLaunchMessage(plan, activity, scene), plan));
    await sendContentToSelectedChat(buildTonightDiscussionTemplate(plan));

    trackPreferenceAction("launch_group", buildTrackedPlacesFromPlan(plan, 6), {
      scene,
      source: "tonight_group",
    });
    markFlowStep("join", "今晚成团消息已发群");
    navigateToScreen("social", "social-section");
    await api.logEvent("tonight_group_launch", {
      scene: scene || "",
      activityCode: activity.code,
      routeCount: Array.isArray(plan.route) ? plan.route.length : 0,
    });
    alert("已自动发起活动并推送到 Global 群聊。");
  } catch (err) {
    alert(`今晚成团失败: ${err.message}`);
  }
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

function renderTravelPosts(posts) {
  if (!posts.length) {
    travelList.innerHTML = `<div class="meta">暂无匹配行程。</div>`;
    return;
  }
  travelList.innerHTML = posts
    .map((post) => {
      const tags = Array.isArray(post.tags) && post.tags.length ? post.tags.join(", ") : "无";
      const moreBody = `
        <p class="chat-content">${escapeHtml(post.note || "无备注")}</p>
        <div class="actions">
          <button class="btn-secondary travel-discuss-btn" data-post-id="${post.id}" data-post-city="${escapeHtml(
            post.toCity || "",
          )}" data-post-country="${escapeHtml(post.toCountry || "")}" type="button">发起找搭子讨论</button>
        </div>
      `;
      return `
        <article class="travel-item compact">
          <div class="travel-head">
            <strong>${post.fromCountry} -> ${post.toCountry} / ${post.toCity}</strong>
            <span>${post.startDate} ~ ${post.endDate}</span>
          </div>
          <div class="travel-meta">发起人：${post.creator.displayName} | 成员：${post.members.length}</div>
          <div class="travel-meta">预算：${post.budget || "未填写"} | 标签：${tags}</div>
          <div class="actions compact-primary-actions">
            <button class="btn-secondary travel-join-btn" data-post-id="${post.id}" type="button">加入行程</button>
            <button class="btn-secondary travel-route-btn" data-post-id="${post.id}" type="button">生成当地路线</button>
          </div>
          ${renderItemMore("更多信息与操作", moreBody)}
        </article>
      `;
    })
    .join("");
}

function renderDocRouteMeta(plan) {
  if (!docRoutePoints) return;
  const extracted = Array.isArray(plan?.documentMeta?.extractedPoints) ? plan.documentMeta.extractedPoints : [];
  const unresolved = Array.isArray(plan?.documentMeta?.unresolvedPoints) ? plan.documentMeta.unresolvedPoints : [];
  const route = Array.isArray(plan?.route) ? plan.route : [];
  if (!extracted.length && !unresolved.length) {
    docRoutePoints.innerHTML = "";
    return;
  }

  const normalizePoint = (value) => String(value || "").trim().toLowerCase();
  const unresolvedSet = new Set(unresolved.map(normalizePoint));
  const routePool = route.map((step) => ({
    ...step,
    used: false,
    inputNorm: normalizePoint(step.input || step.point),
    pointNorm: normalizePoint(step.point),
  }));

  const rows = extracted
    .map((rawPoint, index) => {
      const point = String(rawPoint || "").trim();
      const pointNorm = normalizePoint(point);
      const routeIdx = routePool.findIndex((step) => !step.used && (step.inputNorm === pointNorm || step.pointNorm === pointNorm));
      const matched = routeIdx >= 0 ? routePool[routeIdx] : null;
      if (matched) matched.used = true;

      const unresolvedByServer = unresolvedSet.has(pointNorm);
      const isResolved = Boolean(matched) && !unresolvedByServer;
      const statusClass = isResolved ? "resolved" : "unresolved";
      const statusText = isResolved ? "已识别" : "未识别";
      const mappedText = isResolved
        ? escapeHtml(matched.matchedName || matched.point || point)
        : "未找到可信地点";
      const scheduleText = isResolved ? escapeHtml(formatStopDateTime(matched)) : "时间待定";
      const recommendation = isResolved ? "" : "建议补充更完整地名（含城市/区域）。";

      return `
        <li class="doc-point-row ${statusClass}">
          <span class="doc-point-index">${index + 1}</span>
          <div class="doc-point-main">
            <div class="doc-point-title">${escapeHtml(point)}</div>
            <div class="doc-point-meta">行程：${scheduleText}</div>
            <div class="doc-point-meta">匹配：${mappedText}</div>
            ${recommendation ? `<div class="doc-point-tip">${recommendation}</div>` : ""}
          </div>
          <span class="doc-point-status ${statusClass}">${statusText}</span>
        </li>
      `;
    })
    .join("");

  docRoutePoints.innerHTML = `
    <article class="travel-item doc-points-card">
      <div class="travel-head"><strong>文档抽点结果</strong><span>按文档顺序</span></div>
      <div class="doc-points-summary">
        <span class="doc-pill">抽取 ${extracted.length}</span>
        <span class="doc-pill success">已识别 ${route.length}</span>
        <span class="doc-pill warning">未识别 ${unresolved.length}</span>
      </div>
      <ul class="doc-points-list">${rows}</ul>
    </article>
  `;
}

async function loadTravelPosts() {
  const posts = await api.getTravelPosts({
    toCountry: travelFilterCountry.value.trim(),
    toCity: travelFilterCity.value.trim(),
  });
  renderTravelPosts(posts);
}

function buildChatTargetKey(type, id) {
  return `${type}:${id || "global"}`;
}

function markActiveChatTarget() {
  const activeKey = selectedChatTarget ? buildChatTargetKey(selectedChatTarget.type, selectedChatTarget.id) : "";
  document.querySelectorAll(".chat-target-btn").forEach((btn) => {
    const key = buildChatTargetKey(btn.getAttribute("data-chat-type"), btn.getAttribute("data-chat-id"));
    btn.classList.toggle("active", Boolean(activeKey) && key === activeKey);
  });
}

function renderChatThread(messages) {
  if (!messages.length) {
    chatThreadMessages.innerHTML = `<div class="meta">暂无消息。</div>`;
    return;
  }
  chatThreadMessages.innerHTML = messages
    .map((m) => {
      const senderId = m.user?.id || m.fromUserId || "";
      const self = senderId && senderId === currentUser?.id;
      const who = m.user?.displayName || m.fromUserId || "Unknown";
      const geo = m.geo?.label ? ` | ${escapeHtml(m.geo.label)}` : "";
      const rawText = String(m.content || "");
      const routeParsed = parseRouteJoinMessage(rawText);
      const text = routeParsed.displayText || rawText;
      const isRouteLike = routeParsed.hasPayload || text.includes("【候选路线】") || text.includes("【路线讨论模板】");
      const joinBtn = routeParsed.hasPayload
        ? `<div class="actions"><button class="btn-primary chat-route-join-btn" type="button" data-route-token="${routeParsed.token}">一键加入这条路线</button></div>`
        : "";
      return `<article class="chat-item ${self ? "self" : ""}"><div class="chat-meta">${escapeHtml(who)} · ${new Date(
        m.createdAt,
      ).toLocaleString()}${geo}</div><p class="chat-content ${isRouteLike ? "route" : ""}">${escapeHtml(text).replaceAll(
        "\n",
        "<br/>",
      )}</p>${joinBtn}</article>`;
    })
    .join("");
  chatThreadMessages.scrollTop = chatThreadMessages.scrollHeight;
}

function normalizeInterestVisibility(value, campusOnly = false) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "public" || raw === "公开" || raw === "open") return "public";
  if (raw === "campus" || raw === "同校" || raw === "校园" || raw === "school") return "campus";
  if (raw === "invite" || raw === "仅邀请" || raw === "invite_only") return "invite";
  return campusOnly ? "campus" : "public";
}

function interestVisibilityLabel(group) {
  const mode = normalizeInterestVisibility(group?.visibility, Boolean(group?.campusOnly));
  if (mode === "campus") return "同校可见";
  if (mode === "invite") return "仅邀请";
  return "公开可见";
}

function parseInviteUsernames(raw) {
  const parts = String(raw || "")
    .split(/[\s,，;；\n]+/)
    .map((item) => item.trim().replace(/^@+/, "").toLowerCase())
    .filter(Boolean);
  return [...new Set(parts)];
}

function updateChatRouteContext() {
  if (!chatRouteContext) return;
  if (!currentPlan || !Array.isArray(currentPlan.route) || !currentPlan.route.length) {
    chatRouteContext.innerHTML = `<strong>路线讨论助手</strong><span>先生成路线，再发送到当前聊天进行讨论。</span>`;
    return;
  }
  const quickStops = currentPlan.route
    .slice(0, 3)
    .map((s) => `${formatStopDateTime(s)} ${s.point}`)
    .join(" · ");
  chatRouteContext.innerHTML = `
    <strong>${escapeHtml(currentPlan.title || "当前路线")}</strong>
    <span>${escapeHtml(quickStops)}</span>
  `;
}

function appendSnippetToThreadInput(snippet) {
  const text = String(snippet || "").trim();
  if (!text) return;
  const current = chatThreadInput.value.trim();
  chatThreadInput.value = current ? `${current}\n${text}` : text;
  chatThreadInput.focus();
}

function buildSummarizePayloadForTarget(target) {
  if (!target) return null;
  if (target.type === "global") return { scope: "global", limit: 100 };
  if (target.type === "campus") return { scope: "campus_group", groupId: target.id, limit: 100 };
  if (target.type === "interest") return { scope: "interest_group", groupId: target.id, limit: 100 };
  if (target.type === "dm") return { scope: "dm", dmUserId: target.id, limit: 100 };
  return null;
}

async function sendContentToSelectedChat(content) {
  if (!selectedChatTarget) throw new Error("请先在左侧选择一个聊天。");
  const message = String(content || "").trim();
  if (!message) return;
  if (selectedChatTarget.type === "dm") {
    await api.sendDm(selectedChatTarget.id, { content: message });
  } else if (selectedChatTarget.type === "global") {
    await api.sendMessage(message);
  } else if (selectedChatTarget.type === "campus") {
    await api.sendCampusGroupMessage(selectedChatTarget.id, { content: message });
  } else if (selectedChatTarget.type === "interest") {
    await api.sendInterestGroupMessage(selectedChatTarget.id, { content: message });
  } else {
    throw new Error("暂不支持当前会话类型。");
  }
  await openChatTarget(selectedChatTarget);
}

async function openChatTarget(target) {
  if (!currentUser) return;
  selectedChatTarget = target;
  chatThreadTitle.textContent = target.name || "聊天";
  const metaMap = {
    dm: "好友私聊",
    global: "Global 群聊",
    campus: "校园群聊",
    interest: "兴趣群聊",
  };
  chatThreadMeta.textContent = `${metaMap[target.type] || "聊天"} · 推荐讨论：时间 / 预算 / 必去点`;
  const placeholderMap = {
    dm: "和好友对齐时间、预算、必去点...",
    global: "发起路线讨论：时间、预算、兴趣偏好...",
    campus: "和同学讨论路线分工、集合点、交通...",
    interest: "围绕兴趣主题讨论当天路线...",
  };
  chatThreadInput.placeholder = placeholderMap[target.type] || "输入消息...";
  markActiveChatTarget();
  updateChatRouteContext();
  updateFlowCoach();
  if (target.type !== "global") {
    markFlowStep("match", target.name || metaMap[target.type] || "已进入聊天");
  }

  try {
    let messages = [];
    if (target.type === "dm") {
      messages = await api.getDmMessages(target.id);
    } else if (target.type === "global") {
      messages = await api.getMessages(200);
    } else if (target.type === "campus") {
      if (chatSocket) chatSocket.emit("campus_group:join", { groupId: target.id });
      messages = await api.getCampusGroupMessages(target.id);
    } else if (target.type === "interest") {
      if (chatSocket) chatSocket.emit("interest_group:join", { groupId: target.id });
      messages = await api.getInterestGroupMessages(target.id);
    }
    renderChatThread(messages);
  } catch (err) {
    chatThreadMessages.innerHTML = `<div class="meta">加载失败：${escapeHtml(err.message)}</div>`;
  }
}

function renderChatGroupsDirectory() {
  if (!currentUser) {
    chatGroupsList.innerHTML = `<div class="meta">登录后可查看群聊。</div>`;
    return;
  }
  const groupBlocks = [];
  groupBlocks.push(`
    <button class="chat-target-btn" data-chat-type="global" data-chat-id="global" data-chat-name="Global 群聊" type="button">
      <strong>Global 群聊</strong><span>全站公共讨论</span>
    </button>
  `);

  for (const g of chatCampusGroups) {
    const isMember = Array.isArray(g.members) && g.members.some((m) => m.id === currentUser.id);
    groupBlocks.push(`
      <div class="chat-target-row">
        <button class="chat-target-btn ${isMember ? "" : "disabled"}" data-chat-type="campus" data-chat-id="${g.id}" data-chat-name="校园群 · ${escapeHtml(
          g.name,
        )}" type="button" ${isMember ? "" : "disabled"}>
          <strong>${escapeHtml(g.name)}</strong><span>校园群 · ${escapeHtml(g.campusName || "")}</span>
        </button>
        ${isMember ? "" : `<button class="btn-secondary chat-join-campus-btn" data-group-id="${g.id}" type="button">加入</button>`}
      </div>
    `);
  }

  for (const g of chatInterestGroups) {
    const isMember = Array.isArray(g.members) && g.members.some((m) => m.id === currentUser.id);
    const location = [g.city, g.country].filter(Boolean).join(", ");
    const subtitle = `${g.interest || "兴趣"} · ${location || "地点待定"} · ${interestVisibilityLabel(g)}`;
    groupBlocks.push(`
      <div class="chat-target-row">
        <button class="chat-target-btn ${isMember ? "" : "disabled"}" data-chat-type="interest" data-chat-id="${g.id}" data-chat-name="兴趣群 · ${escapeHtml(
          g.name,
        )}" type="button" ${isMember ? "" : "disabled"}>
          <strong>${escapeHtml(g.name)}</strong><span>${escapeHtml(subtitle)}</span>
        </button>
        ${isMember ? "" : `<button class="btn-secondary chat-join-interest-btn" data-group-id="${g.id}" type="button">加入</button>`}
      </div>
    `);
  }
  chatGroupsList.innerHTML = groupBlocks.join("") || `<div class="meta">暂无群聊。</div>`;
  markActiveChatTarget();
}

function renderFriendsPanel(payload) {
  chatFriendsPayload = payload || { friends: [], requests: [] };
  const friends = chatFriendsPayload.friends || [];
  const requests = chatFriendsPayload.requests || [];
  const friendRows = friends
    .map(
      (f) => `
      <button class="chat-target-btn" data-chat-type="dm" data-chat-id="${f.id}" data-chat-name="${escapeHtml(f.displayName)}" type="button">
        <strong>${escapeHtml(f.displayName)}</strong><span>@${escapeHtml(f.username)}</span>
      </button>
    `,
    )
    .join("");

  const requestRows = requests
    .map((r) => {
      const incoming = r.toUserId === currentUser?.id;
      return `
      <div class="chat-request-row">
        <span class="travel-meta">${incoming ? "收到" : "发出"} 请求 ${r.id.slice(-6)}</span>
        ${
          incoming
            ? `<div class="actions"><button class="btn-secondary friend-req-action" data-request-id="${r.id}" data-accept="true" type="button">接受</button><button class="btn-secondary friend-req-action" data-request-id="${r.id}" data-accept="false" type="button">拒绝</button></div>`
            : `<span class="meta">等待对方处理</span>`
        }
      </div>
    `;
    })
    .join("");

  friendsList.innerHTML = `
    <div class="chat-directory-group">
      <div class="chat-directory-label">好友（${friends.length}）</div>
      ${friendRows || '<div class="meta">暂无好友</div>'}
    </div>
    <div class="chat-directory-group">
      <div class="chat-directory-label">好友请求（${requests.length}）</div>
      ${requestRows || '<div class="meta">暂无请求</div>'}
    </div>
  `;
  markActiveChatTarget();
}

async function loadFriendsPanel() {
  if (!currentUser) {
    chatFriendsPayload = { friends: [], requests: [] };
    friendsList.innerHTML = `<div class="meta">登录后可查看好友。</div>`;
    chatGroupsList.innerHTML = `<div class="meta">登录后可查看群聊。</div>`;
    return;
  }
  const payload = await api.getFriends();
  renderFriendsPanel(payload);
  renderChatGroupsDirectory();
  if (!selectedChatTarget) {
    openChatTarget({ type: "global", id: "global", name: "Global 群聊" }).catch(() => {});
  }
}

function renderCampusGroups(groups) {
  if (!groups.length) {
    campusGroupsList.innerHTML = `<div class="meta">暂无校园群。</div>`;
    return;
  }
  campusGroupsList.innerHTML = groups
    .map(
      (g) => `
      <article class="travel-item compact">
        <div class="travel-head"><strong>${escapeHtml(g.name)}</strong><span>${escapeHtml(g.campusName)}</span></div>
        <div class="travel-meta">ID: ${g.id} | 成员: ${g.members.length}</div>
        <div class="actions compact-primary-actions">
          <button class="btn-secondary campus-join-btn" type="button" data-group-id="${g.id}">加入群</button>
        </div>
        ${renderItemMore("群信息", `<p class="chat-content">${escapeHtml(g.description || "无描述")}</p>`)}
      </article>
    `,
    )
    .join("");
}

async function loadCampusGroups() {
  if (!currentUser) {
    chatCampusGroups = [];
    campusGroupsList.innerHTML = `<div class="meta">登录后可查看校园群。</div>`;
    renderChatGroupsDirectory();
    return;
  }
  try {
    const groups = await api.getCampusGroups();
    chatCampusGroups = groups;
    renderCampusGroups(groups);
    renderChatGroupsDirectory();
  } catch (_err) {
    chatCampusGroups = [];
    campusGroupsList.innerHTML = `<div class="meta">请先完成校园认证。</div>`;
    renderChatGroupsDirectory();
  }
}

function renderInterestGroups(groups) {
  if (!groups.length) {
    communityList.innerHTML = `<div class="meta">暂无匹配社群。</div>`;
    return;
  }
  communityList.innerHTML = groups
    .map((g) => {
      const visibilityTag = interestVisibilityLabel(g);
      const isMember = Array.isArray(g.members) && g.members.some((m) => m.id === currentUser?.id);
      const location = [g.city, g.country].filter(Boolean).join(", ") || "地点待定";
      const moreBody = `
        <p class="chat-content">${escapeHtml(g.description || "无描述")}</p>
        <div class="actions">
          <button class="btn-secondary interest-chat-btn" data-group-id="${g.id}" data-group-name="${escapeHtml(g.name)}" type="button">${
            isMember ? "进入群聊讨论路线" : "加入并讨论路线"
          }</button>
        </div>
      `;
      return `
      <article class="travel-item compact">
        <div class="travel-head"><strong>${escapeHtml(g.name)}</strong><span>${escapeHtml(location)}</span></div>
        <div class="travel-meta">兴趣：${escapeHtml(g.interest || "兴趣")} | 成员：${g.members?.length || 0} | ${visibilityTag}</div>
        <div class="travel-meta">下次活动：${new Date(g.nextMeetupAt).toLocaleString()}</div>
        <div class="actions compact-primary-actions">
          <button class="btn-secondary interest-join-btn" data-group-id="${g.id}" type="button">加入社群</button>
        </div>
        ${renderItemMore("社群详情与讨论", moreBody)}
      </article>
    `;
    })
    .join("");
}

async function loadInterestGroups() {
  const groups = await api.getInterestGroups({
    city: communityFilterCity.value.trim(),
    interest: communityFilterInterest.value.trim(),
  });
  chatInterestGroups = groups;
  renderInterestGroups(groups);
  renderChatGroupsDirectory();
}

function feedTypeLabel(type) {
  if (type === "official") return "官方发布";
  if (type === "local_event") return "本地活动";
  if (type === "travel") return "旅行找搭子";
  if (type === "inspiration") return "灵感内容";
  return "聚合内容";
}

function renderAggregatedFeed(items) {
  if (!officialFeedList) return;
  if (!items.length) {
    officialFeedList.innerHTML = `<div class="meta">暂无匹配信息。</div>`;
    return;
  }
  officialFeedList.innerHTML = items
    .slice(0, 80)
    .map((item) => {
      const type = String(item.type || "");
      const title = String(item.title || item.name || "未命名内容");
      const city = String(item.city || item.toCity || "");
      const country = String(item.country || item.toCountry || "");
      const category = String(item.category || item.interest || "");
      const desc = String(item.content || item.description || item.note || "").slice(0, 220);
      const tags = Array.isArray(item.tags) ? item.tags.join(",") : "";
      const when = item.startAt || item.createdAt;
      const whenText = when ? new Date(when).toLocaleString() : "时间未提供";
      const sourceText = item.source || item.creator?.displayName || "聚合源";
      const url = item.ticketUrl || item.link || item.booking?.official || "";
      const moreBody = `
        <p class="chat-content">${escapeHtml(desc || "暂无详情")}</p>
        <div class="actions">
          ${
            url
              ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">查看详情</a>`
              : `<span class="meta">暂无外链</span>`
          }
          <button class="btn-secondary feed-buddy-btn" type="button" data-feed-title="${escapeHtml(title)}">发起找搭子讨论</button>
        </div>
      `;
      return `
      <article class="travel-item compact">
        <div class="travel-head"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(feedTypeLabel(type))}</span></div>
        <div class="travel-meta">${escapeHtml(city || "未知城市")}${country ? `, ${escapeHtml(country)}` : ""} ${category ? `| ${escapeHtml(category)}` : ""}</div>
        <div class="travel-meta">${escapeHtml(whenText)} | 来源：${escapeHtml(sourceText)}</div>
        <div class="actions compact-primary-actions">
          <button
            class="btn-secondary feed-plan-btn"
            type="button"
            data-feed-title="${escapeHtml(title)}"
            data-feed-city="${escapeHtml(city)}"
            data-feed-country="${escapeHtml(country)}"
            data-feed-category="${escapeHtml(category)}"
            data-feed-tags="${escapeHtml(tags)}"
            data-feed-desc="${escapeHtml(desc)}"
          >转成路线</button>
        </div>
        ${renderItemMore("详情与讨论", moreBody)}
      </article>
    `;
    })
    .join("");
}

async function loadAggregatedFeed() {
  if (!officialFeedList) return;
  const all = await api.getAggregatedFeed();
  const keyword = String(officialFilterQ?.value || "")
    .trim()
    .toLowerCase();
  const filtered = keyword
    ? all.filter((item) => {
        const text = `${item.type || ""} ${item.title || ""} ${item.content || ""} ${item.description || ""} ${item.city || ""} ${
          item.toCity || ""
        } ${(item.tags || []).join(" ")}`.toLowerCase();
        return text.includes(keyword);
      })
    : all;
  renderAggregatedFeed(filtered);
}

function countRsvp(event, status) {
  return (event.rsvps || []).filter((r) => r.status === status).length;
}

function renderLocalEvents(events) {
  if (!events.length) {
    eventList.innerHTML = `<div class="meta">暂无活动。</div>`;
    return;
  }
  eventList.innerHTML = events
    .map((e) => {
      const interested = countRsvp(e, "interested");
      const going = countRsvp(e, "going");
      const price = Number(e.price) > 0 ? `${e.price} ${e.currency || "SGD"}` : "免费";
      const link = e.ticketUrl
        ? `<a href="${e.ticketUrl}" target="_blank" rel="noreferrer">购票/报名</a>`
        : `<span class="meta">无票务链接</span>`;
      const moreBody = `
        <p class="chat-content">${escapeHtml(e.description || "无活动说明")}</p>
        <div class="actions">
          ${link}
          <button class="btn-secondary event-buddy-btn" data-event-title="${escapeHtml(e.title)}" type="button">发起找搭子讨论</button>
          <button class="btn-secondary event-rsvp-btn" data-event-id="${e.id}" data-status="interested" type="button">感兴趣</button>
        </div>
      `;
      return `
      <article class="travel-item compact">
        <div class="travel-head"><strong>${escapeHtml(e.title)}</strong><span>${new Date(e.startAt).toLocaleString()}</span></div>
        <div class="travel-meta">${escapeHtml(e.city)}, ${escapeHtml(e.country)} | ${escapeHtml(e.category)} | ${price}</div>
        <div class="travel-meta">地点：${escapeHtml(e.venueName || "待定")} | 去：${going} | 感兴趣：${interested}</div>
        <div class="actions compact-primary-actions">
          <button
            class="btn-secondary event-plan-btn"
            data-event-title="${escapeHtml(e.title)}"
            data-event-city="${escapeHtml(e.city || "")}"
            data-event-country="${escapeHtml(e.country || "")}"
            data-event-category="${escapeHtml(e.category || "")}"
            data-event-desc="${escapeHtml(e.description || "")}"
            type="button"
          >按活动生成路线</button>
          <button class="btn-secondary event-rsvp-btn" data-event-id="${e.id}" data-status="going" type="button">我要去</button>
        </div>
        ${renderItemMore("活动详情与更多操作", moreBody)}
      </article>
    `;
    })
    .join("");
}

async function loadLocalEvents() {
  const events = await api.getLocalEvents({
    city: eventFilterCity.value.trim(),
    category: eventFilterCategory.value.trim(),
  });
  renderLocalEvents(events);
}

function pickInterestFromTags(tags = []) {
  const joined = tags.join(" ").toLowerCase();
  if (joined.includes("coffee") || joined.includes("咖啡")) return "咖啡";
  if (joined.includes("exhibit") || joined.includes("museum") || joined.includes("看展")) return "看展";
  if (joined.includes("acg") || joined.includes("anime")) return "ACG";
  if (joined.includes("food") || joined.includes("美食")) return "美食";
  return "city walk";
}

function areaFromCity(city = "", country = "") {
  const c = String(city || "").trim();
  const k = String(country || "").trim();
  if (c || k) return [c, k || "Singapore"].filter(Boolean).join(", ");
  return "Singapore, Singapore";
}

function renderInspirations(posts) {
  if (!posts.length) {
    inspirationList.innerHTML = `<div class="meta">暂无灵感内容。</div>`;
    return;
  }
  inspirationList.innerHTML = posts
    .map((p) => {
      const tags = (p.tags || []).join(" · ");
      const places = (p.places || []).join(" · ");
      const moreBody = `
        <p class="chat-content">${escapeHtml(p.content || "")}</p>
        <div class="actions">
          <button class="btn-secondary inspiration-like-btn" data-ins-id="${p.id}" type="button">点赞/取消</button>
          <button class="btn-secondary inspiration-buddy-btn" data-ins-title="${escapeHtml(p.title || "")}" type="button">发起找搭子讨论</button>
        </div>
      `;
      return `
      <article class="travel-item compact">
        <div class="travel-head"><strong>${escapeHtml(p.title)}</strong><span>${escapeHtml(p.city)}, ${escapeHtml(p.country)}</span></div>
        <div class="travel-meta">作者：${escapeHtml(p.creator?.displayName || "Unknown")} | 点赞：${(p.likes || []).length}</div>
        <div class="travel-meta">标签：${escapeHtml(tags || "无")} </div>
        <div class="travel-meta">地点：${escapeHtml(places || "无")} </div>
        <div class="actions compact-primary-actions">
          <button class="btn-secondary inspiration-plan-btn" data-ins-id="${p.id}" data-ins-city="${escapeHtml(
            p.city || "",
          )}" data-ins-tags="${escapeHtml((p.tags || []).join(","))}" type="button">生成同款路线</button>
        </div>
        ${renderItemMore("内容详情与互动", moreBody)}
      </article>
    `;
    })
    .join("");
}

async function loadInspirations() {
  const posts = await api.getInspirations({
    city: inspirationFilterCity.value.trim(),
    tag: inspirationFilterTag.value.trim(),
  });
  renderInspirations(posts);
}

function renderDiscoverPlaces(places, options = {}) {
  const mode = options.mode || "search";
  const heading = String(options.heading || "").trim();
  const emptyText =
    options.emptyText || (mode === "recommend" ? "暂时还没有足够偏好数据，先选几个地点让我学习。" : "暂无匹配商户，请换关键词。");
  if (!places.length) {
    discoverList.dataset.mode = mode;
    discoverList.innerHTML = `<div class="meta">${escapeHtml(emptyText)}</div>`;
    return;
  }
  const cardsHtml = places
    .map((p) => {
      const mapsUrl = p.googleMapsUri || createGoogleMapsSearchUrl(p.matchedName || p.point);
      const rating = formatRatingText(p.rating, p.userRatingCount);
      const ticket = p.ticketing?.required ? "可能需门票" : "通常无需门票";
      const openState = p.openNow === true ? "营业中" : p.openNow === false ? "当前休息" : "营业信息未知";
      const price = formatPriceLevel(p.priceLevel);
      const title = p.point || p.matchedName || "推荐地点";
      const summary = String(p.intro || "").trim() || "交通便利，适合加入本次路线。";
      const tags = Array.isArray(p.vibeTags) && p.vibeTags.length ? p.vibeTags : [ticket, openState, price];
      const recommendReason = String(p.recommendReason || "").trim();
      const heroHtml = renderPlaceHero(p, title);
      const moreBody = `
        <p class="chat-content">${escapeHtml(summary)}</p>
        <div class="travel-meta">地址：${escapeHtml(p.matchedName || "未返回详细地址")}</div>
        <div class="actions">
          ${p.booking?.official ? `<a href="${p.booking.official}" target="_blank" rel="noreferrer">官网</a>` : ""}
          ${p.ticketing?.required && p.booking?.klook ? `<a href="${p.booking.klook}" target="_blank" rel="noreferrer">Klook</a>` : ""}
          ${p.ticketing?.required && p.booking?.kkday ? `<a href="${p.booking.kkday}" target="_blank" rel="noreferrer">KKday</a>` : ""}
          <button class="btn-secondary discover-buddy-btn" type="button" data-place-name="${escapeHtml(p.point || "")}">发起找搭子讨论</button>
        </div>
      `;
      return `
      <article class="travel-item compact place-card">
        ${heroHtml}
        <div class="travel-head"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(price)}</span></div>
        ${recommendReason ? `<div class="travel-meta">推荐理由：${escapeHtml(recommendReason)}</div>` : ""}
        <div class="travel-meta">${escapeHtml(summary)}</div>
        <div class="travel-meta">评分：${rating} | ${escapeHtml(openState)}</div>
        ${renderTagChips(tags)}
        <div class="actions compact-primary-actions">
          <a href="${mapsUrl}" target="_blank" rel="noreferrer">查看地图与导航</a>
          <button
            class="btn-secondary discover-plan-btn"
            type="button"
            data-place-name="${escapeHtml(p.point || "")}"
            data-place-city="${escapeHtml(p.city || "")}"
            data-place-country="${escapeHtml(p.country || "")}"
            data-place-intro="${escapeHtml(p.intro || "")}"
          >加入并生成路线</button>
          <button
            class="btn-primary discover-tonight-btn"
            type="button"
            data-place-name="${escapeHtml(p.point || "")}"
            data-place-city="${escapeHtml(p.city || "")}"
            data-place-country="${escapeHtml(p.country || "")}"
            data-place-category="${escapeHtml(lastDiscoverContext.category || "")}"
            data-place-intro="${escapeHtml(p.intro || "")}"
          >今晚就去</button>
        </div>
        ${renderItemMore("地点详情与更多操作", moreBody)}
      </article>
    `;
    })
    .join("");
  discoverList.dataset.mode = mode;
  if (heading) {
    discoverList.innerHTML = `
      <article class="travel-item">
        <div class="travel-head"><strong>${escapeHtml(heading)}</strong><span>${escapeHtml(mode === "recommend" ? "基于你的历史选择" : "地点列表")}</span></div>
        <div class="travel-list">${cardsHtml}</div>
      </article>
    `;
    return;
  }
  discoverList.innerHTML = cardsHtml;
}

function buildTrackedPlacesFromPlan(plan, limit = 6) {
  if (!plan || !Array.isArray(plan.route)) return [];
  return plan.route
    .slice(0, limit)
    .map((step) => ({
      name: step.point,
      city: step.city || lastDiscoverContext.city || "",
      country: step.country || lastDiscoverContext.country || "",
      category: step.primaryType || "",
      interest: step.primaryType || "",
      weight: 1,
    }))
    .filter((item) => String(item.name || "").trim());
}

async function trackPreferenceAction(actionType, places = [], context = {}) {
  if (!currentUser) return;
  const normalizedPlaces = (Array.isArray(places) ? places : [])
    .map((place) => ({
      name: String(place?.name || place?.point || "").trim(),
      city: String(place?.city || "").trim(),
      country: String(place?.country || "").trim(),
      category: String(place?.category || place?.primaryType || "").trim(),
      interest: String(place?.interest || "").trim(),
      weight: Number.isFinite(Number(place?.weight)) ? Number(place.weight) : 1,
    }))
    .filter((place) => place.name)
    .slice(0, 10);
  if (!normalizedPlaces.length) return;
  try {
    await api.trackPreference({
      actionType,
      places: normalizedPlaces,
      context: context || {},
    });
  } catch (_err) {
    // Ignore preference tracking failures to avoid blocking UX.
  }
}

async function loadPersonalizedRecommendations(options = {}) {
  if (!discoverList) return;
  const force = Boolean(options.force);
  const hasContent = Boolean(discoverList.innerHTML.trim());
  const mode = discoverList.dataset.mode || "";
  if (!force && hasContent && mode === "search") {
    return;
  }
  if (!currentUser) {
    if (force || !hasContent || mode === "recommend") {
      discoverList.dataset.mode = "recommend";
      discoverList.innerHTML = `<div class="meta">登录后可根据你的历史选择推荐最可能想去的地点。</div>`;
    }
    return;
  }
  const city = String(lastDiscoverContext.city || "").trim();
  const country = String(lastDiscoverContext.country || "").trim();
  try {
    const places = await api.getDiscoveryRecommendations({
      limit: 8,
      city,
      country,
    });
    renderDiscoverPlaces(places, {
      mode: "recommend",
      heading: "猜你最可能想去",
      emptyText: "暂时还没有足够偏好数据，先选几个地点让我学习。",
    });
  } catch (_err) {
    if (!discoverList.innerHTML.trim()) {
      discoverList.dataset.mode = "recommend";
      discoverList.innerHTML = `<div class="meta">个性化推荐加载失败，请稍后重试。</div>`;
    }
  }
}

function renderCollabTrips(trips) {
  if (!trips.length) {
    collabList.innerHTML = `<div class="meta">暂无协同行程。</div>`;
    return;
  }
  collabList.innerHTML = trips
    .map((t) => {
      return `
      <article class="travel-item compact">
        <div class="travel-head"><strong>${escapeHtml(t.title)}</strong><span>${escapeHtml(t.destinationCity)}, ${escapeHtml(
          t.destinationCountry,
        )}</span></div>
        <div class="travel-meta">ID: ${t.id} | 成员：${(t.members || []).length} | ${t.startDate} ~ ${t.endDate}</div>
        <div class="travel-meta">行程项：${(t.items || []).length} | 费用：${(t.expenses || []).length}</div>
        <div class="actions compact-primary-actions">
          <button class="btn-secondary collab-join-btn" data-trip-id="${t.id}" type="button">加入行程</button>
          <button class="btn-secondary collab-summary-btn" data-trip-id="${t.id}" type="button">查看分账</button>
        </div>
      </article>
    `;
    })
    .join("");
}

async function loadCollabTrips() {
  if (!currentUser) {
    collabList.innerHTML = `<div class="meta">登录后可查看协同行程。</div>`;
    return;
  }
  const trips = await api.getCollabTrips();
  renderCollabTrips(trips);
}

function renderCollabSummary(summary) {
  const settlements = summary.settlements || [];
  const settlementHtml = settlements.length
    ? settlements
        .map((s) => `<div class="travel-meta">${escapeHtml(s.from)} -> ${escapeHtml(s.to)}：${s.amount} ${s.currency}</div>`)
        .join("")
    : `<div class="travel-meta">当前无需转账，已平衡。</div>`;
  collabSummary.innerHTML = `
    <article class="travel-item">
      <div class="travel-head"><strong>分账结果</strong><span>Trip ${summary.tripId}</span></div>
      <div class="travel-meta">总费用：${summary.totalExpense} ${summary.currency}</div>
      ${settlementHtml}
    </article>
  `;
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
    if (selectedChatTarget?.type === "global") {
      openChatTarget(selectedChatTarget).catch(() => {});
    }
  });

  chatSocket.on("im:dm_message", () => {
    if (selectedChatTarget?.type === "dm") {
      openChatTarget(selectedChatTarget).catch(() => {});
    }
  });

  chatSocket.on("campus_group:new_message", ({ groupId }) => {
    if (selectedChatTarget?.type === "campus" && selectedChatTarget.id === groupId) {
      openChatTarget(selectedChatTarget).catch(() => {});
    }
  });

  chatSocket.on("interest_group:new_message", ({ groupId }) => {
    if (selectedChatTarget?.type === "interest" && selectedChatTarget.id === groupId) {
      openChatTarget(selectedChatTarget).catch(() => {});
    }
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
  const realtimeTag = plan.validationSummary?.realtime ? "实时搜索" : "模板+校验";
  const multiDayTag = plan.validationSummary?.multiDay ? ` | 多日: ${plan.validationSummary.multiDay}天` : "";
  const routeSummary = plan.routeSummary
    ? `整段路径：约 ${plan.routeSummary.distanceKm || "-"} km / ${plan.routeSummary.durationMin || "-"} 分钟`
    : "整段路径：暂无官方路线时长";
  const narrative = plan.narrative || {};
  const narrativeInsights = Array.isArray(narrative.searchInsights) ? narrative.searchInsights.slice(0, 3) : [];
  const narrativeHtml =
    narrative.hook || narrative.vibe || narrativeInsights.length
      ? `
      <article class="travel-item">
        ${narrative.hook ? `<div class="travel-head"><strong>${escapeHtml(narrative.hook)}</strong><span>${narrative.llmEnhanced ? "LLM增强" : "推荐增强"}</span></div>` : ""}
        ${narrative.vibe ? `<div class="travel-meta">${escapeHtml(narrative.vibe)}</div>` : ""}
        ${narrativeInsights.length ? `<div class="travel-meta">${narrativeInsights.map((line) => `• ${escapeHtml(line)}`).join("<br/>")}</div>` : ""}
      </article>
    `
      : "";
  const routeHtml = plan.route
    .map((step) => {
      const mapsUrl = createGoogleMapsSearchUrl(step.matchedName || step.point);
      const status = step.verified ? "真实地点" : "待确认";
      const stopDateTime = formatStopDateTime(step);
      const rating = formatRatingText(step.rating, step.userRatingCount);
      const openState = step.openNow === true ? "营业中" : step.openNow === false ? "当前休息" : "营业信息未知";
      const price = formatPriceLevel(step.priceLevel);
      const tags = Array.isArray(step.vibeTags) && step.vibeTags.length ? step.vibeTags : [status, price];
      const bookingLinks = [];
      if (step.ticketing?.required && step.booking?.klook) {
        bookingLinks.push(`<a href="${step.booking.klook}" target="_blank" rel="noreferrer">Klook 买票</a>`);
      }
      if (step.ticketing?.required && step.booking?.kkday) {
        bookingLinks.push(`<a href="${step.booking.kkday}" target="_blank" rel="noreferrer">KKday 买票</a>`);
      }
      if (step.ticketing?.required && step.booking?.official) {
        bookingLinks.push(`<a href="${step.booking.official}" target="_blank" rel="noreferrer">官方购票</a>`);
      } else if (step.booking?.official) {
        bookingLinks.push(`<a href="${step.booking.official}" target="_blank" rel="noreferrer">官网</a>`);
      }
      const mapLink = `<a href="${mapsUrl}" target="_blank" rel="noreferrer">Google 地图</a>`;
      const primaryLinks = [mapLink];
      if (bookingLinks.length) primaryLinks.push(bookingLinks[0]);
      const moreLinks = bookingLinks.slice(1);
      const heroHtml = renderPlaceHero(step, step.point || "路线站点");
      const moreBody = `
        ${step.intro ? `<p class="chat-content">${escapeHtml(step.intro)}</p>` : ""}
        <div class="travel-meta">${step.ticketing?.required ? "门票：可能需要提前购票" : "门票：通常无需单独门票"}</div>
        <div class="travel-meta">评分：${rating} | ${escapeHtml(openState)} | ${escapeHtml(price)}</div>
        ${
          moreLinks.length
            ? `<div class="actions">${moreLinks.join("")}</div>`
            : `<div class="meta">暂无更多外链。</div>`
        }
      `;
      return `
        <article class="travel-item compact plan-stop-card">
          ${heroHtml}
          <div class="travel-head"><strong>${escapeHtml(stopDateTime)} · ${escapeHtml(step.point)}</strong><span>${status}</span></div>
          <div class="travel-meta">评分：${rating} | ${escapeHtml(openState)}</div>
          ${renderTagChips(tags)}
          <div class="actions compact-primary-actions">${primaryLinks.join("")}</div>
          ${renderItemMore("站点介绍与购票入口", moreBody)}
        </article>
      `;
    })
    .join("");

  const masterBooking = plan.bookingLinks
    ? `
    <article class="travel-item">
      <div class="travel-head"><strong>机酒票快捷入口</strong><span>真实平台</span></div>
      <div class="actions">
        <a href="${plan.bookingLinks.flights}" target="_blank" rel="noreferrer">机票（Google Flights）</a>
        <a href="${plan.bookingLinks.hotels}" target="_blank" rel="noreferrer">酒店（Booking）</a>
        <a href="${plan.bookingLinks.attractions}" target="_blank" rel="noreferrer">门票（Klook）</a>
      </div>
    </article>
  `
    : "";

  planOutput.innerHTML = `
    <h3>${plan.title}</h3>
    <p class="meta">预算估计：${plan.budgetEstimate}</p>
    <p class="meta">地点校验：${validation} | 来源：${realtimeTag}${multiDayTag}</p>
    <p class="meta">${routeSummary}</p>
    ${narrativeHtml}
    ${masterBooking}
    <div class="travel-list">${routeHtml}</div>
    <p class="why">${plan.reason}</p>
  `;
  syncActivityLaunchFormFromPlan(plan, true);
  markFlowStep("plan", plan.title || "路线已生成");
  updateChatRouteContext();
}

function formatStopDateTime(step) {
  const date = String(step?.date || "").trim();
  const time = String(step?.time || "").trim();
  if (date && time) return `${date} ${time}`;
  if (date) return date;
  if (time) return time;
  return "时间待定";
}

function encodeUtf8Base64Url(text) {
  const bytes = new TextEncoder().encode(String(text || ""));
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeUtf8Base64Url(token) {
  const raw = String(token || "").trim();
  if (!raw) return "";
  const base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function buildJoinableRoutePlanPayload(plan, maxStops = 8) {
  const routeSource = Array.isArray(plan?.route) ? plan.route : [];
  const route = routeSource
    .slice(0, Math.max(2, Math.min(maxStops, routeSource.length || 2)))
    .map((step) => ({
      date: String(step?.date || "").trim(),
      time: String(step?.time || "").trim(),
      point: String(step?.point || "").trim(),
      matchedName: String(step?.matchedName || "").trim(),
      lat: Number.isFinite(Number(step?.lat)) ? Number(step.lat) : null,
      lng: Number.isFinite(Number(step?.lng)) ? Number(step.lng) : null,
      verified: Boolean(step?.verified),
      intro: String(step?.intro || "")
        .trim()
        .slice(0, 72),
    }))
    .filter((step) => step.point);
  if (route.length < 2) return null;
  const verifiedCount = route.filter((step) => step.verified).length;
  const routePath = route
    .filter((step) => Number.isFinite(step.lat) && Number.isFinite(step.lng))
    .map((step) => ({ lat: step.lat, lng: step.lng }));
  return {
    id: String(plan?.id || `CHAT-${Date.now()}`),
    title: String(plan?.title || "群聊路线").trim(),
    budgetEstimate: String(plan?.budgetEstimate || "预算待定").trim(),
    reason: String(plan?.reason || "来自群聊分享路线，可一键加入。").trim(),
    route,
    routePath,
    validationSummary: {
      total: route.length,
      verified: verifiedCount,
      replaced: 0,
      fromChat: true,
    },
    generatedAt: new Date().toISOString(),
  };
}

function encodeRouteJoinPayloadToken(plan) {
  if (!plan || !Array.isArray(plan.route) || !plan.route.length) return "";
  const maxTryStops = Math.min(8, plan.route.length);
  for (let stops = maxTryStops; stops >= 2; stops -= 1) {
    const payload = buildJoinableRoutePlanPayload(plan, stops);
    if (!payload) continue;
    const encoded = encodeUtf8Base64Url(JSON.stringify(payload));
    if (encoded.length <= 1350) return encoded;
  }
  return "";
}

function appendRouteJoinPayloadToMessage(message, plan) {
  const text = String(message || "").trim();
  if (!text) return text;
  const token = encodeRouteJoinPayloadToken(plan);
  if (!token) return text;
  return `${text}\n[ROUTE_JOIN_PAYLOAD]${token}[/ROUTE_JOIN_PAYLOAD]`;
}

function parseRouteJoinMessage(content) {
  const raw = String(content || "");
  const matched = raw.match(ROUTE_JOIN_PAYLOAD_RE);
  if (!matched) {
    return { displayText: raw, hasPayload: false, token: "" };
  }
  return {
    displayText: raw.replace(matched[0], "").trim(),
    hasPayload: true,
    token: matched[1] || "",
  };
}

function decodeRouteJoinPayloadToken(token) {
  try {
    const json = decodeUtf8Base64Url(token);
    const payload = JSON.parse(json);
    const route = Array.isArray(payload?.route)
      ? payload.route
          .map((step) => ({
            date: String(step?.date || "").trim(),
            time: String(step?.time || "").trim(),
            point: String(step?.point || "").trim(),
            matchedName: String(step?.matchedName || "").trim(),
            lat: Number.isFinite(Number(step?.lat)) ? Number(step.lat) : null,
            lng: Number.isFinite(Number(step?.lng)) ? Number(step.lng) : null,
            verified: Boolean(step?.verified),
            intro: String(step?.intro || "").trim(),
          }))
          .filter((step) => step.point)
      : [];
    if (route.length < 2) return null;
    const routePath =
      Array.isArray(payload?.routePath) && payload.routePath.length
        ? payload.routePath
            .map((p) => ({
              lat: Number.isFinite(Number(p?.lat)) ? Number(p.lat) : null,
              lng: Number.isFinite(Number(p?.lng)) ? Number(p.lng) : null,
            }))
            .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        : route
            .filter((step) => Number.isFinite(step.lat) && Number.isFinite(step.lng))
            .map((step) => ({ lat: step.lat, lng: step.lng }));
    const verified = route.filter((step) => step.verified).length;
    return {
      id: String(payload?.id || `CHAT-${Date.now()}`),
      title: String(payload?.title || "群聊路线").trim(),
      budgetEstimate: String(payload?.budgetEstimate || "预算待定").trim(),
      reason: String(payload?.reason || "来自聊天的一键加入路线。").trim(),
      route,
      routePath,
      validationSummary: payload?.validationSummary || { total: route.length, verified, replaced: 0, fromChat: true },
      generatedAt: String(payload?.generatedAt || new Date().toISOString()),
    };
  } catch (_err) {
    return null;
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("图片读取失败。"));
    reader.readAsDataURL(file);
  });
}

function createGoogleMapsSearchUrl(place) {
  const query = encodeURIComponent(String(place || ""));
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
  const stopDateTime = formatStopDateTime(step);
  return `
    <div style="font-size:12px;line-height:1.45;">
      <strong>第${index + 1}站 · ${step.point}</strong><br/>
      时间：${stopDateTime}<br/>
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
        const url = createGoogleMapsSearchUrl(step.matchedName || step.point);
        return `<a href="${url}" target="_blank" rel="noreferrer">第${index + 1}站 · ${escapeHtml(formatStopDateTime(step))} · ${escapeHtml(step.point)}</a>`;
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
  validatedStops.forEach((step, index) => {
    const position = { lat: step.lat, lng: step.lng };
    bounds.extend(position);

    const marker = new google.maps.Marker({
      position,
      map: googleMap,
      label: `${index + 1}`,
      title: `${step.point} (${formatStopDateTime(step)})`,
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

  const polylinePath =
    Array.isArray(plan.routePath) && plan.routePath.length >= 2
      ? plan.routePath.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      : validatedStops.map((step) => ({ lat: step.lat, lng: step.lng }));

  googlePath = new google.maps.Polyline({
    path: polylinePath,
    geodesic: true,
    strokeColor: "#0f4c81",
    strokeOpacity: 0.9,
    strokeWeight: 4,
    map: googleMap,
  });

  googleMap.fitBounds(bounds);

  mapLinks.innerHTML = plan.route
    .map((step, index) => {
      const url = createGoogleMapsSearchUrl(step.matchedName || step.point);
      const status = step.verified ? "已验证" : "待确认";
      return `<a href="${url}" target="_blank" rel="noreferrer">第${index + 1}站 · ${escapeHtml(formatStopDateTime(step))} · ${escapeHtml(step.point)}（${status}）</a>`;
    })
    .join("");

  mapSection.classList.remove("hidden");
}

async function renderDefaultGlobalMap() {
  mapSection.classList.remove("hidden");
  try {
    await ensureMapReady();
    hideMapStatus();
    clearGoogleMapLayers();
    googleMap.setCenter({ lat: 1.3521, lng: 103.8198 });
    googleMap.setZoom(11);
    mapLinks.innerHTML = `<a href="${createGoogleMapsSearchUrl("Singapore")}" target="_blank" rel="noreferrer">打开 Google Maps（默认）</a>`;
  } catch (err) {
    showMapStatus(
      `Google Maps 加载失败：${err.message}。请在 Google Cloud 启用 Maps JavaScript API、绑定 Billing，并将 HTTP referrer 加入白名单（如 http://localhost:3000/*）。`,
    );
    mapLinks.innerHTML = `<a href="${createGoogleMapsSearchUrl("Singapore")}" target="_blank" rel="noreferrer">打开 Google Maps</a>`;
  }
}

const ACTIVITY_THEME_PRESETS = {
  量子:
    "radial-gradient(circle at 20% 22%, rgba(183, 250, 255, 0.62) 0%, transparent 45%), linear-gradient(130deg, #56dce3 0%, #5ec2ff 34%, #9275ff 100%)",
  霓虹夜游:
    "radial-gradient(circle at 15% 18%, rgba(255, 212, 165, 0.56) 0%, transparent 42%), linear-gradient(135deg, #2f0e86 0%, #5d22b2 48%, #2a6ab8 100%)",
  城市漫游:
    "radial-gradient(circle at 80% 20%, rgba(214, 245, 255, 0.5) 0%, transparent 40%), linear-gradient(135deg, #2d5f89 0%, #1c85a8 45%, #75c8d8 100%)",
  露营野餐:
    "radial-gradient(circle at 16% 18%, rgba(226, 255, 183, 0.55) 0%, transparent 45%), linear-gradient(135deg, #2f7144 0%, #4f9a5f 45%, #8ad0a7 100%)",
};

function formatDateTimeLocalValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function parseStopDateTime(stop, fallbackDate) {
  const date = String(stop?.date || "").trim();
  const time = String(stop?.time || "").trim() || "19:30";
  if (!date) return fallbackDate;
  const parsed = new Date(`${date}T${time}`);
  if (Number.isNaN(parsed.getTime())) return fallbackDate;
  return parsed;
}

function buildLaunchDefaultsFromPlan(plan) {
  const now = new Date();
  const fallbackStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const fallbackEnd = new Date(fallbackStart.getTime() + 60 * 60 * 1000);
  const firstStop = Array.isArray(plan?.route) && plan.route.length ? plan.route[0] : null;
  const lastStop = Array.isArray(plan?.route) && plan.route.length ? plan.route[plan.route.length - 1] : null;
  const startDate = parseStopDateTime(firstStop, fallbackStart);
  let endDate = parseStopDateTime(lastStop, new Date(startDate.getTime() + 60 * 60 * 1000));
  if (endDate <= startDate) endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const title = String(plan?.title || "").trim() || "活动名称";
  return {
    title,
    startAt: formatDateTimeLocalValue(startDate),
    endAt: formatDateTimeLocalValue(endDate),
    venueName: String(firstStop?.point || firstStop?.matchedName || "").trim(),
    description: String(plan?.reason || "").trim(),
    ticketPrice: "免费",
    attendeeLimit: 50,
    timezone: "GMT+08:00 新加坡",
    calendar: "个人日历",
    privacy: "私密",
    requiresApproval: false,
    theme: "量子",
  };
}

function getSelectedActivityPrivacy() {
  const value = String(quickActivityPrivacySelect?.value || "").trim();
  return value === "公开" ? "公开" : "私密";
}

function buildQuickLaunchConfig() {
  return { privacy: getSelectedActivityPrivacy() };
}

function applyActivityCoverPreview(theme = "") {
  if (!activityCoverPreview) return;
  const selectedTheme = String(theme || activityThemeSelect?.value || "量子").trim() || "量子";
  const labelStrong = activityCoverPreview.querySelector("strong");
  const labelSpan = activityCoverPreview.querySelector("span");
  if (labelStrong) labelStrong.textContent = selectedTheme;
  if (labelSpan) labelSpan.textContent = "Route Launch";
  if (activityCoverDataUrl) return;
  const background = ACTIVITY_THEME_PRESETS[selectedTheme] || ACTIVITY_THEME_PRESETS.量子;
  activityCoverPreview.style.background = background;
}

function renderActivityCoverFromDataUrl(dataUrl = "") {
  if (!activityCoverPreview) return;
  const safeUrl = String(dataUrl || "").trim();
  if (!safeUrl) {
    activityCoverDataUrl = "";
    activityCoverPreview.innerHTML = `<strong>${escapeHtml(activityThemeSelect?.value || "TripWeaver")}</strong><span>Route Launch</span>`;
    applyActivityCoverPreview(activityThemeSelect?.value || "量子");
    return;
  }
  activityCoverDataUrl = safeUrl;
  activityCoverPreview.innerHTML = `<img src="${safeUrl}" alt="活动封面预览" />`;
}

function syncActivityLaunchPills() {
  if (activityCalendarPill && activityCalendarSelect) activityCalendarPill.textContent = activityCalendarSelect.value || "个人日历";
  if (activityPrivacyPill && activityPrivacySelect) activityPrivacyPill.textContent = activityPrivacySelect.value || "私密";
}

function syncActivityLaunchFormFromPlan(plan, overwrite = true) {
  if (!activityLaunchForm || !plan) return;
  const defaults = buildLaunchDefaultsFromPlan(plan);
  Object.entries(defaults).forEach(([key, value]) => {
    const field = activityLaunchForm.elements.namedItem(key);
    if (!field) return;
    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      if (overwrite) field.checked = Boolean(value);
      return;
    }
    if (overwrite || !String(field.value || "").trim()) {
      field.value = value;
    }
  });
  syncActivityLaunchPills();
  applyActivityCoverPreview(defaults.theme);
}

function collectLaunchConfigFromForm(plan) {
  const defaults = buildLaunchDefaultsFromPlan(plan);
  if (!activityLaunchForm) return defaults;
  const data = Object.fromEntries(new FormData(activityLaunchForm).entries());
  const startRaw = String(data.startAt || defaults.startAt || "").trim();
  const endRaw = String(data.endAt || defaults.endAt || "").trim();
  const parsedStart = startRaw ? new Date(startRaw) : null;
  const parsedEnd = endRaw ? new Date(endRaw) : null;
  const startAt = parsedStart && !Number.isNaN(parsedStart.getTime()) ? parsedStart.toISOString() : new Date().toISOString();
  let endAt = parsedEnd && !Number.isNaN(parsedEnd.getTime()) ? parsedEnd.toISOString() : new Date(new Date(startAt).getTime() + 60 * 60 * 1000).toISOString();
  if (new Date(endAt) <= new Date(startAt)) {
    endAt = new Date(new Date(startAt).getTime() + 60 * 60 * 1000).toISOString();
  }
  const limitRaw = Number(data.attendeeLimit);
  return {
    title: String(data.title || defaults.title || "").trim() || defaults.title,
    calendar: String(data.calendar || defaults.calendar || "个人日历").trim(),
    privacy: String(data.privacy || defaults.privacy || "私密").trim(),
    timezone: String(data.timezone || defaults.timezone || "GMT+08:00 新加坡").trim(),
    startAt,
    endAt,
    venueName: String(data.venueName || defaults.venueName || "").trim(),
    description: String(data.description || defaults.description || "").trim(),
    ticketPrice: String(data.ticketPrice || defaults.ticketPrice || "免费").trim() || "免费",
    requiresApproval: Boolean(activityLaunchForm.querySelector("#activity-require-approval")?.checked),
    attendeeLimit: Number.isFinite(limitRaw) ? Math.max(1, Math.min(5000, Math.round(limitRaw))) : 50,
    theme: String(data.theme || defaults.theme || "量子").trim(),
    coverImage: activityCoverDataUrl || "",
  };
}

function createActivity(plan, launchConfig = null) {
  const payload = {
    ...plan,
    launchConfig: launchConfig || collectLaunchConfigFromForm(plan),
  };
  return api.createActivity(payload);
}

function renderActivity(activity) {
  activityOutput.innerHTML = `
    <h3>${activity.title}</h3>
    <p class="meta">活动编号：${activity.code}</p>
    <p class="meta">${escapeHtml(activity.calendar || "个人日历")} · ${escapeHtml(activity.privacy || "私密")} · ${escapeHtml(
      activity.timezone || "GMT+08:00 新加坡",
    )}</p>
    <p>时间：${new Date(activity.startAt).toLocaleString()} - ${new Date(activity.endAt).toLocaleString()}</p>
    <p>地点：${escapeHtml(activity.venueName || "待定集合点")}</p>
    <p>行程：${activity.schedule}</p>
    <p>规则：${escapeHtml(activity.ticketPriceLabel || "免费")} · ${activity.requiresApproval ? "需审核" : "免审核"} · 限 ${Number(activity.attendeeLimit || 50)} 人</p>
    <p>${escapeHtml(activity.description || activity.members || "")}</p>
    <p>分享链接：<a href="${activity.link}" target="_blank" rel="noreferrer">${activity.link}</a></p>
  `;
  markFlowStep("launch", activity.code ? `活动 ${activity.code}` : "活动已发起");
}

async function applyAuthSuccess(result, successMessage) {
  setAuth(result.token, result.user);
  await loadMessages();
  await loadTravelPosts();
  await loadFriendsPanel();
  await loadCampusGroups();
  await loadInterestGroups();
  await loadLocalEvents();
  await loadInspirations();
  await loadAggregatedFeed().catch(() => {});
  await loadCollabTrips();
  await loadPersonalizedRecommendations({ force: true });
  connectChatSocket();
  if (successMessage) alert(successMessage);
}

function getMockOauthUserId(provider) {
  const key = `oauth_mock_user_${provider}`;
  let value = localStorage.getItem(key) || "";
  if (!value) {
    value = `${provider}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    localStorage.setItem(key, value);
  }
  return value;
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(registerForm).entries());
    try {
      const result = await api.register(data);
      registerForm.reset();
      await applyAuthSuccess(result, "注册成功，已自动登录。");
    } catch (err) {
      alert(`注册失败: ${err.message}`);
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm).entries());
    try {
      const result = await api.login(data);
      loginForm.reset();
      await applyAuthSuccess(result, "登录成功。");
    } catch (err) {
      alert(`登录失败: ${err.message}`);
    }
  });
}

if (requestCodeBtn && codeLoginForm) {
  requestCodeBtn.addEventListener("click", async () => {
    const identifierInput = codeLoginForm.querySelector('input[name="identifier"]');
    const identifier = String(identifierInput?.value || "").trim();
    if (!identifier) {
      alert("请先输入邮箱地址。");
      return;
    }
    try {
      requestCodeBtn.disabled = true;
      const result = await api.requestAuthCode({ email: identifier });
      const codeInput = codeLoginForm.querySelector('input[name="code"]');
      if (codeInput && !codeInput.value && result.debugCode) {
        codeInput.value = result.debugCode;
      }
      if (result.debugCode) {
        alert(`验证码已发送到 ${result.identifierHint}（调试码：${result.debugCode}，10分钟内有效）。`);
      } else {
        alert(`验证码已发送到 ${result.identifierHint}，请查收邮箱（10分钟内有效）。`);
      }
    } catch (err) {
      alert(`获取验证码失败: ${err.message}`);
    } finally {
      requestCodeBtn.disabled = false;
    }
  });
}

if (codeLoginForm) {
  codeLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(codeLoginForm).entries());
    try {
      const result = await api.codeLogin({
        email: data.identifier,
        code: data.code,
        displayName: data.displayName || "",
      });
      codeLoginForm.reset();
      await applyAuthSuccess(result, result.created ? "邮箱验证码注册并登录成功。" : "邮箱验证码登录成功。");
    } catch (err) {
      alert(`邮箱验证码登录失败: ${err.message}`);
    }
  });
}

oauthButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const provider = String(button.getAttribute("data-provider") || "").trim().toLowerCase();
    if (!provider) return;
    const oauthUserId = getMockOauthUserId(provider);
    const providerLabel = provider[0].toUpperCase() + provider.slice(1);
    try {
      button.disabled = true;
      const result = await api.oauthLoginMock({
        provider,
        oauthUserId,
        displayName: `${providerLabel} 用户`,
      });
      await applyAuthSuccess(result, `${providerLabel} 登录成功。`);
    } catch (err) {
      alert(`${providerLabel} 登录失败: ${err.message}`);
    } finally {
      button.disabled = false;
    }
  });
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (chatSocket) {
      chatSocket.disconnect();
      chatSocket = null;
    }
    selectedChatTarget = null;
    chatThreadTitle.textContent = "选择一个聊天";
    chatThreadMeta.textContent = "可切换好友私聊 / 群聊";
    chatThreadMessages.innerHTML = `<div class="meta">登录后开始聊天。</div>`;
    setAuth("", null);
    loadPersonalizedRecommendations({ force: true }).catch(() => {});
    loadTravelPosts().catch(() => {});
    loadFriendsPanel().catch(() => {});
    loadCampusGroups().catch(() => {});
    loadInterestGroups().catch(() => {});
    loadLocalEvents().catch(() => {});
    loadInspirations().catch(() => {});
    loadAggregatedFeed().catch(() => {});
    loadCollabTrips().catch(() => {});
  });
}

if (goAuthBtn) {
  goAuthBtn.addEventListener("click", () => {
    openAuthPage();
  });
}

if (chatCreateInterestToggleBtn && chatCreateInterestPanel) {
  chatCreateInterestToggleBtn.addEventListener("click", () => {
    const hidden = chatCreateInterestPanel.classList.contains("hidden");
    chatCreateInterestPanel.classList.toggle("hidden", !hidden);
    if (hidden) {
      chatCreateInterestPanel.setAttribute("open", "open");
    } else {
      chatCreateInterestPanel.removeAttribute("open");
    }
  });
}

async function submitInterestGroupCreate(rawData, { formElement = null, fromChat = false } = {}) {
  const visibility = normalizeInterestVisibility(rawData.visibility, rawData.campusOnly === "true");
  if (visibility === "campus" && !currentUser?.campusVerified) {
    throw new Error("同校可见群需要先完成校园认证。");
  }
  const inviteUsernames = parseInviteUsernames(rawData.inviteUsernames || "");
  const payload = {
    name: rawData.name,
    interest: rawData.interest,
    city: rawData.city,
    country: rawData.country,
    description: rawData.description || "",
    visibility,
    inviteUsernames: visibility === "invite" ? inviteUsernames : [],
  };
  await api.createInterestGroup(payload);
  if (formElement) {
    formElement.reset();
    if (fromChat) {
      if (chatCreateInterestPanel) {
        chatCreateInterestPanel.classList.add("hidden");
        chatCreateInterestPanel.removeAttribute("open");
      }
    } else {
      closeComposeCardForElement(formElement);
    }
  }
  await loadInterestGroups();
  markFlowStep("discover", `${payload.city} ${payload.interest}`);
}

if (chatInterestCreateForm) {
  chatInterestCreateForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("请先登录。");
    const data = Object.fromEntries(new FormData(chatInterestCreateForm).entries());
    try {
      await submitInterestGroupCreate(data, { formElement: chatInterestCreateForm, fromChat: true });
      alert("兴趣群已创建并同步到群聊列表。");
    } catch (err) {
      alert(`创建失败: ${err.message}`);
    }
  });
}

friendRequestForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return alert("请先登录。");
  const data = Object.fromEntries(new FormData(friendRequestForm).entries());
  try {
    await api.sendFriendRequest(data.toUsername);
    friendRequestForm.reset();
    await loadFriendsPanel();
    markFlowStep("match", `好友请求 @${data.toUsername}`);
    alert("好友请求已发送。");
  } catch (err) {
    alert(`发送失败: ${err.message}`);
  }
});

friendsList.addEventListener("click", async (e) => {
  const targetBtn = e.target.closest(".chat-target-btn");
  const actionBtn = e.target.closest(".friend-req-action");

  if (targetBtn) {
    if (!currentUser) return alert("请先登录。");
    const type = targetBtn.getAttribute("data-chat-type");
    const id = targetBtn.getAttribute("data-chat-id");
    const name = targetBtn.getAttribute("data-chat-name");
    if (!type) return;
    await openChatTarget({ type, id, name });
    return;
  }

  if (actionBtn) {
    if (!currentUser) return alert("请先登录。");
    const requestId = actionBtn.getAttribute("data-request-id");
    const accept = actionBtn.getAttribute("data-accept") === "true";
    if (!requestId) return;
    try {
      await api.respondFriendRequest(requestId, accept);
      await loadFriendsPanel();
      if (accept) markFlowStep("match", "已建立好友关系");
    } catch (err) {
      alert(`处理失败: ${err.message}`);
    }
  }
});

chatGroupsList.addEventListener("click", async (e) => {
  const targetBtn = e.target.closest(".chat-target-btn");
  const joinCampusBtn = e.target.closest(".chat-join-campus-btn");
  const joinInterestBtn = e.target.closest(".chat-join-interest-btn");

  if (targetBtn) {
    if (!currentUser) return alert("请先登录。");
    if (targetBtn.disabled) return;
    const type = targetBtn.getAttribute("data-chat-type");
    const id = targetBtn.getAttribute("data-chat-id");
    const name = targetBtn.getAttribute("data-chat-name");
    if (!type) return;
    await openChatTarget({ type, id, name });
    return;
  }

  if (joinCampusBtn) {
    if (!currentUser) return alert("请先登录。");
    const groupId = joinCampusBtn.getAttribute("data-group-id");
    if (!groupId) return;
    try {
      await api.joinCampusGroup(groupId);
      await loadCampusGroups();
      markFlowStep("match", `加入校园群 ${groupId.slice(-6)}`);
      alert("已加入校园群。");
    } catch (err) {
      alert(`加入失败: ${err.message}`);
    }
    return;
  }

  if (joinInterestBtn) {
    if (!currentUser) return alert("请先登录。");
    const groupId = joinInterestBtn.getAttribute("data-group-id");
    if (!groupId) return;
    try {
      await api.joinInterestGroup(groupId);
      await loadInterestGroups();
      markFlowStep("match", `加入兴趣群 ${groupId.slice(-6)}`);
      alert("已加入兴趣群。");
    } catch (err) {
      alert(`加入失败: ${err.message}`);
    }
  }
});

chatThreadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return alert("请先登录。");
  const content = chatThreadInput.value.trim();
  if (!content) return;
  try {
    await sendContentToSelectedChat(content);
    chatThreadInput.value = "";
    if (selectedChatTarget) {
      markFlowStep("match", `已在${selectedChatTarget.name || "会话"}讨论`);
    }
  } catch (err) {
    alert(`发送失败: ${err.message}`);
  }
});

chatThreadMessages.addEventListener("click", async (e) => {
  const joinBtn = e.target.closest(".chat-route-join-btn");
  if (!joinBtn) return;
  const token = String(joinBtn.getAttribute("data-route-token") || "").trim();
  const plan = decodeRouteJoinPayloadToken(token);
  if (!plan) {
    alert("该路线卡片已失效，请让对方重新发送路线。");
    return;
  }
  const originalLabel = joinBtn.textContent;
  joinBtn.disabled = true;
  joinBtn.textContent = "加入中...";
  try {
    await applyGeneratedPlan(plan, `来自${selectedChatTarget?.name || "群聊"}的一键加入`);
    trackPreferenceAction("route_join", buildTrackedPlacesFromPlan(plan, 6), {
      source: "chat_join",
      chatType: selectedChatTarget?.type || "",
    });
    alert("已加入该路线并同步到地图。");
  } catch (err) {
    alert(`加入失败: ${err.message}`);
  } finally {
    joinBtn.disabled = false;
    joinBtn.textContent = originalLabel || "一键加入这条路线";
  }
});

function buildCurrentPlanChatMessage(plan) {
  if (!plan || !Array.isArray(plan.route) || !plan.route.length) return "";
  const routeText = plan.route
    .slice(0, 6)
    .map((step, idx) => `${idx + 1}. ${formatStopDateTime(step)} ${step.point}`)
    .join("\n");
  return appendRouteJoinPayloadToMessage(
    `【候选路线】${plan.title}\n${routeText}\n预算：${plan.budgetEstimate || "待定"}`,
    plan,
  );
}

async function sendCurrentPlanToSelectedChat() {
  if (!currentUser) throw new Error("请先登录。");
  if (!currentPlan || !Array.isArray(currentPlan.route) || !currentPlan.route.length) {
    throw new Error("当前没有可发送的路线，请先生成路线。");
  }
  const content = buildCurrentPlanChatMessage(currentPlan);
  if (!content) throw new Error("当前路线内容为空。");
  await sendContentToSelectedChat(content);
}

const routeDiscussionTemplate = `【路线讨论模板】
日期：
人数：
预算：
必去点：
集合点：
交通：
住宿：
备注：`;

if (chatTopicChips) {
  chatTopicChips.addEventListener("click", (e) => {
    const btn = e.target.closest(".chat-chip-btn");
    if (!btn) return;
    const snippet = btn.getAttribute("data-snippet");
    appendSnippetToThreadInput(snippet || "");
  });
}

if (chatInsertTemplateBtn) {
  chatInsertTemplateBtn.addEventListener("click", () => {
    appendSnippetToThreadInput(routeDiscussionTemplate);
  });
}

if (chatSendCurrentPlanBtn) {
  chatSendCurrentPlanBtn.addEventListener("click", async () => {
    try {
      await sendCurrentPlanToSelectedChat();
      alert("已发送当前路线到会话。");
    } catch (err) {
      alert(`发送失败: ${err.message}`);
    }
  });
}

if (chatSummarizeThreadBtn) {
  chatSummarizeThreadBtn.addEventListener("click", async () => {
    if (!currentUser) return alert("请先登录。");
    if (!selectedChatTarget) return alert("请先在左侧选择一个聊天。");
    const payload = buildSummarizePayloadForTarget(selectedChatTarget);
    if (!payload) return alert("当前会话暂不支持总结。");
    try {
      const result = await api.summarizePlan(payload);
      await applyGeneratedPlan(result.plan, `来自${selectedChatTarget.name || "会话"}总结`);
      alert("已根据当前会话总结生成路线。");
    } catch (err) {
      alert(`总结失败: ${err.message}`);
    }
  });
}

campusVerifyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return alert("请先登录。");
  const data = Object.fromEntries(new FormData(campusVerifyForm).entries());
  try {
    await api.verifyCampus(data);
    campusVerifyForm.reset();
    closeComposeCardForElement(campusVerifyForm);
    await restoreSession();
    await loadCampusGroups();
    alert("校园认证成功。");
  } catch (err) {
    alert(`认证失败: ${err.message}`);
  }
});

campusGroupCreateForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return alert("请先登录。");
  const data = Object.fromEntries(new FormData(campusGroupCreateForm).entries());
  try {
    await api.createCampusGroup({
      name: data.name,
      description: data.description,
      geo: data.geoLabel ? { label: data.geoLabel } : null,
    });
    campusGroupCreateForm.reset();
    closeComposeCardForElement(campusGroupCreateForm);
    await loadCampusGroups();
    markFlowStep("match", `创建校园群 ${data.name}`);
    alert("校园群已创建。");
  } catch (err) {
    alert(`创建失败: ${err.message}`);
  }
});

campusGroupsList.addEventListener("click", async (e) => {
  const joinBtn = e.target.closest(".campus-join-btn");
  if (!joinBtn) return;
  if (!currentUser) return alert("请先登录。");
  const groupId = joinBtn.getAttribute("data-group-id");
  if (!groupId) return;
  try {
    await api.joinCampusGroup(groupId);
    await loadCampusGroups();
    markFlowStep("match", `加入校园群 ${groupId.slice(-6)}`);
    alert("已加入校园群。");
  } catch (err) {
    alert(`加入失败: ${err.message}`);
  }
});

campusGroupMessageForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return alert("请先登录。");
  const data = Object.fromEntries(new FormData(campusGroupMessageForm).entries());
  try {
    await api.sendCampusGroupMessage(data.groupId, {
      content: data.content,
      geo: data.geoLabel ? { label: data.geoLabel } : null,
    });
    if (selectedChatTarget?.type === "campus" && selectedChatTarget.id === data.groupId) {
      await openChatTarget(selectedChatTarget);
    }
    campusGroupMessageForm.reset();
    closeComposeCardForElement(campusGroupMessageForm);
    markFlowStep("match", `校园群 ${data.groupId} 讨论`);
  } catch (err) {
    alert(`发送失败: ${err.message}`);
  }
});

summarizeGlobalBtn.addEventListener("click", async () => {
  if (!currentUser) return alert("请先登录。");
  try {
    const result = await api.summarizePlan({ scope: "global", limit: 80 });
    await applyGeneratedPlan(result.plan, "来自 Global 群聊总结");
    alert("已根据群聊总结需求并生成路线。");
  } catch (err) {
    alert(`总结失败: ${err.message}`);
  }
});

summarizeCampusBtn.addEventListener("click", async () => {
  if (!currentUser) return alert("请先登录。");
  const groupId = prompt("输入校园群 ID");
  if (!groupId) return;
  try {
    const result = await api.summarizePlan({ scope: "campus_group", groupId, limit: 80 });
    await applyGeneratedPlan(result.plan, `来自校园群 ${groupId} 总结`);
    alert("已根据校园群聊总结需求并生成路线。");
  } catch (err) {
    alert(`总结失败: ${err.message}`);
  }
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
    markFlowStep("match", "Global 群聊讨论");
  } catch (err) {
    alert(`发送失败: ${err.message}`);
  }
});

travelForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) {
    alert("请先登录后发布行程。");
    return;
  }
  const data = Object.fromEntries(new FormData(travelForm).entries());
  const payload = {
    ...data,
    tags: String(data.tags || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
  try {
    await api.createTravelPost(payload);
    travelForm.reset();
    closeComposeCardForElement(travelForm);
    await loadTravelPosts();
    markFlowStep("discover", `跨国行程 ${payload.toCity || payload.toCountry || ""}`);
    alert("行程已发布。");
  } catch (err) {
    alert(`发布失败: ${err.message}`);
  }
});

travelRefreshBtn.addEventListener("click", async () => {
  try {
    await loadTravelPosts();
  } catch (err) {
    alert(`刷新失败: ${err.message}`);
  }
});

if (docRouteForm) {
  docRouteForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(docRouteForm).entries());
    const payload = {
      city: String(data.city || "").trim(),
      country: String(data.country || "").trim(),
      interest: String(data.interest || "").trim(),
      fromCountry: String(data.fromCountry || "").trim(),
      startDate: String(data.startDate || "").trim(),
      endDate: String(data.endDate || "").trim(),
      documentText: String(data.documentText || "").trim(),
    };
    try {
      markFlowStep("discover", `${payload.city} 文档抽点`);
      const result = await api.generateDocRoute(payload);
      renderDocRouteMeta(result.plan);
      await applyGeneratedPlan(result.plan, `文档路线：${payload.city}`);
      closeComposeCardForElement(docRouteForm);
      alert("已根据文档逐点生成路线。");
    } catch (err) {
      alert(`文档路线生成失败: ${err.message}`);
    }
  });
}

if (imageRouteForm) {
  imageRouteForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = imageRouteFileInput?.files?.[0];
    if (!file) {
      alert("请先选择图片。");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("仅支持图片文件。");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("图片过大，请控制在 5MB 以内。");
      return;
    }

    const data = Object.fromEntries(new FormData(imageRouteForm).entries());
    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      const payload = {
        city: String(data.city || "").trim(),
        country: String(data.country || "").trim(),
        interest: String(data.interest || "").trim(),
        fromCountry: String(data.fromCountry || "").trim(),
        startDate: String(data.startDate || "").trim(),
        endDate: String(data.endDate || "").trim(),
        imageDataUrl,
      };
      markFlowStep("discover", `${payload.city} 图片抽点`);
      const result = await api.generateImageRoute(payload);
      renderDocRouteMeta(result.plan);
      await applyGeneratedPlan(result.plan, `图片路线：${payload.city}`);
      imageRouteForm.reset();
      closeComposeCardForElement(imageRouteForm);
      alert("已根据图片生成路线。");
    } catch (err) {
      alert(`图片路线生成失败: ${err.message}`);
    }
  });
}

travelList.addEventListener("click", async (e) => {
  const joinBtn = e.target.closest(".travel-join-btn");
  const routeBtn = e.target.closest(".travel-route-btn");
  const discussBtn = e.target.closest(".travel-discuss-btn");
  if (!joinBtn && !routeBtn && !discussBtn) return;
  if (!currentUser) {
    alert("请先登录后加入。");
    return;
  }
  const postId = (joinBtn || routeBtn || discussBtn).getAttribute("data-post-id");
  if (!postId) return;

  if (joinBtn) {
    try {
      await api.joinTravelPost(postId);
      await loadTravelPosts();
      markFlowStep("join", `加入行程 ${postId.slice(-6)}`);
      alert("已加入该行程。");
    } catch (err) {
      alert(`加入失败: ${err.message}`);
    }
    return;
  }

  if (routeBtn) {
    try {
      const result = await api.generateTravelRoute(postId);
      markFlowStep("discover", `旅行贴 ${postId.slice(-6)}`);
      await applyGeneratedPlan(result.plan, "跨国旅行路线");
      alert("已生成跨国旅行路线（第1天预览）。");
    } catch (err) {
      alert(`生成失败: ${err.message}`);
    }
    return;
  }

  if (discussBtn) {
    const city = discussBtn.getAttribute("data-post-city") || "";
    const country = discussBtn.getAttribute("data-post-country") || "";
    await startBuddyDiscussion(`${city}${country ? `, ${country}` : ""} 跨国行程，找搭子一起规划。`);
  }
});

communityForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return alert("请先登录。");
  const data = Object.fromEntries(new FormData(communityForm).entries());
  try {
    await submitInterestGroupCreate(data, { formElement: communityForm, fromChat: false });
    alert("兴趣社群已创建。");
  } catch (err) {
    alert(`创建失败: ${err.message}`);
  }
});

communityRefreshBtn.addEventListener("click", async () => {
  try {
    await loadInterestGroups();
  } catch (err) {
    alert(`加载失败: ${err.message}`);
  }
});

communityList.addEventListener("click", async (e) => {
  const joinBtn = e.target.closest(".interest-join-btn");
  const chatBtn = e.target.closest(".interest-chat-btn");
  if (!joinBtn && !chatBtn) return;
  if (!currentUser) return alert("请先登录。");
  const sourceBtn = joinBtn || chatBtn;
  const groupId = sourceBtn.getAttribute("data-group-id");
  if (!groupId) return;
  try {
    const joined = await api.joinInterestGroup(groupId);
    await loadInterestGroups();
    if (joinBtn) {
      markFlowStep("match", `加入社群 ${joined.name || groupId}`);
      alert("已加入兴趣社群。");
      return;
    }
    if (chatBtn) {
      const groupName = chatBtn.getAttribute("data-group-name") || joined.name || groupId;
      navigateToScreen("social", "social-section");
      await openChatTarget({ type: "interest", id: groupId, name: `兴趣群 · ${groupName}` });
      appendSnippetToThreadInput("日期：\n预算：\n必去点：\n集合点：");
      markFlowStep("match", `兴趣群 ${groupName}`);
    }
  } catch (err) {
    alert(`加入失败: ${err.message}`);
  }
});

eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return alert("请先登录。");
  const data = Object.fromEntries(new FormData(eventForm).entries());
  try {
    await api.createLocalEvent({
      title: data.title,
      category: data.category,
      city: data.city,
      country: data.country,
      venueName: data.venueName,
      startAt: data.startAt,
      endAt: data.endAt,
      price: data.price,
      currency: data.currency,
      ticketUrl: data.ticketUrl,
      tags: String(data.tags || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    eventForm.reset();
    closeComposeCardForElement(eventForm);
    await loadLocalEvents();
    markFlowStep("discover", `${data.city} 活动发布`);
    alert("活动发布成功。");
  } catch (err) {
    alert(`发布失败: ${err.message}`);
  }
});

eventRefreshBtn.addEventListener("click", async () => {
  try {
    await loadLocalEvents();
  } catch (err) {
    alert(`加载失败: ${err.message}`);
  }
});

eventList.addEventListener("click", async (e) => {
  const rsvpBtn = e.target.closest(".event-rsvp-btn");
  const planBtn = e.target.closest(".event-plan-btn");
  const buddyBtn = e.target.closest(".event-buddy-btn");

  if (planBtn) {
    const seed = {
      title: planBtn.getAttribute("data-event-title") || "",
      city: planBtn.getAttribute("data-event-city") || "",
      country: planBtn.getAttribute("data-event-country") || "",
      category: planBtn.getAttribute("data-event-category") || "",
      description: planBtn.getAttribute("data-event-desc") || "",
    };
    const intent = buildIntentFromSeed(seed);
    applyIntentToForm(intent);
    markFlowStep("discover", `${seed.city || "活动"} · ${seed.title}`);
    try {
      const plan = await api.generatePlan(intent);
      await applyGeneratedPlan(plan, `来自活动：${seed.title}`);
    } catch (err) {
      alert(`生成失败: ${err.message}`);
    }
    return;
  }

  if (buddyBtn) {
    const title = buddyBtn.getAttribute("data-event-title") || "活动";
    markFlowStep("discover", title);
    await startBuddyDiscussion(`${title}，有人一起吗？`);
    return;
  }

  if (!rsvpBtn) return;
  if (!currentUser) return alert("请先登录。");
  const eventId = rsvpBtn.getAttribute("data-event-id");
  const status = rsvpBtn.getAttribute("data-status");
  if (!eventId || !status) return;
  try {
    await api.rsvpLocalEvent(eventId, status);
    await loadLocalEvents();
    markFlowStep("join", `${status === "going" ? "我要去" : "感兴趣"} · ${eventId.slice(-6)}`);
  } catch (err) {
    alert(`报名失败: ${err.message}`);
  }
});

inspirationForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return alert("请先登录。");
  const data = Object.fromEntries(new FormData(inspirationForm).entries());
  try {
    await api.createInspiration({
      title: data.title,
      city: data.city,
      country: data.country,
      tags: String(data.tags || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      places: String(data.places || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      content: data.content,
    });
    inspirationForm.reset();
    closeComposeCardForElement(inspirationForm);
    await loadInspirations();
    alert("灵感内容已发布。");
  } catch (err) {
    alert(`发布失败: ${err.message}`);
  }
});

inspirationRefreshBtn.addEventListener("click", async () => {
  try {
    await loadInspirations();
  } catch (err) {
    alert(`加载失败: ${err.message}`);
  }
});

inspirationList.addEventListener("click", async (e) => {
  const likeBtn = e.target.closest(".inspiration-like-btn");
  const planBtn = e.target.closest(".inspiration-plan-btn");
  const buddyBtn = e.target.closest(".inspiration-buddy-btn");
  if (!likeBtn && !planBtn && !buddyBtn) return;

  if (likeBtn) {
    if (!currentUser) return alert("请先登录。");
    const id = likeBtn.getAttribute("data-ins-id");
    if (!id) return;
    try {
      await api.likeInspiration(id);
      await loadInspirations();
    } catch (err) {
      alert(`操作失败: ${err.message}`);
    }
    return;
  }

  if (planBtn) {
    const city = planBtn.getAttribute("data-ins-city") || "";
    const tags = (planBtn.getAttribute("data-ins-tags") || "").split(",");
    const intent = {
      companion: "朋友",
      people: "2",
      budget: "中预算",
      timeSlot: "周末全天",
      interest: pickInterestFromTags(tags),
      area: areaFromCity(city),
    };
    try {
      markFlowStep("discover", `灵感同款 ${city || ""}`);
      const plan = await api.generatePlan(intent);
      await applyGeneratedPlan(plan, "来自灵感同款");
    } catch (err) {
      alert(`生成失败: ${err.message}`);
    }
    return;
  }

  if (buddyBtn) {
    const title = buddyBtn.getAttribute("data-ins-title") || "灵感路线";
    markFlowStep("discover", title);
    await startBuddyDiscussion(`想按「${title}」走一条路线，来找搭子。`);
  }
});

discoverForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(discoverForm).entries());
  try {
    const places = await api.discoverPlaces({
      q: data.q,
      city: data.city,
      country: data.country,
      category: data.category,
      limit: data.limit,
    });
    lastDiscoverContext = {
      city: String(data.city || "").trim(),
      country: String(data.country || "").trim(),
      category: String(data.category || "").trim(),
      q: String(data.q || "").trim(),
    };
    markFlowStep("discover", `${lastDiscoverContext.city || "附近"} · ${lastDiscoverContext.q || "地点发现"}`);
    renderDiscoverPlaces(places);
    closeComposeCardForElement(discoverForm);
  } catch (err) {
    alert(`搜索失败: ${err.message}`);
  }
});

discoverList.addEventListener("click", async (e) => {
  const planBtn = e.target.closest(".discover-plan-btn");
  const buddyBtn = e.target.closest(".discover-buddy-btn");
  const tonightBtn = e.target.closest(".discover-tonight-btn");
  if (!planBtn && !buddyBtn && !tonightBtn) return;

  if (planBtn) {
    const seed = {
      title: planBtn.getAttribute("data-place-name") || "",
      city: planBtn.getAttribute("data-place-city") || lastDiscoverContext.city,
      country: planBtn.getAttribute("data-place-country") || lastDiscoverContext.country,
      category: lastDiscoverContext.category,
      description: planBtn.getAttribute("data-place-intro") || "",
    };
    trackPreferenceAction(
      "discover_select",
      [
        {
          name: seed.title,
          city: seed.city,
          country: seed.country,
          category: seed.category,
          interest: seed.category,
          weight: 1.4,
        },
      ],
      { source: "discover_plan" },
    );
    const intent = buildIntentFromSeed(seed);
    applyIntentToForm(intent);
    markFlowStep("discover", `${seed.city || "附近"} · ${seed.title}`);
    try {
      const plan = await api.generatePlan(intent);
      await applyGeneratedPlan(plan, `来自附近发现：${seed.title}`);
    } catch (err) {
      alert(`生成失败: ${err.message}`);
    }
    return;
  }

  if (buddyBtn) {
    const placeName = buddyBtn.getAttribute("data-place-name") || "附近地点";
    trackPreferenceAction(
      "discover_buddy",
      [
        {
          name: placeName,
          city: lastDiscoverContext.city,
          country: lastDiscoverContext.country,
          category: lastDiscoverContext.category,
          interest: lastDiscoverContext.category,
          weight: 1,
        },
      ],
      { source: "discover_buddy" },
    );
    markFlowStep("discover", placeName);
    await startBuddyDiscussion(`想去 ${placeName}，找搭子一起。`);
    return;
  }

  if (tonightBtn) {
    const seed = {
      title: tonightBtn.getAttribute("data-place-name") || "",
      city: tonightBtn.getAttribute("data-place-city") || lastDiscoverContext.city,
      country: tonightBtn.getAttribute("data-place-country") || lastDiscoverContext.country,
      category: tonightBtn.getAttribute("data-place-category") || lastDiscoverContext.category,
      description: tonightBtn.getAttribute("data-place-intro") || "",
    };
    trackPreferenceAction(
      "discover_tonight",
      [
        {
          name: seed.title,
          city: seed.city,
          country: seed.country,
          category: seed.category,
          interest: seed.category,
          weight: 1.8,
        },
      ],
      { source: "discover_tonight" },
    );
    const scene = `${seed.city || "附近"} · ${seed.title || "今晚路线"}`;
    await launchTonightGroup({ seed, scene });
  }
});

if (officialRefreshBtn) {
  officialRefreshBtn.addEventListener("click", async () => {
    try {
      await loadAggregatedFeed();
    } catch (err) {
      alert(`刷新失败: ${err.message}`);
    }
  });
}

if (officialFilterQ) {
  officialFilterQ.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    try {
      await loadAggregatedFeed();
    } catch (err) {
      alert(`筛选失败: ${err.message}`);
    }
  });
}

if (officialFeedList) {
  officialFeedList.addEventListener("click", async (e) => {
    const planBtn = e.target.closest(".feed-plan-btn");
    const buddyBtn = e.target.closest(".feed-buddy-btn");
    if (!planBtn && !buddyBtn) return;

    if (planBtn) {
      const seed = {
        title: planBtn.getAttribute("data-feed-title") || "",
        city: planBtn.getAttribute("data-feed-city") || "",
        country: planBtn.getAttribute("data-feed-country") || "",
        category: planBtn.getAttribute("data-feed-category") || "",
        tags: planBtn.getAttribute("data-feed-tags") || "",
        description: planBtn.getAttribute("data-feed-desc") || "",
      };
      const intent = buildIntentFromSeed(seed);
      applyIntentToForm(intent);
      markFlowStep("discover", `${seed.city || "聚合内容"} · ${seed.title}`);
      try {
        const plan = await api.generatePlan(intent);
        await applyGeneratedPlan(plan, `来自聚合信息：${seed.title}`);
      } catch (err) {
        alert(`生成失败: ${err.message}`);
      }
      return;
    }

    if (buddyBtn) {
      const title = buddyBtn.getAttribute("data-feed-title") || "聚合活动";
      markFlowStep("discover", title);
      await startBuddyDiscussion(`看到一个活动：${title}，有兴趣一起去吗？`);
    }
  });
}

if (exploreTabs) {
  exploreTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".explore-tab-btn[data-explore-target]");
    if (!btn) return;
    const panel = btn.getAttribute("data-explore-target");
    if (!panel || !EXPLORE_PANELS.has(panel)) return;
    setExplorePanel(panel, true, true);
    if (window.location.hash.replace("#", "") === "explore") {
      const sectionId = EXPLORE_SECTION_MAP[panel];
      const section = sectionId ? document.getElementById(sectionId) : null;
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

if (exploreBackFlowBtn) {
  exploreBackFlowBtn.addEventListener("click", () => {
    navigateToScreen("plan", "workflow-section");
  });
}

window.addEventListener("hashchange", () => {
  syncExploreFloatingButton();
  syncTopbarScreen();
  requestTopbarTitleModeSync();
  setTimeout(requestTopbarTitleModeSync, 70);
  updateFlowCoach();
  const screen = window.location.hash.replace("#", "") || "plan";
  if (screen === "explore") {
    maybeApplyRecommendedExplorePanel(false);
    if (currentExplorePanel === "nearby") {
      loadPersonalizedRecommendations({ force: false }).catch(() => {});
    }
  }
});

window.addEventListener("scroll", requestTopbarTitleModeSync, { passive: true });
window.addEventListener("resize", requestTopbarTitleModeSync);

if (flowGoDiscoverBtn) flowGoDiscoverBtn.addEventListener("click", () => jumpToFlowStep("discover"));
if (flowGoMatchBtn) flowGoMatchBtn.addEventListener("click", () => jumpToFlowStep("match"));
if (flowGoPlanBtn) flowGoPlanBtn.addEventListener("click", () => jumpToFlowStep("plan"));
if (flowGoLaunchBtn) flowGoLaunchBtn.addEventListener("click", () => jumpToFlowStep("launch"));
if (flowGoJoinBtn) flowGoJoinBtn.addEventListener("click", () => jumpToFlowStep("join"));
if (flowNextBtn) {
  flowNextBtn.addEventListener("click", () => {
    const nextStep = flowNextBtn.getAttribute("data-next-step");
    if (nextStep) jumpToFlowStep(nextStep);
  });
}
if (flowResetBtn) {
  flowResetBtn.addEventListener("click", () => {
    resetFlowState();
  });
}

if (flowCoachPrimary) {
  flowCoachPrimary.addEventListener("click", async () => {
    await runFlowCoachAction("primary");
  });
}

if (flowCoachSecondary) {
  flowCoachSecondary.addEventListener("click", async () => {
    await runFlowCoachAction("secondary");
  });
}

if (intentPresets) {
  intentPresets.addEventListener("click", (e) => {
    const btn = e.target.closest(".intent-preset-btn[data-preset]");
    if (!btn) return;
    const preset = btn.getAttribute("data-preset");
    if (!preset || !INTENT_PRESETS[preset]) return;
    applyIntentPreset(preset);
  });
}

if (manualPlaceInput) {
  manualPlaceInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await addManualPlaceFromTextInput();
      return;
    }
    if (manualSuggestTimer) clearTimeout(manualSuggestTimer);
    manualSuggestTimer = setTimeout(() => {
      loadManualPlaceSuggestions(manualPlaceInput.value).catch(() => {});
    }, 180);
  });
  manualPlaceInput.addEventListener("input", () => {
    if (manualSuggestTimer) clearTimeout(manualSuggestTimer);
    manualSuggestTimer = setTimeout(() => {
      loadManualPlaceSuggestions(manualPlaceInput.value).catch(() => {});
    }, 180);
  });
}

if (manualPlaceAddBtn) {
  manualPlaceAddBtn.addEventListener("click", async () => {
    await addManualPlaceFromTextInput();
  });
}

if (manualMapPinBtn) {
  manualMapPinBtn.addEventListener("click", async () => {
    await toggleManualMapPinMode();
  });
}

if (manualPlaceList) {
  manualPlaceList.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-manual-remove]");
    if (!btn) return;
    const idx = Number(btn.getAttribute("data-manual-remove"));
    if (!Number.isInteger(idx) || idx < 0 || idx >= manualPlacesForIntent.length) return;
    manualPlacesForIntent.splice(idx, 1);
    renderManualPlaces();
    await loadManualPlaceSuggestions(manualPlaceInput?.value || "");
  });
}

if (manualPlaceSuggestions) {
  manualPlaceSuggestions.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-manual-suggest]");
    if (!btn) return;
    const idx = Number(btn.getAttribute("data-manual-suggest"));
    const suggestions = parseManualSuggestionsFromDataset();
    const pick = suggestions[idx];
    if (!pick) return;
    const added = upsertManualPlace(pick);
    renderManualPlaces();
    if (added) {
      await saveManualPlacesForAccount([pick]);
    }
    await loadManualPlaceSuggestions("");
  });
}

if (intentStartDatetimeInput && !intentStartDatetimeInput.value) {
  const now = new Date();
  now.setHours(now.getHours() + 2);
  intentStartDatetimeInput.value = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

if (intentGenerateFastBtn) {
  intentGenerateFastBtn.addEventListener("click", async () => {
    try {
      if (activeIntentPreset && INTENT_PRESETS[activeIntentPreset]) {
        applyIntentToForm(INTENT_PRESETS[activeIntentPreset].intent);
      }
      await generatePlanFromIntentForm("预设一键生成", "intent_preset_generate");
    } catch (err) {
      alert(`预设生成失败: ${err.message}`);
    }
  });
}

collabTripForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return alert("请先登录。");
  const data = Object.fromEntries(new FormData(collabTripForm).entries());
  try {
    await api.createCollabTrip({
      title: data.title,
      destinationCity: data.destinationCity,
      destinationCountry: data.destinationCountry,
      startDate: data.startDate,
      endDate: data.endDate,
      currency: data.currency,
      memberIds: String(data.memberIds || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    collabTripForm.reset();
    closeComposeCardForElement(collabTripForm);
    await loadCollabTrips();
    markFlowStep("discover", `协同行程 ${data.destinationCity || ""}`);
    alert("协同行程已创建。");
  } catch (err) {
    alert(`创建失败: ${err.message}`);
  }
});

collabItemForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return alert("请先登录。");
  const data = Object.fromEntries(new FormData(collabItemForm).entries());
  try {
    await api.addCollabItem(data.tripId, {
      day: data.day,
      time: data.time,
      title: data.title,
      placeName: data.placeName,
      bookingUrl: data.bookingUrl,
      bookingType: data.bookingType,
    });
    collabItemForm.reset();
    closeComposeCardForElement(collabItemForm);
    await loadCollabTrips();
    alert("已添加行程项。");
  } catch (err) {
    alert(`添加失败: ${err.message}`);
  }
});

collabExpenseForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return alert("请先登录。");
  const data = Object.fromEntries(new FormData(collabExpenseForm).entries());
  try {
    await api.addCollabExpense(data.tripId, {
      title: data.title,
      amount: data.amount,
      category: data.category,
      splitWith: String(data.splitWith || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    collabExpenseForm.reset();
    closeComposeCardForElement(collabExpenseForm);
    await loadCollabTrips();
    alert("费用已记录。");
  } catch (err) {
    alert(`记录失败: ${err.message}`);
  }
});

collabImportForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return alert("请先登录。");
  const data = Object.fromEntries(new FormData(collabImportForm).entries());
  try {
    await api.importReservation(data.tripId, data.text);
    collabImportForm.reset();
    closeComposeCardForElement(collabImportForm);
    await loadCollabTrips();
    alert("预订信息已导入。");
  } catch (err) {
    alert(`导入失败: ${err.message}`);
  }
});

collabRefreshBtn.addEventListener("click", async () => {
  try {
    await loadCollabTrips();
  } catch (err) {
    alert(`刷新失败: ${err.message}`);
  }
});

collabList.addEventListener("click", async (e) => {
  const joinBtn = e.target.closest(".collab-join-btn");
  const summaryBtn = e.target.closest(".collab-summary-btn");
  if (!joinBtn && !summaryBtn) return;
  if (!currentUser) return alert("请先登录。");

  if (joinBtn) {
    const tripId = joinBtn.getAttribute("data-trip-id");
    if (!tripId) return;
    try {
      await api.joinCollabTrip(tripId);
      await loadCollabTrips();
      markFlowStep("join", `加入协同 ${tripId.slice(-6)}`);
      alert("已加入协同行程。");
    } catch (err) {
      alert(`加入失败: ${err.message}`);
    }
    return;
  }

  if (summaryBtn) {
    const tripId = summaryBtn.getAttribute("data-trip-id");
    if (!tripId) return;
    try {
      const summary = await api.getCollabSummary(tripId);
      renderCollabSummary(summary);
    } catch (err) {
      alert(`查询失败: ${err.message}`);
    }
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await generatePlanFromIntentForm("手动输入需求", "input_submit");
  } catch (err) {
    alert(`生成失败: ${err.message}`);
  }
});

if (openActivityCreateBtn) {
  openActivityCreateBtn.addEventListener("click", async () => {
    if (!currentPlan) {
      navigateToScreen("plan", "intent-section");
      return;
    }
    try {
      await createAndRenderActivityFromPlan(currentPlan, true);
    } catch (err) {
      alert(`发起失败: ${err.message}`);
    }
  });
}

if (backPlanBtn) {
  backPlanBtn.addEventListener("click", () => {
    navigateToScreen("plan", "plan-section");
  });
}

if (activityLaunchForm) {
  activityLaunchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentPlan) return;
    try {
      const launchConfig = collectLaunchConfigFromForm(currentPlan);
      await createAndRenderActivityFromPlan(currentPlan, true, launchConfig);
      syncActivityLaunchPills();
    } catch (err) {
      alert(`发起失败: ${err.message}`);
    }
  });
} else if (createActivityBtn) {
  createActivityBtn.addEventListener("click", async () => {
    if (!currentPlan) return;
    try {
      await createAndRenderActivityFromPlan(currentPlan, true);
    } catch (err) {
      alert(`发起失败: ${err.message}`);
    }
  });
}

if (activityThemeSelect) {
  activityThemeSelect.addEventListener("change", () => {
    applyActivityCoverPreview(activityThemeSelect.value);
  });
}

if (activityThemeShuffleBtn && activityThemeSelect) {
  activityThemeShuffleBtn.addEventListener("click", () => {
    const options = Array.from(activityThemeSelect.options).map((option) => option.value);
    if (!options.length) return;
    const pool = options.filter((name) => name !== activityThemeSelect.value);
    const next = pool.length ? pool[Math.floor(Math.random() * pool.length)] : options[0];
    activityThemeSelect.value = next;
    applyActivityCoverPreview(next);
  });
}

if (activityCoverInput) {
  activityCoverInput.addEventListener("change", () => {
    const file = activityCoverInput.files?.[0];
    if (!file) {
      renderActivityCoverFromDataUrl("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      renderActivityCoverFromDataUrl(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  });
}

if (activityCalendarSelect || activityPrivacySelect) {
  activityCalendarSelect?.addEventListener("change", syncActivityLaunchPills);
  activityPrivacySelect?.addEventListener("change", syncActivityLaunchPills);
}

if (tonightGroupBtn) {
  tonightGroupBtn.addEventListener("click", async () => {
    await launchTonightGroup({ scene: currentPlan?.title || "今晚路线" });
  });
}

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
    markFlowStep("join", "已分享活动链接");
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
  markFlowStep("join", "已复制并可报名");
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
    await loadPersonalizedRecommendations({ force: true });
    return;
  }
  try {
    const result = await api.me();
    currentUser = result.user;
    renderAuthState();
    await loadMessages();
    await loadTravelPosts();
    await loadFriendsPanel();
    await loadCampusGroups();
    await loadInterestGroups();
    await loadLocalEvents();
    await loadInspirations();
    await loadAggregatedFeed().catch(() => {});
    await loadCollabTrips();
    await loadPersonalizedRecommendations({ force: true });
    await loadManualPlaceSuggestions(manualPlaceInput?.value || "");
    connectChatSocket();
  } catch (_err) {
    setAuth("", null);
    await loadPersonalizedRecommendations({ force: true });
  }
}

async function boot() {
  try {
    mapConfig = await api.getMapsConfig();
  } catch (_err) {
    mapConfig = { enabled: false, apiKey: "" };
  }
  await restoreSession();
  await loadTravelPosts();
  await loadFriendsPanel();
  await loadCampusGroups();
  await loadInterestGroups();
  await loadLocalEvents();
  await loadInspirations();
  await loadAggregatedFeed().catch(() => {});
  await loadCollabTrips();
  await refreshEvents();
  await renderDefaultGlobalMap();
  renderManualPlaces();
  renderFlowState();
}

const savedExplorePanel = localStorage.getItem("explore_panel") || "official";
setExplorePanel(EXPLORE_PANELS.has(savedExplorePanel) ? savedExplorePanel : "official", false);
maybeApplyRecommendedExplorePanel(true);
renderFlowState();
syncExploreFloatingButton();
syncTopbarScreen();
syncTopbarTitleMode();
syncActivityLaunchPills();
applyActivityCoverPreview(activityThemeSelect?.value || "量子");
applyIntentPreset(activeIntentPreset, true);
updateFlowCoach();
boot();
