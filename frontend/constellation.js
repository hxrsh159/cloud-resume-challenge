// Constellation page background — spec: design-system/theozdev/pages/index.md
// (creative layer, ADR-019/020/021). Fixed full-viewport canvas behind all
// content. The network reveals around the pointer: links only form between
// dots inside the pointer radius, and both link and dot alpha fade with
// pointer distance. The pointer itself is a node in the graph.
// Theme-aware (reads CSS vars), DPR-aware, pauses on hidden tab, one static
// frame under prefers-reduced-motion.

(function () {
  "use strict";

  var canvas = document.getElementById("constellation");
  if (!canvas) return;

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = canvas.getContext("2d");

  var W = 0, H = 0, DPR = 1;
  var dots = [];
  var running = false;
  var rafId = null;

  // density/behavior tiers by viewport width (spec: pages/index.md)
  function tier() {
    var w = window.innerWidth;
    if (w > 1600) return { nb: 600, distance: 70, dRadius: 300 };
    if (w > 1300) return { nb: 575, distance: 60, dRadius: 280 };
    if (w > 1100) return { nb: 500, distance: 55, dRadius: 250 };
    if (w > 800)  return { nb: 300, distance: 0, dRadius: 0 };
    if (w > 600)  return { nb: 200, distance: 0, dRadius: 0 };
    return { nb: 100, distance: 0, dRadius: 0 };
  }
  var cfg = tier();

  // pointer: defaults to viewport center, keeps last-known position
  var pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  function palette() {
    var cs = getComputedStyle(document.documentElement);
    return {
      blue: cs.getPropertyValue("--color-glow-blue").trim() || "#3B6BFF",
      accent: cs.getPropertyValue("--color-accent").trim() || "#FFCD00",
      red: cs.getPropertyValue("--color-flag-red").trim() || "#FF4757"
    };
  }

  function rgbComponents(hex) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  var dotColors = []; // per-dot rgb triplets: 3/5 royal, 1/5 gold, 1/5 red
  var linkRGB = [59, 107, 255];

  function buildPalette() {
    var p = palette();
    linkRGB = rgbComponents(p.blue);
    var blue = rgbComponents(p.blue);
    var gold = rgbComponents(p.accent);
    var red = rgbComponents(p.red);
    dotColors = dots.map(function (_, i) {
      if (i % 5 === 3) return gold;   // cricket gold
      if (i % 5 === 4) return red;    // flag red
      return blue;                    // flag royal
    });
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cfg = tier();
    seed();
    buildPalette();
    if (prefersReduced) draw();
  }

  function seed() {
    dots = [];
    for (var i = 0; i < cfg.nb; i++) {
      dots.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: -0.5 + Math.random(),
        vy: -0.5 + Math.random(),
        r: 1.5 * Math.random()
      });
    }
  }

  function step() {
    for (var i = 1; i < dots.length; i++) {
      var d = dots[i];
      // bounce at edges
      if (d.y < 0 || d.y > H) d.vy = -d.vy;
      if (d.x < 0 || d.x > W) d.vx = -d.vx;
      d.x += d.vx;
      d.y += d.vy;
    }
    // pointer is a node
    if (dots.length) {
      dots[0].x = pointer.x;
      dots[0].y = pointer.y;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // links: only between dots that are both near the pointer
    if (cfg.distance > 0) {
      ctx.lineWidth = 0.3;
      for (var i = 0; i < dots.length; i++) {
        var a = dots[i];
        var adx = a.x - pointer.x, ady = a.y - pointer.y;
        if (adx > cfg.dRadius || adx < -cfg.dRadius || ady > cfg.dRadius || ady < -cfg.dRadius) continue;
        for (var j = i + 1; j < dots.length; j++) {
          var b = dots[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          if (dx > cfg.distance || dx < -cfg.distance || dy > cfg.distance || dy < -cfg.distance) continue;
          var bdx = b.x - pointer.x, bdy = b.y - pointer.y;
          if (bdx > cfg.dRadius || bdx < -cfg.dRadius || bdy > cfg.dRadius || bdy < -cfg.dRadius) continue;
          // alpha fades toward the radius edge
          var e = Math.sqrt(adx * adx + ady * ady) / cfg.dRadius - 0.3;
          if (e < 0) e = 0;
          var alpha = 1 - e;
          if (alpha <= 0) continue;
          ctx.strokeStyle = "rgba(" + linkRGB[0] + "," + linkRGB[1] + "," + linkRGB[2] + "," + alpha + ")";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // dots: alpha fades with pointer distance; beyond the falloff radius
    // dots are invisible — the cursor region is the active zone
    var falloff = W / 1.7;
    for (var k = 0; k < dots.length; k++) {
      var d = dots[k];
      var c = dotColors[k] || linkRGB;
      var ddx = d.x - pointer.x, ddy = d.y - pointer.y;
      var alpha2 = 1 - Math.sqrt(ddx * ddx + ddy * ddy) / falloff;
      if (alpha2 <= 0) continue;
      ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + alpha2 + ")";
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
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

  document.addEventListener("visibilitychange", function () {
    document.hidden ? stop() : start();
  });

  window.addEventListener("pointermove", function (e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  }, { passive: true });
  // keep last-known pointer position on leave (dots settle, network rests)

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  // repaint with the new palette after a theme flip
  var toggle = document.querySelector(".theme-toggle");
  if (toggle) toggle.addEventListener("click", function () {
    setTimeout(function () { buildPalette(); draw(); }, 50);
  });

  start();
})();
