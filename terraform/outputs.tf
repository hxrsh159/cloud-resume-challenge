output "firebase_default_url" {
  description = "URL that works immediately after first deploy, no DNS needed."
  value       = google_firebase_hosting_site.site.default_url
}

output "site_url" {
  description = "Public URL once DNS + managed SSL cert finish provisioning."
  value       = "https://${var.domain_name}"
}

output "dns_records_to_create" {
  description = "DNS records Cloudflare needs for domain verification + routing. If empty, check the Firebase console (Hosting -> theozdev.com)."
  value       = try(google_firebase_hosting_custom_domain.apex.required_dns_updates, null)
}

output "cloud_run_url" {
  description = "Public URL of the visitor counter API. Referenced by frontend/counter.js."
  value       = google_cloud_run_v2_service.api.uri
}

output "deploy_hint" {
  description = "Command to publish the frontend/ directory (Phase 4 automates this in GitHub Actions)."
  value       = "firebase deploy --only hosting"
}
