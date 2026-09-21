// Visitor counter — calls the Cloud Run REST API built in Phases 2–3.
// PHASE 3 TODO: replace with the `cloud_run_service_url` Terraform output,
// e.g. "https://resume-api-abc123-uc.a.run.app"
const API_URL = "https://YOUR-CLOUD-RUN-URL-HERE.a.run.app";

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
