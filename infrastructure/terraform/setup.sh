#!/bin/bash

# DEHN Terraform Setup Script
# This script helps set up and deploy the DEHN infrastructure on Google Cloud Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if running from correct directory
if [ ! -f "main.tf" ]; then
    print_error "This script must be run from the infrastructure/terraform directory"
    print_error "Current directory: $(pwd)"
    print_error "Expected files: main.tf, variables.tf, outputs.tf"
    exit 1
fi

print_status "Starting DEHN Terraform setup..."

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    print_error "Terraform is not installed. Please install it first:"
    print_error "  macOS: brew install terraform"
    print_error "  Linux: https://learn.hashicorp.com/tutorials/terraform/install-cli"
    print_error "  Windows: https://learn.hashicorp.com/tutorials/terraform/install-cli"
    exit 1
fi

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud SDK is not installed. Please install it first:"
    print_error "  https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 > /dev/null 2>&1; then
    print_warning "You are not authenticated with Google Cloud."
    print_status "Running 'gcloud auth login'..."
    gcloud auth login
fi

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")

if [ -z "$CURRENT_PROJECT" ]; then
    print_warning "No default project set in gcloud."
    print_status "Please set a project with: gcloud config set project YOUR_PROJECT_ID"
    read -p "Enter your GCP project ID: " PROJECT_ID
    gcloud config set project "$PROJECT_ID"
    CURRENT_PROJECT="$PROJECT_ID"
fi

print_status "Using GCP project: $CURRENT_PROJECT"

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    print_warning "terraform.tfvars not found. Creating from template..."
    cp terraform.tfvars.example terraform.tfvars
    
    # Update project_id in terraform.tfvars
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-gcp-project-id/$CURRENT_PROJECT/" terraform.tfvars
    else
        # Linux
        sed -i "s/your-gcp-project-id/$CURRENT_PROJECT/" terraform.tfvars
    fi
    
    print_status "Updated terraform.tfvars with project ID: $CURRENT_PROJECT"
    print_warning "Please review terraform.tfvars and update any values as needed."
    
    read -p "Press Enter to continue or Ctrl+C to exit and edit terraform.tfvars..."
fi

# Initialize Terraform
print_status "Initializing Terraform..."
terraform init

# Validate configuration
print_status "Validating Terraform configuration..."
terraform validate

if [ $? -eq 0 ]; then
    print_status "✅ Terraform configuration is valid"
else
    print_error "❌ Terraform configuration is invalid. Please fix the errors above."
    exit 1
fi

# Plan deployment
print_status "Creating Terraform plan..."
terraform plan -out=tfplan

# Ask user if they want to apply
echo
print_status "Terraform plan created successfully!"
print_warning "This will create the following resources in GCP:"
print_warning "  • Cloud Run services (3)"
print_warning "  • Cloud Storage bucket"
print_warning "  • MongoDB Atlas connection"
print_warning "  • VPC network and subnet"
print_warning "  • Secret Manager secrets (2)"
print_warning "  • Required API enablement"
echo
read -p "Do you want to apply this plan? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Applying Terraform plan..."
    terraform apply tfplan
    
    if [ $? -eq 0 ]; then
        print_status "✅ Infrastructure deployed successfully!"
        echo
        print_status "Getting service URLs..."
        terraform output
        echo
        print_status "Next steps:"
        print_status "1. Build and push your Docker images to Google Container Registry"
        print_status "2. Update the Cloud Run services to use your images"
        print_status "3. Set up your secrets in Google Secret Manager"
        print_status "4. Configure your domain (if using custom domain)"
        echo
        print_status "Deployment complete! 🎉"
    else
        print_error "❌ Terraform apply failed. Please check the errors above."
        exit 1
    fi
else
    print_status "Terraform plan saved as 'tfplan'. You can apply it later with:"
    print_status "  terraform apply tfplan"
fi

print_status "Setup complete!"
