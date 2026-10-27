/* =========================================================
   朝暮 · OUR LITTLE DAYS
   Everything lives in your browser. No server, no tracking.
   ========================================================= */

(() => {
  "use strict";

  const STORAGE_KEY = "zhaomu.love.v1";
  const MAX_PHOTOS = 40;
  const MAX_UPLOAD_FILES = 9;
  const MAX_FILE_BYTES = 22 * 1024 * 1024;
  const IMAGE_MAX_EDGE = 1600;
  const IMAGE_QUALITY = 0.84;
  const CATEGORIES = ["日常", "旅行", "纪念日"];
  const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const MONTHS_EN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const DAY_MS = 86400000;
  const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");

  const QUOTES = [
    "爱是今天也为你留一盏灯。",
    "想和你一起，把普通的日子过成纪念日。",
    "世界很大，幸好我们并肩。",
    "今天的晚霞很好看，想拍给你看。",
    "你是我平淡生活里，最具体的浪漫。",
    "我们还有很多个明天。",
    "在所有不确定里，你是我的确定。",
    "喜欢是开始，陪伴才是答案。",
    "想把所有温柔，都留给同一个人。",
    "慢慢来，反正我们有一辈子。"
  ];

  const DEFAULT_COUPLE = {
    nameA: "阿澈",
    nameB: "小满",
    startDate: "2021-05-20",
    city: "杭州",
    quote: "从 2021 年 5 月 20 日开始，我们把一屋两人、三餐四季，慢慢过成了想要的样子。"
  };

  const DEFAULT_PHOTOS = [
    {
      id: "memory-sea",
      src: "assets/img/sea.svg",
      caption: "把日落看完再回家",
      date: "2025-08-17",
      category: "旅行",
      alt: "海边落日与并肩看海的两个背影",
      width: 1200,
      height: 900
    },
    {
      id: "memory-cafe",
      src: "assets/img/rain-cafe.svg",
      caption: "雨天，两杯热拿铁",
      date: "2026-03-08",
      category: "日常",
      alt: "雨天咖啡馆窗边的两杯热拿铁",
      width: 900,
      height: 1200
    },
    {
      id: "memory-mountain",
      src: "assets/img/mountain.svg",
      caption: "山里的风，替我们说了好多话",
      date: "2025-10-02",
      category: "旅行",
      alt: "晨雾山野中的帐篷与远山",
      width: 900,
      height: 1200
    },
    {
      id: "memory-flowers",
      src: "assets/img/flowers.svg",
      caption: "每周一束，给平凡的日子",
      date: "2026-04-19",
      category: "日常",
      alt: "奶油色房间里的一瓶花",
      width: 1000,
      height: 1000
    },
    {
      id: "memory-fireworks",
      src: "assets/img/fireworks.svg",
      caption: "跨年那晚，烟花和你都刚刚好",
      date: "2025-12-31",
      category: "纪念日",
      alt: "跨年夜天台上的烟花与两个背影",
      width: 900,
      height: 1200
    },
    {
      id: "memory-train",
      src: "assets/img/train.svg",
      caption: "开往春天的列车",
      date: "2026-04-05",
      category: "旅行",
      alt: "从火车车窗望出去的春日田野",
      width: 1200,
      height: 900
    }
  ];

  const DEFAULT_NOTES = [
    {
      id: "note-1",
      by: "a",
      text: "今天路过花店，看到一束很像你的洋桔梗。买回家插在窗边，突然觉得，原来想念也可以有颜色。",
      date: "2026-09-18"
    },
    {
      id: "note-2",
      by: "b",
      text: "你总说自己不浪漫，可你记得我随口提过的每一件小事。比起惊喜，我更喜欢这种被放在心上的感觉。",
      date: "2026-08-07"
    },
    {
      id: "note-3",
      by: "a",
      text: "如果以后我们有了自己的房子，想要一面很大的窗。冬天晒太阳，夏天听雨，你在旁边做什么都好。",
      date: "2026-05-20"
    },
    {
      id: "note-4",
      by: "b",
      text: "今天也很喜欢你。明天大概也是。这个结论我反复验证了很多次，暂时没有例外。",
      date: "2026-03-14"
    }
  ];

  const DEFAULT_WISHES = [
    { id: "wish-1", text: "一起去看一次极光", done: false },
    { id: "wish-2", text: "在海边等一场完整的日落", done: true },
    { id: "wish-3", text: "养一只小猫，取一个只有我们懂的名字", done: true },
    { id: "wish-4", text: "拍一组很土但很开心的胶片写真", done: false },
    { id: "wish-5", text: "学会做对方最爱吃的那道菜", done: false },
    { id: "wish-6", text: "把这张清单慢慢填满", done: false }
  ];

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  let storage = null;
  let hadStoredData = false;
  let state = null;
  let activeFilter = "全部";
  let visiblePhotos = [];
  let activeModal = null;
  let modalReturnFocus = null;
  let selectedFiles = [];
  let uploadInProgress = false;
  let lightboxItems = [];
  let lightboxIndex = 0;
  let lightboxReturnFocus = null;
  let menuReturnFocus = null;
  let toastTimer = null;
  let scrollTicking = false;
  let currentDay = "";
  let clockTimer = null;

  const cloud = window.ZhaomuCloud || null;
  const cloudAvailable = Boolean(cloud && cloud.enabled);
  const MAX_REMOTE_STATE_BYTES = 4.6 * 1024 * 1024;
  let appStarted = false;
  let remoteActive = false;
  let remoteUpdatedAt = null;
  let remoteSaving = false;
  let remotePollTimer = null;
  let remotePollInFlight = false;
  let remoteLastError = null;
  let authInFlight = false;
  let authReloadScheduled = false;
  let lastRemoteSyncAt = 0;

  /* ---------- Utilities ---------- */

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };
      return entities[character];
    });
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function uid(prefix) {
    const random = window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${random}`;
  }

  function startOfDay(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function parseISODate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const parts = value.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    if (
      date.getFullYear() !== parts[0] ||
      date.getMonth() !== parts[1] - 1 ||
      date.getDate() !== parts[2]
    ) {
      return null;
    }
    return date;
  }

  function isValidISODate(value) {
    return parseISODate(value) !== null;
  }

  function dateToISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function todayISO() {
    return dateToISO(new Date());
  }

  function addDays(date, amount) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
  }

  function addYears(date, amount) {
    return new Date(date.getFullYear() + amount, date.getMonth(), date.getDate());
  }

  function diffDays(later, earlier) {
    const laterMidnight = startOfDay(later).getTime();
    const earlierMidnight = startOfDay(earlier).getTime();
    return Math.round((laterMidnight - earlierMidnight) / DAY_MS);
  }

  function formatDateShort(value) {
    const date = value instanceof Date ? value : parseISODate(value);
    if (!date) return "";
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  }

  function formatDateCN(value) {
    const date = value instanceof Date ? value : parseISODate(value);
    if (!date) return "";
    return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  }

  function formatHeaderDate(date = new Date()) {
    return `${MONTHS_EN[date.getMonth()]} ${String(date.getDate()).padStart(2, "0")}, ${date.getFullYear()}`;
  }

  function formatWeekday(date = new Date()) {
    return WEEKDAYS[date.getDay()];
  }

  function dayOfYear(date = new Date()) {
    const first = new Date(date.getFullYear(), 0, 1);
    return diffDays(date, first);
  }

  function dailyQuote() {
    return QUOTES[dayOfYear() % QUOTES.length];
  }

  function defaultQuoteFor(startDate) {
    return `从 ${formatDateCN(startDate)} 开始，我们把一屋两人、三餐四季，慢慢过成了想要的样子。`;
  }

  function cleanText(value, fallback, maxLength) {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    return trimmed.slice(0, maxLength);
  }

  function safeId(value, fallbackPrefix = "item") {
    if (typeof value === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(value)) return value;
    return uid(fallbackPrefix);
  }

  function uniqueId(candidate, seen, fallbackPrefix) {
    let id = candidate || uid(fallbackPrefix);
    while (seen.has(id)) id = uid(fallbackPrefix);
    seen.add(id);
    return id;
  }

  function isAllowedPhotoSrc(src) {
    if (typeof src !== "string") return false;
    const trimmed = src.trim();
    if (/^assets\/img\/[a-zA-Z0-9._-]+$/.test(trimmed)) return true;
    return /^data:image\/(?:jpeg|jpg|png|webp);base64,[a-zA-Z0-9+/=\s]+$/i.test(trimmed);
  }

  function setText(selector, value) {
    const element = typeof selector === "string" ? $(selector) : selector;
    if (element) element.textContent = value == null ? "" : String(value);
  }

  function showToast(message, variant = "") {
    const toast = $("#toast");
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.toggle("is-error", variant === "error");
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2900);
  }

  function prefersReducedMotion() {
    return REDUCED_MOTION.matches;
  }

  /* ---------- Cloud UI helpers ---------- */

  function setSyncStatus(status, label) {
    const badge = $("#syncState");
    if (!badge) return;
    badge.hidden = !remoteActive;
    if (!remoteActive) return;

    const classes = ["is-saving", "is-error", "is-offline"];
    badge.classList.remove(...classes);
    if (status === "saving") badge.classList.add("is-saving");
    if (status === "error") badge.classList.add("is-error");
    if (status === "offline") badge.classList.add("is-offline");

    setText("#syncText", label || "已同步");
    const titles = {
      synced: "云端已同步，点击立即检查更新",
      saving: "正在同步到云端…",
      error: "同步失败，点击重试",
      offline: "当前网络不可用，点击重试",
      connecting: "正在连接云端…"
    };
    badge.title = titles[status] || titles.synced;
  }

  function updateCloudUI() {
    const syncBadge = $("#syncState");
    const sessionCard = $("#cloudSession");
    const logoutButton = $("#logoutBtn");
    const scope = $("#dataScope");
    const desc = $("#dataToolsDesc");

    if (syncBadge) syncBadge.hidden = !remoteActive;
    if (sessionCard) sessionCard.hidden = !remoteActive;
    if (logoutButton) logoutButton.hidden = !remoteActive;

    if (remoteActive) {
      setText("#cloudAccount", cloud && cloud.getEmail() ? cloud.getEmail() : "已连接云端");
      setText("#cloudStatusText", "两台设备共享同一份内容，修改后自动同步");
      setText("#dataScope", "云端共享");
      setText("#dataToolsDesc", "内容保存在你们的 Supabase 云端。换设备时登录同一个账号即可；导出备份可以作为额外的保险。");
      setText("#albumTipText", "示例照片可以随时替换成你们自己的照片 · 云端模式会把照片同步到你们的私密空间，只有登录后的两台设备能看见");
      setText("#settingsModalDesc", "所有内容都会同步到你们的云端。换成你们的名字和纪念日，这里就真正属于你们了。");
      setText("#photoModalDesc", "照片会自动压缩后同步到你们的云端空间，两台设备都能看到。");
    } else {
      setText("#dataScope", "只在这台设备");
      setText("#dataToolsDesc", "换了电脑或浏览器？先导出一份备份，再到新设备导入。");
      setText("#albumTipText", "示例照片可以随时替换成你们自己的照片 · 上传内容只保存在这台设备上，不会上传到任何服务器");
      setText("#settingsModalDesc", "所有内容都保存在你的浏览器里。换成你们的名字和纪念日，这里就真正属于你们了。");
      setText("#photoModalDesc", "照片会在本地自动压缩，只保存在你的浏览器里。");
    }
  }

  function saveErrorMessage(action) {
    if (remoteActive) {
      if (remoteLastError && remoteLastError.code === "SIZE") {
        return `${action}：照片数据超过云端单次同步上限，先删掉几张旧照片再试。`;
      }
      if (remoteLastError && remoteLastError.code === "NETWORK") {
        return `${action}：网络连接失败，请检查网络后重试。`;
      }
      if (remoteLastError && (remoteLastError.status === 401 || remoteLastError.status === 403)) {
        return `${action}：云端登录已过期，请刷新页面重新登录。`;
      }
      return `${action}：云端同步失败，请稍后重试。`;
    }
    return `${action}，浏览器本地存储暂时不可用。`;
  }

  function setAuthError(message) {
    const errorBox = $("#authError");
    if (!errorBox) return;
    errorBox.textContent = message || "";
  }

  function setAuthBusy(busy) {
    const button = $("#authSubmit");
    if (!button) return;
    button.disabled = Boolean(busy);
    button.textContent = busy ? "正在进入…" : "进入我们的小宇宙";
  }

  function showBoot() {
    const boot = $("#bootScreen");
    if (!boot) return;
    boot.hidden = false;
  }

  function hideBoot() {
    const boot = $("#bootScreen");
    if (!boot) return;
    boot.hidden = true;
  }

  function showAuthGate(message) {
    const gate = $("#authGate");
    if (!gate) return;
    hideBoot();
    setAuthError(message || "");
    gate.hidden = false;
    document.body.classList.add("auth-locked");
    window.requestAnimationFrame(() => gate.classList.add("is-open"));
    window.setTimeout(() => {
      $("#authEmail")?.focus({ preventScroll: true });
    }, 260);
  }

  function hideAuthGate() {
    const gate = $("#authGate");
    if (!gate) return;
    gate.classList.remove("is-open");
    document.body.classList.remove("auth-locked");
    window.setTimeout(() => {
      if (!gate.classList.contains("is-open")) gate.hidden = true;
    }, 520);
  }

  /* ---------- State ---------- */

  function findStorage() {
    try {
      const testKey = "__zhaomu_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  function createDefaultState() {
    return {
      version: 1,
      couple: { ...DEFAULT_COUPLE },
      photos: DEFAULT_PHOTOS.map((photo) => ({ ...photo })),
      notes: DEFAULT_NOTES.map((note) => ({ ...note })),
      wishes: DEFAULT_WISHES.map((wish) => ({ ...wish }))
    };
  }

  function normalizeCouple(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const startDate = isValidISODate(source.startDate) ? source.startDate : DEFAULT_COUPLE.startDate;
    return {
      nameA: cleanText(source.nameA, DEFAULT_COUPLE.nameA, 12),
      nameB: cleanText(source.nameB, DEFAULT_COUPLE.nameB, 12),
      startDate,
      city: cleanText(source.city, DEFAULT_COUPLE.city, 20),
      quote: cleanText(source.quote, defaultQuoteFor(startDate), 100)
    };
  }

  function normalizePhoto(raw, seen) {
    if (!raw || typeof raw !== "object") return null;
    const src = typeof raw.src === "string" ? raw.src.trim() : "";
    if (!isAllowedPhotoSrc(src)) return null;
    const date = isValidISODate(raw.date) ? raw.date : todayISO();
    const caption = cleanText(raw.caption, "未命名的瞬间", 40);
    const category = CATEGORIES.includes(raw.category) ? raw.category : "日常";
    const width = Number(raw.width);
    const height = Number(raw.height);
    return {
      id: uniqueId(safeId(raw.id, "photo"), seen, "photo"),
      src,
      caption,
      date,
      category,
      alt: cleanText(raw.alt, `${caption}，${formatDateShort(date)}`, 120),
      width: Number.isFinite(width) && width > 0 && width <= 12000 ? Math.round(width) : null,
      height: Number.isFinite(height) && height > 0 && height <= 12000 ? Math.round(height) : null
    };
  }

  function normalizeNote(raw, seen) {
    if (!raw || typeof raw !== "object") return null;
    const text = cleanText(raw.text, "", 240);
    if (!text) return null;
    return {
      id: uniqueId(safeId(raw.id, "note"), seen, "note"),
      by: raw.by === "b" ? "b" : "a",
      text,
      date: isValidISODate(raw.date) ? raw.date : todayISO()
    };
  }

  function normalizeWish(raw, seen) {
    if (!raw || typeof raw !== "object") return null;
    const text = cleanText(raw.text, "", 60);
    if (!text) return null;
    return {
      id: uniqueId(safeId(raw.id, "wish"), seen, "wish"),
      text,
      done: Boolean(raw.done)
    };
  }

  function normalizeState(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return createDefaultState();
    const source = raw.state && typeof raw.state === "object" ? raw.state : raw;
    if (!source || typeof source !== "object" || Array.isArray(source)) return createDefaultState();

    const defaults = createDefaultState();
    const photoIds = new Set();
    const noteIds = new Set();
    const wishIds = new Set();

    const photos = Array.isArray(source.photos)
      ? source.photos.map((photo) => normalizePhoto(photo, photoIds)).filter(Boolean).slice(0, MAX_PHOTOS)
      : defaults.photos;

    const notes = Array.isArray(source.notes)
      ? source.notes.map((note) => normalizeNote(note, noteIds)).filter(Boolean).slice(0, 100)
      : defaults.notes;

    const wishes = Array.isArray(source.wishes)
      ? source.wishes.map((wish) => normalizeWish(wish, wishIds)).filter(Boolean).slice(0, 100)
      : defaults.wishes;

    return {
      version: 1,
      couple: normalizeCouple(source.couple),
      photos,
      notes,
      wishes
    };
  }

  function loadState() {
    storage = findStorage();
    if (!storage) return createDefaultState();
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      hadStoredData = true;
      return normalizeState(JSON.parse(raw));
    } catch (error) {
      return createDefaultState();
    }
  }

  async function persistState(nextState = state) {
    if (remoteActive) return persistRemoteState(nextState);
    if (!storage) return false;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      return true;
    } catch (error) {
      return false;
    }
  }

  async function persistRemoteState(nextState) {
    if (!cloud || !cloud.hasSession()) {
      remoteLastError = { code: "AUTH", status: 401 };
      setSyncStatus("error", "未登录");
      return false;
    }

    let serialized;
    try {
      serialized = JSON.stringify(nextState);
    } catch (error) {
      remoteLastError = { code: "SERIALIZE", status: 0 };
      setSyncStatus("error", "同步失败");
      return false;
    }

    if (new Blob([serialized]).size > MAX_REMOTE_STATE_BYTES) {
      remoteLastError = { code: "SIZE", status: 0 };
      setSyncStatus("error", "内容过大");
      return false;
    }

    remoteSaving = true;
    remoteLastError = null;
    setSyncStatus("saving", "同步中");

    try {
      const row = await cloud.saveState(nextState);
      remoteUpdatedAt = (row && row.updated_at) || new Date().toISOString();
      remoteLastError = null;
      setSyncStatus("synced", "已同步");
      return true;
    } catch (error) {
      remoteLastError = error;
      if (error && (error.status === 401 || error.status === 403)) {
        handleRemoteAuthLost(error);
      } else if (error && error.code === "NETWORK") {
        setSyncStatus("offline", "离线");
      } else {
        setSyncStatus("error", "同步失败");
      }
      return false;
    } finally {
      remoteSaving = false;
    }
  }

  /* ---------- Date calculations ---------- */

  function calculateRelationship() {
    const start = parseISODate(state.couple.startDate) || parseISODate(DEFAULT_COUPLE.startDate);
    const today = startOfDay();
    const rawDifference = diffDays(today, start);
    const isFuture = rawDifference < 0;
    const days = isFuture ? 0 : rawDifference + 1;
    const daysUntilStart = isFuture ? Math.abs(rawDifference) : 0;
    const displayDays = isFuture ? daysUntilStart : days;
    const nextMilestone = isFuture ? 100 : (Math.floor(days / 100) + 1) * 100;
    const daysToMilestone = isFuture ? daysUntilStart + 100 : nextMilestone - days;
    const milestoneProgress = isFuture ? 0 : (days % 100) / 100;

    return {
      start,
      today,
      rawDifference,
      isFuture,
      days,
      daysUntilStart,
      displayDays,
      nextMilestone,
      daysToMilestone,
      milestoneProgress
    };
  }

  function calculateAnniversary(relationship) {
    const { start, today, isFuture, daysUntilStart } = relationship;

    if (isFuture) {
      return {
        date: start,
        days: daysUntilStart,
        number: 1,
        progress: 0,
        isStart: true
      };
    }

    let anniversary = new Date(today.getFullYear(), start.getMonth(), start.getDate());
    if (diffDays(anniversary, today) < 0) {
      anniversary = new Date(today.getFullYear() + 1, start.getMonth(), start.getDate());
    }

    const days = diffDays(anniversary, today);
    const number = Math.max(1, anniversary.getFullYear() - start.getFullYear());
    const previous = new Date(anniversary.getFullYear() - 1, anniversary.getMonth(), anniversary.getDate());
    const total = Math.max(1, diffDays(anniversary, previous));
    const progress = clamp((total - days) / total, 0, 1);

    return { date: anniversary, days, number, progress, isStart: false };
  }

  function setAnimatedNumber(element, value, animate) {
    if (!element) return;
    if (element._countAnimation) {
      window.cancelAnimationFrame(element._countAnimation);
      element._countAnimation = null;
    }

    const target = Math.max(0, Math.round(Number(value) || 0));
    const from = Number(element.dataset.value || 0);
    element.dataset.value = String(target);

    if (!animate || prefersReducedMotion() || from === target) {
      element.textContent = String(target);
      return;
    }

    const duration = 1250;
    const startedAt = performance.now();

    const tick = (now) => {
      const progress = clamp((now - startedAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        element._countAnimation = window.requestAnimationFrame(tick);
      } else {
        element._countAnimation = null;
        element.textContent = String(target);
      }
    };

    element._countAnimation = window.requestAnimationFrame(tick);
  }

  function updateDateStats(animate = false) {
    const relationship = calculateRelationship();
    const anniversary = calculateAnniversary(relationship);
    const start = relationship.start;

    setAnimatedNumber($("#heroDays"), relationship.displayDays, animate);
    setAnimatedNumber($("#bigDays"), relationship.displayDays, animate);

    const stampLabel = relationship.isFuture ? "距离相恋" : "已经相爱";
    const stampUnit = relationship.isFuture ? "DAYS TO GO" : "DAYS";
    setText("#stampLabel", stampLabel);
    setText("#stampUnit", stampUnit);

    const stamp = $(".days-stamp");
    if (stamp) {
      stamp.setAttribute(
        "aria-label",
        relationship.isFuture
          ? `距离相恋还有 ${relationship.daysUntilStart} 天`
          : `已经相爱 ${relationship.days} 天`
      );
    }

    setText("#heroSince", relationship.isFuture ? `COUNTING DOWN TO ${formatDateShort(start)}` : `SINCE ${formatDateShort(start)}`);
    setText("#countSince", relationship.isFuture ? `COUNTING DOWN TO ${formatDateShort(start)}` : `SINCE ${formatDateShort(start)}`);
    setText("#countKicker", relationship.isFuture ? "COUNTING DOWN TO US" : "WE'VE BEEN IN LOVE FOR");

    const countCopy = $("#countCopy");
    if (countCopy) {
      countCopy.innerHTML = relationship.isFuture
        ? `距离 ${escapeHTML(formatDateCN(start))}，<br>还有 ${relationship.daysUntilStart} 天，故事就要开始。`
        : `从 ${escapeHTML(formatDateCN(start))} 开始，<br>时间有了温柔的单位。`;
    }

    setText("#milestoneNumber", relationship.nextMilestone);
    setText("#daysToMilestone", relationship.daysToMilestone);

    const milestoneFill = $("#milestoneFill");
    if (milestoneFill) {
      const width = `${(relationship.milestoneProgress * 100).toFixed(2)}%`;
      window.requestAnimationFrame(() => {
        milestoneFill.style.width = width;
      });
    }

    let anniversaryTitle;
    let anniversaryLine;
    let anniversaryDisplayDays;

    if (relationship.isFuture) {
      anniversaryTitle = "故事开始倒计时";
      anniversaryLine = `${formatDateShort(start)} · 还有 ${relationship.daysUntilStart} 天`;
      anniversaryDisplayDays = relationship.daysUntilStart;
    } else if (anniversary.days === 0) {
      anniversaryTitle = "今天就是纪念日";
      anniversaryLine = `${formatDateShort(anniversary.date)} · 就是今天`;
      anniversaryDisplayDays = 0;
    } else {
      anniversaryTitle = `第 ${anniversary.number} 个纪念日`;
      anniversaryLine = `${formatDateShort(anniversary.date)} · 还要等 ${anniversary.days} 天`;
      anniversaryDisplayDays = anniversary.days;
    }

    setText("#annivTitle", anniversaryTitle);
    setText("#annivDays", anniversaryDisplayDays);
    const annivLine = $("#annivLine");
    if (annivLine) annivLine.textContent = anniversaryLine;

    const anniversaryCircle = $("#anniversaryProgress");
    if (anniversaryCircle) {
      const circumference = 2 * Math.PI * 52;
      const progress = relationship.isFuture ? 0 : anniversary.progress;
      anniversaryCircle.style.strokeDasharray = String(circumference);
      anniversaryCircle.style.strokeDashoffset = String(circumference * (1 - progress));
    }

    const footerLine = $("#footerLine");
    if (footerLine) {
      footerLine.innerHTML = relationship.isFuture
        ? `距离成为“我们”，还有 <strong>${relationship.daysUntilStart}</strong> 天。<br>已经开始期待了。`
        : `从 <span>${escapeHTML(formatDateShort(start))}</span> 开始的第 <strong>${relationship.days}</strong> 天，<br>还是最喜欢你。`;
    }

    setText(
      "#mobileNavDays",
      relationship.isFuture ? `距离故事开始还有 ${relationship.daysUntilStart} 天` : `一起走过 ${relationship.days} 天`
    );

    const startYear = start ? start.getFullYear() : new Date().getFullYear();
    setText("#estYear", startYear);
    setText("#footerYear", new Date().getFullYear());
  }

  function updateTodayLabels() {
    const now = new Date();
    const iso = dateToISO(now);
    currentDay = iso;

    setText("#headerDate", formatHeaderDate(now));
    setText("#todayText", `${formatDateShort(iso)} · ${formatWeekday(now)}`);
    setText("#dailyQuote", dailyQuote());
    setText("#dailyQuoteFeature", dailyQuote());
    setText("#footerYear", now.getFullYear());
  }

  /* ---------- Couple / counts ---------- */

  function applyCouple() {
    const { nameA, nameB, startDate, city, quote } = state.couple;

    setText("#nameA", nameA);
    setText("#nameB", nameB);
    setText("#footerNameA", nameA);
    setText("#footerNameB", nameB);
    setText("#storyQuoteNames", `${nameA} & ${nameB}`);
    setText("#noteAuthorA", nameA);
    setText("#noteAuthorB", nameB);
    setText("#heroCity", city || "某个地方");
    setText("#heroDesc", quote || defaultQuoteFor(startDate));

    document.title = `${nameA} & ${nameB}｜朝朝暮暮`;
  }

  function refreshCounts() {
    const totalWishes = state.wishes.length;
    const doneWishes = state.wishes.filter((wish) => wish.done).length;
    const percent = totalWishes === 0 ? 0 : Math.round((doneWishes / totalWishes) * 100);

    setText("#photoCount", state.photos.length);
    setText("#noteCount", state.notes.length);
    setText("#noteCountInline", state.notes.length);
    setText("#wishDone", doneWishes);
    setText("#wishTotal", totalWishes);
    setText("#wishDoneInline", doneWishes);
    setText("#wishTotalInline", totalWishes);

    const wishPercent = $("#wishPercent");
    if (wishPercent) wishPercent.innerHTML = `${percent}<small>%</small>`;

    const wishRing = $("#wishProgressRing");
    if (wishRing) {
      const circumference = 2 * Math.PI * 60;
      wishRing.style.strokeDasharray = String(circumference);
      wishRing.style.strokeDashoffset = String(circumference * (1 - (totalWishes === 0 ? 0 : doneWishes / totalWishes)));
    }
  }

  function refreshAll(animateDays = false) {
    updateDateStats(animateDays);
    refreshCounts();
    updateTodayLabels();
  }

  /* ---------- Timeline ---------- */

  function renderTimeline() {
    const timeline = $("#timeline");
    if (!timeline) return;

    const relationship = calculateRelationship();
    const { start, today } = relationship;
    const dayHundred = addDays(start, 99);
    const firstAnniversary = addYears(start, 1);

    let items;

    if (relationship.isFuture) {
      items = [
        {
          date: today,
          label: "TODAY",
          title: "等待开始",
          text: `还有 ${relationship.daysUntilStart} 天，故事就要开始了。`,
          future: false
        },
        {
          date: start,
          label: "DAY 01",
          title: "故事开始",
          text: "我们约好从这一天开始，慢慢成为彼此的人。",
          future: true
        },
        {
          date: dayHundred,
          label: "DAY 100",
          title: "第一百天",
          text: "等走到第一百天，要一起好好庆祝。",
          future: true
        },
        {
          date: firstAnniversary,
          label: "1ST YEAR",
          title: "第一次周年",
          text: "第一次周年，想把那天留给你。",
          future: true
        }
      ];
    } else {
      items = [
        {
          date: start,
          label: "DAY 01",
          title: "故事开始",
          text: "从这一天起，日历有了新的意义。",
          future: false
        },
        {
          date: dayHundred,
          label: "DAY 100",
          title: "第一百天",
          text: "从小心翼翼，到自然而然地想念。",
          future: diffDays(dayHundred, today) > 0
        },
        {
          date: firstAnniversary,
          label: "1ST YEAR",
          title: "第一次周年",
          text: "原来喜欢一个人，可以喜欢这么久。",
          future: diffDays(firstAnniversary, today) > 0
        },
        {
          date: today,
          label: `DAY ${relationship.days}`,
          title: "此时此刻",
          text: "还在继续，还在认真喜欢你。",
          future: false
        }
      ];
    }

    timeline.innerHTML = items.map((item, index) => {
      const future = Boolean(item.future);
      const dateText = formatDateShort(item.date);
      const futureNote = future
        ? `<span class="timeline-daylabel">还有 ${diffDays(item.date, today)} 天</span>`
        : "";

      return `
        <article class="timeline-item${future ? " is-future" : ""}">
          <span class="timeline-dot" aria-hidden="true"></span>
          <span class="timeline-number" aria-hidden="true">0${index + 1}</span>
          <p class="timeline-date">${escapeHTML(dateText)}<span class="timeline-daylabel">${escapeHTML(item.label)}</span>${futureNote}</p>
          <h3>${escapeHTML(item.title)}</h3>
          <p class="timeline-text">${escapeHTML(item.text)}</p>
        </article>
      `;
    }).join("");
  }

  /* ---------- Album ---------- */

  function getAllPhotos() {
    return Array.isArray(state.photos) ? state.photos : [];
  }

  function getFilteredPhotos() {
    const photos = getAllPhotos();
    if (activeFilter === "全部") return photos;
    return photos.filter((photo) => photo.category === activeFilter);
  }

  function renderPhotos() {
    const grid = $("#albumGrid");
    if (!grid) return;

    visiblePhotos = getFilteredPhotos();
    const tilts = [-0.45, 0.35, -0.25, 0.5, -0.35, 0.25];

    const cards = visiblePhotos.map((photo, index) => {
      const caption = photo.caption || "未命名的瞬间";
      const alt = photo.alt || caption;
      const dimensions = photo.width && photo.height
        ? ` width="${photo.width}" height="${photo.height}"`
        : "";
      return `
        <article class="memory-card" style="--tilt:${tilts[index % tilts.length]}deg">
          <button class="memory-media" type="button" data-photo-id="${escapeHTML(photo.id)}" aria-label="查看照片：${escapeHTML(caption)}">
            <img src="${escapeHTML(photo.src)}" alt="${escapeHTML(alt)}"${dimensions} loading="lazy" decoding="async">
            <span class="memory-category">${escapeHTML(photo.category)}</span>
            <span class="memory-view">VIEW MEMORY <span aria-hidden="true">↗</span></span>
          </button>
          <button class="memory-delete" type="button" data-delete-photo="${escapeHTML(photo.id)}" aria-label="从相册移除：${escapeHTML(caption)}">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
              <path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10M9 9v4M11 9v4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="memory-caption">
            <h3>${escapeHTML(caption)}</h3>
            <time datetime="${escapeHTML(photo.date)}">${escapeHTML(formatDateShort(photo.date))}</time>
          </div>
        </article>
      `;
    }).join("");

    const emptyState = visiblePhotos.length === 0
      ? `<div class="memory-empty">
          <strong>这一页还空着</strong>
          <span>把这个分类里的第一个瞬间放进来吧。</span>
        </div>`
      : "";

    grid.innerHTML = `
      ${emptyState}
      ${cards}
      <button class="memory-add-card" type="button" data-open-photo>
        <span class="memory-add-icon" aria-hidden="true">+</span>
        <strong>放进一张新照片</strong>
        <span>让今天也成为以后会翻到的一页</span>
      </button>
    `;

    setText("#albumCount", `共 ${visiblePhotos.length} 个瞬间`);

    $$(".filter-btn", $("#photoFilters")).forEach((button) => {
      const isActive = button.dataset.filter === activeFilter;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function openLightboxFromId(photoId, trigger) {
    const index = visiblePhotos.findIndex((photo) => photo.id === photoId);
    if (index < 0) return;
    openLightbox(visiblePhotos, index, trigger);
  }

  function openLightbox(items, index, trigger) {
    if (!Array.isArray(items) || items.length === 0) return;
    lightboxItems = items.slice();
    lightboxIndex = clamp(index, 0, lightboxItems.length - 1);
    lightboxReturnFocus = trigger || document.activeElement;

    const lightbox = $("#lightbox");
    if (!lightbox) return;

    if (activeModal) closeModal(activeModal, false);
    if ($("#mobileNav").classList.contains("is-open")) closeMenu(false);

    lightbox.hidden = false;
    window.requestAnimationFrame(() => lightbox.classList.add("is-open"));
    document.body.classList.add("lightbox-open");
    renderLightbox();

    window.setTimeout(() => {
      $(".lightbox-close")?.focus({ preventScroll: true });
    }, 100);
  }

  function renderLightbox() {
    const item = lightboxItems[lightboxIndex];
    if (!item) return;

    const image = $("#lightboxImage");
    image.src = item.src;
    image.alt = item.alt || item.caption || "我们的回忆";

    setText("#lightboxCount", `${String(lightboxIndex + 1).padStart(2, "0")} / ${String(lightboxItems.length).padStart(2, "0")}`);
    setText("#lightboxCategory", item.category || "回忆");
    setText("#lightboxCaption", item.caption || "未命名的瞬间");
    setText("#lightboxDate", formatDateShort(item.date));

    const prev = $("#lightboxPrev");
    const next = $("#lightboxNext");
    const hasMany = lightboxItems.length > 1;
    if (prev) prev.hidden = !hasMany;
    if (next) next.hidden = !hasMany;
  }

  function stepLightbox(direction) {
    if (lightboxItems.length < 2) return;
    lightboxIndex = (lightboxIndex + direction + lightboxItems.length) % lightboxItems.length;
    renderLightbox();
  }

  function closeLightbox(restoreFocus = true) {
    const lightbox = $("#lightbox");
    if (!lightbox || lightbox.hidden) return;
    lightbox.classList.remove("is-open");
    document.body.classList.remove("lightbox-open");

    window.setTimeout(() => {
      if (!lightbox.classList.contains("is-open")) lightbox.hidden = true;
    }, 320);

    if (restoreFocus && lightboxReturnFocus && lightboxReturnFocus.isConnected) {
      window.setTimeout(() => lightboxReturnFocus.focus({ preventScroll: true }), 80);
    }
  }

  async function deletePhoto(photoId, fromLightbox = false) {
    const photo = state.photos.find((item) => item.id === photoId);
    if (!photo) return;

    const confirmed = window.confirm(`要把“${photo.caption || "这个瞬间"}”从相册里移除吗？此操作不可撤销。`);
    if (!confirmed) return;

    const nextState = {
      ...state,
      photos: state.photos.filter((item) => item.id !== photoId)
    };

    if (!(await persistState(nextState))) {
      showToast(saveErrorMessage("移除失败"), "error");
      return;
    }

    state = nextState;
    renderPhotos();
    refreshCounts();

    if (fromLightbox || (!$("#lightbox").hidden && lightboxItems.some((item) => item.id === photoId))) {
      closeLightbox(false);
      const albumSection = $("#album");
      if (albumSection) {
        window.setTimeout(() => albumSection.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }), 60);
      }
    }

    showToast("这个瞬间已从相册移除");
  }

  /* ---------- Notes ---------- */

  function renderNotes() {
    const board = $("#notesBoard");
    if (!board) return;

    if (state.notes.length === 0) {
      board.innerHTML = `
        <div class="notes-empty">
          <span aria-hidden="true">✉</span>
          <strong>信箱还空着</strong>
          <p>写第一张纸条吧，哪怕只有一句“今天想你”。</p>
          <button class="button button-light" type="button" data-open-note>写第一张</button>
        </div>
      `;
      return;
    }

    board.innerHTML = state.notes.map((note) => {
      const author = note.by === "b" ? state.couple.nameB : state.couple.nameA;
      return `
        <article class="note-card" data-note-id="${escapeHTML(note.id)}">
          <button class="note-delete" type="button" data-delete-note="${escapeHTML(note.id)}" aria-label="取下这张纸条">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke-linecap="round"/>
            </svg>
          </button>
          <p class="note-text">${escapeHTML(note.text)}</p>
          <div class="note-sign">
            <strong>—— ${escapeHTML(author)}</strong>
            <time datetime="${escapeHTML(note.date)}">${escapeHTML(formatDateShort(note.date))}</time>
          </div>
        </article>
      `;
    }).join("");
  }

  async function deleteNote(noteId) {
    const note = state.notes.find((item) => item.id === noteId);
    if (!note) return;
    if (!window.confirm("要把这张纸条从信箱里取下来吗？")) return;

    const nextState = {
      ...state,
      notes: state.notes.filter((item) => item.id !== noteId)
    };

    if (!(await persistState(nextState))) {
      showToast(saveErrorMessage("取不下来"), "error");
      return;
    }

    state = nextState;
    renderNotes();
    refreshCounts();
    showToast("纸条已取下");
  }

  /* ---------- Wishes ---------- */

  function renderWishes() {
    const list = $("#wishList");
    if (!list) return;

    if (state.wishes.length === 0) {
      list.innerHTML = `
        <li class="wish-empty">
          <span aria-hidden="true">♡</span>
          <p>清单还是空的。<br>写下第一件想和 TA 一起做的事吧。</p>
        </li>
      `;
      return;
    }

    list.innerHTML = state.wishes.map((wish, index) => `
      <li class="wish-item${wish.done ? " is-done" : ""}" data-wish-id="${escapeHTML(wish.id)}">
        <span class="wish-index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
        <button class="wish-check" type="button" data-toggle-wish aria-label="${wish.done ? "取消完成" : "标记完成"}：${escapeHTML(wish.text)}" aria-pressed="${wish.done}">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M2.5 7.4l3 3 6-6.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="wish-text" type="button" data-toggle-wish>${escapeHTML(wish.text)}</button>
        <span class="wish-done-note" aria-hidden="true">完成 ♡</span>
        <button class="wish-delete" type="button" data-delete-wish="${escapeHTML(wish.id)}" aria-label="删除心愿：${escapeHTML(wish.text)}">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke-linecap="round"/>
          </svg>
        </button>
      </li>
    `).join("");
  }

  async function toggleWish(wishId, origin) {
    const wish = state.wishes.find((item) => item.id === wishId);
    if (!wish) return;

    let burstX = window.innerWidth / 2;
    let burstY = window.innerHeight / 2;

    if (origin) {
      const target = origin.target?.closest?.("[data-toggle-wish]") || origin.target;
      const rect = target?.getBoundingClientRect?.();
      if (origin.clientX) burstX = origin.clientX;
      else if (rect) burstX = rect.left + rect.width / 2;
      if (origin.clientY) burstY = origin.clientY;
      else if (rect) burstY = rect.top + rect.height / 2;
    }

    const nextState = {
      ...state,
      wishes: state.wishes.map((item) => item.id === wishId ? { ...item, done: !item.done } : item)
    };

    if (!(await persistState(nextState))) {
      showToast(saveErrorMessage("保存失败"), "error");
      return;
    }

    state = nextState;
    renderWishes();
    refreshCounts();

    const updated = state.wishes.find((item) => item.id === wishId);
    if (updated && updated.done) {
      burstHearts(burstX, burstY, 7);
      showToast("又多了一件可以一起回忆的小事");
    }

    window.requestAnimationFrame(() => {
      const rows = $$(".wish-item", $("#wishList"));
      const row = rows.find((item) => item.dataset.wishId === wishId);
      row?.querySelector(".wish-check")?.focus({ preventScroll: true });
    });
  }

  async function deleteWish(wishId) {
    const wish = state.wishes.find((item) => item.id === wishId);
    if (!wish) return;
    if (!window.confirm(`要把“${wish.text}”从心愿清单里删掉吗？`)) return;

    const nextState = {
      ...state,
      wishes: state.wishes.filter((item) => item.id !== wishId)
    };

    if (!(await persistState(nextState))) {
      showToast(saveErrorMessage("删除失败"), "error");
      return;
    }

    state = nextState;
    renderWishes();
    refreshCounts();
    showToast("心愿已从清单移除");
  }

  /* ---------- Hearts / petals ---------- */

  function burstHearts(x, y, amount = 8) {
    if (prefersReducedMotion()) return;
    const layer = $("#heartLayer");
    if (!layer) return;
    const chars = ["♡", "♥", "✦", "♡"];

    for (let index = 0; index < amount; index += 1) {
      const heart = document.createElement("span");
      heart.className = "floating-heart";
      heart.textContent = chars[Math.floor(Math.random() * chars.length)];
      heart.style.left = `${x + (Math.random() - 0.5) * 34}px`;
      heart.style.top = `${y + (Math.random() - 0.5) * 20}px`;
      heart.style.fontSize = `${9 + Math.random() * 15}px`;
      heart.style.setProperty("--heart-x", `${(Math.random() - 0.5) * 150}px`);
      heart.style.setProperty("--heart-rotate", `${(Math.random() - 0.5) * 90}deg`);
      heart.style.animationDelay = `${Math.random() * 0.18}s`;
      layer.appendChild(heart);
      window.setTimeout(() => heart.remove(), 2300);
    }
  }

  function createPetals() {
    if (prefersReducedMotion()) return;
    const container = $("#heroPetals");
    if (!container) return;

    for (let index = 0; index < 11; index += 1) {
      const petal = document.createElement("span");
      petal.className = "petal";
      petal.style.left = `${4 + Math.random() * 92}%`;
      petal.style.setProperty("--fall-duration", `${17 + Math.random() * 17}s`);
      petal.style.setProperty("--fall-delay", `${-5 - Math.random() * 22}s`);
      petal.style.setProperty("--drift", `${-60 + Math.random() * 150}px`);
      petal.style.setProperty("--fall-opacity", `${0.28 + Math.random() * 0.38}`);
      petal.style.opacity = "0";
      const size = 6 + Math.random() * 7;
      petal.style.width = `${size}px`;
      petal.style.height = `${size * 1.35}px`;
      container.appendChild(petal);
    }
  }

  /* ---------- Modal & menu management ---------- */

  function focusableElements(container) {
    if (!container) return [];
    return $$(
      'a[href], button:not([disabled]):not([hidden]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      container
    ).filter((element) => !element.hasAttribute("hidden") && element.offsetParent !== null);
  }

  function trapFocus(event, container) {
    if (!container) return;
    const focusable = focusableElements(container);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !container.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !container.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  function openModal(modal, trigger, focusSelector) {
    if (!modal) return;
    if (activeModal && activeModal !== modal) closeModal(activeModal, false);
    if ($("#mobileNav").classList.contains("is-open")) closeMenu(false);

    modalReturnFocus = trigger || document.activeElement;
    window.clearTimeout(modal._hideTimer);
    modal.hidden = false;
    activeModal = modal;
    document.body.classList.add("modal-open");

    window.requestAnimationFrame(() => modal.classList.add("is-open"));

    window.setTimeout(() => {
      const target = focusSelector ? $(focusSelector, modal) : focusableElements(modal)[0];
      target?.focus({ preventScroll: true });
    }, 100);
  }

  function closeModal(modal = activeModal, restoreFocus = true) {
    if (!modal) return;
    if (modal.id === "photoModal" && uploadInProgress) {
      showToast("照片正在冲洗，稍等一下下");
      return;
    }
    modal.classList.remove("is-open");
    modal._hideTimer = window.setTimeout(() => {
      if (!modal.classList.contains("is-open")) modal.hidden = true;
    }, 320);

    if (activeModal === modal) activeModal = null;
    if (!activeModal) document.body.classList.remove("modal-open");

    if (modal.id === "photoModal") resetPhotoForm();

    if (restoreFocus && modalReturnFocus && modalReturnFocus.isConnected) {
      window.setTimeout(() => modalReturnFocus.focus({ preventScroll: true }), 90);
    }
  }

  function openSettings(trigger) {
    const modal = $("#settingsModal");
    if (!modal) return;

    $("#settingNameA").value = state.couple.nameA;
    $("#settingNameB").value = state.couple.nameB;
    $("#settingStartDate").value = state.couple.startDate;
    $("#settingStartDate").max = todayISO();
    $("#settingCity").value = state.couple.city;
    $("#settingQuote").value = state.couple.quote;

    openModal(modal, trigger, "#settingNameA");
  }

  function openPhotoModal(trigger) {
    const modal = $("#photoModal");
    if (!modal) return;
    resetPhotoForm();
    $("#photoDate").value = todayISO();
    openModal(modal, trigger, "#uploadZone");
  }

  function openNoteModal(trigger) {
    const modal = $("#noteModal");
    if (!modal) return;
    setText("#noteAuthorA", state.couple.nameA);
    setText("#noteAuthorB", state.couple.nameB);
    openModal(modal, trigger, "#noteText");
  }

  function openMenu(trigger) {
    const menu = $("#mobileNav");
    const triggerButton = $("#menuTrigger");
    if (!menu) return;

    menuReturnFocus = trigger || triggerButton || document.activeElement;
    window.clearTimeout(menu._hideTimer);
    menu.hidden = false;
    document.body.classList.add("menu-open");
    triggerButton?.setAttribute("aria-expanded", "true");

    window.requestAnimationFrame(() => menu.classList.add("is-open"));
    window.setTimeout(() => {
      $("a", menu)?.focus({ preventScroll: true });
    }, 120);
  }

  function closeMenu(restoreFocus = true) {
    const menu = $("#mobileNav");
    const triggerButton = $("#menuTrigger");
    if (!menu || menu.hidden) return;

    menu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    triggerButton?.setAttribute("aria-expanded", "false");

    menu._hideTimer = window.setTimeout(() => {
      if (!menu.classList.contains("is-open")) menu.hidden = true;
    }, 420);

    if (restoreFocus && menuReturnFocus && menuReturnFocus.isConnected) {
      window.setTimeout(() => menuReturnFocus.focus({ preventScroll: true }), 100);
    }
  }

  /* ---------- Photo upload ---------- */

  function resetPhotoForm() {
    selectedFiles.forEach((item) => URL.revokeObjectURL(item.url));
    selectedFiles = [];

    const preview = $("#uploadPreview");
    if (preview) {
      preview.innerHTML = "";
      preview.hidden = true;
    }

    const input = $("#photoInput");
    if (input) input.value = "";

    const caption = $("#photoCaption");
    if (caption) caption.value = "";

    const category = $("#photoCategory");
    if (category) category.value = "日常";

    const date = $("#photoDate");
    if (date) date.value = todayISO();

    const hint = $("#uploadHint");
    if (hint) hint.textContent = "还没有选择照片";

    const submit = $("#photoSubmit");
    if (submit) {
      submit.disabled = false;
      submit.textContent = "冲洗出来";
    }
  }

  function renderUploadPreview() {
    const preview = $("#uploadPreview");
    const hint = $("#uploadHint");
    if (!preview || !hint) return;

    if (selectedFiles.length === 0) {
      preview.innerHTML = "";
      preview.hidden = true;
      hint.textContent = "还没有选择照片";
      return;
    }

    preview.hidden = false;
    preview.innerHTML = selectedFiles.map((item) => `
      <div class="upload-thumb">
        <img src="${escapeHTML(item.url)}" alt="${escapeHTML(item.file.name)}">
        <button class="upload-thumb-remove" type="button" data-remove-file="${escapeHTML(item.id)}" aria-label="移除 ${escapeHTML(item.file.name)}">×</button>
      </div>
    `).join("");

    hint.textContent = `已选择 ${selectedFiles.length} 张照片${selectedFiles.length >= MAX_UPLOAD_FILES ? "（已达单次上限）" : "，可以继续添加"}`;
  }

  function addSelectedFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    let rejected = 0;

    for (const file of files) {
      if (selectedFiles.length >= MAX_UPLOAD_FILES) {
        showToast(`一次最多放 ${MAX_UPLOAD_FILES} 张照片`);
        break;
      }

      const supported = /^image\/(jpeg|png|webp)$/i.test(file.type);
      if (!supported) {
        rejected += 1;
        continue;
      }

      if (file.size > MAX_FILE_BYTES) {
        showToast(`“${file.name}”太大了，请换一张 22MB 以内的照片`, "error");
        continue;
      }

      selectedFiles.push({
        id: uid("file"),
        file,
        url: URL.createObjectURL(file)
      });
    }

    if (rejected > 0) {
      showToast("部分文件格式不支持，请使用 JPG、PNG 或 WebP", "error");
    }

    renderUploadPreview();
  }

  function decodeImage(file) {
    if (typeof window.createImageBitmap === "function") {
      return window.createImageBitmap(file, { imageOrientation: "from-image" })
        .catch(() => window.createImageBitmap(file));
    }

    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("IMAGE_DECODE"));
      };
      image.src = url;
    });
  }

  async function compressImage(file) {
    const image = await decodeImage(file);
    const width = image.width || image.naturalWidth;
    const height = image.height || image.naturalHeight;
    if (!width || !height) throw new Error("IMAGE_DECODE");

    const maxEdge = remoteActive ? 1400 : IMAGE_MAX_EDGE;
    const quality = remoteActive ? 0.78 : IMAGE_QUALITY;
    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("CANVAS_UNAVAILABLE");

    context.fillStyle = "#f7f0e5";
    context.fillRect(0, 0, targetWidth, targetHeight);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    if (typeof image.close === "function") image.close();

    return {
      src: canvas.toDataURL("image/jpeg", quality),
      width: targetWidth,
      height: targetHeight
    };
  }

  /* ---------- Data backup ---------- */

  function exportBackup() {
    const payload = {
      app: "朝暮 · OUR LITTLE DAYS",
      version: 1,
      exportedAt: new Date().toISOString(),
      state
    };

    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const safeName = `${state.couple.nameA}-${state.couple.nameB}`.replace(/[\\/:*?"<>|]/g, "");
      anchor.href = url;
      anchor.download = `朝暮-${safeName}-${todayISO()}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      showToast("备份已导出，记得收好");
    } catch (error) {
      showToast("导出失败，请稍后再试", "error");
    }
  }

  async function importBackup(file) {
    if (!file) return;

    try {
      if (file.size > 30 * 1024 * 1024) {
        showToast("备份文件太大了，请检查文件是否正确", "error");
        return;
      }

      const text = await file.text();
      const parsed = JSON.parse(text);
      const source = parsed && parsed.state ? parsed.state : parsed;

      if (!source || typeof source !== "object" || !source.couple) {
        throw new Error("INVALID_BACKUP");
      }

      if (!window.confirm(`导入备份会覆盖${remoteActive ? "云端" : "这台设备"}上现在的内容，确定继续吗？`)) return;

      const imported = normalizeState(source);
      const previous = state;
      state = imported;

      if (!(await persistState())) {
        state = previous;
        throw new Error("SAVE");
      }

      activeFilter = "全部";
      applyCouple();
      renderPhotos();
      renderNotes();
      renderWishes();
      renderTimeline();
      refreshAll(true);
      closeModal($("#settingsModal"));
      showToast("备份已导入，欢迎回来");
    } catch (error) {
      if (error.message === "SAVE") {
        showToast(saveErrorMessage("导入失败"), "error");
      } else if (error instanceof SyntaxError) {
        showToast("这个文件不是有效的备份，请重新选择", "error");
      } else {
        showToast("备份导入失败，请检查文件是否正确", "error");
      }
    } finally {
      const input = $("#importInput");
      if (input) input.value = "";
    }
  }

  /* ---------- Navigation / reveal ---------- */

  function updateHeaderAndNav() {
    const header = $("#siteHeader");
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 24);

      const headerMarker = header.offsetHeight * 0.55;
      const darkZones = [$("#notes"), $(".site-footer")];
      const overDarkZone = darkZones.some((zone) => {
        if (!zone) return false;
        const rect = zone.getBoundingClientRect();
        return rect.top <= headerMarker && rect.bottom > headerMarker;
      });
      header.classList.toggle("is-dark", overDarkZone);
    }

    const marker = window.innerHeight * 0.35;
    const sections = ["home", "numbers", "story", "album", "notes", "wishes"];
    let activeSection = "home";

    sections.forEach((id) => {
      const section = document.getElementById(id);
      if (!section) return;
      if (section.getBoundingClientRect().top <= marker) activeSection = id;
    });

    $$(".nav-link").forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${activeSection}`);
    });
  }

  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(() => {
      updateHeaderAndNav();
      scrollTicking = false;
    });
  }

  function setupReveal() {
    const reveals = $$(".reveal");
    if (reveals.length === 0) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      reveals.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: "0px 0px -6% 0px"
    });

    reveals.forEach((element) => observer.observe(element));
  }

  function setupClock() {
    currentDay = todayISO();
    window.clearInterval(clockTimer);
    clockTimer = window.setInterval(() => {
      const nowDay = todayISO();
      if (nowDay !== currentDay) {
        currentDay = nowDay;
        refreshAll(false);
        renderTimeline();
      }
    }, 60000);
  }

  /* ---------- Event wiring ---------- */

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const settingsTrigger = event.target.closest("[data-open-settings]");
      if (settingsTrigger) {
        openSettings(settingsTrigger);
        return;
      }

      const noteTrigger = event.target.closest("[data-open-note]");
      if (noteTrigger) {
        if ($("#mobileNav").classList.contains("is-open")) closeMenu(false);
        openNoteModal(noteTrigger);
        return;
      }

      const photoTrigger = event.target.closest("[data-open-photo]");
      if (photoTrigger) {
        openPhotoModal(photoTrigger);
        return;
      }

      const closeTrigger = event.target.closest("[data-close-modal]");
      if (closeTrigger) {
        const modal = closeTrigger.closest(".modal");
        closeModal(modal);
        return;
      }

      if (event.target.closest("[data-close-lightbox]")) {
        closeLightbox();
      }
    });

    $("#menuTrigger")?.addEventListener("click", () => openMenu($("#menuTrigger")));
    $("#menuClose")?.addEventListener("click", () => closeMenu());
    $$("#mobileNav nav a").forEach((link) => {
      link.addEventListener("click", () => closeMenu(false));
    });

    $("#heartButton")?.addEventListener("click", (event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      burstHearts(rect.left + rect.width / 2, rect.top + rect.height / 2, 11);
      showToast(`“${QUOTES[Math.floor(Math.random() * QUOTES.length)]}”`);
    });

    $("#photoFilters")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      activeFilter = button.dataset.filter || "全部";
      renderPhotos();
    });

    $("#albumGrid")?.addEventListener("click", (event) => {
      const deleteButton = event.target.closest("[data-delete-photo]");
      if (deleteButton) {
        event.stopPropagation();
        deletePhoto(deleteButton.dataset.deletePhoto, false);
        return;
      }

      const media = event.target.closest("[data-photo-id]");
      if (media) openLightboxFromId(media.dataset.photoId, media);
    });

    $("#notesBoard")?.addEventListener("click", (event) => {
      const deleteButton = event.target.closest("[data-delete-note]");
      if (deleteButton) deleteNote(deleteButton.dataset.deleteNote);
    });

    $("#wishList")?.addEventListener("click", (event) => {
      const row = event.target.closest("[data-wish-id]");
      if (!row) return;
      const wishId = row.dataset.wishId;

      if (event.target.closest("[data-delete-wish]")) {
        deleteWish(wishId);
        return;
      }

      if (event.target.closest("[data-toggle-wish]")) {
        toggleWish(wishId, event);
      }
    });

    $("#lightboxPrev")?.addEventListener("click", () => stepLightbox(-1));
    $("#lightboxNext")?.addEventListener("click", () => stepLightbox(1));

    $("#lightboxDelete")?.addEventListener("click", () => {
      const item = lightboxItems[lightboxIndex];
      if (item) deletePhoto(item.id, true);
    });

    $("#settingsForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const nameA = $("#settingNameA").value.trim();
      const nameB = $("#settingNameB").value.trim();
      const startDate = $("#settingStartDate").value;
      const city = $("#settingCity").value.trim();
      const quote = $("#settingQuote").value.trim();

      if (!nameA || !nameB) {
        showToast("先写下你们的名字吧", "error");
        return;
      }

      if (!isValidISODate(startDate)) {
        showToast("相恋纪念日还没有选好", "error");
        return;
      }

      if (parseISODate(startDate) > startOfDay()) {
        showToast("相恋纪念日要选今天或更早哦", "error");
        return;
      }

      const previousCouple = state.couple;
      const nextCouple = {
        nameA: nameA.slice(0, 12),
        nameB: nameB.slice(0, 12),
        startDate,
        city: city.slice(0, 20) || DEFAULT_COUPLE.city,
        quote: quote.slice(0, 100) || defaultQuoteFor(startDate)
      };

      state.couple = nextCouple;
      if (!(await persistState())) {
        state.couple = previousCouple;
        showToast(saveErrorMessage("保存失败"), "error");
        return;
      }

      applyCouple();
      refreshAll(true);
      renderTimeline();
      renderNotes();
      closeModal($("#settingsModal"));
      showToast("我们的故事已更新");
    });

    $("#photoForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (selectedFiles.length === 0) {
        showToast("先选择一张照片吧");
        return;
      }

      if (state.photos.length + selectedFiles.length > MAX_PHOTOS) {
        showToast(`相册最多保存 ${MAX_PHOTOS} 张照片，请先移除一些旧照片`, "error");
        return;
      }

      const submitButton = $("#photoSubmit");
      const caption = $("#photoCaption").value.trim().slice(0, 40) || "未命名的瞬间";
      const date = isValidISODate($("#photoDate").value) ? $("#photoDate").value : todayISO();
      const category = CATEGORIES.includes($("#photoCategory").value) ? $("#photoCategory").value : "日常";

      submitButton.disabled = true;
      submitButton.textContent = "正在冲洗…";
      uploadInProgress = true;

      try {
        const additions = [];
        for (const item of selectedFiles) {
          const compressed = await compressImage(item.file);
          additions.push({
            id: uid("photo"),
            src: compressed.src,
            caption,
            date,
            category,
            alt: `${caption}，${formatDateShort(date)}`,
            width: compressed.width,
            height: compressed.height
          });
        }

        const nextState = {
          ...state,
          photos: [...additions, ...state.photos]
        };

        if (!(await persistState(nextState))) throw new Error("SAVE");

        state = nextState;
        activeFilter = "全部";
        renderPhotos();
        refreshCounts();
        uploadInProgress = false;
        closeModal($("#photoModal"));
        burstHearts(window.innerWidth / 2, window.innerHeight * 0.52, 9);
        showToast(`已把 ${additions.length} 个瞬间放进相册`);
      } catch (error) {
        uploadInProgress = false;
        if (error.message === "SAVE") {
          showToast(saveErrorMessage("照片没有保存"), "error");
        } else {
          showToast("这张照片处理失败了，换一张 JPG 或 PNG 再试试", "error");
        }
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "冲洗出来";
      }
    });

    $("#uploadZone")?.addEventListener("click", () => $("#photoInput")?.click());
    $("#uploadZone")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        $("#photoInput")?.click();
      }
    });

    $("#photoInput")?.addEventListener("change", (event) => {
      addSelectedFiles(event.target.files);
      event.target.value = "";
    });

    const uploadZone = $("#uploadZone");
    ["dragenter", "dragover"].forEach((eventName) => {
      uploadZone?.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploadZone.classList.add("is-dragover");
      });
    });
    ["dragleave", "drop"].forEach((eventName) => {
      uploadZone?.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploadZone.classList.remove("is-dragover");
        if (eventName === "drop" && event.dataTransfer) addSelectedFiles(event.dataTransfer.files);
      });
    });

    $("#uploadPreview")?.addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-remove-file]");
      if (!removeButton) return;
      const item = selectedFiles.find((file) => file.id === removeButton.dataset.removeFile);
      if (item) URL.revokeObjectURL(item.url);
      selectedFiles = selectedFiles.filter((file) => file.id !== removeButton.dataset.removeFile);
      renderUploadPreview();
    });

    $("#noteText")?.addEventListener("input", (event) => {
      setText("#noteCharCount", event.target.value.length);
    });

    $("#noteText")?.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        $("#noteForm")?.requestSubmit();
      }
    });

    $("#noteForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const text = $("#noteText").value.trim();
      if (!text) {
        showToast("纸条还没有内容呢");
        return;
      }

      const by = $('input[name="noteAuthor"]:checked')?.value === "b" ? "b" : "a";
      const note = {
        id: uid("note"),
        by,
        text: text.slice(0, 240),
        date: todayISO()
      };

      const nextState = { ...state, notes: [note, ...state.notes] };
      if (!(await persistState(nextState))) {
        showToast(saveErrorMessage("放不进信箱"), "error");
        return;
      }

      state = nextState;
      renderNotes();
      refreshCounts();

      $("#noteForm").reset();
      $("#noteText").value = "";
      setText("#noteCharCount", "0");
      closeModal($("#noteModal"));
      showToast("纸条已经放进信箱了");
    });

    $("#wishForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = $("#wishInput");
      const text = input.value.trim();
      if (!text) {
        input.focus();
        showToast("先写下一个小愿望吧");
        return;
      }

      const nextState = {
        ...state,
        wishes: [...state.wishes, { id: uid("wish"), text: text.slice(0, 60), done: false }]
      };

      if (!(await persistState(nextState))) {
        showToast(saveErrorMessage("保存失败"), "error");
        return;
      }

      state = nextState;
      input.value = "";
      renderWishes();
      refreshCounts();
      input.focus();
      showToast("心愿已加入清单");
    });

    $("#exportBtn")?.addEventListener("click", exportBackup);
    $("#importBtn")?.addEventListener("click", () => $("#importInput")?.click());
    $("#importInput")?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) importBackup(file);
    });

    $("#resetBtn")?.addEventListener("click", async () => {
      if (!window.confirm(`恢复示例会清空${remoteActive ? "云端" : "这台设备"}上的所有照片、纸条和心愿，确定吗？`)) return;

      const previous = state;
      state = createDefaultState();
      if (!(await persistState())) {
        state = previous;
        showToast(saveErrorMessage("恢复失败"), "error");
        return;
      }

      activeFilter = "全部";
      applyCouple();
      renderPhotos();
      renderNotes();
      renderWishes();
      renderTimeline();
      refreshAll(true);
      closeModal($("#settingsModal"));
      showToast("已恢复示例内容");
    });

    $("#syncState")?.addEventListener("click", () => {
      if (!remoteActive) return;
      syncFromCloud(true);
    });

    $("#logoutBtn")?.addEventListener("click", async () => {
      if (!remoteActive) return;
      if (!window.confirm("退出云端账号？这台设备将看不到共享内容，下次需要重新登录。")) return;

      stopRemotePolling();
      await cloud.signOut();
      window.location.reload();
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateHeaderAndNav, { passive: true });

    document.addEventListener("keydown", (event) => {
      const lightbox = $("#lightbox");
      const lightboxOpen = lightbox && !lightbox.hidden && lightbox.classList.contains("is-open");

      if (event.key === "Escape") {
        if (lightboxOpen) {
          closeLightbox();
          return;
        }
        if (activeModal) {
          closeModal(activeModal);
          return;
        }
        if ($("#mobileNav").classList.contains("is-open")) closeMenu();
        return;
      }

      if (lightboxOpen && event.key === "ArrowLeft") {
        event.preventDefault();
        stepLightbox(-1);
        return;
      }

      if (lightboxOpen && event.key === "ArrowRight") {
        event.preventDefault();
        stepLightbox(1);
        return;
      }

      if (event.key === "Tab") {
        if (lightboxOpen) {
          trapFocus(event, lightbox);
        } else if (activeModal) {
          trapFocus(event, activeModal);
        } else if ($("#mobileNav").classList.contains("is-open")) {
          trapFocus(event, $("#mobileNav"));
        }
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        const nowDay = todayISO();
        if (nowDay !== currentDay) {
          refreshAll(false);
          renderTimeline();
        }
        if (remoteActive) syncFromCloud(false);
      }
    });

    window.addEventListener("focus", () => {
      if (remoteActive) syncFromCloud(false);
    });

    window.addEventListener("online", () => {
      if (!remoteActive) return;
      setSyncStatus("synced", "已同步");
      syncFromCloud(false);
    });

    window.addEventListener("offline", () => {
      if (remoteActive) setSyncStatus("offline", "离线");
    });
  }

  /* ---------- Cloud lifecycle ---------- */

  function renderAppFromState(animateDays = false) {
    if (!state) return;
    applyCouple();
    renderPhotos();
    renderNotes();
    renderWishes();
    renderTimeline();
    refreshAll(animateDays);
  }

  function startApp() {
    if (appStarted) return;
    appStarted = true;

    bindEvents();
    renderAppFromState(true);

    $("#settingStartDate").max = todayISO();
    $("#photoDate").value = todayISO();

    createPetals();
    setupReveal();
    setupClock();
    updateHeaderAndNav();
    updateCloudUI();

    if (remoteActive) {
      setSyncStatus("synced", "已同步");
      startRemotePolling();
    } else if (!storage) {
      window.setTimeout(() => {
        showToast("当前浏览器无法保存本地数据，这次修改只会在本页有效。建议使用 Chrome 或 Edge 打开。", "error");
      }, 900);
    }
  }

  function startRemotePolling() {
    stopRemotePolling();
    if (!remoteActive) return;
    remotePollTimer = window.setInterval(() => syncFromCloud(false), 20000);
  }

  function stopRemotePolling() {
    if (remotePollTimer) {
      window.clearInterval(remotePollTimer);
      remotePollTimer = null;
    }
  }

  function handleRemoteAuthLost(error) {
    remoteLastError = error || remoteLastError;
    stopRemotePolling();

    if (!appStarted) {
      showAuthGate(cloud && cloud.friendlyError ? cloud.friendlyError(error) : "云端登录已过期，请重新登录。");
      return;
    }

    if (authReloadScheduled) return;
    authReloadScheduled = true;
    remoteActive = false;
    updateCloudUI();
    showToast("云端登录已过期，请重新登录。", "error");
    window.setTimeout(() => window.location.reload(), 1500);
  }

  async function syncFromCloud(manual = false) {
    if (!remoteActive || remoteSaving || uploadInProgress || remotePollInFlight) return;
    if (!cloud || !cloud.hasSession() || document.hidden) return;
    if (!manual && (activeModal || !$("#lightbox").hidden)) return;
    if (!manual && Date.now() - lastRemoteSyncAt < 8000) return;

    lastRemoteSyncAt = Date.now();
    remotePollInFlight = true;
    if (manual) setSyncStatus("connecting", "检查中");

    try {
      const row = await cloud.loadState();
      if (!row.exists) {
        setSyncStatus("synced", "已同步");
        return;
      }

      if (row.updatedAt && row.updatedAt !== remoteUpdatedAt) {
        const incoming = normalizeState(row.state);
        remoteUpdatedAt = row.updatedAt;

        if (JSON.stringify(incoming) !== JSON.stringify(state)) {
          state = incoming;
          renderAppFromState(false);
          showToast("已同步最新的内容");
        }
      }

      remoteLastError = null;
      setSyncStatus("synced", "已同步");
      if (manual) showToast("已经是最新的啦");
    } catch (error) {
      remoteLastError = error;
      if (error && (error.status === 401 || error.status === 403)) {
        handleRemoteAuthLost(error);
      } else if (error && error.code === "NETWORK") {
        setSyncStatus("offline", "离线");
      } else {
        setSyncStatus("error", "同步失败");
      }
      if (manual) {
        showToast(cloud.friendlyError(error), "error");
      }
    } finally {
      remotePollInFlight = false;
    }
  }

  function setupAuthForm() {
    const form = $("#authForm");
    if (!form || form.dataset.bound === "true") return;
    form.dataset.bound = "true";

    document.addEventListener("keydown", (event) => {
      const gate = $("#authGate");
      if (!gate || gate.hidden) return;
      if (event.key === "Tab") trapFocus(event, gate);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (authInFlight) return;

      const email = $("#authEmail").value.trim();
      const password = $("#authPassword").value;

      if (!email || !password) {
        setAuthError("先填写邮箱和密码。");
        return;
      }

      authInFlight = true;
      setAuthBusy(true);
      setAuthError("");
      showBoot();

      try {
        await cloud.signIn(email, password);
        const row = await cloud.loadState();

        if (row.exists) {
          state = normalizeState(row.state);
          remoteUpdatedAt = row.updatedAt;
        } else {
          state = createDefaultState();
          const saved = await cloud.saveState(state);
          remoteUpdatedAt = saved.updated_at;
        }

        remoteActive = true;
        remoteLastError = null;
        $("#authPassword").value = "";

        if (!appStarted) {
          startApp();
        } else {
          renderAppFromState(false);
          updateCloudUI();
          setSyncStatus("synced", "已同步");
          startRemotePolling();
        }

        hideBoot();
        hideAuthGate();
        showToast("欢迎回来，这里一直为你们留着");
      } catch (error) {
        console.error("[朝暮] cloud sign-in failed", error);
        hideBoot();
        setAuthError(cloud.friendlyError(error));
      } finally {
        authInFlight = false;
        setAuthBusy(false);
      }
    });
  }

  async function loadRemoteInitialState() {
    const restored = await cloud.restoreSession();
    if (!restored) {
      showAuthGate("");
      return false;
    }

    try {
      const row = await cloud.loadState();
      if (row.exists) {
        state = normalizeState(row.state);
        remoteUpdatedAt = row.updatedAt;
      } else {
        state = createDefaultState();
        const saved = await cloud.saveState(state);
        remoteUpdatedAt = saved.updated_at;
      }
    } catch (error) {
      console.error("[朝暮] cloud load failed", error);
      showAuthGate(cloud.friendlyError(error));
      return false;
    }

    remoteActive = true;
    remoteLastError = null;
    return true;
  }

  /* ---------- Init ---------- */

  async function init() {
    document.body.classList.add("motion-ready");

    if (cloudAvailable) {
      cloud.onAuthLost(handleRemoteAuthLost);
      setupAuthForm();
      showBoot();

      if (!(await loadRemoteInitialState())) {
        hideBoot();
        return;
      }

      hideBoot();
      hideAuthGate();
      startApp();
      setSyncStatus("synced", "已同步");
      return;
    }

    state = loadState();
    if (!hadStoredData) await persistState(state);
    startApp();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init().catch((error) => {
        console.error("[朝暮] init failed", error);
        hideBoot();
        showAuthGate("页面打开失败了，请刷新重试。");
      });
    }, { once: true });
  } else {
    init().catch((error) => {
      console.error("[朝暮] init failed", error);
      hideBoot();
      showAuthGate("页面打开失败了，请刷新重试。");
    });
  }
})();
