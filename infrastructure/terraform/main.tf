# DEHN Hackathon - Google Cloud Infrastructure
# Terraform configuration for deploying the multi-service application

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Variables
variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "containerregistry.googleapis.com",
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com",
    "firestore.googleapis.com"
  ])
  
  project = var.project_id
  service = each.value
  
  disable_dependent_services = false
  disable_on_destroy        = false
}

# Create a VPC network
resource "google_compute_network" "vpc_network" {
  name                    = "dehn-vpc-${var.environment}"
  auto_create_subnetworks = false
  depends_on             = [google_project_service.required_apis]
}

# Create a subnet
resource "google_compute_subnetwork" "subnet" {
  name          = "dehn-subnet-${var.environment}"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc_network.id
}

# Firestore database
resource "google_firestore_database" "main" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
  
  depends_on = [google_project_service.required_apis]
}

# Cloud Storage bucket for document storage
resource "google_storage_bucket" "documents" {
  name     = "dehn-documents-${var.project_id}-${var.environment}"
  location = var.region
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }
}

# Secret Manager secrets
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "jwt-secret-${var.environment}"
  
  replication {
    auto {}
  }
  
  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret" "ai_api_key" {
  secret_id = "ai-api-key-${var.environment}"
  
  replication {
    auto {}
  }
  
  depends_on = [google_project_service.required_apis]
}

# Cloud Run services

# PDF Processor Service
resource "google_cloud_run_service" "pdf_processor" {
  name     = "dehn-pdf-processor-${var.environment}"
  location = var.region
  
  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/dehn-pdf-processor:latest"
        
        ports {
          container_port = 3001
        }
        
        env {
          name  = "PORT"
          value = "3001"
        }
        
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
        
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
        "run.googleapis.com/cpu-throttling" = "false"
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [google_project_service.required_apis]
}

# Admin Backend Service
resource "google_cloud_run_service" "admin_backend" {
  name     = "dehn-admin-backend-${var.environment}"
  location = var.region
  
  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/dehn-admin-backend:latest"
        
        ports {
          container_port = 3001
        }
        
        env {
          name  = "PORT"
          value = "3001"
        }
        
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
        
        env {
          name  = "PDF_PROCESSOR_URL"
          value = google_cloud_run_service.pdf_processor.status[0].url
        }
        
        env {
          name = "JWT_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.jwt_secret.secret_id
              key  = "latest"
            }
          }
        }
        
        env {
          name = "AI_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.ai_api_key.secret_id
              key  = "latest"
            }
          }
        }
        
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [google_project_service.required_apis]
}

# User Backend Service
resource "google_cloud_run_service" "user_backend" {
  name     = "dehn-user-backend-${var.environment}"
  location = var.region
  
  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/dehn-user-backend:latest"
        
        ports {
          container_port = 3002
        }
        
        env {
          name  = "PORT"
          value = "3002"
        }
        
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
        
        env {
          name = "JWT_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.jwt_secret.secret_id
              key  = "latest"
            }
          }
        }
        
        env {
          name = "AI_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.ai_api_key.secret_id
              key  = "latest"
            }
          }
        }
        
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [google_project_service.required_apis]
}

# Cloud Run service IAM
resource "google_cloud_run_service_iam_member" "public_access" {
  count = 3
  
  service = [
    google_cloud_run_service.pdf_processor.name,
    google_cloud_run_service.admin_backend.name,
    google_cloud_run_service.user_backend.name
  ][count.index]
  
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Outputs
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
