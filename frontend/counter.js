// Visitor counter — Cloud Run REST API (see terraform/backend.tf).
const API_URL = "https://resume-api-ykjegodhwq-uc.a.run.app";

// ADR-018: don't count crawlers/automation. Each view costs a Firestore
// write; bots see the placeholder, humans get the live count.
function isBot() {
  return (
    navigator.webdriver === true ||
    /bot|crawl|spider|slurp|headless|lighthouse/i.test(navigator.userAgent)
  );
}

async function updateVisitorCounter() {
  const el = document.getElementById("visitor-counter");
  const heroPill = document.getElementById("hero-counter");
  const heroN = document.getElementById("hero-counter-n");
  if (isBot()) return; // footer keeps "—", hero pill stays hidden (ADR-018/019)
  try {
    const res = await fetch(`${API_URL}/api/visitors`, { method: "GET" });
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const data = await res.json();
    const pretty = data.count.toLocaleString();
    if (el) el.textContent = pretty;
    if (heroPill && heroN) {
      heroN.textContent = "#" + pretty;
      heroPill.hidden = false;
    }
  } catch (err) {
    console.warn("Visitor counter unavailable:", err);
    if (el) el.textContent = "unavailable";
  }
}

updateVisitorCounter();
