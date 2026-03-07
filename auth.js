const authTokenKey = "auth_token";
const registerForm = document.getElementById("auth-register-form");
const loginForm = document.getElementById("auth-login-form");
const codeForm = document.getElementById("auth-code-form");
const requestCodeBtn = document.getElementById("auth-request-code-btn");
const oauthButtons = Array.from(document.querySelectorAll(".oauth-btn"));
const tabButtons = Array.from(document.querySelectorAll(".auth-tab-btn"));
const tabPanels = Array.from(document.querySelectorAll("[data-auth-panel]"));
const messageEl = document.getElementById("auth-message");
const nextHint = document.getElementById("auth-next-hint");
const backAppBtn = document.getElementById("auth-back-app-btn");
const clearTokenBtn = document.getElementById("auth-clear-token-btn");
const sessionBox = document.getElementById("auth-session-box");

let authToken = localStorage.getItem(authTokenKey) || "";

function normalizeNextPath(raw) {
  const value = String(raw || "").trim();
  if (!value) return "/";
  if (value.startsWith("http://") || value.startsWith("https://")) return "/";
  if (value.startsWith("//")) return "/";
  return value.startsWith("/") ? value : `/${value}`;
}

const nextPath = normalizeNextPath(new URLSearchParams(location.search).get("next"));

if (nextHint) {
  nextHint.textContent = `登录后返回 ${nextPath}`;
}

function showMessage(text, tone = "") {
  if (!messageEl) return;
  const content = String(text || "").trim();
  messageEl.textContent = content;
  messageEl.classList.remove("error", "success");
  if (tone) messageEl.classList.add(tone);
}

function setActiveTab(tab) {
  const target = String(tab || "login").trim();
  tabButtons.forEach((btn) => {
    const active = btn.getAttribute("data-auth-tab") === target;
    btn.classList.toggle("active", active);
  });
  tabPanels.forEach((panel) => {
    const active = panel.getAttribute("data-auth-panel") === target;
    panel.classList.toggle("hidden", !active);
  });
}

function setAuth(token) {
  authToken = String(token || "").trim();
  if (authToken) {
    localStorage.setItem(authTokenKey, authToken);
  } else {
    localStorage.removeItem(authTokenKey);
  }
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

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await fetch(path, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "请求失败");
  }
  return data;
}

async function onAuthSuccess(result, successText) {
  setAuth(result.token || "");
  showMessage(successText || "登录成功，正在返回...", "success");
  setTimeout(() => {
    location.href = nextPath;
  }, 240);
}

async function checkExistingSession() {
  if (!authToken) return;
  try {
    const result = await request("/api/auth/me");
    const user = result.user || {};
    sessionBox.classList.remove("hidden");
    sessionBox.innerHTML = `当前已登录：<strong>${user.displayName || "用户"}</strong> (@${user.username || "-"})`;
  } catch (_err) {
    setAuth("");
  }
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(registerForm).entries());
    try {
      const result = await request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      registerForm.reset();
      await onAuthSuccess(result, "注册成功，正在进入应用...");
    } catch (err) {
      showMessage(`注册失败：${err.message}`, "error");
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm).entries());
    try {
      const result = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      loginForm.reset();
      await onAuthSuccess(result, "登录成功，正在进入应用...");
    } catch (err) {
      showMessage(`登录失败：${err.message}`, "error");
    }
  });
}

if (requestCodeBtn && codeForm) {
  requestCodeBtn.addEventListener("click", async () => {
    const identifierInput = codeForm.querySelector('input[name="identifier"]');
    const identifier = String(identifierInput?.value || "").trim();
    if (!identifier) {
      showMessage("请先输入邮箱或手机号。", "error");
      return;
    }
    try {
      requestCodeBtn.disabled = true;
      const result = await request("/api/auth/request-code", {
        method: "POST",
        body: JSON.stringify({ identifier }),
      });
      const codeInput = codeForm.querySelector('input[name="code"]');
      if (codeInput && !codeInput.value && result.debugCode) {
        codeInput.value = result.debugCode;
      }
      showMessage(`验证码已发送（Demo显示：${result.debugCode}）`, "success");
    } catch (err) {
      showMessage(`获取验证码失败：${err.message}`, "error");
    } finally {
      requestCodeBtn.disabled = false;
    }
  });
}

if (codeForm) {
  codeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(codeForm).entries());
    try {
      const result = await request("/api/auth/code-login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      codeForm.reset();
      await onAuthSuccess(result, result.created ? "验证码注册成功，正在进入应用..." : "验证码登录成功，正在进入应用...");
    } catch (err) {
      showMessage(`验证码登录失败：${err.message}`, "error");
    }
  });
}

oauthButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const provider = String(button.getAttribute("data-provider") || "").trim().toLowerCase();
    if (!provider) return;
    try {
      button.disabled = true;
      const providerLabel = provider[0].toUpperCase() + provider.slice(1);
      const result = await request("/api/auth/oauth/mock", {
        method: "POST",
        body: JSON.stringify({
          provider,
          oauthUserId: getMockOauthUserId(provider),
          displayName: `${providerLabel} 用户`,
        }),
      });
      await onAuthSuccess(result, `${providerLabel} 登录成功，正在进入应用...`);
    } catch (err) {
      showMessage(`第三方登录失败：${err.message}`, "error");
    } finally {
      button.disabled = false;
    }
  });
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTab(button.getAttribute("data-auth-tab") || "login");
  });
});

if (backAppBtn) {
  backAppBtn.addEventListener("click", () => {
    location.href = nextPath;
  });
}

if (clearTokenBtn) {
  clearTokenBtn.addEventListener("click", () => {
    setAuth("");
    sessionBox.classList.add("hidden");
    sessionBox.innerHTML = "";
    showMessage("已退出当前账号。", "success");
  });
}

setActiveTab("login");
checkExistingSession().catch(() => {});
