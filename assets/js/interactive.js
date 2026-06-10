/* AlephBeth — interactive article behaviours (vanilla, no deps).
   Loaded with `defer` from extend_footer.html.
   Features: reading-progress bar, sober scroll-reveal, animated counters,
   persistent checklist, interactive infographic. All degrade gracefully. */
(function () {
  "use strict";

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("ab-js");

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  /* ---- Reading-progress bar -------------------------------------------- */
  function initProgress() {
    var bar = document.createElement("div");
    bar.className = "ab-progress";
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      var h = document.documentElement;
      var max = (h.scrollHeight - h.clientHeight) || 1;
      var frac = Math.min(1, Math.max(0, (window.scrollY || h.scrollTop) / max));
      bar.style.setProperty("--ab-scroll", frac.toFixed(4));
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  /* ---- Scroll-reveal --------------------------------------------------- */
  function initReveal() {
    var content = document.querySelector(".post-content");
    if (!content) return;
    var kids = Array.prototype.slice.call(content.children);
    kids.forEach(function (el) {
      if (!el.classList.contains("ab-figure-detail")) el.classList.add("ab-reveal");
    });
    var targets = content.querySelectorAll(".ab-reveal");
    if (REDUCED || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    // Reveal anything already on-screen immediately to avoid a flash.
    var vh = window.innerHeight || document.documentElement.clientHeight;
    targets.forEach(function (el) {
      if (el.getBoundingClientRect().top < vh) el.classList.add("is-in");
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    targets.forEach(function (el) { if (!el.classList.contains("is-in")) io.observe(el); });
  }

  /* ---- Animated counters ----------------------------------------------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-target"));
    if (isNaN(target)) return;
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var sep = el.getAttribute("data-sep") || "";
    function fmt(v) {
      var s = v.toFixed(decimals);
      if (sep) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
      return prefix + s + suffix;
    }
    if (REDUCED) { el.textContent = fmt(target); return; }
    var dur = 1100, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = fmt(target * eased);
      if (p < 1) window.requestAnimationFrame(step);
      else el.textContent = fmt(target);
    }
    window.requestAnimationFrame(step);
  }
  function initCounters() {
    var nums = document.querySelectorAll("[data-target]");
    if (!nums.length) return;
    if (REDUCED || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(nums, animateCount);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(nums, function (el) { io.observe(el); });
  }

  /* ---- Persistent checklist -------------------------------------------- */
  function initChecklists() {
    var lists = document.querySelectorAll(".ab-checklist");
    Array.prototype.forEach.call(lists, function (list) {
      var key = "ab-checklist:" + (list.getAttribute("data-key") || location.pathname);
      var boxes = list.querySelectorAll('input[type="checkbox"]');
      var bar = list.querySelector(".ab-checklist-bar > i");
      var meta = list.querySelector(".ab-checklist-meta");
      var total = boxes.length;
      var saved = {};
      try { saved = JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) { saved = {}; }

      function render() {
        var done = 0;
        Array.prototype.forEach.call(boxes, function (b) { if (b.checked) done++; });
        var pct = total ? Math.round((done / total) * 100) : 0;
        if (bar) bar.parentNode.style.setProperty("--ab-done", pct + "%");
        if (meta) meta.textContent = done + " / " + total;
        list.classList.toggle("is-complete", done === total && total > 0);
      }
      function save() {
        var state = {};
        Array.prototype.forEach.call(boxes, function (b, i) { state[i] = b.checked; });
        try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) {}
      }
      Array.prototype.forEach.call(boxes, function (b, i) {
        if (saved[i]) b.checked = true;
        b.addEventListener("change", function () { save(); render(); });
      });
      var reset = list.querySelector(".ab-checklist-reset");
      if (reset) reset.addEventListener("click", function () {
        Array.prototype.forEach.call(boxes, function (b) { b.checked = false; });
        save(); render();
      });
      render();
    });
  }

  /* ---- Interactive infographic ----------------------------------------- */
  function initFigures() {
    var figs = document.querySelectorAll(".ab-figure-interactive");
    Array.prototype.forEach.call(figs, function (fig) {
      var panel = fig.querySelector(".ab-figure-detail");
      var nodes = fig.querySelectorAll(".ab-node");
      function show(node) {
        Array.prototype.forEach.call(nodes, function (n) { n.classList.toggle("is-active", n === node); });
        fig.classList.add("has-active");
        if (panel) {
          var title = node.getAttribute("data-title") || "";
          var detail = node.getAttribute("data-detail") || "";
          panel.innerHTML = (title ? '<span class="ab-figure-detail-title">' + title + "</span>" : "") + detail;
        }
      }
      function clear() {
        Array.prototype.forEach.call(nodes, function (n) { n.classList.remove("is-active"); });
        fig.classList.remove("has-active");
        if (panel) panel.innerHTML = "";
      }
      Array.prototype.forEach.call(nodes, function (node) {
        node.addEventListener("click", function () {
          if (node.classList.contains("is-active")) clear(); else show(node);
        });
        node.addEventListener("mouseenter", function () {
          if (!fig.classList.contains("has-active")) {
            if (panel) {
              var t = node.getAttribute("data-title") || "", d = node.getAttribute("data-detail") || "";
              panel.innerHTML = (t ? '<span class="ab-figure-detail-title">' + t + "</span>" : "") + d;
            }
          }
        });
        node.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (node.classList.contains("is-active")) clear(); else show(node);
          }
        });
      });
      fig.addEventListener("mouseleave", function () {
        if (!fig.classList.contains("has-active") && panel) panel.innerHTML = "";
      });
    });
  }

  ready(function () {
    initProgress();
    initReveal();
    initCounters();
    initChecklists();
    initFigures();
  });
})();
