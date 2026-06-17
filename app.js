const themes = [
  { id: "obsidian", label: "\u66dc\u77f3" },
  { id: "graphite", label: "\u77f3\u58a8" },
  { id: "midnight-green", label: "\u591c\u7eff" },
  { id: "warm-mono", label: "\u6696\u8272" },
  { id: "terminal", label: "\u7ec8\u7aef" },
  { id: "paper-dark", label: "\u7eb8\u58a8" },
];

const displayStyles = [
  { id: "digital", label: "\u6570\u5b57" },
  { id: "flip", label: "\u7ffb\u9875" },
  { id: "nixie", label: "\u8f89\u5149\u7ba1" },
  { id: "dot", label: "\u70b9\u9635" },
];

const driftLevels = [
  { id: "off", label: "\u5173\u95ed", rangeX: 0, rangeY: 0, interval: 0 },
  { id: "light", label: "\u8f7b\u5fae", rangeX: 32, rangeY: 22, interval: 5 * 60 * 1000 },
  { id: "strong", label: "\u660e\u663e", rangeX: 90, rangeY: 56, interval: 3 * 60 * 1000 },
];

const defaultSettings = {
  theme: "obsidian",
  displayStyle: "digital",
  use24Hour: true,
  showSeconds: false,
  scale: 1,
  brightness: 1,
  driftLevel: "light",
  positionX: 0,
  positionY: 0,
};

const storageKey = "idle-clock-settings-v2";
const legacyStorageKey = "idle-clock-settings-v1";
const scaleMin = 0.72;
const scaleMax = 2;
const scaleStep = 0.08;
const positionMin = -35;
const positionMax = 35;
const weekdayNames = [
  "\u661f\u671f\u65e5",
  "\u661f\u671f\u4e00",
  "\u661f\u671f\u4e8c",
  "\u661f\u671f\u4e09",
  "\u661f\u671f\u56db",
  "\u661f\u671f\u4e94",
  "\u661f\u671f\u516d",
];

const elements = {
  time: document.querySelector("#time"),
  date: document.querySelector("#date"),
  controls: document.querySelector("#controls"),
  themeName: document.querySelector("#themeName"),
  styleName: document.querySelector("#styleName"),
  hourMode: document.querySelector("#hourMode"),
  secondsMode: document.querySelector("#secondsMode"),
  driftMode: document.querySelector("#driftMode"),
  brightness: document.querySelector("#brightness"),
  positionX: document.querySelector("#positionX"),
  positionY: document.querySelector("#positionY"),
};

let settings = loadSettings();
let clockTimer = 0;
let idleTimer = 0;
let driftTimer = 0;
let controlsPinnedHidden = false;
let lastRenderedText = "";

function pad(value) {
  return String(value).padStart(2, "0");
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function readStoredSettings() {
  return localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey);
}

function loadSettings() {
  try {
    const raw = readStoredSettings();
    if (!raw) return { ...defaultSettings };

    const parsed = JSON.parse(raw);
    const themeIds = themes.map((theme) => theme.id);
    const styleIds = displayStyles.map((style) => style.id);
    const driftLevelIds = driftLevels.map((level) => level.id);
    const driftLevel = driftLevelIds.includes(parsed.driftLevel)
      ? parsed.driftLevel
      : parsed.drift === false
        ? "off"
        : defaultSettings.driftLevel;

    return {
      theme: themeIds.includes(parsed.theme) ? parsed.theme : defaultSettings.theme,
      displayStyle: styleIds.includes(parsed.displayStyle) ? parsed.displayStyle : defaultSettings.displayStyle,
      use24Hour: typeof parsed.use24Hour === "boolean" ? parsed.use24Hour : defaultSettings.use24Hour,
      showSeconds: typeof parsed.showSeconds === "boolean" ? parsed.showSeconds : defaultSettings.showSeconds,
      scale: clampNumber(parsed.scale, scaleMin, scaleMax, defaultSettings.scale),
      brightness: clampNumber(parsed.brightness, 0.45, 1.15, defaultSettings.brightness),
      driftLevel,
      positionX: clampNumber(parsed.positionX, positionMin, positionMax, defaultSettings.positionX),
      positionY: clampNumber(parsed.positionY, positionMin, positionMax, defaultSettings.positionY),
    };
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings() {
  localStorage.setItem(storageKey, JSON.stringify(settings));
}

function formatTime(date, state) {
  let hours = date.getHours();
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  let suffix = "";

  if (!state.use24Hour) {
    suffix = hours < 12 ? " AM" : " PM";
    hours = hours % 12 || 12;
  }

  const base = `${pad(hours)}:${minutes}`;
  return `${base}${state.showSeconds ? `:${seconds}` : ""}${suffix}`;
}

function formatDate(date) {
  return `${date.getMonth() + 1}\u6708${date.getDate()}\u65e5 ${weekdayNames[date.getDay()]}`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderStyledTime(text) {
  if (settings.displayStyle === "digital") {
    elements.time.textContent = text;
    return;
  }

  const chars = [...text];
  elements.time.innerHTML = chars
    .map((char, index) => {
      if (char === " ") return '<span class="time-space" aria-hidden="true"></span>';

      const role = /[0-9]/.test(char) ? "digit" : char === ":" ? "separator" : "suffix";
      const changed = lastRenderedText[index] !== char ? " is-changing" : "";
      return `<span class="time-char ${role}${changed}">${escapeHtml(char)}</span>`;
    })
    .join("");
}

function renderClock() {
  const now = new Date();
  const text = formatTime(now, settings);
  renderStyledTime(text);
  elements.date.textContent = formatDate(now);
  lastRenderedText = text;
}

function scheduleClock() {
  window.clearTimeout(clockTimer);
  renderClock();

  if (settings.showSeconds) {
    const delay = 1000 - new Date().getMilliseconds();
    clockTimer = window.setTimeout(scheduleClock, delay);
    return;
  }

  const now = new Date();
  const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  clockTimer = window.setTimeout(scheduleClock, delay);
}

function applySettings() {
  const theme = themes.find((item) => item.id === settings.theme) || themes[0];
  const displayStyle = displayStyles.find((item) => item.id === settings.displayStyle) || displayStyles[0];
  const driftLevel = driftLevels.find((item) => item.id === settings.driftLevel) || driftLevels[1];

  document.body.dataset.theme = theme.id;
  document.body.dataset.style = displayStyle.id;
  document.body.dataset.seconds = String(settings.showSeconds);
  document.documentElement.style.setProperty("--scale", settings.scale.toFixed(2));
  document.documentElement.style.setProperty("--brightness", settings.brightness.toFixed(2));
  document.documentElement.style.setProperty("--position-x", `${settings.positionX}vw`);
  document.documentElement.style.setProperty("--position-y", `${settings.positionY}vh`);

  elements.themeName.textContent = theme.label;
  elements.styleName.textContent = displayStyle.label;
  elements.hourMode.textContent = settings.use24Hour ? "24H" : "12H";
  elements.secondsMode.textContent = settings.showSeconds ? "\u79d2\u5f00" : "\u79d2\u5173";
  elements.driftMode.textContent = driftLevel.label;
  elements.brightness.value = settings.brightness;
  elements.positionX.value = settings.positionX;
  elements.positionY.value = settings.positionY;

  if (settings.driftLevel === "off") {
    setDrift(0, 0);
  }

  lastRenderedText = "";
  scheduleClock();
  scheduleDrift();
}

function updateSettings(nextSettings) {
  settings = { ...settings, ...nextSettings };
  saveSettings();
  applySettings();
}

function moveById(items, currentId, direction) {
  const currentIndex = items.findIndex((item) => item.id === currentId);
  const nextIndex = (currentIndex + direction + items.length) % items.length;
  return items[nextIndex].id;
}

function moveTheme(direction) {
  updateSettings({ theme: moveById(themes, settings.theme, direction) });
}

function moveDisplayStyle(direction) {
  updateSettings({ displayStyle: moveById(displayStyles, settings.displayStyle, direction) });
}

function moveDriftLevel(direction) {
  setDrift(0, 0);
  updateSettings({ driftLevel: moveById(driftLevels, settings.driftLevel, direction) });
}

function setDrift(x, y) {
  document.documentElement.style.setProperty("--drift-x", `${x}px`);
  document.documentElement.style.setProperty("--drift-y", `${y}px`);
}

function scheduleDrift() {
  window.clearInterval(driftTimer);

  const driftLevel = driftLevels.find((item) => item.id === settings.driftLevel) || driftLevels[1];

  if (driftLevel.id === "off" || document.hidden) {
    return;
  }

  driftTimer = window.setInterval(() => {
    const x = Math.round((Math.random() - 0.5) * driftLevel.rangeX);
    const y = Math.round((Math.random() - 0.5) * driftLevel.rangeY);
    setDrift(x, y);
  }, driftLevel.interval);
}

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }

  await document.documentElement.requestFullscreen();
}

function showControls() {
  controlsPinnedHidden = false;
  document.body.classList.remove("is-idle", "controls-hidden");
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    document.body.classList.add("is-idle");
  }, 2000);
}

function hideControls() {
  controlsPinnedHidden = true;
  document.body.classList.add("controls-hidden");
}

function handleAction(action) {
  switch (action) {
    case "fullscreen":
      toggleFullscreen().catch(() => {});
      break;
    case "theme-prev":
      moveTheme(-1);
      break;
    case "theme-next":
      moveTheme(1);
      break;
    case "display-next":
      moveDisplayStyle(1);
      break;
    case "toggle-hour":
      updateSettings({ use24Hour: !settings.use24Hour });
      break;
    case "toggle-seconds":
      updateSettings({ showSeconds: !settings.showSeconds });
      break;
    case "scale-down":
      updateSettings({ scale: clampNumber(settings.scale - scaleStep, scaleMin, scaleMax, 1) });
      break;
    case "scale-up":
      updateSettings({ scale: clampNumber(settings.scale + scaleStep, scaleMin, scaleMax, 1) });
      break;
    case "toggle-drift":
      moveDriftLevel(1);
      break;
    case "reset-position":
      setDrift(0, 0);
      updateSettings({ positionX: 0, positionY: 0 });
      break;
    case "hide-controls":
      hideControls();
      break;
    default:
      break;
  }
}

elements.controls.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  handleAction(button.dataset.action);
});

elements.brightness.addEventListener("input", (event) => {
  updateSettings({ brightness: clampNumber(event.target.value, 0.45, 1.15, 1) });
});

elements.positionX.addEventListener("input", (event) => {
  updateSettings({ positionX: clampNumber(event.target.value, positionMin, positionMax, 0) });
});

elements.positionY.addEventListener("input", (event) => {
  updateSettings({ positionY: clampNumber(event.target.value, positionMin, positionMax, 0) });
});

window.addEventListener("mousemove", showControls);
window.addEventListener("pointerdown", showControls);

window.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

  if (controlsPinnedHidden) {
    showControls();
  } else {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => document.body.classList.add("is-idle"), 2000);
  }

  switch (event.key.toLowerCase()) {
    case "f":
      event.preventDefault();
      toggleFullscreen().catch(() => {});
      break;
    case "t":
      event.preventDefault();
      moveTheme(1);
      break;
    case "v":
      event.preventDefault();
      moveDisplayStyle(1);
      break;
    case "s":
      event.preventDefault();
      updateSettings({ showSeconds: !settings.showSeconds });
      break;
    case "c":
      event.preventDefault();
      setDrift(0, 0);
      updateSettings({ positionX: 0, positionY: 0 });
      break;
    case "h":
      event.preventDefault();
      hideControls();
      break;
    default:
      break;
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    window.clearInterval(driftTimer);
    return;
  }
  scheduleClock();
  scheduleDrift();
});

applySettings();
showControls();
