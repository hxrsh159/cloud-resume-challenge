// Terminal easter egg — spec: design-system/theozdev/pages/index.md
// (creative layer, ADR-019). Opens on ` (backtick) or the ">_" nav button.
// Commands: help whoami skills resume visitors theme ping clear exit.

(function () {
  "use strict";

  var overlay = document.getElementById("terminal-overlay");
  if (!overlay) return;
  var out = document.getElementById("terminal-out");
  var form = document.getElementById("terminal-form");
  var input = document.getElementById("terminal-input");
  var openBtn = document.querySelector(".terminal-open");
  var closeBtn = document.querySelector(".terminal-close");
  var history = [];
  var hIdx = -1;

  var API_URL = "https://resume-api-ykjegodhwq-uc.a.run.app";

  function print(text, cls) {
    var div = document.createElement("div");
    if (cls) div.className = cls;
    div.textContent = text;
    out.appendChild(div);
    out.parentElement.scrollTop = out.parentElement.scrollHeight;
  }

  function printCmd(cmd) {
    print("guest@theozdev:~$ " + cmd, "t-cmd");
  }

  var commands = {
    help: function () {
      print("available commands:", "t-ok");
      print("  help       this list");
      print("  whoami     about the human behind this site");
      print("  skills     the short version");
      print("  resume     open my resume in a new tab");
      print("  visitors   live visitor count from Firestore");
      print("  theme      toggle dark/light");
      print("  ping       check the API");
      print("  clear      clear the screen");
      print("  exit       close this terminal");
    },
    whoami: function () {
      print("Harshit Singh — Software Engineer, Melbourne (Australian Citizen).", "t-ok");
      print("Production software since 2017: ERP, retail loyalty, transport");
      print("logistics, digital signage. Now building cloud-native systems on GCP.");
      print("github.com/hxrsh159 · linkedin.com/in/harsh159");
    },
    skills: function () {
      print("C#/.NET · Rust · TypeScript · PHP · SQL", "t-ok");
      print("GCP · Azure · Terraform · Docker · GitHub Actions (WIF, zero secrets)");
      print("PostgreSQL · MySQL · NATS JetStream · event-driven systems");
    },
    resume: function () {
      print("opening /resume.pdf in a new tab...", "t-ok");
      window.open("/resume.pdf", "_blank", "noopener");
    },
    visitors: function () {
      print("querying Firestore via the Rust API...");
      fetch(API_URL + "/api/visitors")
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (d) { print("visitors: " + d.count.toLocaleString() + " (you're one of them)", "t-ok"); })
        .catch(function (e) { print("API unavailable: " + e.message, "t-err"); });
    },
    theme: function () {
      var t = document.querySelector(".theme-toggle");
      if (t) { t.click(); print("theme toggled.", "t-ok"); }
    },
    ping: function () {
      var t0 = performance.now();
      print("PING resume-api (Cloud Run, us-central1)...");
      fetch(API_URL + "/health")
        .then(function (r) {
          var ms = Math.round(performance.now() - t0);
          print("reply: status=" + r.status + " time=" + ms + "ms", "t-ok");
        })
        .catch(function (e) { print("no reply: " + e.message, "t-err"); });
    },
    clear: function () { out.innerHTML = ""; },
    exit: function () { close(); }
  };

  function run(raw) {
    var cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    printCmd(cmd);
    history.unshift(raw);
    hIdx = -1;
    if (commands[cmd]) {
      commands[cmd]();
    } else {
      print("command not found: " + cmd + " — try 'help'", "t-err");
    }
  }

  function open() {
    overlay.hidden = false;
    if (!out.dataset.booted) {
      out.dataset.booted = "1";
      print("theozdev shell — welcome, guest.", "t-ok");
      print("type 'help' to see what I can do.");
      print("");
    }
    setTimeout(function () { input.focus(); }, 30);
  }

  function close() {
    overlay.hidden = true;
    input.blur();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input.value;
    input.value = "";
    run(v);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx]; }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIdx > 0) { hIdx--; input.value = history[hIdx]; }
      else { hIdx = -1; input.value = ""; }
    }
  });

  if (openBtn) openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) close();
  });

  document.addEventListener("keydown", function (e) {
    // ` backtick toggles the terminal; Esc closes it
    if (e.key === "`" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      e.preventDefault();
      overlay.hidden ? open() : close();
    } else if (e.key === "Escape" && !overlay.hidden) {
      close();
    }
  });
})();
