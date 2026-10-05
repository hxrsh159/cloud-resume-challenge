// Nav interactions — spec: design-system/theozdev/pages/index.md (creative
// layer, ADR-019): scroll-progress bar, active-section highlight, magnetic
// CTA buttons, loaded-class entrance trigger.

(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Entrance: add .loaded so .fly-in elements animate in --- */
  requestAnimationFrame(function () {
    document.body.classList.add("loaded");
  });

  // --- Scroll progress bar ---
  var bar = document.querySelector(".scroll-progress");
  if (bar) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = "scaleX(" + Math.min(1, Math.max(0, p)) + ")";
    };
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  // --- Active section highlighting (home page anchors only) ---
  var anchors = Array.prototype.slice.call(document.querySelectorAll(".nav-anchor"));
  var sections = anchors
    .map(function (a) {
      var href = a.getAttribute("href") || "";
      var id = href.indexOf("#") >= 0 ? href.slice(href.indexOf("#") + 1) : null;
      return id ? document.getElementById(id) : null;
    })
    .filter(Boolean);
  if (sections.length && "IntersectionObserver" in window) {
    var setActive = function (id) {
      anchors.forEach(function (a) {
        a.classList.toggle("nav-active", (a.getAttribute("href") || "").slice(-id.length) === id);
      });
    };
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setActive(e.target.id);
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    sections.forEach(function (s) { obs.observe(s); });
  }

  // --- Magnetic CTAs (pointer:fine only, transform-only) ---
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  if (finePointer && !prefersReduced) {
    document.querySelectorAll(".hero-cta .btn").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        var mx = Math.max(-4, Math.min(4, dx / 6));
        var my = Math.max(-4, Math.min(4, dy / 6));
        btn.style.transform = "translate(" + mx + "px," + my + "px)";
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.transform = "";
      });
    });
  }
})();
