# DEHN - Multi-Language Document Processing Platform

## Development Guide

DEHN is a sophisticated document processing pipeline for multi-language content management with AI-powered translation and layout-aware rendering.

## Project Architecture

```
DEHN/
├── services/                    # Backend services
│   ├── pdf-processor/          # Python service (PyMuPDF + layout extraction)
│   ├── admin-backend/          # Express TS admin workflow API
│   └── user-backend/           # Express TS public access API
├── apps/                       # Frontend applications
│   ├── admin-frontend/         # React admin workflow panel
│   └── mobile-frontend/        # React public document viewer
├── packages/                   # Shared libraries
│   ├── api-models/            # TypeScript types and interfaces
│   └── ai-agent/              # AI/LLM integration (Gemini)
└── infrastructure/            # Deployment configuration
    └── terraform/             # Google Cloud infrastructure
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
| Admin Backend | http://localhost:3091 | Admin API endpoints |
| User Backend | http://localhost:3090 | User API endpoints |
| Admin Frontend | http://localhost:8091 | Admin web interface |
| User Frontend | http://localhost:8090 | Mobile web interface |

## API Endpoints

### PDF Processor Service (Python) - Layout-Aware Extraction
- `GET /health` - Health check
- `POST /extract` - Extract PDF with layout information and positioning data
- `POST /extract/zip` - Extract PDF + images as ZIP with complete structure

### Admin Backend Service (TypeScript) - Document Processing Workflow
**Document Processing Pipeline:**
- `POST /api/documents/upload` - Upload PDF and trigger extraction workflow
- `GET /api/documents` - List documents with processing status (paginated, searchable)
- `GET /api/documents/:id` - Get document details and current processing phase
- `GET /api/documents/:id/status` - Poll real-time processing status
- `DELETE /api/documents/:id` - Delete document and all associated content

**Content Grouping & Analysis:**
- `POST /api/documents/:id/analyze` - Trigger AI content grouping phase
- `GET /api/documents/:id/groups` - Get AI-generated content groups by language
- `PUT /api/documents/:id/groups` - Update and approve content group assignments

**Translation Management:**
- `POST /api/documents/:id/translate` - Generate missing language versions with AI
- `GET /api/documents/:id/translations` - Get all available translations and versions
- `PUT /api/documents/:id/translations/:lang` - Update/approve specific language translation

**Publishing Workflow:**
- `GET /api/documents/:id/versions` - Get all versions available for publishing
- `POST /api/documents/:id/publish` - Move selected content to public bucket
- `GET /api/documents/:id/published` - Get published status and public access URLs

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
- `GET /api/documents` - List published documents with language options
- `GET /api/documents/:id` - Get published document metadata
- `GET /api/documents/:id/content/:lang` - Get document content in specific language
- `GET /api/documents/:id/layout/:lang` - Get layout rendering data for language
- `GET /api/documents/search` - Search published documents
- `GET /api/languages` - Get available languages for documents

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

### Google Cloud Platform

1. **Setup Infrastructure**
   ```bash
   cd infrastructure/terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your GCP project ID
   
   terraform init
   terraform plan
   terraform apply
   ```

2. **Deploy Services**
   ```bash
   # Build Docker images
   docker build -t gcr.io/YOUR_PROJECT/dehn-pdf-processor services/pdf-processor
   docker build -t gcr.io/YOUR_PROJECT/dehn-admin-backend services/admin-backend
   
   # Push to Google Container Registry
   docker push gcr.io/YOUR_PROJECT/dehn-pdf-processor
   docker push gcr.io/YOUR_PROJECT/dehn-admin-backend
   ```

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
   - Connect to Firestore or PostgreSQL
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
