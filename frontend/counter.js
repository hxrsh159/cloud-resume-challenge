// Visitor counter — Cloud Run REST API (see terraform/backend.tf).
const API_URL = "https://resume-api-ykjegodhwq-uc.a.run.app";

async function updateVisitorCounter() {
  const el = document.getElementById("visitor-counter");
  try {
    const res = await fetch(`${API_URL}/api/visitors`, { method: "GET" });
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const data = await res.json();
    el.textContent = data.count.toLocaleString();
  } catch (err) {
    console.warn("Visitor counter unavailable:", err);
    el.textContent = "unavailable";
  }
}

updateVisitorCounter();
