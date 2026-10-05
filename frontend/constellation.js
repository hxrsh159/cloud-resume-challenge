// Constellation page background — spec: design-system/theozdev/pages/index.md
// (creative layer, ADR-019/020). Fixed full-viewport canvas behind all
// content: dots + proximity links + pointer attraction. Theme-aware (reads
// CSS vars), DPR-aware, pauses on hidden tab, one static frame under
// prefers-reduced-motion.

(function () {
  "use strict";

  var canvas = document.getElementById("constellation");
  if (!canvas) return;

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = canvas.getContext("2d");

  var LINK_DIST = 130;      // px: max distance for a link
  var POINTER_DIST = 170;   // px: pointer attraction radius
  var MAX_DOTS = 120;
  var DENSITY = 9000;       // px^2 per dot

  var dots = [];
  var pointer = { x: -9999, y: -9999 };
  var running = false;
  var rafId = null;
  var W = 0, H = 0, DPR = 1;

  function colors() {
    var cs = getComputedStyle(document.documentElement);
    return {
      dot: cs.getPropertyValue("--color-accent").trim() || "#22C55E",
      line: cs.getPropertyValue("--color-muted-foreground").trim() || "#94A3B8"
    };
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    seed();
    if (prefersReduced) draw();
  }

  function seed() {
    var n = Math.min(MAX_DOTS, Math.floor((W * H) / DENSITY));
    dots = [];
    for (var i = 0; i < n; i++) {
      dots.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1 + Math.random() * 1.6
      });
    }
  }

  function step() {
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      // gentle pointer attraction
      var pdx = pointer.x - d.x, pdy = pointer.y - d.y;
      var pd = Math.sqrt(pdx * pdx + pdy * pdy);
      if (pd < POINTER_DIST && pd > 0.01) {
        d.vx += (pdx / pd) * 0.012;
        d.vy += (pdy / pd) * 0.012;
      }
      d.x += d.vx;
      d.y += d.vy;
      // soft speed cap + drift floor
      d.vx *= 0.995;
      d.vy *= 0.995;
      if (Math.abs(d.vx) < 0.08) d.vx += (Math.random() - 0.5) * 0.02;
      if (Math.abs(d.vy) < 0.08) d.vy += (Math.random() - 0.5) * 0.02;
      // wrap edges
      if (d.x < -10) d.x = W + 10; else if (d.x > W + 10) d.x = -10;
      if (d.y < -10) d.y = H + 10; else if (d.y > H + 10) d.y = -10;
    }
  }

  function draw() {
    var c = colors();
    ctx.clearRect(0, 0, W, H);
    // links
    for (var i = 0; i < dots.length; i++) {
      for (var j = i + 1; j < dots.length; j++) {
        var dx = dots[i].x - dots[j].x;
        var dy = dots[i].y - dots[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          ctx.strokeStyle = c.line;
          ctx.globalAlpha = (1 - dist / LINK_DIST) * 0.35;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.stroke();
        }
      }
    }
    // dots
    ctx.fillStyle = c.dot;
    for (var k = 0; k < dots.length; k++) {
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc(dots[k].x, dots[k].y, dots[k].r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function loop() {
    if (!running) return;
    step();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (running || prefersReduced) return;
    running = true;
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  resize();
  if (prefersReduced) return; // static frame drawn in resize()

  // full-viewport background: only pause when the tab is hidden
  document.addEventListener("visibilitychange", function () {
    document.hidden ? stop() : start();
  });

  window.addEventListener("pointermove", function (e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  }, { passive: true });
  document.addEventListener("pointerleave", function () {
    pointer.x = -9999;
    pointer.y = -9999;
  });

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  // redraw with new palette after a theme flip
  var toggle = document.querySelector(".theme-toggle");
  if (toggle) toggle.addEventListener("click", function () { setTimeout(draw, 50); });

  start();
})();
