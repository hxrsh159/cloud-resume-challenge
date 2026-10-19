variable "project_id" {
  description = "GCP project ID to deploy into."
  type        = string
}

variable "region" {
  description = "Default region for regional resources."
  type        = string
  default     = "us-central1"
}

variable "domain_name" {
  description = "Fully-qualified domain for the site (e.g. theozdev.com). Firebase provisions a managed SSL cert once DNS points at Firebase Hosting."
  type        = string
}

variable "image_digest" {
  description = "Digest (sha256:...) of the resume-api image to deploy. Empty = :latest (bootstrap only). CI pins a digest so every deploy creates a new Cloud Run revision."
  type        = string
  default     = ""
}

variable "billing_account_id" {
  description = "Billing account ID (no billingAccounts/ prefix) that funds the project. Used by the guardrail budget."
  type        = string
}

variable "project_number" {
  description = "Project number (numeric id) of project_id. The billing budget filter wants the numeric form."
  type        = string
}
