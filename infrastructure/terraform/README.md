# DEHN Terraform Infrastructure

This directory contains Terraform configurations for deploying the DEHN multi-service application to Google Cloud Platform.

## 🏗️ Architecture Overview

The infrastructure includes:

- **Cloud Run Services**: Serverless containers for PDF processor, admin backend, and user backend
- **Cloud Storage**: Document storage with lifecycle management
- **MongoDB Atlas**: NoSQL database for metadata and user data
- **Secret Manager**: Secure storage for API keys and secrets
- **VPC Network**: Private networking for secure communication
- **IAM**: Proper access controls and service accounts

## 📋 Prerequisites

1. **Google Cloud SDK**
   ```bash
   # Install gcloud CLI
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   gcloud init
   ```

2. **Terraform**
   ```bash
   # macOS
   brew install terraform
   
   # Linux/Windows
   # Download from: https://www.terraform.io/downloads
   ```

3. **Docker** (for building and pushing images)
   ```bash
   # macOS
   brew install docker
   
   # Linux
   sudo apt-get install docker.io
   ```

4. **Google Cloud Project**
   - Create a new project or use an existing one
   - Enable billing on the project
   - Note your project ID

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
cd infrastructure/terraform
./setup.sh
```

The setup script will:
- Check prerequisites
- Authenticate with Google Cloud
- Create and configure `terraform.tfvars`
- Initialize Terraform
- Validate configuration
- Create and optionally apply a deployment plan

### Option 2: Manual Setup

1. **Configure Variables**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

2. **Initialize Terraform**
   ```bash
   terraform init
   ```

3. **Plan Deployment**
   ```bash
   terraform plan
   ```

4. **Deploy Infrastructure**
   ```bash
   terraform apply
   ```

## ⚙️ Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `project_id` | Your GCP project ID | `"my-dehn-project"` |

### Optional Variables

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `region` | GCP region | `"us-central1"` | Any GCP region |
| `zone` | GCP zone | `"us-central1-a"` | Any zone in the region |
| `environment` | Environment name | `"dev"` | `dev`, `staging`, `prod` |
| `max_scale` | Max Cloud Run instances | `10` | `1-1000` |
| `min_scale` | Min Cloud Run instances | `0` | `0-100` |
| `cpu_limit` | CPU per service | `"1000m"` | `1000m`, `2000m`, `4000m` |
| `memory_limit` | Memory per service | `"512Mi"` | `128Mi` to `8Gi` |
| `public_access` | Allow public access | `true` | `true`, `false` |
| `storage_class` | Storage bucket class | `"STANDARD"` | `STANDARD`, `NEARLINE`, `COLDLINE`, `ARCHIVE` |

### Sample terraform.tfvars

```hcl
project_id = "my-dehn-project-12345"
region = "us-central1"
environment = "prod"
max_scale = 50
min_scale = 1
cpu_limit = "2000m"
memory_limit = "1Gi"
public_access = false
```

## 📦 Docker Images

Before deploying, you need to build and push Docker images:

```bash
# From project root
cd /Users/burakk/Hackathon/DEHN

# Build images
docker build -t gcr.io/YOUR_PROJECT_ID/dehn-pdf-processor services/pdf-processor
docker build -t gcr.io/YOUR_PROJECT_ID/dehn-admin-backend services/admin-backend  
docker build -t gcr.io/YOUR_PROJECT_ID/dehn-user-backend services/user-backend

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/dehn-pdf-processor
docker push gcr.io/YOUR_PROJECT_ID/dehn-admin-backend
docker push gcr.io/YOUR_PROJECT_ID/dehn-user-backend
```

## 🔐 Secrets Management

After deployment, set up your secrets:

```bash
# JWT Secret
echo -n "your-jwt-secret-here" | gcloud secrets versions add jwt-secret-dev --data-file=-

# AI API Key (Google Gemini)
echo -n "your-gemini-api-key" | gcloud secrets versions add ai-api-key-dev --data-file=-
```

## 🌍 Outputs

After successful deployment, Terraform provides these outputs:

```bash
terraform output
```

Example outputs:
- `pdf_processor_url`: URL for the PDF processor service
- `admin_backend_url`: URL for the admin backend
- `user_backend_url`: URL for the user backend  
- `storage_bucket_name`: Name of the document storage bucket
- `service_urls`: All service URLs in one object

## 📊 Monitoring and Management

### View Service Status
```bash
gcloud run services list --region=us-central1
```

### View Logs
```bash
gcloud logs tail --follow --format="value(textPayload)" \
  --filter="resource.labels.service_name=dehn-pdf-processor-dev"
```

### Scale Services
```bash
gcloud run services update dehn-pdf-processor-dev \
  --region=us-central1 \
  --max-instances=20
```

## 🧹 Cleanup

To destroy all infrastructure:

```bash
terraform destroy
```

**⚠️ Warning**: This will permanently delete all resources and data!

## 📁 File Structure

```
infrastructure/terraform/
├── main.tf              # Main infrastructure configuration
├── variables.tf         # Input variables
├── outputs.tf          # Output values
├── terraform.tfvars.example  # Example configuration
├── setup.sh            # Automated setup script
└── README.md           # This file
```

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Error**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

2. **Project Not Found**
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **API Not Enabled**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   ```

4. **Billing Not Enabled**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to Billing
   - Enable billing for your project

5. **Resource Quota Exceeded**
   - Request quota increases in the GCP Console
   - Or use a different region

### Getting Help

- Check the Terraform state: `terraform show`
- View detailed logs: `terraform apply -var="debug=true"`
- Validate configuration: `terraform validate`
- Format configuration: `terraform fmt`

## 🔄 Updates and Maintenance

### Update Infrastructure
```bash
# Pull latest changes
git pull

# Plan changes
terraform plan

# Apply updates
terraform apply
```

### Backup State
```bash
# Create state backup
cp terraform.tfstate terraform.tfstate.backup

# Or use remote state (recommended for production)
# Configure in main.tf:
terraform {
  backend "gcs" {
    bucket = "your-terraform-state-bucket"
    prefix = "dehn/state"
  }
}
```

---

## 📚 Additional Resources

- [Terraform Google Provider Documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)

For more help, see the main project [DEVELOPMENT.md](../../DEVELOPMENT.md) file.
