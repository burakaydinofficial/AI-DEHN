# Variables for DEHN Terraform Configuration

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

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "mongodb_connection_string" {
  description = "MongoDB Atlas connection string"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Custom domain name for the application (optional)"
  type        = string
  default     = ""
}

variable "enable_apis" {
  description = "Enable required Google Cloud APIs"
  type        = bool
  default     = true
}

variable "storage_class" {
  description = "Storage class for document bucket"
  type        = string
  default     = "STANDARD"

  validation {
    condition     = contains(["STANDARD", "NEARLINE", "COLDLINE", "ARCHIVE"], var.storage_class)
    error_message = "Storage class must be one of: STANDARD, NEARLINE, COLDLINE, ARCHIVE."
  }
}

variable "max_scale" {
  description = "Maximum number of instances for Cloud Run services"
  type        = number
  default     = 10

  validation {
    condition     = var.max_scale >= 1 && var.max_scale <= 1000
    error_message = "Max scale must be between 1 and 1000."
  }
}

variable "min_scale" {
  description = "Minimum number of instances for Cloud Run services"
  type        = number
  default     = 0

  validation {
    condition     = var.min_scale >= 0 && var.min_scale <= 100
    error_message = "Min scale must be between 0 and 100."
  }
}

variable "cpu_limit" {
  description = "CPU limit for Cloud Run services"
  type        = string
  default     = "1000m"
}

variable "memory_limit" {
  description = "Memory limit for Cloud Run services"
  type        = string
  default     = "512Mi"
}

variable "public_access" {
  description = "Allow public access to Cloud Run services"
  type        = bool
  default     = true
}
