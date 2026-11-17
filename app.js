// MultiTool Hub — Core Application Logic & Security-Hardened Registry
// Strict zero-trust DOM construction, origin validation, and offline persistence.

// ─────────────────────────────────────────────────────────────────────────────
// 1. SERVICE WORKER REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(function () {
      // Service worker registration failures handled gracefully
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PWA INSTALL PROMPT SUPPORT
// ─────────────────────────────────────────────────────────────────────────────
let deferredPrompt = null;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.hidden = false;
});

window.addEventListener("appinstalled", function () {
  deferredPrompt = null;
  if (installBtn) installBtn.hidden = true;
});

if (installBtn) {
  installBtn.addEventListener("click", function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () {
      deferredPrompt = null;
      installBtn.hidden = true;
    }).catch(function () {
      deferredPrompt = null;
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SECURE STORAGE WRAPPER
// Guards against SecurityError (e.g. cookies disabled, private browsing sandbox)
// and handles quota exceeded exceptions cleanly.
// ─────────────────────────────────────────────────────────────────────────────
const safeStorage = {
  getItem: function (key) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (err) {
      // Storage unavailable or restricted
    }
    return null;
  },
  setItem: function (key, value) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, String(value));
      }
    } catch (err) {
      // Storage quota exceeded or disabled
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. URL VALIDATION & ORIGIN ALLOWLISTING
// Prevents javascript:, data:, localhost, loopback, private RFC-1918 networks,
// non-standard ports, and unapproved external origins.
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
    
    // 1. Mandatory HTTPS
    if (parsed.protocol !== "https:") {
      return false;
    }
    
    // 2. Disallow embedded credentials (http://user:pass@host)
    if (parsed.username || parsed.password) {
      return false;
    }
    
    // 3. Disallow unexpected non-standard ports
    if (parsed.port && parsed.port !== "443" && parsed.port !== "") {
      return false;
    }
    
    const hostname = parsed.hostname.toLowerCase();
    
    // 4. Disallow localhost, loopback, and local domain suffixes
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
    
    // 5. Disallow IPv4 private network ranges (10.0.0.0/8, 192.168.0.0/16, 172.16.0.0/12)
    if (hostname.startsWith("10.") || hostname.startsWith("192.168.")) {
      return false;
    }
    const ip172Match = hostname.match(/^172\.(\d+)\./);
    if (ip172Match) {
      const octet = parseInt(ip172Match[1], 10);
      if (octet >= 16 && octet <= 31) {
        return false;
      }
    }
    
    // 6. Must belong to an explicitly approved production tool origin
    return APPROVED_TOOL_ORIGINS.has(parsed.origin);
  } catch (err) {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CENTRAL TOOLS & CATEGORY REGISTRIES
// ─────────────────────────────────────────────────────────────────────────────
const TOOLS_DATA = [
  {
    id: "metaclean",
    title: "MetaClean 4K",
    description: "Strip EXIF, XMP, IPTC and C2PA provenance metadata from images without altering visual pixels.",
    url: "https://metaclean-4k.vercel.app/",
    categories: ["file", "security"],
    tags: ["JPEG", "PNG", "WEBP", "TIFF", "HEIC", "AVIF"],
    features: ["🔒 Privacy-first", "⚡ Lossless", "📊 Visual diff"],
    live: true,
    featured: true,
    iconBoxClass: "tool-icon--purple",
    iconId: "metaclean",
    addedDate: "2026-09-01",
    updateTag: "v1.0.0 · Core Integration",
    updateNote: "Lossless metadata stripping for JPEG, PNG, WEBP, TIFF, HEIC, and AVIF. Visual difference viewer and privacy verification."
  },
  {
    id: "sendanywhere",
    title: "Send Anywhere",
    description: "Transfer any file to anyone with a 6-digit key. AES-256-GCM encrypted and auto-expiring in 30 minutes.",
    url: "https://sendanywhere-lite.onrender.com",
    categories: ["file", "security", "network"],
    tags: ["Any File", "Up to 3 GB", "50 files"],
    features: ["🔐 AES-256-GCM", "⏱️ Auto-expires", "🔑 6-digit key"],
    live: true,
    featured: true,
    iconBoxClass: "tool-icon--cyan",
    iconId: "sendanywhere",
    addedDate: "2026-09-15",
    updateTag: "v1.0.0 · Security & P2P",
    updateNote: "Transfer up to 3 GB with AES-256-GCM encryption and 6-digit key auto-expiration."
  },
  {
    id: "ytmp",
    title: "YTmp3/4",
    description: "Convert YouTube videos to MP4 or MP3. Pick your quality, hit convert — files are processed and auto-deleted after 1 hour.",
    url: "", // Inactive: localhost destination removed during security remediation
    categories: ["media"],
    tags: ["MP4", "MP3", "Up to 4K", "320 kbps"],
    features: ["🎥 Video + Audio", "⏱️ Auto-expires", "🔒 No tracking"],
    live: false, // Not live until verified HTTPS production endpoint is deployed
    featured: false,
    iconBoxClass: "tool-icon--coral",
    iconId: "ytmp",
    addedDate: "2026-09-21",
    updateTag: "v1.0.0 · In Development",
    updateNote: "YouTube video & audio converter (MP4 / MP3). Media processing pipeline currently in development."
  }
];

const CATEGORIES_DATA = [
  {
    id: "file",
    name: "File Utilities",
    iconClass: "cat-icon--cyan",
    iconId: "cat-file"
  },
  {
    id: "security",
    name: "Privacy & Security",
    iconClass: "cat-icon--pink",
    iconId: "cat-security"
  },
  {
    id: "network",
    name: "Network Tools",
    iconClass: "cat-icon--blue",
    iconId: "cat-network"
  },
  {
    id: "developer",
    name: "Developer Tools",
    iconClass: "cat-icon--violet",
    iconId: "cat-developer"
  },
  {
    id: "media",
    name: "Media Tools",
    iconClass: "cat-icon--magenta",
    iconId: "cat-media"
  },
  {
    id: "all",
    name: "All Tools",
    iconClass: "cat-icon--teal",
    iconId: "cat-all"
  }
];

const ALLOWED_CATEGORY_IDS = new Set(["file", "security", "network", "developer", "media", "all"]);
const ALLOWED_ICON_BOX_CLASSES = new Set([
  "tool-icon--purple",
  "tool-icon--cyan",
  "tool-icon--coral",
  "tool-icon--muted"
]);
const ALLOWED_CAT_CLASSES = new Set([
  "cat-icon--cyan",
  "cat-icon--pink",
  "cat-icon--blue",
  "cat-icon--violet",
  "cat-icon--magenta",
  "cat-icon--teal"
]);

// ─────────────────────────────────────────────────────────────────────────────
// 6. SAFE SVG DOM BUILDER
// Programmatically constructs clean SVG DOM nodes using createElementNS.
// Completely bypasses innerHTML, preventing SVG-based script/attribute injection.
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

function renderSafeSvgIcon(iconId, size) {
  const s = String(size || 24);
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
    case "metaclean":
      svg.appendChild(createSvgElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }));
      svg.appendChild(createSvgElement("circle", { cx: "8.5", cy: "8.5", r: "1.5" }));
      svg.appendChild(createSvgElement("polyline", { points: "21 15 16 10 5 21" }));
      break;

    case "sendanywhere":
      svg.appendChild(createSvgElement("line", { x1: "22", y1: "2", x2: "11", y2: "13" }));
      svg.appendChild(createSvgElement("polygon", { points: "22 2 15 22 11 13 2 9 22 2" }));
      break;

    case "ytmp":
      svg.appendChild(createSvgElement("circle", { cx: "9", cy: "18", r: "3" }));
      svg.appendChild(createSvgElement("circle", { cx: "18", cy: "16", r: "3" }));
      svg.appendChild(createSvgElement("path", { d: "M12 18V5l9-2v11" }));
      break;

    case "clock-soon":
      svg.appendChild(createSvgElement("circle", { cx: "12", cy: "12", r: "10" }));
      svg.appendChild(createSvgElement("polyline", { points: "12 6 12 12 16 14" }));
      break;

    case "cat-file":
      svg.appendChild(createSvgElement("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }));
      break;

    case "cat-security":
      svg.appendChild(createSvgElement("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }));
      break;

    case "cat-network":
      svg.appendChild(createSvgElement("path", { d: "M5 12.55a11 11 0 0 1 14.08 0" }));
      svg.appendChild(createSvgElement("path", { d: "M1.42 9a16 16 0 0 1 21.16 0" }));
      svg.appendChild(createSvgElement("path", { d: "M8.53 16.11a6 6 0 0 1 6.95 0" }));
      svg.appendChild(createSvgElement("line", { x1: "12", y1: "20", x2: "12.01", y2: "20" }));
      break;

    case "cat-developer":
      svg.appendChild(createSvgElement("polyline", { points: "16 18 22 12 16 6" }));
      svg.appendChild(createSvgElement("polyline", { points: "8 6 2 12 8 18" }));
      break;

    case "cat-media":
      svg.appendChild(createSvgElement("polygon", { points: "5 3 19 12 5 21 5 3" }));
      break;

    case "cat-all":
      svg.appendChild(createSvgElement("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1.5" }));
      svg.appendChild(createSvgElement("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1.5" }));
      svg.appendChild(createSvgElement("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1.5" }));
      svg.appendChild(createSvgElement("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1.5" }));
      break;

    case "arrow-right":
      svg.setAttribute("stroke-width", "2.5");
      svg.appendChild(createSvgElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" }));
      svg.appendChild(createSvgElement("polyline", { points: "12 5 19 12 12 19" }));
      break;

    case "search-check":
      svg.appendChild(createSvgElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }));
      svg.appendChild(createSvgElement("path", { d: "m9 12 2 2 4-4" }));
      break;

    default:
      svg.appendChild(createSvgElement("circle", { cx: "12", cy: "12", r: "9" }));
      break;
  }

  return svg;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. MAIN APPLICATION LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {

  // 1. Dynamic Statistics Rendering (Real live counts via textContent)
  function updateStats() {
    const statTools = document.getElementById("statToolsAvailable");
    if (statTools) {
      statTools.textContent = String(TOOLS_DATA.length);
    }
    const statNew = document.getElementById("statNewThisMonth");
    if (statNew) {
      statNew.textContent = String(TOOLS_DATA.length);
    }
  }

  // 2. Dynamic Categories Rendering via Safe DOM Construction
  function renderCategories() {
    const catGrid = document.getElementById("categoriesGrid");
    if (!catGrid) return;

    while (catGrid.firstChild) {
      catGrid.removeChild(catGrid.firstChild);
    }

    CATEGORIES_DATA.forEach(function (cat) {
      const count = cat.id === "all"
        ? TOOLS_DATA.length
        : TOOLS_DATA.filter(function (t) { return t.categories && t.categories.includes(cat.id); }).length;

      const countLabel = count + (count === 1 ? " tool" : " tools");

      const cardBtn = document.createElement("button");
      cardBtn.className = "category-card";
      cardBtn.setAttribute("data-cat", cat.id);
      cardBtn.setAttribute("aria-label", "Filter by " + cat.name);

      const iconWrap = document.createElement("div");
      const safeIconClass = ALLOWED_CAT_CLASSES.has(cat.iconClass) ? cat.iconClass : "cat-icon--teal";
      iconWrap.className = "cat-icon " + safeIconClass;
      iconWrap.appendChild(renderSafeSvgIcon(cat.iconId, 22));

      const contentWrap = document.createElement("div");
      contentWrap.className = "cat-content";

      const nameEl = document.createElement("div");
      nameEl.className = "cat-name";
      nameEl.textContent = cat.name;

      const countEl = document.createElement("div");
      countEl.className = "cat-count";
      countEl.textContent = countLabel;

      contentWrap.appendChild(nameEl);
      contentWrap.appendChild(countEl);
      cardBtn.appendChild(iconWrap);
      cardBtn.appendChild(contentWrap);

      cardBtn.addEventListener("click", function () {
        applyCategoryFilter(cat.id);
        const dirSection = document.getElementById("all-tools");
        if (dirSection) {
          dirSection.scrollIntoView({ behavior: "smooth" });
        }
      });

      catGrid.appendChild(cardBtn);
    });
  }

  // 3. Dynamic Filter Pills for Directory via Safe DOM Construction
  function renderFilterPills() {
    const filterRow = document.getElementById("dirFilterRow");
    if (!filterRow) return;

    while (filterRow.firstChild) {
      filterRow.removeChild(filterRow.firstChild);
    }

    const categoriesWithTools = CATEGORIES_DATA.filter(function (cat) {
      if (cat.id === "all") return true;
      return TOOLS_DATA.some(function (t) { return t.categories && t.categories.includes(cat.id); });
    });

    categoriesWithTools.forEach(function (cat) {
      const pill = document.createElement("button");
      pill.className = "filter-pill" + (cat.id === "all" ? " active" : "");
      pill.setAttribute("data-filter", cat.id);
      pill.textContent = cat.name;

      pill.addEventListener("click", function () {
        applyCategoryFilter(cat.id);
      });

      filterRow.appendChild(pill);
    });
  }

  // 4. Dynamic Tools Directory Rendering via Safe DOM Construction
  function renderToolsDirectory() {
    const toolsGrid = document.getElementById("toolsGrid");
    if (!toolsGrid) return;

    while (toolsGrid.firstChild) {
      toolsGrid.removeChild(toolsGrid.firstChild);
    }

    TOOLS_DATA.forEach(function (tool) {
      const card = document.createElement("article");
      card.className = "tool-card";

      // Filter categories against allowlist
      const safeCats = (tool.categories || []).filter(function (c) {
        return ALLOWED_CATEGORY_IDS.has(c);
      });
      card.setAttribute("data-categories", safeCats.join(" "));

      // Card Header
      const head = document.createElement("div");
      head.className = "tool-card-head";

      const iconBox = document.createElement("div");
      const safeBoxClass = ALLOWED_ICON_BOX_CLASSES.has(tool.iconBoxClass)
        ? tool.iconBoxClass
        : "tool-icon--purple";
      iconBox.className = "tool-icon-box " + safeBoxClass;
      iconBox.setAttribute("aria-hidden", "true");
      iconBox.appendChild(renderSafeSvgIcon(tool.iconId, 24));
      head.appendChild(iconBox);

      const isLiveValid = Boolean(tool.live && isValidToolUrl(tool.url));

      if (isLiveValid) {
        const liveBadge = document.createElement("span");
        liveBadge.className = "live-badge";
        const dot = document.createElement("span");
        dot.className = "live-dot";
        liveBadge.appendChild(dot);
        liveBadge.appendChild(document.createTextNode("LIVE"));
        head.appendChild(liveBadge);
      } else {
        const soonBadge = document.createElement("span");
        soonBadge.className = "soon-badge";
        soonBadge.textContent = "SOON";
        head.appendChild(soonBadge);
      }

      card.appendChild(head);

      // Title & Description
      const titleEl = document.createElement("h3");
      titleEl.className = "tool-card-title";
      titleEl.textContent = tool.title;
      card.appendChild(titleEl);

      const descEl = document.createElement("p");
      descEl.className = "tool-card-desc";
      descEl.textContent = tool.description;
      card.appendChild(descEl);

      // Tags
      const tagRow = document.createElement("div");
      tagRow.className = "tag-row";
      (tool.tags || []).forEach(function (tag) {
        const tagSpan = document.createElement("span");
        tagSpan.className = "format-tag";
        tagSpan.textContent = tag;
        tagRow.appendChild(tagSpan);
      });
      card.appendChild(tagRow);

      // Features
      const featRow = document.createElement("div");
      featRow.className = "tool-card-features";
      (tool.features || []).forEach(function (feat) {
        const featSpan = document.createElement("span");
        featSpan.className = "feat-badge";
        featSpan.textContent = feat;
        featRow.appendChild(featSpan);
      });
      card.appendChild(featRow);

      // Action Button
      if (isLiveValid) {
        const openBtn = document.createElement("a");
        openBtn.href = tool.url;
        openBtn.target = "_blank";
        openBtn.rel = "noopener noreferrer";
        openBtn.className = "card-btn card-btn--purple";
        openBtn.setAttribute("aria-label", "Open " + tool.title);

        const btnText = document.createElement("span");
        btnText.textContent = "Open Tool";
        openBtn.appendChild(btnText);
        openBtn.appendChild(renderSafeSvgIcon("arrow-right", 14));

        card.appendChild(openBtn);
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

        card.appendChild(disabledBtn);
      }

      toolsGrid.appendChild(card);
    });

    // Static "More Tools in Development" Card
    const soonCard = document.createElement("article");
    soonCard.className = "tool-card tool-card--soon";
    soonCard.setAttribute("data-categories", "all");

    const soonHead = document.createElement("div");
    soonHead.className = "tool-card-head";

    const soonIconBox = document.createElement("div");
    soonIconBox.className = "tool-icon-box tool-icon--muted";
    soonIconBox.setAttribute("aria-hidden", "true");
    soonIconBox.appendChild(renderSafeSvgIcon("clock-soon", 24));
    soonHead.appendChild(soonIconBox);

    const soonBadge = document.createElement("span");
    soonBadge.className = "soon-badge";
    soonBadge.textContent = "SOON";
    soonHead.appendChild(soonBadge);
    soonCard.appendChild(soonHead);

    const soonTitle = document.createElement("h3");
    soonTitle.className = "tool-card-title";
    soonTitle.textContent = "More Tools in Development";
    soonCard.appendChild(soonTitle);

    const soonDesc = document.createElement("p");
    soonDesc.className = "tool-card-desc";
    soonDesc.textContent = "New utilities added regularly with zero tracking, offline capability, and client-side encryption.";
    soonCard.appendChild(soonDesc);

    const soonTagRow = document.createElement("div");
    soonTagRow.className = "tag-row";
    const tag1 = document.createElement("span");
    tag1.className = "format-tag";
    tag1.textContent = "Modular";
    const tag2 = document.createElement("span");
    tag2.className = "format-tag";
    tag2.textContent = "Zero Cloud Data";
    soonTagRow.appendChild(tag1);
    soonTagRow.appendChild(tag2);
    soonCard.appendChild(soonTagRow);

    const soonPill = document.createElement("div");
    soonPill.className = "coming-soon-pill";
    soonPill.textContent = "New tool in progress…";
    soonCard.appendChild(soonPill);

    toolsGrid.appendChild(soonCard);
  }

  // 5. Dynamic "Updates" Modal Section (Auto-updated, Safe DOM Construction)
  function renderUpdatesModal() {
    const updatesBody = document.getElementById("updatesModalBody");
    if (!updatesBody) return;

    while (updatesBody.firstChild) {
      updatesBody.removeChild(updatesBody.firstChild);
    }

    // Core Platform Release Entry
    const platformEntry = document.createElement("div");
    platformEntry.className = "update-entry";

    const pTag = document.createElement("div");
    pTag.className = "update-tag";
    pTag.textContent = "v1.0.0 · Core Platform";

    const pTitle = document.createElement("h4");
    pTitle.className = "update-title";
    pTitle.textContent = "Brand New Dashboard & 3D Glass Design System";

    const pDesc = document.createElement("p");
    pDesc.className = "update-desc";
    pDesc.textContent = "Complete visual overhaul matching the official MultiTool Hub branding. Responsive sidebar navigation, desktop & mobile optimized viewports, and unified utility hubs.";

    platformEntry.appendChild(pTag);
    platformEntry.appendChild(pTitle);
    platformEntry.appendChild(pDesc);
    updatesBody.appendChild(platformEntry);

    // Dynamic Tool Updates (sorted newest first)
    const sortedTools = TOOLS_DATA.slice().sort(function (a, b) {
      return (b.addedDate || "").localeCompare(a.addedDate || "");
    });

    sortedTools.forEach(function (tool) {
      const entry = document.createElement("div");
      entry.className = "update-entry";

      const tag = document.createElement("div");
      tag.className = "update-tag";
      tag.textContent = tool.updateTag || (tool.title + " · Release");

      const title = document.createElement("h4");
      title.className = "update-title";
      title.textContent = tool.title;

      const desc = document.createElement("p");
      desc.className = "update-desc";
      desc.textContent = tool.updateNote || tool.description;

      entry.appendChild(tag);
      entry.appendChild(title);
      entry.appendChild(desc);

      const isLiveValid = Boolean(tool.live && isValidToolUrl(tool.url));
      const actionBox = document.createElement("div");
      actionBox.className = "update-link-box";

      if (isLiveValid) {
        const link = document.createElement("a");
        link.href = tool.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "update-link";
        link.textContent = "Open " + tool.title + " →";
        actionBox.appendChild(link);
      } else {
        const pill = document.createElement("span");
        pill.className = "update-status-pill";
        pill.textContent = "In Development";
        actionBox.appendChild(pill);
      }

      entry.appendChild(actionBox);
      updatesBody.appendChild(entry);
    });
  }

  // 6. Category Filtering Logic (Replaces inline style assignment with CSS class)
  function applyCategoryFilter(catKey) {
    if (!ALLOWED_CATEGORY_IDS.has(catKey)) {
      catKey = "all";
    }

    const filterPills = document.querySelectorAll(".filter-pill");
    filterPills.forEach(function (pill) {
      pill.classList.toggle("active", pill.getAttribute("data-filter") === catKey);
    });

    const toolCards = document.querySelectorAll(".directory-grid .tool-card");
    toolCards.forEach(function (card) {
      const cardCats = (card.getAttribute("data-categories") || "").split(" ");
      if (catKey === "all" || cardCats.includes(catKey)) {
        card.classList.remove("tool-card--hidden");
      } else {
        card.classList.add("tool-card--hidden");
      }
    });
  }

  // 7. Theme Toggle & Persistence
  const savedTheme = safeStorage.getItem("multitool-theme");
  if (savedTheme === "light") {
    document.body.classList.add("theme-light");
  } else {
    document.body.classList.remove("theme-light");
  }

  function toggleTheme() {
    const isLight = document.body.classList.toggle("theme-light");
    safeStorage.setItem("multitool-theme", isLight ? "light" : "dark");
    showToast(isLight ? "Switched to High-Contrast Theme" : "Switched to Obsidian Dark Theme");
  }

  const themeBtn = document.getElementById("themeBtn");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

  // 8. Modals System (Updates, Request, Issue, Search)
  function openDialog(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    if (typeof modal.showModal === "function") {
      modal.showModal();
    } else {
      modal.setAttribute("open", "");
    }
  }

  function closeDialog(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    if (typeof modal.close === "function") {
      modal.close();
    } else {
      modal.removeAttribute("open");
    }
  }

  document.querySelectorAll(".modal-dialog").forEach(function (dialog) {
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog || e.target.classList.contains("modal-backdrop")) {
        closeDialog(dialog.id);
      }
    });
  });

  // Updates Modal Triggers
  const updatesTriggers = ["btnWhatsNew", "navUpdates", "bnavUpdates", "notifBtn"];
  updatesTriggers.forEach(function (id) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        openDialog("updatesModal");
      });
    }
  });

  const updatesClose = document.getElementById("updatesModalClose");
  if (updatesClose) {
    updatesClose.addEventListener("click", function () {
      closeDialog("updatesModal");
    });
  }

  // Quick Action: Tool Request (Strict client-side handling with local persistence)
  const qaNewRequest = document.getElementById("qaNewRequest");
  if (qaNewRequest) {
    qaNewRequest.addEventListener("click", function () {
      openDialog("requestModal");
    });
  }
  const reqClose = document.getElementById("reqModalClose");
  if (reqClose) {
    reqClose.addEventListener("click", function () {
      closeDialog("requestModal");
    });
  }

  const reqForm = document.getElementById("reqForm");
  if (reqForm) {
    reqForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const nameInput = document.getElementById("reqToolName");
      const descInput = document.getElementById("reqToolDesc");
      const toolName = (nameInput ? nameInput.value : "").trim().slice(0, 100);
      const toolDesc = (descInput ? descInput.value : "").trim().slice(0, 1000);

      if (!toolName || !toolDesc) {
        showToast("Please provide both a name and a description.");
        return;
      }

      try {
        const stored = JSON.parse(safeStorage.getItem("multitool_feedback") || "[]");
        stored.push({
          type: "request",
          name: toolName,
          desc: toolDesc,
          timestamp: new Date().toISOString()
        });
        safeStorage.setItem("multitool_feedback", JSON.stringify(stored.slice(-20)));
      } catch (err) {}

      closeDialog("requestModal");
      reqForm.reset();
      showToast("Tool request recorded in local feedback log.");
    });
  }

  // Quick Action: Report Issue (Strict client-side handling with local persistence)
  const qaReportIssue = document.getElementById("qaReportIssue");
  if (qaReportIssue) {
    qaReportIssue.addEventListener("click", function () {
      openDialog("issueModal");
    });
  }
  const issueClose = document.getElementById("issueModalClose");
  if (issueClose) {
    issueClose.addEventListener("click", function () {
      closeDialog("issueModal");
    });
  }

  const issueForm = document.getElementById("issueForm");
  if (issueForm) {
    issueForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const toolSelect = document.getElementById("issueTool");
      const detailsInput = document.getElementById("issueDetails");
      const affectedTool = (toolSelect ? toolSelect.value : "general").slice(0, 50);
      const details = (detailsInput ? detailsInput.value : "").trim().slice(0, 1000);

      if (!details) {
        showToast("Please describe the issue.");
        return;
      }

      try {
        const stored = JSON.parse(safeStorage.getItem("multitool_feedback") || "[]");
        stored.push({
          type: "issue",
          tool: affectedTool,
          details: details,
          timestamp: new Date().toISOString()
        });
        safeStorage.setItem("multitool_feedback", JSON.stringify(stored.slice(-20)));
      } catch (err) {}

      closeDialog("issueModal");
      issueForm.reset();
      showToast("Issue report recorded in local feedback log.");
    });
  }

  // 9. Interactive Search Dialog (Ctrl + K) via Safe DOM Construction
  const searchTriggers = document.querySelectorAll(".search-trigger");
  const searchModal = document.getElementById("searchModal");
  const modalSearchInput = document.getElementById("modalSearchInput");
  const modalResultsList = document.getElementById("modalResultsList");
  const searchModalClose = document.getElementById("searchModalClose");

  function openSearch() {
    openDialog("searchModal");
    if (modalSearchInput) {
      setTimeout(function () {
        modalSearchInput.focus();
        renderSearchResults("");
      }, 50);
    }
  }

  function closeSearch() {
    closeDialog("searchModal");
  }

  searchTriggers.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openSearch();
    });
  });

  if (searchModalClose) searchModalClose.addEventListener("click", closeSearch);

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
      closeDialog("updatesModal");
      closeDialog("requestModal");
      closeDialog("issueModal");
    }
  });

  function renderSearchResults(query) {
    if (!modalResultsList) return;

    while (modalResultsList.firstChild) {
      modalResultsList.removeChild(modalResultsList.firstChild);
    }

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
      iconWrap.className = "result-item-icon";
      iconWrap.appendChild(renderSafeSvgIcon("search-check", 18));
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

  // 10. Navigation Active Scroll Sync
  const navHome = document.getElementById("navHome");
  const navAllTools = document.getElementById("navAllTools");
  const navCategories = document.getElementById("navCategories");
  const bnavHome = document.getElementById("bnavHome");
  const bnavAllTools = document.getElementById("bnavAllTools");

  function setActiveNav(navKey) {
    [navHome, navAllTools, navCategories].forEach(function (el) {
      if (el) el.classList.remove("active");
    });
    [bnavHome, bnavAllTools].forEach(function (el) {
      if (el) el.classList.remove("active");
    });

    if (navKey === "home") {
      if (navHome) navHome.classList.add("active");
      if (bnavHome) bnavHome.classList.add("active");
    } else if (navKey === "all-tools") {
      if (navAllTools) navAllTools.classList.add("active");
      if (bnavAllTools) bnavAllTools.classList.add("active");
    } else if (navKey === "categories") {
      if (navCategories) navCategories.classList.add("active");
    }
  }

  window.addEventListener("scroll", function () {
    const scrollPos = window.scrollY + 200;
    const allToolsEl = document.getElementById("all-tools");
    const catEl = document.getElementById("categories");

    if (allToolsEl && scrollPos >= allToolsEl.offsetTop) {
      setActiveNav("all-tools");
    } else if (catEl && scrollPos >= catEl.offsetTop) {
      setActiveNav("categories");
    } else {
      setActiveNav("home");
    }
  });

  // 11. Mobile Drawer Toggle (Uses CSS classes instead of inline styles)
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const sidebar = document.getElementById("sidebar");
  const drawerOverlay = document.getElementById("drawerOverlay");

  if (mobileMenuToggle && sidebar) {
    mobileMenuToggle.addEventListener("click", function () {
      const isOpen = sidebar.classList.toggle("sidebar--open");
      if (drawerOverlay) {
        drawerOverlay.classList.toggle("drawer-overlay--open", isOpen);
      }
    });
  }

  if (drawerOverlay) {
    drawerOverlay.addEventListener("click", function () {
      if (sidebar) {
        sidebar.classList.remove("sidebar--open");
      }
      drawerOverlay.classList.remove("drawer-overlay--open");
    });
  }

  // Initialize Dynamic UI Components
  updateStats();
  renderCategories();
  renderFilterPills();
  renderToolsDirectory();
  renderUpdatesModal();
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. SECURITY-HARDENED NOTIFICATIONS & ESCAPING HELPERS
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
  }, 3200);
}

function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/`/g, "&#x60;");
}
