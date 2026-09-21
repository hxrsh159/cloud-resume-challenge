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
