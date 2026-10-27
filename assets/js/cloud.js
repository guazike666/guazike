/* =========================================================
   朝暮 · Cloud bridge
   Small Supabase REST client for auth + one shared state row.
   No SDK, no build step, no third-party network requests.
   ========================================================= */

(() => {
  "use strict";

  const config = window.ZHAOMU_CONFIG || {};
  const supabaseUrl = String(config.supabaseUrl || "").trim().replace(/\/+$/, "");
  const supabaseAnonKey = String(config.supabaseAnonKey || "").trim();
  const isLocalDevUrl = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(supabaseUrl);
  const isValidUrl = /^https:\/\/[^\s]+$/i.test(supabaseUrl) || isLocalDevUrl;
  const enabled = Boolean(isValidUrl && supabaseAnonKey.length >= 12);

  const SESSION_KEY = "zhaomu.cloud.session.v1";
  const STATE_ENDPOINT = "/rest/v1/couple_state";
  const REQUEST_TIMEOUT = 20000;

  let session = null;
  let authLostHandler = null;

  class CloudError extends Error {
    constructor(message, status = 0, payload = null) {
      super(message || "CLOUD_ERROR");
      this.name = "CloudError";
      this.status = Number(status) || 0;
      this.payload = payload;
      this.code = payload && payload.code ? payload.code : (this.status === 0 ? "NETWORK" : "HTTP");
    }
  }

  function safeReadSession() {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.access_token !== "string" || typeof parsed.refresh_token !== "string") {
        return null;
      }
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function persistSession(nextSession) {
    session = nextSession;
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    } catch (error) {
      // The session still works for this page even if storage is unavailable.
    }
  }

  function clearSession() {
    session = null;
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      // Ignore unavailable storage.
    }
  }

  function parsePayload(text) {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      return { message: text };
    }
  }

  function messageFromPayload(payload, status) {
    if (!payload) return `HTTP ${status}`;
    if (typeof payload === "string") return payload;
    return (
      payload.error_description ||
      payload.msg ||
      payload.message ||
      payload.error ||
      payload.details ||
      `HTTP ${status}`
    );
  }

  async function fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      return await window.fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
      throw new CloudError("NETWORK", 0, { code: "NETWORK", cause: String(error) });
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function request(path, options = {}) {
    if (!enabled) throw new CloudError("NOT_CONFIGURED", 0, { code: "NOT_CONFIGURED" });

    const {
      method = "GET",
      body = null,
      headers = {},
      auth = true,
      retry = true
    } = options;

    const requestHeaders = {
      apikey: supabaseAnonKey,
      ...headers
    };

    if (body != null && !requestHeaders["Content-Type"]) {
      requestHeaders["Content-Type"] = "application/json";
    }

    if (auth && session && session.access_token) {
      requestHeaders.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetchWithTimeout(`${supabaseUrl}${path}`, {
      method,
      headers: requestHeaders,
      body
    });

    const text = await response.text();
    const payload = parsePayload(text);

    if (!response.ok) {
      if (response.status === 401 && auth && retry && session && session.refresh_token) {
        try {
          await refreshSession();
          return request(path, { ...options, retry: false });
        } catch (refreshError) {
          clearSession();
          if (typeof authLostHandler === "function") authLostHandler(refreshError);
          throw refreshError;
        }
      }

      throw new CloudError(messageFromPayload(payload, response.status), response.status, payload);
    }

    return payload;
  }

  async function authRequest(path, body) {
    if (!enabled) throw new CloudError("NOT_CONFIGURED", 0, { code: "NOT_CONFIGURED" });
    const response = await fetchWithTimeout(`${supabaseUrl}${path}`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    const payload = parsePayload(text);

    if (!response.ok) {
      throw new CloudError(messageFromPayload(payload, response.status), response.status, payload);
    }
    return payload;
  }

  function applyAuthResponse(payload, fallbackEmail = "") {
    if (!payload || typeof payload.access_token !== "string" || typeof payload.refresh_token !== "string") {
      throw new CloudError("AUTH_RESPONSE_INVALID", 0, { code: "AUTH_RESPONSE_INVALID" });
    }

    const expiresIn = Number(payload.expires_in) || 3600;
    const email = (payload.user && payload.user.email) || fallbackEmail || (session && session.email) || "";
    const nextSession = {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_at: Date.now() + Math.max(60, expiresIn) * 1000,
      email
    };
    persistSession(nextSession);
    return nextSession;
  }

  async function refreshSession() {
    if (!session || !session.refresh_token) throw new CloudError("NO_REFRESH_TOKEN", 401, { code: "AUTH" });
    const payload = await authRequest("/auth/v1/token?grant_type=refresh_token", {
      refresh_token: session.refresh_token
    });
    return applyAuthResponse(payload, session.email);
  }

  async function restoreSession() {
    const stored = safeReadSession();
    if (!stored) return false;

    session = stored;
    const expiresAt = Number(stored.expires_at) || 0;
    if (expiresAt > Date.now() + 30000) return true;

    try {
      await refreshSession();
      return true;
    } catch (error) {
      clearSession();
      return false;
    }
  }

  async function signIn(email, password) {
    const payload = await authRequest("/auth/v1/token?grant_type=password", {
      email: String(email || "").trim(),
      password: String(password || "")
    });
    return applyAuthResponse(payload, String(email || "").trim());
  }

  async function signOut() {
    if (session && session.access_token) {
      try {
        await request("/auth/v1/logout", { method: "POST", auth: true, retry: false });
      } catch (error) {
        // Clearing local credentials is enough for this device.
      }
    }
    clearSession();
  }

  async function loadState() {
    const rows = await request(`${STATE_ENDPOINT}?id=eq.1&select=state,updated_at`);
    if (!Array.isArray(rows)) {
      throw new CloudError("INVALID_STATE_RESPONSE", 0, { code: "INVALID_STATE_RESPONSE" });
    }
    if (rows.length === 0) {
      return { exists: false, state: null, updatedAt: null };
    }
    return {
      exists: true,
      state: rows[0].state,
      updatedAt: rows[0].updated_at
    };
  }

  async function saveState(state) {
    const updatedAt = new Date().toISOString();
    const rows = await request(`${STATE_ENDPOINT}?on_conflict=id`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify({
        id: 1,
        state,
        updated_at: updatedAt
      })
    });

    if (Array.isArray(rows) && rows[0]) return rows[0];
    return { updated_at: updatedAt };
  }

  function hasSession() {
    return Boolean(session && session.access_token);
  }

  function getEmail() {
    return session && session.email ? session.email : "";
  }

  function friendlyError(error) {
    if (!error) return "云端连接失败，请稍后重试。";
    const message = String(error.message || "");
    const status = Number(error.status) || 0;

    if (error.code === "NETWORK" || status === 0) {
      return "连不上云端。请检查网络，或确认 Supabase 地址填写正确。";
    }
    if (error.code === "NOT_CONFIGURED") {
      return "还没有填写 Supabase 地址和公开密钥。";
    }
    if (/invalid login credentials|invalid_grant|invalid password/i.test(message)) {
      return "邮箱或密码不正确，再试一次。";
    }
    if (/email not confirmed/i.test(message)) {
      return "这个账号还没有确认邮箱，请先在 Supabase 后台确认。";
    }
    if (status === 404 || /could not find the table|relation .* does not exist/i.test(message)) {
      return "云端数据表还没创建，请先执行 supabase/schema.sql。";
    }
    if (status === 401 || status === 403 || /row-level security|permission denied|jwt/i.test(message)) {
      return "没有权限读取云端内容。请检查数据表权限，或重新登录。";
    }
    return "云端连接失败，请稍后重试。";
  }

  window.ZhaomuCloud = {
    enabled,
    signIn,
    signOut,
    restoreSession,
    loadState,
    saveState,
    hasSession,
    getEmail,
    friendlyError,
    onAuthLost(callback) {
      authLostHandler = typeof callback === "function" ? callback : null;
    },
    CloudError
  };
})();
