# DEHN - Multi-Language Document Processing Platform

## Development Guide

DEHN is a sophisticated document processing pipeline for multi-language content management with AI-powered translation and layout-aware rendering.

## Project Architecture

```
DEHN/
├── backend/                    # Consolidated Express TypeScript API
├── frontend/                   # Consolidated React TypeScript application
├── services/                   # Specialized services
│   └── pdf-processor/          # Python service (PyMuPDF + layout extraction)
└── infrastructure/             # Deployment configuration
    └── terraform/              # Google Cloud infrastructure
```

## Core Workflow

1. **PDF Upload & Extraction** → Admin uploads → PDF processor extracts with layout
2. **Content Grouping** → AI analyzes and groups repeated components across languages  
3. **Translation Generation** → AI creates missing language versions with layout awareness
4. **Publishing** → Admin selects versions → Content moves to public bucket → Users access

## Quick Start

1. **Clone and Setup**
   ```bash
   cd /Users/burakk/Hackathon/DEHN
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Update .env with:
   # - MongoDB Atlas connection string
   # - Google Cloud Storage credentials (production)
   # - AI API keys (Gemini)
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

## Service URLs (Development)

| Service | URL | Purpose |
|---------|-----|---------|
| PDF Processor | http://localhost:3095 | PDF analysis & image extraction |
| Backend | http://localhost:3090 | Consolidated API endpoints |
| Frontend | http://localhost:3000 | Consolidated web interface |

## API Endpoints

### PDF Processor Service (Python) - Layout-Aware Extraction
- `GET /health` - Health check
- `POST /extract` - Extract PDF with layout information and positioning data
- `POST /extract/zip` - Extract PDF + images as ZIP with complete structure

### Backend Service (TypeScript) - Consolidated API
**Admin Document Processing Pipeline:**
- `POST /api/admin/documents/upload` - Upload PDF and trigger extraction workflow
- `GET /api/admin/documents` - List documents with processing status (paginated, searchable)
- `GET /api/admin/documents/:id` - Get document details and current processing phase
- `GET /api/admin/documents/:id/status` - Poll real-time processing status
- `DELETE /api/admin/documents/:id` - Delete document and all associated content

**Public Document Access:**
- `GET /api/documents` - List published documents
- `GET /api/documents/:id` - Get published document details

**Content Grouping & Analysis:**
- `POST /api/admin/documents/:id/analyze` - Trigger AI content grouping phase
- `GET /api/admin/documents/:id/groups` - Get AI-generated content groups by language
- `PUT /api/admin/documents/:id/groups` - Update and approve content group assignments

**Translation Management:**
- `POST /api/documents/:id/translate` - Generate missing language versions with AI
- `GET /api/documents/:id/translations` - Get all available translations and versions
- `PUT /api/documents/:id/translations/:lang` - Update/approve specific language translation

**Publishing Workflow:**
- `GET /api/documents/:id/versions` - Get all versions available for publishing
- `POST /api/documents/:id/publish` - Process and publish selected content:
  - Generate SHA-256 hashes for all images
  - Copy optimized images to public bucket with hash names
  - Create pre-baked JSON with hash-based image references
  - Validate layout for print compatibility and overlay detection
  - Update database with publication status and public URLs
- `GET /api/documents/:id/published` - Get published status and CDN URLs
- `GET /api/documents/:id/images/hashes` - Get image hash mappings
- `POST /api/documents/:id/images/optimize` - Optimize images for web/print
- `GET /api/documents/:id/layout/validate` - Validate pixel-perfect positioning

**Authentication & User Management:**
- `POST /api/auth/login` - Admin authentication
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/me` - Get current admin user details
- `GET /api/users` - List users (paginated, searchable)
- `GET /api/users/:id` - Get user by ID  
- `PUT /api/users/:id` - Update user information
- `DELETE /api/users/:id` - Delete user account

**AI Integration:**
- `POST /api/ai/analyze-document` - AI document structure analysis
- `POST /api/ai/group-content` - AI content grouping across languages
- `POST /api/ai/translate` - AI translation with layout context
- `POST /api/ai/chat/start` - Start AI processing session
- `POST /api/ai/chat/:sessionId` - Continue AI conversation
- `GET /api/ai/chat/sessions` - Get user's AI processing sessions

### User Backend Service (TypeScript) - Public Document Access
- `GET /health` - Health check
- `GET /api/documents` - List published documents with language availability
- `GET /api/documents/:id` - Get published document metadata 
- `GET /api/documents/:id/pages/:lang` - Get pre-baked page layout JSON
- `GET /api/documents/:id/page/:pageNum/:lang` - Get specific page with hash-named images
- `GET /api/documents/:id/print/:lang` - Get print-optimized layout
- `GET /api/documents/search` - Search published documents
- `GET /api/languages` - Get available languages

**Direct Public Bucket Access (No API needed):**
- Public JSON files: `https://cdn.example.com/documents/:id/:lang/pages.json`
- Hash-named images: `https://cdn.example.com/images/:sha256hash.png`
- Print layouts: `https://cdn.example.com/documents/:id/:lang/print.json`

## Development Workflow

### 1. Working with Services

**Python PDF Processor:**
```bash
cd services/pdf-processor
pip install -r requirements.txt
python main.py
```

**Express Backend Services:**
```bash
cd services/admin-backend
npm install
npm run dev
```

### 2. Working with Frontend Apps

**Admin Frontend:**
```bash
cd apps/admin-frontend
npm install
npm run dev
```

**Mobile Frontend:**
```bash
cd apps/mobile-frontend
npm install
npm run dev
```

### 3. Working with Shared Packages

**API Models:**
```bash
cd packages/api-models
npm run build
```

**AI Agent:**
```bash
cd packages/ai-agent
npm run build
```

## Testing

### API Testing
Use the provided REST files or tools like Postman:

```bash
# Test PDF processor
curl -X POST -F "file=@example-files/example-flyer.pdf" \
  http://localhost:3095/extract
  -F "file=@test.pdf"

# Test admin backend health
curl http://localhost:3091/health
```

### Frontend Testing
Navigate to the respective URLs in your browser:
- Admin: http://localhost:8091
- User: http://localhost:8090

## Deployment

### Google Cloud Platform (Recommended)

The project includes comprehensive Terraform infrastructure-as-code for seamless GCP deployment.

#### Prerequisites

1. **Install Required Tools**
   ```bash
   # Google Cloud SDK
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   gcloud init
   
   # Terraform
   brew install terraform  # macOS
   # or download from: https://www.terraform.io/downloads
   
   # Docker (for building images)
   brew install docker  # macOS
   ```

2. **GCP Project Setup**
   - Create a new Google Cloud Project
   - Enable billing on the project
   - Note your project ID

#### Quick Deployment

1. **Automated Infrastructure Setup**
   ```bash
   cd infrastructure/terraform
   ./setup.sh
   ```
   
   This script will:
   - Check all prerequisites
   - Authenticate with Google Cloud
   - Configure terraform.tfvars automatically
   - Initialize and validate Terraform
   - Create and optionally apply deployment plan

2. **Build and Push Docker Images**
   ```bash
   # Still in infrastructure/terraform directory
   ./build-and-push.sh
   ```
   
   This will build and push all service images to Google Container Registry.

3. **Deploy Infrastructure**
   ```bash
   terraform apply
   ```

4. **Configure Secrets**
   ```bash
   # Set JWT secret
   echo -n "your-jwt-secret-here" | \
     gcloud secrets versions add jwt-secret-dev --data-file=-
   
   # Set AI API key (Google Gemini)
   echo -n "your-gemini-api-key" | \
     gcloud secrets versions add ai-api-key-dev --data-file=-
   ```

#### Manual Deployment

1. **Setup Infrastructure**
   ```bash
   cd infrastructure/terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your GCP project ID
   
   terraform init
   terraform plan
   terraform apply
   ```

2. **Build Docker Images**
   ```bash
   # From project root
   cd /Users/burakk/Hackathon/DEHN
   
   PROJECT_ID="your-gcp-project-id"
   
   # Build images
   docker build -t gcr.io/$PROJECT_ID/dehn-pdf-processor services/pdf-processor
   docker build -t gcr.io/$PROJECT_ID/dehn-admin-backend services/admin-backend
   docker build -t gcr.io/$PROJECT_ID/dehn-user-backend services/user-backend
   
   # Configure Docker for GCR
   gcloud auth configure-docker
   
   # Push to Google Container Registry
   docker push gcr.io/$PROJECT_ID/dehn-pdf-processor
   docker push gcr.io/$PROJECT_ID/dehn-admin-backend
   docker push gcr.io/$PROJECT_ID/dehn-user-backend
   ```

#### Configuration Options

The Terraform configuration supports extensive customization via `terraform.tfvars`:

```hcl
project_id = "my-dehn-project-12345"
region = "us-central1"
environment = "prod"
max_scale = 50          # Max Cloud Run instances
min_scale = 1           # Min Cloud Run instances
cpu_limit = "2000m"     # CPU per service
memory_limit = "1Gi"    # Memory per service
public_access = false   # Require authentication
storage_class = "STANDARD"  # Storage bucket class
```

#### Post-Deployment

After successful deployment, get your service URLs:

```bash
terraform output
```

The infrastructure includes:
- **Cloud Run Services**: Serverless, auto-scaling containers
- **Cloud Storage**: Document storage with lifecycle management
- **MongoDB Atlas**: NoSQL database for metadata
- **Secret Manager**: Secure API key storage
- **VPC Network**: Private networking
- **IAM**: Proper access controls

### Local Development with Docker

For local development and testing:

```bash
# Start all services
npm run dev

# Or start individual services
npm run dev:local
```

### Production Considerations

1. **Custom Domains**: Configure Cloud DNS and SSL certificates
2. **Monitoring**: Set up Cloud Monitoring and Logging
3. **Security**: Review IAM roles and network security
4. **Backup**: Configure automated backups for MongoDB Atlas
5. **CDN**: Set up Cloud CDN for static assets

## Troubleshooting

### Common Issues

1. **Workspace Dependencies Error**
   - Run `./setup.sh` to install dependencies individually
   - Make sure Node.js version is 18+

2. **Python Dependencies**
   - Ensure Python 3.9+ is installed
   - On macOS: `brew install python`
   - Install dependencies: `pip install -r requirements.txt`

3. **TypeScript Errors**
   - Build shared packages first: `npm run build:packages`
   - Check that all workspace references are correct

4. **CORS Issues**
   - Update CORS_ORIGINS in backend .env files
   - Ensure frontend URLs match CORS configuration

5. **AI API Errors**
   - Set up Google Gemini API key in .env files
   - Check API quotas and billing

## Environment Variables Reference

### Required Environment Variables

**Admin Backend:**
- `JWT_SECRET` - Secret for JWT token signing
- `AI_API_KEY` - Google Gemini API key
- `PDF_PROCESSOR_URL` - URL of PDF processor service

**User Backend:**
- `JWT_SECRET` - Secret for JWT token signing
- `AI_API_KEY` - Google Gemini API key

**PDF Processor:**
- `PORT` - Server port (default: 3095)
- `DEBUG` - Debug mode (true/false)

## Next Steps

1. **Implement Authentication**
   - Set up proper JWT authentication
   - Add user registration endpoints
   - Implement role-based access control

2. **Add Database Integration**
   - Connect to MongoDB Atlas
   - Implement proper data models
   - Add database migrations

3. **Enhance AI Features**
   - Add more AI analysis types
   - Implement chat persistence
   - Add AI response caching

4. **Improve Frontend**
   - Add proper routing
   - Implement file upload UI
   - Add responsive design components
   - Add error handling and loading states

5. **Add Monitoring**
   - Implement logging
   - Add health checks
   - Set up error tracking
   - Add performance monitoring

Happy coding! 🚀
