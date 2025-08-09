#!/bin/bash

# DEHN Docker Build and Deploy Script
# This script builds Docker images and pushes them to Google Container Registry

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running from correct directory
if [ ! -f "../../docker-compose.yml" ]; then
    print_error "This script must be run from the infrastructure/terraform directory"
    print_error "Current directory: $(pwd)"
    exit 1
fi

print_status "Starting DEHN Docker build and deployment..."

# Get project ID from terraform.tfvars or gcloud
PROJECT_ID=""

if [ -f "terraform.tfvars" ]; then
    PROJECT_ID=$(grep "^project_id" terraform.tfvars | cut -d'"' -f2)
fi

if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
fi

if [ -z "$PROJECT_ID" ]; then
    print_error "Could not determine GCP project ID"
    print_error "Please set it with: gcloud config set project YOUR_PROJECT_ID"
    print_error "Or create terraform.tfvars with project_id = \"YOUR_PROJECT_ID\""
    exit 1
fi

print_status "Using GCP project: $PROJECT_ID"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 > /dev/null 2>&1; then
    print_error "You are not authenticated with Google Cloud."
    print_error "Please run: gcloud auth login"
    exit 1
fi

# Configure Docker to use gcloud as a credential helper
print_step "Configuring Docker for Google Container Registry..."
gcloud auth configure-docker --quiet

# Build and push images
SERVICES=("pdf-processor" "admin-backend" "user-backend")
FAILED_SERVICES=()

for SERVICE in "${SERVICES[@]}"; do
    print_step "Building $SERVICE..."
    
    # Navigate to project root
    cd ../../
    
    # Build the Docker image
    IMAGE_NAME="gcr.io/$PROJECT_ID/dehn-$SERVICE"
    
    if docker build --platform linux/amd64 -t "$IMAGE_NAME:latest" -f "services/$SERVICE/Dockerfile" "services/$SERVICE"; then
        print_status "✅ Successfully built $SERVICE"
        
        # Push the image
        print_step "Pushing $SERVICE to Google Container Registry..."
        
        if docker push "$IMAGE_NAME:latest"; then
            print_status "✅ Successfully pushed $SERVICE"
        else
            print_error "❌ Failed to push $SERVICE"
            FAILED_SERVICES+=("$SERVICE")
        fi
    else
        print_error "❌ Failed to build $SERVICE"
        FAILED_SERVICES+=("$SERVICE")
    fi
    
    # Navigate back to terraform directory
    cd infrastructure/terraform/
    echo
done

# Summary
echo "==============================================="
if [ ${#FAILED_SERVICES[@]} -eq 0 ]; then
    print_status "🎉 All services built and pushed successfully!"
    echo
    print_status "Next steps:"
    print_status "1. Deploy infrastructure: terraform apply"
    print_status "2. Update Cloud Run services to use new images"
    print_status "3. Set up secrets in Google Secret Manager"
    echo
    print_status "Your Docker images:"
    for SERVICE in "${SERVICES[@]}"; do
        echo "  - gcr.io/$PROJECT_ID/dehn-$SERVICE:latest"
    done
else
    print_error "❌ The following services failed:"
    for SERVICE in "${FAILED_SERVICES[@]}"; do
        echo "  - $SERVICE"
    done
    echo
    print_error "Please check the errors above and try again."
    exit 1
fi

print_status "Build and push completed!"
