# Outputs for DEHN Infrastructure

output "pdf_processor_url" {
  description = "URL of the PDF processor service"
  value       = google_cloud_run_service.pdf_processor.status[0].url
}

output "admin_backend_url" {
  description = "URL of the admin backend service"
  value       = google_cloud_run_service.admin_backend.status[0].url
}

output "user_backend_url" {
  description = "URL of the user backend service"
  value       = google_cloud_run_service.user_backend.status[0].url
}

output "storage_bucket_name" {
  description = "Name of the documents storage bucket"
  value       = google_storage_bucket.documents.name
}

output "storage_bucket_url" {
  description = "URL of the documents storage bucket"
  value       = google_storage_bucket.documents.url
}

output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP Region"
  value       = var.region
}

output "environment" {
  description = "Environment"
  value       = var.environment
}

output "vpc_network_name" {
  description = "VPC network name"
  value       = google_compute_network.vpc_network.name
}

output "subnet_name" {
  description = "Subnet name"
  value       = google_compute_subnetwork.subnet.name
}

output "secret_manager_secrets" {
  description = "Secret Manager secrets"
  value = {
    jwt_secret = google_secret_manager_secret.jwt_secret.secret_id
    ai_api_key = google_secret_manager_secret.ai_api_key.secret_id
  }
}

# Service URLs for easy access
output "service_urls" {
  description = "All service URLs"
  value = {
    pdf_processor = google_cloud_run_service.pdf_processor.status[0].url
    admin_backend = google_cloud_run_service.admin_backend.status[0].url
    user_backend  = google_cloud_run_service.user_backend.status[0].url
  }
}
