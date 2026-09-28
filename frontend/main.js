// Portfolio interactions — spec: design-system/theozdev/pages/index.md
// Role rotator + scroll reveal. All transform/opacity; reduced-motion safe.

(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Role rotation ---
  var roles = [
    "production software",
    "Rust services",
    "cloud platforms on GCP",
    "CI/CD with zero secrets",
    "systems that stay maintainable"
  ];
  var el = document.getElementById("role-rotator");
  if (el && !prefersReduced) {
    var i = 0;
    setInterval(function () {
      el.style.opacity = "0";
      setTimeout(function () {
        i = (i + 1) % roles.length;
        el.textContent = roles[i];
        el.style.opacity = "1";
      }, 250);
    }, 2800);
  }

  // --- Scroll reveal (fire once) ---
  var targets = document.querySelectorAll(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    targets.forEach(function (t) { t.classList.add("visible"); });
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  targets.forEach(function (t) { observer.observe(t); });
})();
