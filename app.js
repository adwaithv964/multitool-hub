// MultiTool Hub — Core Application Logic & Dynamic Registry

// Service Worker Registration
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(function () {});
}

// PWA Install Prompt Support
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
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL TOOLS REGISTRY
// Adding any new tool here will AUTOMATICALLY:
// 1. Update the "Tools Available" count (real live number)
// 2. Increment its respective Category tool counts
// 3. Render its card in "All Utilities & Services" with instant category filtering
// 4. Update the "Updates" section modal accessible from the sidebar
// 5. Index the tool in the Ctrl + K search dialog
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
    iconSvg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    artSvg: "/assets/metaclean-art.svg",
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
    iconSvg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    artSvg: "/assets/sendanywhere-art.svg",
    addedDate: "2026-09-15",
    updateTag: "v1.0.0 · Security & P2P",
    updateNote: "Transfer up to 3 GB with AES-256-GCM encryption and 6-digit key auto-expiration."
  },
  {
    id: "ytmp",
    title: "YTmp3/4",
    description: "Convert YouTube videos to MP4 or MP3. Pick your quality, hit convert — files are processed and auto-deleted after 1 hour.",
    url: "http://localhost:3000",
    categories: ["media"],
    tags: ["MP4", "MP3", "Up to 4K", "320 kbps"],
    features: ["🎥 Video + Audio", "⏱️ Auto-expires", "🔒 No tracking"],
    live: true,
    featured: false,
    iconBoxClass: "tool-icon--coral",
    iconSvg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M12 18V5l9-2v11"/></svg>',
    addedDate: "2026-09-21",
    updateTag: "v1.0.0 · Media Converter",
    updateNote: "Convert YouTube videos to MP4 or MP3 with up to 4K / 320kbps audio quality."
  }
];

// Master Category Definitions
const CATEGORIES_DATA = [
  {
    id: "file",
    name: "File Utilities",
    iconClass: "cat-icon--cyan",
    iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>'
  },
  {
    id: "security",
    name: "Privacy & Security",
    iconClass: "cat-icon--pink",
    iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>'
  },
  {
    id: "network",
    name: "Network Tools",
    iconClass: "cat-icon--blue",
    iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>'
  },
  {
    id: "developer",
    name: "Developer Tools",
    iconClass: "cat-icon--violet",
    iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>'
  },
  {
    id: "media",
    name: "Media Tools",
    iconClass: "cat-icon--magenta",
    iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>'
  },
  {
    id: "all",
    name: "All Tools",
    iconClass: "cat-icon--teal",
    iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect></svg>'
  }
];

// Document Ready Initialization
document.addEventListener("DOMContentLoaded", function () {

  // 1. Dynamic Statistics Rendering (Real live numbers)
  function updateStats() {
    const statTools = document.getElementById("statToolsAvailable");
    if (statTools) {
      statTools.innerText = String(TOOLS_DATA.length);
    }
    const statNew = document.getElementById("statNewThisMonth");
    if (statNew) {
      statNew.innerText = String(TOOLS_DATA.length);
    }
  }

  // 2. Dynamic Categories Rendering with Real Tool Counts
  function renderCategories() {
    const catGrid = document.getElementById("categoriesGrid");
    if (!catGrid) return;

    catGrid.innerHTML = CATEGORIES_DATA.map(function (cat) {
      const count = cat.id === "all"
        ? TOOLS_DATA.length
        : TOOLS_DATA.filter(function (t) { return t.categories && t.categories.includes(cat.id); }).length;
      
      const countLabel = count + (count === 1 ? " tool" : " tools");

      return (
        '<button class="category-card" data-cat="' + cat.id + '" aria-label="Filter by ' + escapeHTML(cat.name) + '">' +
          '<div class="cat-icon ' + cat.iconClass + '">' + cat.iconSvg + '</div>' +
          '<div class="cat-content">' +
            '<div class="cat-name">' + escapeHTML(cat.name) + '</div>' +
            '<div class="cat-count">' + countLabel + '</div>' +
          '</div>' +
        '</button>'
      );
    }).join("");

    // Attach click listeners to category cards
    catGrid.querySelectorAll(".category-card").forEach(function (card) {
      card.addEventListener("click", function () {
        const cat = card.getAttribute("data-cat");
        applyCategoryFilter(cat);
        const dirSection = document.getElementById("all-tools");
        if (dirSection) {
          dirSection.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }

  // 3. Dynamic Filter Pills for Directory
  function renderFilterPills() {
    const filterRow = document.getElementById("dirFilterRow");
    if (!filterRow) return;

    // Build pills for "all" plus any category that has tools
    const categoriesWithTools = CATEGORIES_DATA.filter(function (cat) {
      if (cat.id === "all") return true;
      return TOOLS_DATA.some(function (t) { return t.categories && t.categories.includes(cat.id); });
    });

    filterRow.innerHTML = categoriesWithTools.map(function (cat) {
      const isActive = cat.id === "all" ? " active" : "";
      return '<button class="filter-pill' + isActive + '" data-filter="' + cat.id + '">' + escapeHTML(cat.name) + '</button>';
    }).join("");

    filterRow.querySelectorAll(".filter-pill").forEach(function (pill) {
      pill.addEventListener("click", function () {
        const filter = pill.getAttribute("data-filter");
        applyCategoryFilter(filter);
      });
    });
  }

  // 4. Dynamic Tools Directory Rendering
  function renderToolsDirectory() {
    const toolsGrid = document.getElementById("toolsGrid");
    if (!toolsGrid) return;

    const cardsHtml = TOOLS_DATA.map(function (tool) {
      const catClasses = (tool.categories || []).join(" ");
      const tagsHtml = (tool.tags || []).map(function (tag) {
        return '<span class="format-tag">' + escapeHTML(tag) + '</span>';
      }).join("");

      const featuresHtml = (tool.features || []).map(function (feat) {
        return '<span class="feat-badge">' + escapeHTML(feat) + '</span>';
      }).join("");

      return (
        '<article class="tool-card" data-categories="' + catClasses + '">' +
          '<div class="tool-card-head">' +
            '<div class="tool-icon-box ' + (tool.iconBoxClass || "tool-icon--purple") + '" aria-hidden="true">' +
              tool.iconSvg +
            '</div>' +
            '<span class="live-badge">' +
              '<span class="live-dot"></span>' +
              'LIVE' +
            '</span>' +
          '</div>' +
          '<h3 class="tool-card-title">' + escapeHTML(tool.title) + '</h3>' +
          '<p class="tool-card-desc">' + escapeHTML(tool.description) + '</p>' +
          '<div class="tag-row">' + tagsHtml + '</div>' +
          '<div class="tool-card-features">' + featuresHtml + '</div>' +
          '<a href="' + tool.url + '" target="_blank" rel="noopener" class="card-btn card-btn--purple" aria-label="Open ' + escapeHTML(tool.title) + '">' +
            '<span>Open Tool</span>' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
              '<line x1="5" y1="12" x2="19" y2="12"></line>' +
              '<polyline points="12 5 19 12 12 19"></polyline>' +
            '</svg>' +
          '</a>' +
        '</article>'
      );
    }).join("");

    const comingSoonHtml = (
      '<article class="tool-card tool-card--soon" data-categories="all">' +
        '<div class="tool-card-head">' +
          '<div class="tool-icon-box tool-icon--muted" aria-hidden="true">' +
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<circle cx="12" cy="12" r="10"></circle>' +
              '<polyline points="12 6 12 12 16 14"></polyline>' +
            '</svg>' +
          '</div>' +
          '<span class="soon-badge">SOON</span>' +
        '</div>' +
        '<h3 class="tool-card-title">More Tools in Development</h3>' +
        '<p class="tool-card-desc">' +
          'New utilities added regularly with zero tracking, offline capability, and client-side encryption.' +
        '</p>' +
        '<div class="tag-row">' +
          '<span class="format-tag">Modular</span>' +
          '<span class="format-tag">Zero Cloud Data</span>' +
        '</div>' +
        '<div class="coming-soon-pill">New tool in progress&hellip;</div>' +
      '</article>'
    );

    toolsGrid.innerHTML = cardsHtml + comingSoonHtml;
  }

  // 5. Dynamic "Updates" Modal Section (Auto-updated when new tools are added)
  function renderUpdatesModal() {
    const updatesBody = document.getElementById("updatesModalBody");
    if (!updatesBody) return;

    // Platform release notes
    const platformEntry = (
      '<div class="update-entry">' +
        '<div class="update-tag">v1.0.0 · Core Platform</div>' +
        '<h4 class="update-title">Brand New Dashboard &amp; 3D Glass Design System</h4>' +
        '<p class="update-desc">Complete visual overhaul matching the official MultiTool Hub branding. Responsive sidebar navigation, desktop &amp; mobile optimized viewports, and unified utility hubs.</p>' +
      '</div>'
    );

    // Dynamic tool updates (sorted newest first)
    const sortedTools = TOOLS_DATA.slice().sort(function (a, b) {
      return (b.addedDate || "").localeCompare(a.addedDate || "");
    });

    const toolEntries = sortedTools.map(function (tool) {
      const tag = tool.updateTag || (tool.title + " · Live Release");
      const note = tool.updateNote || tool.description;
      return (
        '<div class="update-entry">' +
          '<div class="update-tag">' + escapeHTML(tag) + '</div>' +
          '<h4 class="update-title">' + escapeHTML(tool.title) + '</h4>' +
          '<p class="update-desc">' + escapeHTML(note) + '</p>' +
          '<div style="margin-top:8px;">' +
            '<a href="' + tool.url + '" target="_blank" rel="noopener" style="font-size:0.8rem;color:#c084fc;text-decoration:none;font-weight:600;">' +
              'Open ' + escapeHTML(tool.title) + ' &rarr;' +
            '</a>' +
          '</div>' +
        '</div>'
      );
    }).join("");

    updatesBody.innerHTML = platformEntry + toolEntries;
  }

  // 6. Category Filtering Logic
  function applyCategoryFilter(catKey) {
    const filterPills = document.querySelectorAll(".filter-pill");
    filterPills.forEach(function (pill) {
      if (pill.getAttribute("data-filter") === catKey) {
        pill.classList.add("active");
      } else {
        pill.classList.remove("active");
      }
    });

    const toolCards = document.querySelectorAll(".directory-grid .tool-card");
    toolCards.forEach(function (card) {
      const cardCats = (card.getAttribute("data-categories") || "").split(" ");
      if (catKey === "all" || cardCats.includes(catKey)) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    });
  }

  // 7. Theme Toggle & Persistence
  const savedTheme = localStorage.getItem("multitool-theme");
  if (savedTheme === "light") {
    document.body.classList.add("theme-light");
  }

  function toggleTheme() {
    const isLight = document.body.classList.toggle("theme-light");
    localStorage.setItem("multitool-theme", isLight ? "light" : "dark");
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
  if (updatesClose) updatesClose.addEventListener("click", function () { closeDialog("updatesModal"); });

  // Quick Action: Tool Request
  const qaNewRequest = document.getElementById("qaNewRequest");
  if (qaNewRequest) qaNewRequest.addEventListener("click", function () { openDialog("requestModal"); });
  const reqClose = document.getElementById("reqModalClose");
  if (reqClose) reqClose.addEventListener("click", function () { closeDialog("requestModal"); });

  const reqForm = document.getElementById("reqForm");
  if (reqForm) {
    reqForm.addEventListener("submit", function (e) {
      e.preventDefault();
      closeDialog("requestModal");
      reqForm.reset();
      showToast("Tool request submitted! Thank you for the suggestion.");
    });
  }

  // Quick Action: Report Issue
  const qaReportIssue = document.getElementById("qaReportIssue");
  if (qaReportIssue) qaReportIssue.addEventListener("click", function () { openDialog("issueModal"); });
  const issueClose = document.getElementById("issueModalClose");
  if (issueClose) issueClose.addEventListener("click", function () { closeDialog("issueModal"); });

  const issueForm = document.getElementById("issueForm");
  if (issueForm) {
    issueForm.addEventListener("submit", function (e) {
      e.preventDefault();
      closeDialog("issueModal");
      issueForm.reset();
      showToast("Issue report submitted! We will investigate shortly.");
    });
  }

  // 9. Interactive Search Dialog (Ctrl + K)
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
    const q = query.trim().toLowerCase();
    const filtered = TOOLS_DATA.filter(function (tool) {
      if (!q) return true;
      return (
        tool.title.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.tags.some(function (t) { return t.toLowerCase().includes(q); })
      );
    });

    if (filtered.length === 0) {
      modalResultsList.innerHTML = '<div style="padding:20px;text-align:center;color:#64748b;font-size:0.88rem;">No utilities found matching "' + escapeHTML(query) + '"</div>';
      return;
    }

    modalResultsList.innerHTML = filtered.map(function (tool, index) {
      return (
        '<a href="' + tool.url + '" target="_blank" rel="noopener" class="search-result-item' + (index === 0 ? " selected" : "") + '">' +
          '<div class="result-item-main">' +
            '<div class="result-item-icon">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>' +
            '</div>' +
            '<div>' +
              '<div class="result-item-title">' + escapeHTML(tool.title) + '</div>' +
              '<div style="font-size:0.75rem;color:#94a3b8;margin-top:2px;">' + escapeHTML(tool.description) + '</div>' +
            '</div>' +
          '</div>' +
          '<span class="result-item-badge">OPEN</span>' +
        '</a>'
      );
    }).join("");
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

  // 11. Mobile Drawer Toggle
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const sidebar = document.getElementById("sidebar");
  const drawerOverlay = document.getElementById("drawerOverlay");

  if (mobileMenuToggle && sidebar) {
    mobileMenuToggle.addEventListener("click", function () {
      const isOpen = sidebar.style.display === "flex";
      sidebar.style.display = isOpen ? "none" : "flex";
      sidebar.style.position = "fixed";
      sidebar.style.zIndex = "110";
      sidebar.style.left = "0";
      sidebar.style.top = "0";
      if (drawerOverlay) drawerOverlay.style.display = isOpen ? "none" : "block";
    });
  }

  if (drawerOverlay) {
    drawerOverlay.addEventListener("click", function () {
      if (sidebar && window.innerWidth <= 900) {
        sidebar.style.display = "none";
      }
      drawerOverlay.style.display = "none";
    });
  }

  // Initialize Dynamic UI Components
  updateStats();
  renderCategories();
  renderFilterPills();
  renderToolsDirectory();
  renderUpdatesModal();

});

// Helper Functions
function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = '<span style="color:#22c55e;">✔</span> <span>' + escapeHTML(message) + '</span>';
  container.appendChild(toast);
  setTimeout(function () {
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3200);
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
