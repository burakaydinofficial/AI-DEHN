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
  disable_on_destroy         = false
}

# Create a VPC network
resource "google_compute_network" "vpc_network" {
  name                    = "dehn-vpc-${var.environment}"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.required_apis]
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

# Create initial secret versions
resource "google_secret_manager_secret_version" "jwt_secret_version" {
  secret = google_secret_manager_secret.jwt_secret.name
  secret_data = "your-jwt-secret-key-change-me-in-production"
}

resource "google_secret_manager_secret_version" "ai_api_key_version" {
  secret = google_secret_manager_secret.ai_api_key.name
  secret_data = "your-ai-api-key-here"
}

resource "google_secret_manager_secret" "ai_api_key" {
  secret_id = "ai-api-key-${var.environment}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required_apis]
}

# Cloud Run services

# Service Account for Cloud Run services
resource "google_service_account" "cloud_run_sa" {
  account_id   = "dehn-cloud-run-${var.environment}"
  display_name = "Cloud Run Service Account"
  description  = "Service account for DEHN Cloud Run services"
}

# Grant Secret Manager access to the service account
resource "google_secret_manager_secret_iam_member" "ai_api_key_access" {
  secret_id = google_secret_manager_secret.ai_api_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "jwt_secret_access" {
  secret_id = google_secret_manager_secret.jwt_secret.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# PDF Processor Service
resource "google_cloud_run_service" "pdf_processor" {
  name     = "dehn-pdf-processor-${var.environment}"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.cloud_run_sa.email

      containers {
        image = "gcr.io/${var.project_id}/dehn-pdf-processor:latest"

        ports {
          container_port = 3095
        }

        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }

        resources {
          limits = {
            cpu    = var.cpu_limit
            memory = var.memory_limit
          }
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"  = var.max_scale
        "autoscaling.knative.dev/minScale"  = var.min_scale
        "run.googleapis.com/cpu-throttling" = "false"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.required_apis,
    google_service_account.cloud_run_sa
  ]
}

# Admin Backend Service
resource "google_cloud_run_service" "admin_backend" {
  name     = "dehn-admin-backend-${var.environment}"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.cloud_run_sa.email

      containers {
        image = "gcr.io/${var.project_id}/dehn-admin-backend:latest"

        ports {
          container_port = 3091
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

  depends_on = [
    google_project_service.required_apis,
    google_service_account.cloud_run_sa,
    google_secret_manager_secret_iam_member.ai_api_key_access,
    google_secret_manager_secret_iam_member.jwt_secret_access
  ]
}

# User Backend Service
resource "google_cloud_run_service" "user_backend" {
  name     = "dehn-user-backend-${var.environment}"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.cloud_run_sa.email

      containers {
        image = "gcr.io/${var.project_id}/dehn-user-backend:latest"

        ports {
          container_port = 3090
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

  depends_on = [
    google_project_service.required_apis,
    google_service_account.cloud_run_sa,
    google_secret_manager_secret_iam_member.ai_api_key_access,
    google_secret_manager_secret_iam_member.jwt_secret_access
  ]
}

# Cloud Run service IAM (conditional)
resource "google_cloud_run_service_iam_member" "public_access" {
  count = var.public_access ? 3 : 0

  service = [
    google_cloud_run_service.pdf_processor.name,
    google_cloud_run_service.admin_backend.name,
    google_cloud_run_service.user_backend.name
  ][count.index]

  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
