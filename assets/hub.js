/* ============================================================
   Jap App Hub — Shared JavaScript
   ============================================================ */

(function () {
  "use strict";

  const LOCAL_KEY = "hub_theme";

  /* ---- Theme ---- */
  function applyStoredTheme() {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (!stored) return;
    const root = document.documentElement;
    root.setAttribute("data-bs-theme", stored);
    document.querySelectorAll(".theme-toggle-btn i").forEach(function (el) {
      el.className = stored === "dark" ? "bi bi-sun-fill" : "bi bi-moon-fill";
    });
  }

  window.toggleTheme = function () {
    const root = document.documentElement;
    const isLight = root.getAttribute("data-bs-theme") !== "dark";
    const next = isLight ? "dark" : "light";
    root.setAttribute("data-bs-theme", next);
    localStorage.setItem(LOCAL_KEY, next);
    document.querySelectorAll(".theme-toggle-btn i").forEach(function (el) {
      el.className = isLight ? "bi bi-sun-fill" : "bi bi-moon-fill";
    });
  };

  /* ---- Scroll Progress ---- */
  function initScrollProgress() {
    var bar = document.getElementById("scrollProgress");
    if (!bar) return;
    var main = document.querySelector(".learn-main") || document.documentElement;
    function update() {
      var scrollTop = main.scrollTop || window.pageYOffset || document.documentElement.scrollTop || 0;
      var scrollHeight = (main.scrollHeight || document.documentElement.scrollHeight) - window.innerHeight;
      if (scrollHeight <= 0) { bar.style.width = "0%"; return; }
      bar.style.width = Math.min((scrollTop / scrollHeight) * 100, 100) + "%";
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---- Back to Top ---- */
  function initBackToTop() {
    var btn = document.getElementById("backToTop");
    if (!btn) return;
    function toggle() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
      btn.classList.toggle("visible", scrollTop > 300);
    }
    window.addEventListener("scroll", toggle, { passive: true });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    toggle();
  }

  /* ---- Toast ---- */
  function ensureToastContainer() {
    var c = document.getElementById("toastContainer");
    if (!c) {
      c = document.createElement("div");
      c.id = "toastContainer";
      c.className = "toast-container";
      document.body.appendChild(c);
    }
    return c;
  }

  window.showToast = function (text) {
    var container = ensureToastContainer();
    var el = document.createElement("div");
    el.className = "toast-msg";
    el.textContent = text;
    container.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });
    setTimeout(function () {
      el.classList.remove("show");
      setTimeout(function () { el.remove(); }, 350);
    }, 2200);
  };

  /* ---- Debounce ---- */
  window.debounce = function (fn, delay) {
    var timer = null;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  };

  /* ---- Sidebar Search ---- */
  function initSidebarSearch() {
    var input = document.getElementById("sidebarSearchInput");
    if (!input) return;
    var links = document.querySelectorAll(".learn-sidebar .nav-link");
    var sections = document.querySelectorAll(".learn-sidebar .nav-section-body");

    function filter() {
      var q = input.value.trim().toLowerCase();
      links.forEach(function (link) {
        var text = link.textContent.toLowerCase();
        var match = !q || text.indexOf(q) !== -1;
        link.style.display = match ? "block" : "none";
      });
      sections.forEach(function (body) {
        var hasVisible = Array.from(body.querySelectorAll(".nav-link")).some(function (l) { return l.style.display !== "none"; });
        body.style.display = !q || hasVisible ? "" : "none";
      });
    }

    input.addEventListener("input", debounce(filter, 200));
  }

  /* ---- Collapsible Sidebar Sections ---- */
  function initCollapsibleSections() {
    document.querySelectorAll(".learn-sidebar .nav-section").forEach(function (heading) {
      var collapseIcon = document.createElement("i");
      collapseIcon.className = "bi bi-chevron-down collapse-icon";
      heading.appendChild(collapseIcon);

      var body = heading.nextElementSibling;
      while (body && !body.classList.contains("nav-section-body")) {
        body = body.nextElementSibling;
      }
      if (!body) return;

      var stored = localStorage.getItem("sidebar_section_" + heading.textContent.trim());
      if (stored === "closed") {
        body.classList.add("closed");
        collapseIcon.classList.add("collapsed");
      }

      heading.addEventListener("click", function () {
        body.classList.toggle("closed");
        collapseIcon.classList.toggle("collapsed");
        localStorage.setItem("sidebar_section_" + heading.textContent.trim(), body.classList.contains("closed") ? "closed" : "open");
      });
    });
  }

  /* ---- Sidebar Toggle (mobile) ---- */
  function initSidebarToggle() {
    var toggleBtn = document.getElementById("sidebarToggle");
    var sidebar = document.querySelector(".learn-sidebar");
    if (!toggleBtn || !sidebar) return;
    toggleBtn.addEventListener("click", function () {
      sidebar.classList.toggle("show");
    });
  }

  /* ---- Syntax Highlighting (highlight.js) ---- */
  function initHighlightJS() {
    if (typeof hljs !== "undefined") {
      hljs.highlightAll();
      return;
    }
    var script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js";
    script.onload = function () {
      hljs.configure({ ignoreUnescapedHTML: true });
      hljs.highlightAll();
    };
    document.head.appendChild(script);
  }

  /* ---- Init ---- */
  document.addEventListener("DOMContentLoaded", function () {
    applyStoredTheme();
    initScrollProgress();
    initBackToTop();
    initSidebarSearch();
    initCollapsibleSections();
    initSidebarToggle();
    initHighlightJS();
  });
})();
