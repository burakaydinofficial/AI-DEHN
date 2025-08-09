# DEHN Hackathon Project 🚀

A comprehensive multi-service document processing application built for hackathon development. This project extracts detailed layout information from PDF documents and provides both REST APIs and frontend interfaces for document analysis.

## 🏗️ Architecture

### Services
- **🐍 PDF Processor** (`services/pdf-processor/`) - Python service using Bottle and PyMuPDF for PDF analysis
- **🔐 Admin Backend** (`services/admin-backend/`) - Express TypeScript API for admin operations  
- **👤 User Backend** (`services/user-backend/`) - Express TypeScript API for user operations

### Frontend Applications
- **💻 Admin Frontend** (`apps/admin-frontend/`) - React TypeScript admin panel (desktop-first)
- **📱 Mobile Frontend** (`apps/mobile-frontend/`) - React TypeScript mobile app (mobile-first)

### Shared Libraries
- **📋 API Models** (`packages/api-models/`) - Shared TypeScript types and interfaces
- **🤖 AI Agent** (`packages/ai-agent/`) - Common library for LLM integration using Google Gemini

### Infrastructure
- **☁️ Terraform** (`infrastructure/terraform/`) - Google Cloud Platform deployment
- **🗄️ MongoDB Atlas** - Document metadata, user auth, and indexing
- **📦 S3 Storage** - MinIO (local) / Google Cloud Storage (production)

## 🚀 Quick Start with Docker (Recommended)

### Prerequisites
- Docker & Docker Compose
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd DEHN
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string
```

### 2. Start All Services
```bash
# Start everything with Docker Compose
npm run dev

# Or use docker-compose directly
docker-compose up --build
```

This will start:
- 🐍 PDF Processor: http://localhost:3095
- 🔐 Admin Backend: http://localhost:3091
- 👤 User Backend: http://localhost:3090
- 💻 Admin Frontend: http://localhost:8091
- 📱 User Frontend: http://localhost:8090
- 🗄️ MinIO (S3): http://localhost:9000 (Console: http://localhost:9001)

### 3. Test PDF Processing
```bash
# Test with example file
npm run test:pdf

# Or manually:
curl -X POST -F "file=@example-files/example-flyer.pdf" http://localhost:3095/extract
```

## 🛠️ Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all services with Docker Compose |
| `npm run dev:local` | Start services locally (requires manual setup) |
| `npm run docker:down` | Stop all Docker services |
| `npm run docker:logs` | View logs from all services |
| `npm run docker:clean` | Clean up Docker containers and volumes |
| `npm run test:pdf` | Test PDF processor with example file |

## 📋 API Endpoints

### PDF Processor (Port 3095)
- `GET /health` - Health check
- `POST /extract` - Extract PDF content (returns JSON)
- `POST /extract/zip` - Extract PDF content + images (returns ZIP)

### Admin Backend (Port 3091)
- `GET /health` - Health check
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout  
- `GET /api/auth/me` - Get current admin user
- `GET /api/documents` - List all documents (paginated)
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Get document by ID
- `DELETE /api/documents/:id` - Delete document
- `GET /api/users` - List all users (paginated)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/ai/chat/start` - Start AI chat session
- `POST /api/ai/chat/:sessionId` - Continue chat conversation
- `GET /api/ai/chat/sessions` - Get chat sessions
- `POST /api/ai/analyze-document` - Analyze document with AI
- `POST /api/ai/insights` - Generate content insights
- `POST /api/ai/summarize` - Summarize content
- `POST /api/ai/questions` - Generate questions from content

### User Backend (Port 3090)
- `GET /health` - Health check
- `GET /api/auth` - Placeholder auth endpoints (coming soon)
- `GET /api/documents` - Placeholder document endpoints (coming soon)
- `GET /api/ai` - Placeholder AI endpoints (coming soon)

## 🧪 Enhanced PDF Processing Features

The PDF processor now extracts comprehensive layout information:

### Text Analysis
- **Font Properties**: Family, size, weight, style, color
- **Positioning**: Precise coordinates (x, y, width, height)
- **Hierarchy**: Text blocks → Lines → Spans structure
- **Formatting**: Bold, italic, superscript detection

### Image Extraction
- **Image Data**: Full image extraction as PNG files
- **Positioning**: Bounding boxes and transformation matrices
- **Metadata**: Color space, dimensions, file size
- **ZIP Export**: Combined JSON analysis + extracted images

## 🗄️ Database & Storage Architecture

- **MongoDB Atlas**: Document metadata, user authentication, content indexing
- **S3-Compatible Storage**: 
  - **Development**: MinIO (local Docker container)
  - **Production**: Google Cloud Storage buckets

## 🎯 Production Deployment

### Google Cloud Platform
```bash
# Use production Docker Compose
npm run docker:prod

# Or deploy with Terraform
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## 🧹 Project Improvements

✅ **Removed Makefile** - Using npm scripts for consistency  
✅ **Updated .gitignore** - Comprehensive patterns for all file types  
✅ **Test output organization** - Results saved to `test_processor/` folder  
✅ **Docker-first development** - Complete containerized stack  
✅ **Image extraction** - New `/extract/zip` endpoint with image files  
✅ **MongoDB Atlas integration** - Production-ready database  
✅ **S3-compatible storage** - Local MinIO, production GCS  

## 🐛 Troubleshooting

### Docker Issues
```bash
# Reset everything
npm run docker:clean
docker system prune -a
```

### MongoDB Connection
```bash
# Verify connection string in .env
# Check IP whitelist in MongoDB Atlas
```

### MinIO Access
- Console: http://localhost:9001
- Username: `dehn-access-key`
- Password: `dehn-secret-key`

---

**Happy Coding! 🎉**
