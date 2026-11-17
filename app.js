// MultiTool Hub — Warm Editorial SaaS Application Architecture
// Zero-Trust Safe DOM Construction, Local Persistence, and Strict Origin Sandboxing.

// ─────────────────────────────────────────────────────────────────────────────
// 1. SERVICE WORKER REGISTRATION (OFFLINE SHELL)
// ─────────────────────────────────────────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(function () {});
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SECURE CLIENT PERSISTENCE WRAPPER
// Protects against unhandled storage exceptions in strict privacy contexts.
// ─────────────────────────────────────────────────────────────────────────────
const safeStorage = {
  getItem: function (key) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (err) {}
    return null;
  },
  setItem: function (key, value) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, String(value));
      }
    } catch (err) {}
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. STRICT TOOL URL VALIDATOR
// Mandatory HTTPS, blocks loopback/localhost, private subnets, credentials.
// ─────────────────────────────────────────────────────────────────────────────
const APPROVED_TOOL_ORIGINS = new Set([
  "https://metaclean-4k.vercel.app",
  "https://sendanywhere-lite.onrender.com"
]);

function isValidToolUrl(urlString) {
  if (!urlString || typeof urlString !== "string") {
    return false;
  }
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "https:") return false;
    if (parsed.username || parsed.password) return false;
    if (parsed.port && parsed.port !== "443" && parsed.port !== "") return false;

    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return false;
    }

    if (hostname.startsWith("10.") || hostname.startsWith("192.168.")) {
      return false;
    }
    const ip172Match = hostname.match(/^172\.(\d+)\./);
    if (ip172Match) {
      const octet = parseInt(ip172Match[1], 10);
      if (octet >= 16 && octet <= 31) return false;
    }

    return APPROVED_TOOL_ORIGINS.has(parsed.origin);
  } catch (err) {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CENTRAL TOOL & CATEGORY REGISTRIES
// ─────────────────────────────────────────────────────────────────────────────
const TOOLS_DATA = [
  {
    id: "metaclean",
    title: "MetaClean 4K",
    description: "Strip EXIF, XMP, IPTC and C2PA metadata from images without altering visual pixels.",
    url: "https://metaclean-4k.vercel.app/",
    categories: ["file", "security"],
    tags: ["JPEG", "PNG", "WEBP", "TIFF", "+3"],
    live: true,
    featured: true,
    iconId: "image",
    iconBoxClass: "tool-icon--orange",
    artImg: "/assets/images/tools/metaclean-art.svg"
  },
  {
    id: "sendanywhere",
    title: "Send Anywhere",
    description: "Transfer any file to anyone with a 6-digit key. AES-256-GCM encrypted and auto-expiring.",
    url: "https://sendanywhere-lite.onrender.com",
    categories: ["file", "security", "network"],
    tags: ["Any File", "Up to 3 GB", "30 min"],
    live: true,
    featured: true,
    iconId: "send",
    iconBoxClass: "tool-icon--blue",
    artImg: "/assets/images/tools/sendanywhere-art.svg"
  },
  {
    id: "ytmp",
    title: "YTmp3/4",
    description: "Convert YouTube videos to MP4 or MP3 with multiple quality options.",
    url: "", // In development — zero loopback destination
    categories: ["media"],
    tags: ["MP4", "MP3", "Up to 4K", "320 kbps"],
    live: false, // Inactive until verified production deployment
    featured: true,
    iconId: "music",
    iconBoxClass: "tool-icon--rose",
    artImg: "/assets/images/tools/ytmp34-art.svg"
  }
];

const CATEGORIES_DATA = [
  {
    id: "file",
    name: "File Utilities",
    iconClass: "cat-icon--blue",
    iconId: "folder"
  },
  {
    id: "security",
    name: "Privacy & Security",
    iconClass: "cat-icon--rose",
    iconId: "shield"
  },
  {
    id: "network",
    name: "Network Tools",
    iconClass: "cat-icon--green",
    iconId: "wifi"
  },
  {
    id: "developer",
    name: "Developer Tools",
    iconClass: "cat-icon--purple",
    iconId: "code"
  },
  {
    id: "media",
    name: "Media Tools",
    iconClass: "cat-icon--magenta",
    iconId: "play"
  },
  {
    id: "all",
    name: "All Tools",
    iconClass: "cat-icon--neutral",
    iconId: "grid"
  }
];

const ALLOWED_CATEGORY_IDS = new Set(["file", "security", "network", "developer", "media", "all"]);

// ─────────────────────────────────────────────────────────────────────────────
// 5. FAVORITES MANAGEMENT SYSTEM (DEVICE-LOCAL STORAGE)
// ─────────────────────────────────────────────────────────────────────────────
const FAVORITES_STORAGE_KEY = "multitool_favorites";

function getFavorites() {
  try {
    const raw = safeStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(function (id) {
        return typeof id === "string" && TOOLS_DATA.some(function (t) { return t.id === id; });
      });
    }
  } catch (err) {}
  return [];
}

function isFavorite(toolId) {
  return getFavorites().includes(toolId);
}

function toggleFavorite(toolId) {
  const current = getFavorites();
  let updated;
  let added = false;
  if (current.includes(toolId)) {
    updated = current.filter(function (id) { return id !== toolId; });
    added = false;
  } else {
    updated = current.concat([toolId]);
    added = true;
  }
  safeStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
  updateFavBadge();

  // Update heart buttons in DOM
  document.querySelectorAll('.tool-fav-btn[data-tool-id="' + toolId + '"]').forEach(function (btn) {
    btn.classList.toggle("favorited", added);
    btn.setAttribute("aria-label", added ? "Remove from favorites" : "Add to favorites");
    btn.replaceChildren(createHeartSvg(added));
  });

  // Re-render favorites view if currently open
  const favView = document.getElementById("favoritesView");
  if (favView && !favView.classList.contains("view-hidden")) {
    renderFavoritesGrid();
  }

  showToast(added ? "Added to your saved favorites" : "Removed from favorites");
}

function updateFavBadge() {
  const badge = document.getElementById("favBadge");
  if (!badge) return;
  const count = getFavorites().length;
  if (count > 0) {
    badge.textContent = String(count);
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SAFE SVG DOM GENERATOR
// Programmatic createElementNS construction with zero innerHTML interpolation.
// ─────────────────────────────────────────────────────────────────────────────
const SVG_NS = "http://www.w3.org/2000/svg";

function createSvgElement(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (const key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) {
        el.setAttribute(key, attrs[key]);
      }
    }
  }
  return el;
}

function createHeartSvg(filled) {
  const svg = createSvgElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: filled ? "#FF941F" : "none",
    stroke: filled ? "#FF941F" : "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  });
  svg.appendChild(createSvgElement("path", {
    d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
  }));
  return svg;
}

function renderSafeSvgIcon(iconId, size) {
  const s = String(size || 20);
  const svg = createSvgElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  });

  switch (iconId) {
    case "image":
      svg.appendChild(createSvgElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }));
      svg.appendChild(createSvgElement("circle", { cx: "8.5", cy: "8.5", r: "1.5" }));
      svg.appendChild(createSvgElement("polyline", { points: "21 15 16 10 5 21" }));
      break;

    case "send":
      svg.appendChild(createSvgElement("line", { x1: "22", y1: "2", x2: "11", y2: "13" }));
      svg.appendChild(createSvgElement("polygon", { points: "22 2 15 22 11 13 2 9 22 2" }));
      break;

    case "music":
      svg.appendChild(createSvgElement("circle", { cx: "9", cy: "18", r: "3" }));
      svg.appendChild(createSvgElement("circle", { cx: "18", cy: "16", r: "3" }));
      svg.appendChild(createSvgElement("path", { d: "M12 18V5l9-2v11" }));
      break;

    case "folder":
      svg.appendChild(createSvgElement("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }));
      break;

    case "shield":
      svg.appendChild(createSvgElement("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }));
      break;

    case "wifi":
      svg.appendChild(createSvgElement("path", { d: "M5 12.55a11 11 0 0 1 14.08 0" }));
      svg.appendChild(createSvgElement("path", { d: "M1.42 9a16 16 0 0 1 21.16 0" }));
      svg.appendChild(createSvgElement("path", { d: "M8.53 16.11a6 6 0 0 1 6.95 0" }));
      svg.appendChild(createSvgElement("line", { x1: "12", y1: "20", x2: "12.01", y2: "20" }));
      break;

    case "code":
      svg.appendChild(createSvgElement("polyline", { points: "16 18 22 12 16 6" }));
      svg.appendChild(createSvgElement("polyline", { points: "8 6 2 12 8 18" }));
      break;

    case "play":
      svg.appendChild(createSvgElement("polygon", { points: "5 3 19 12 5 21 5 3" }));
      break;

    case "grid":
      svg.appendChild(createSvgElement("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1.5" }));
      svg.appendChild(createSvgElement("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1.5" }));
      svg.appendChild(createSvgElement("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1.5" }));
      svg.appendChild(createSvgElement("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1.5" }));
      break;

    case "arrow-up-right":
      svg.setAttribute("stroke-width", "2.5");
      svg.appendChild(createSvgElement("line", { x1: "7", y1: "17", x2: "17", y2: "7" }));
      svg.appendChild(createSvgElement("polyline", { points: "7 7 17 7 17 17" }));
      break;

    default:
      svg.appendChild(createSvgElement("circle", { cx: "12", cy: "12", r: "9" }));
      break;
  }

  return svg;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. COMPONENT BUILDERS (ZERO INNERHTML)
// ─────────────────────────────────────────────────────────────────────────────

function createToolCardElement(tool) {
  const card = document.createElement("article");
  card.className = "tool-card";

  const safeCats = (tool.categories || []).filter(function (c) {
    return ALLOWED_CATEGORY_IDS.has(c);
  });
  card.setAttribute("data-categories", safeCats.join(" "));

  // Head
  const head = document.createElement("div");
  head.className = "tool-card-head";

  const headLeft = document.createElement("div");
  headLeft.className = "tool-card-head-left";

  const iconBox = document.createElement("div");
  iconBox.className = "tool-icon-box " + (tool.iconBoxClass || "tool-icon--orange");
  iconBox.setAttribute("aria-hidden", "true");
  iconBox.appendChild(renderSafeSvgIcon(tool.iconId, 20));
  headLeft.appendChild(iconBox);

  const titleEl = document.createElement("h3");
  titleEl.className = "tool-card-title";
  titleEl.textContent = tool.title;
  headLeft.appendChild(titleEl);

  const isLive = Boolean(tool.live && isValidToolUrl(tool.url));
  const badge = document.createElement("span");
  badge.className = "status-badge " + (isLive ? "badge-live" : "badge-soon");
  badge.textContent = isLive ? "LIVE" : "SOON";
  headLeft.appendChild(badge);

  head.appendChild(headLeft);

  // Favorite Heart Button
  const favBtn = document.createElement("button");
  favBtn.type = "button";
  const favorited = isFavorite(tool.id);
  favBtn.className = "tool-fav-btn" + (favorited ? " favorited" : "");
  favBtn.setAttribute("data-tool-id", tool.id);
  favBtn.setAttribute("aria-label", favorited ? "Remove from favorites" : "Add to favorites");
  favBtn.appendChild(createHeartSvg(favorited));
  favBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(tool.id);
  });
  head.appendChild(favBtn);

  card.appendChild(head);

  // Description
  const descEl = document.createElement("p");
  descEl.className = "tool-card-desc";
  descEl.textContent = tool.description;
  card.appendChild(descEl);

  // Format Tags
  const tagRow = document.createElement("div");
  tagRow.className = "tag-row";
  (tool.tags || []).forEach(function (tag) {
    const tagSpan = document.createElement("span");
    tagSpan.className = "format-tag";
    tagSpan.textContent = tag;
    tagRow.appendChild(tagSpan);
  });
  card.appendChild(tagRow);

  // Footer (Action + Artwork)
  const footer = document.createElement("div");
  footer.className = "tool-card-footer";

  if (isLive) {
    const openBtn = document.createElement("a");
    openBtn.href = tool.url;
    openBtn.target = "_blank";
    openBtn.rel = "noopener noreferrer";
    openBtn.className = "card-btn card-btn--orange";
    openBtn.setAttribute("aria-label", "Open " + tool.title);

    const btnText = document.createElement("span");
    btnText.textContent = "Open Tool";
    openBtn.appendChild(btnText);
    openBtn.appendChild(renderSafeSvgIcon("arrow-up-right", 14));
    footer.appendChild(openBtn);
  } else {
    const disabledBtn = document.createElement("button");
    disabledBtn.type = "button";
    disabledBtn.className = "card-btn card-btn--disabled";
    disabledBtn.disabled = true;
    disabledBtn.setAttribute("aria-disabled", "true");
    disabledBtn.setAttribute("aria-label", tool.title + " Coming Soon");

    const disabledText = document.createElement("span");
    disabledText.textContent = "Coming Soon";
    disabledBtn.appendChild(disabledText);
    footer.appendChild(disabledBtn);
  }

  // Card Illustration
  if (tool.artImg) {
    const artWrap = document.createElement("div");
    artWrap.className = "card-art-wrap";
    const art = document.createElement("img");
    art.src = tool.artImg;
    art.alt = "";
    art.className = "card-art-img";
    art.width = 96;
    art.height = 80;
    art.setAttribute("loading", "lazy");
    art.setAttribute("aria-hidden", "true");
    artWrap.appendChild(art);
    footer.appendChild(artWrap);
  }

  card.appendChild(footer);
  return card;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. DOM READY INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {

  // Views & Navigation Elements
  const navHome = document.getElementById("navHome");
  const navAllTools = document.getElementById("navAllTools");
  const navCategories = document.getElementById("navCategories");
  const navFavorites = document.getElementById("navFavorites");

  const bnavHome = document.getElementById("bnavHome");
  const bnavAllTools = document.getElementById("bnavAllTools");
  const bnavFavorites = document.getElementById("bnavFavorites");

  const mainDashboardView = document.getElementById("mainDashboardView");
  const allToolsView = document.getElementById("allToolsView");
  const favoritesView = document.getElementById("favoritesView");

  function setActiveView(viewName) {
    // Unset active class on all nav items
    [navHome, navAllTools, navCategories, navFavorites].forEach(function (btn) {
      if (btn) btn.classList.remove("active");
    });
    [bnavHome, bnavAllTools, bnavFavorites].forEach(function (btn) {
      if (btn) btn.classList.remove("active");
    });

    // Hide all view containers
    if (mainDashboardView) mainDashboardView.classList.add("view-hidden");
    if (allToolsView) allToolsView.classList.add("view-hidden");
    if (favoritesView) favoritesView.classList.add("view-hidden");

    if (viewName === "all-tools") {
      if (navAllTools) navAllTools.classList.add("active");
      if (bnavAllTools) bnavAllTools.classList.add("active");
      if (allToolsView) allToolsView.classList.remove("view-hidden");
      renderAllToolsGrid("all");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (viewName === "favorites") {
      if (navFavorites) navFavorites.classList.add("active");
      if (bnavFavorites) bnavFavorites.classList.add("active");
      if (favoritesView) favoritesView.classList.remove("view-hidden");
      renderFavoritesGrid();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (viewName === "categories") {
      if (navCategories) navCategories.classList.add("active");
      if (mainDashboardView) mainDashboardView.classList.remove("view-hidden");
      const catSec = document.getElementById("categoriesSection");
      if (catSec) {
        catSec.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // Default: Home
      if (navHome) navHome.classList.add("active");
      if (bnavHome) bnavHome.classList.add("active");
      if (mainDashboardView) mainDashboardView.classList.remove("view-hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Close mobile drawer if open
    closeMobileDrawer();
  }

  // Sidebar Nav Click Listeners
  if (navHome) navHome.addEventListener("click", function () { setActiveView("home"); });
  if (navAllTools) navAllTools.addEventListener("click", function () { setActiveView("all-tools"); });
  if (navCategories) navCategories.addEventListener("click", function () { setActiveView("categories"); });
  if (navFavorites) navFavorites.addEventListener("click", function () { setActiveView("favorites"); });

  // Mobile Bottom Nav Click Listeners
  if (bnavHome) bnavHome.addEventListener("click", function () { setActiveView("home"); });
  if (bnavAllTools) bnavAllTools.addEventListener("click", function () { setActiveView("all-tools"); });
  if (bnavFavorites) bnavFavorites.addEventListener("click", function () { setActiveView("favorites"); });

  // Hero Actions
  const heroExploreBtn = document.getElementById("heroExploreBtn");
  if (heroExploreBtn) {
    heroExploreBtn.addEventListener("click", function () {
      setActiveView("all-tools");
    });
  }

  const viewAllToolsLink = document.getElementById("viewAllToolsLink");
  if (viewAllToolsLink) {
    viewAllToolsLink.addEventListener("click", function (e) {
      e.preventDefault();
      setActiveView("all-tools");
    });
  }

  const viewAllCatsLink = document.getElementById("viewAllCatsLink");
  if (viewAllCatsLink) {
    viewAllCatsLink.addEventListener("click", function (e) {
      e.preventDefault();
      setActiveView("all-tools");
    });
  }

  // How It Works Modal
  const heroHowBtn = document.getElementById("heroHowBtn");
  const howModal = document.getElementById("howModal");
  const howModalClose = document.getElementById("howModalClose");

  if (heroHowBtn && howModal) {
    heroHowBtn.addEventListener("click", function () {
      if (typeof howModal.showModal === "function") {
        howModal.showModal();
      } else {
        howModal.setAttribute("open", "");
      }
    });
  }

  if (howModalClose && howModal) {
    howModalClose.addEventListener("click", function () {
      if (typeof howModal.close === "function") {
        howModal.close();
      } else {
        howModal.removeAttribute("open");
      }
    });
  }

  if (howModal) {
    howModal.addEventListener("click", function (e) {
      if (e.target === howModal) {
        if (typeof howModal.close === "function") howModal.close();
      }
    });
  }

  // 1. Dynamic Stats Rendering
  function updateStats() {
    const statTools = document.getElementById("statToolsAvailable");
    if (statTools) statTools.textContent = String(TOOLS_DATA.length);
    const statNew = document.getElementById("statNewThisMonth");
    if (statNew) statNew.textContent = String(TOOLS_DATA.length);
  }

  // 2. Dynamic Categories Rendering (6 Cards Row)
  function renderCategories() {
    const catGrid = document.getElementById("categoriesGrid");
    if (!catGrid) return;
    catGrid.replaceChildren();

    CATEGORIES_DATA.forEach(function (cat) {
      const count = cat.id === "all"
        ? TOOLS_DATA.length
        : TOOLS_DATA.filter(function (t) { return t.categories && t.categories.includes(cat.id); }).length;

      const countLabel = count + (count === 1 ? " tool" : " tools");

      const card = document.createElement("button");
      card.type = "button";
      card.className = "category-card";
      card.setAttribute("data-cat", cat.id);
      card.setAttribute("aria-label", "Filter by " + cat.name);

      const iconBox = document.createElement("div");
      iconBox.className = "cat-icon-box " + cat.iconClass;
      iconBox.appendChild(renderSafeSvgIcon(cat.iconId, 18));
      card.appendChild(iconBox);

      const content = document.createElement("div");
      content.className = "cat-content";

      const title = document.createElement("div");
      title.className = "cat-title";
      title.textContent = cat.name;

      const countEl = document.createElement("div");
      countEl.className = "cat-count";
      countEl.textContent = countLabel;

      content.appendChild(title);
      content.appendChild(countEl);
      card.appendChild(content);

      card.addEventListener("click", function () {
        setActiveView("all-tools");
        applyCategoryFilter(cat.id);
      });

      catGrid.appendChild(card);
    });
  }

  // 3. Featured Tools Rendering (3 Columns)
  function renderFeaturedTools() {
    const featuredGrid = document.getElementById("featuredToolsGrid");
    if (!featuredGrid) return;
    featuredGrid.replaceChildren();

    TOOLS_DATA.forEach(function (tool) {
      featuredGrid.appendChild(createToolCardElement(tool));
    });
  }

  // 4. All Tools Directory Filter & Grid Rendering
  function renderFilterPills() {
    const filterRow = document.getElementById("dirFilterRow");
    if (!filterRow) return;
    filterRow.replaceChildren();

    CATEGORIES_DATA.forEach(function (cat) {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "filter-pill" + (cat.id === "all" ? " active" : "");
      pill.setAttribute("data-filter", cat.id);
      pill.textContent = cat.name;

      pill.addEventListener("click", function () {
        applyCategoryFilter(cat.id);
      });

      filterRow.appendChild(pill);
    });
  }

  function applyCategoryFilter(catKey) {
    if (!ALLOWED_CATEGORY_IDS.has(catKey)) catKey = "all";

    document.querySelectorAll(".filter-pill").forEach(function (pill) {
      pill.classList.toggle("active", pill.getAttribute("data-filter") === catKey);
    });

    document.querySelectorAll("#allToolsGrid .tool-card").forEach(function (card) {
      const cats = (card.getAttribute("data-categories") || "").split(" ");
      if (catKey === "all" || cats.includes(catKey)) {
        card.classList.remove("tool-card--hidden");
      } else {
        card.classList.add("tool-card--hidden");
      }
    });
  }

  function renderAllToolsGrid(initialFilter) {
    const allGrid = document.getElementById("allToolsGrid");
    if (!allGrid) return;
    allGrid.replaceChildren();

    TOOLS_DATA.forEach(function (tool) {
      allGrid.appendChild(createToolCardElement(tool));
    });

    applyCategoryFilter(initialFilter || "all");
  }

  // 5. Favorites View Grid Rendering
  function renderFavoritesGrid() {
    const favGrid = document.getElementById("favoritesGrid");
    if (!favGrid) return;
    favGrid.replaceChildren();

    const favIds = getFavorites();
    const favTools = TOOLS_DATA.filter(function (t) { return favIds.includes(t.id); });

    if (favTools.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state-card";

      const icon = document.createElement("div");
      icon.className = "empty-state-icon";
      icon.appendChild(createHeartSvg(false));
      empty.appendChild(icon);

      const title = document.createElement("h3");
      title.className = "empty-state-title";
      title.textContent = "No favorites yet";
      empty.appendChild(title);

      const desc = document.createElement("p");
      desc.className = "empty-state-desc";
      desc.textContent = "Save your frequently used tools here for quick access by clicking the heart on any tool card.";
      empty.appendChild(desc);

      const exploreBtn = document.createElement("button");
      exploreBtn.type = "button";
      exploreBtn.className = "btn-primary-orange";
      exploreBtn.style.marginTop = "10px";
      exploreBtn.textContent = "Explore All Tools";
      exploreBtn.addEventListener("click", function () {
        setActiveView("all-tools");
      });
      empty.appendChild(exploreBtn);

      favGrid.appendChild(empty);
      return;
    }

    favTools.forEach(function (tool) {
      favGrid.appendChild(createToolCardElement(tool));
    });
  }

  // 6. Theme Toggle & Persistence
  const savedTheme = safeStorage.getItem("multitool-theme");
  if (savedTheme === "light") {
    document.body.classList.add("theme-light");
  } else {
    document.body.classList.remove("theme-light");
  }

  function toggleTheme() {
    const isLight = document.body.classList.toggle("theme-light");
    safeStorage.setItem("multitool-theme", isLight ? "light" : "dark");
    showToast(isLight ? "Switched to Light Theme" : "Switched to Dark Charcoal Theme");
  }

  const themeBtn = document.getElementById("themeBtn");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);
  const mobileThemeBtn = document.getElementById("mobileThemeBtn");
  if (mobileThemeBtn) mobileThemeBtn.addEventListener("click", toggleTheme);

  // 7. Search Dialog (Ctrl + K)
  const searchModal = document.getElementById("searchModal");
  const modalSearchInput = document.getElementById("modalSearchInput");
  const modalResultsList = document.getElementById("modalResultsList");
  const searchModalClose = document.getElementById("searchModalClose");

  function openSearch() {
    if (!searchModal) return;
    if (typeof searchModal.showModal === "function") {
      searchModal.showModal();
    } else {
      searchModal.setAttribute("open", "");
    }
    if (modalSearchInput) {
      setTimeout(function () {
        modalSearchInput.focus();
        renderSearchResults("");
      }, 50);
    }
  }

  function closeSearch() {
    if (!searchModal) return;
    if (typeof searchModal.close === "function") {
      searchModal.close();
    } else {
      searchModal.removeAttribute("open");
    }
  }

  document.querySelectorAll(".search-trigger").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openSearch();
    });
  });

  if (searchModalClose) searchModalClose.addEventListener("click", closeSearch);

  if (searchModal) {
    searchModal.addEventListener("click", function (e) {
      if (e.target === searchModal) closeSearch();
    });
  }

  window.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (searchModal && searchModal.hasAttribute("open")) {
        closeSearch();
      } else {
        openSearch();
      }
    }
    if (e.key === "Escape") {
      closeSearch();
      if (howModal && typeof howModal.close === "function") howModal.close();
    }
  });

  function renderSearchResults(query) {
    if (!modalResultsList) return;
    modalResultsList.replaceChildren();

    const q = query.trim().toLowerCase();
    const filtered = TOOLS_DATA.filter(function (tool) {
      if (!q) return true;
      return (
        tool.title.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        (tool.tags || []).some(function (t) { return t.toLowerCase().includes(q); })
      );
    });

    if (filtered.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "search-empty-msg";
      emptyDiv.textContent = 'No utilities found matching "' + query + '"';
      modalResultsList.appendChild(emptyDiv);
      return;
    }

    filtered.forEach(function (tool, index) {
      const isLiveValid = Boolean(tool.live && isValidToolUrl(tool.url));
      const item = document.createElement(isLiveValid ? "a" : "div");
      item.className = "search-result-item" + (index === 0 ? " selected" : "");

      if (isLiveValid) {
        item.href = tool.url;
        item.target = "_blank";
        item.rel = "noopener noreferrer";
      }

      const mainWrap = document.createElement("div");
      mainWrap.className = "result-item-main";

      const iconWrap = document.createElement("div");
      iconWrap.className = "tool-icon-box " + (tool.iconBoxClass || "tool-icon--orange");
      iconWrap.style.width = "28px";
      iconWrap.style.height = "28px";
      iconWrap.appendChild(renderSafeSvgIcon(tool.iconId, 16));
      mainWrap.appendChild(iconWrap);

      const textWrap = document.createElement("div");

      const titleEl = document.createElement("div");
      titleEl.className = "result-item-title";
      titleEl.textContent = tool.title;

      const descEl = document.createElement("div");
      descEl.className = "search-result-desc";
      descEl.textContent = tool.description;

      textWrap.appendChild(titleEl);
      textWrap.appendChild(descEl);
      mainWrap.appendChild(textWrap);

      const badge = document.createElement("span");
      badge.className = "result-item-badge";
      badge.textContent = isLiveValid ? "OPEN" : "SOON";

      item.appendChild(mainWrap);
      item.appendChild(badge);

      modalResultsList.appendChild(item);
    });
  }

  if (modalSearchInput) {
    modalSearchInput.addEventListener("input", function (e) {
      renderSearchResults(e.target.value);
    });
  }

  // 8. Mobile Drawer
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const sidebar = document.getElementById("sidebar");
  const drawerOverlay = document.getElementById("drawerOverlay");

  function closeMobileDrawer() {
    if (sidebar) sidebar.classList.remove("sidebar--open");
    if (drawerOverlay) drawerOverlay.classList.remove("drawer-overlay--open");
  }

  if (mobileMenuToggle && sidebar) {
    mobileMenuToggle.addEventListener("click", function () {
      const isOpen = sidebar.classList.toggle("sidebar--open");
      if (drawerOverlay) {
        drawerOverlay.classList.toggle("drawer-overlay--open", isOpen);
      }
    });
  }

  if (drawerOverlay) {
    drawerOverlay.addEventListener("click", closeMobileDrawer);
  }

  // Initial Render Calls
  updateStats();
  updateFavBadge();
  renderCategories();
  renderFeaturedTools();
  renderFilterPills();
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. TOAST NOTIFICATIONS (SAFE DOM)
// ─────────────────────────────────────────────────────────────────────────────
function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";

  const icon = document.createElement("span");
  icon.className = "toast-check";
  icon.textContent = "✔";

  const text = document.createElement("span");
  text.textContent = String(message || "");

  toast.appendChild(icon);
  toast.appendChild(text);
  container.appendChild(toast);

  setTimeout(function () {
    toast.classList.add("toast--fadeout");
    setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 2800);
}
