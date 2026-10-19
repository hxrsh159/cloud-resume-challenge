// Visitor counter — Cloud Run REST API (see terraform/backend.tf).
// Single source of truth for the API URL: terminal.js reads the
// window.RESUME_API_URL global set here (counter.js always loads first
// on every page that has the terminal).
const API_URL = "https://resume-api-ykjegodhwq-uc.a.run.app";
window.RESUME_API_URL = API_URL;

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
  if (isBot()) return; // leaves the "—" placeholder
  try {
    const res = await fetch(`${API_URL}/api/visitors`, { method: "GET" });
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const data = await res.json();
    if (el) el.textContent = data.count.toLocaleString();
  } catch (err) {
    console.warn("Visitor counter unavailable:", err);
    if (el) el.textContent = "unavailable";
  }
}

updateVisitorCounter();
