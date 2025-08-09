# DEHN - MVP Development Guide

## Development Guide

DEHN is a **Docker Compose** based document processing platform built for rapid MVP deployment with simplified local infrastructure.

## Project Architecture

```
DEHN/
├── backend/                    # Consolidated Express TypeScript API
├── frontend/                   # Consolidated React TypeScript application
├── services/
│   └── pdf-processor/          # Python PDF processing service
└── docker-compose.yml          # Complete deployment configuration
```

## Core Workflow

1. **PDF Upload & Extraction** → User uploads → PDF processor extracts content
2. **AI Analysis** → Google Gemini analyzes document content
3. **Storage** → Documents stored in local file system
4. **Access** → Users access processed documents through React UI

## Quick Start

1. **Clone and Setup**
   ```bash
   cd /Users/burakk/Hackathon/DEHN
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start with Docker Compose**
   ```bash
   # Start all services
   docker compose up -d
   
   # View logs
   docker compose logs -f
   ```

3. **Development Mode**
   ```bash
   # Install dependencies
   npm install
   
   # Start development servers
   npm run dev:local
   ```

## Environment Configuration

### Required Environment Variables

```bash
# Database (MongoDB Docker container)
MONGODB_URI=mongodb://mongodb:27017/dehn

# Storage (Local file system)
STORAGE_ROOT=/app/storage

# Services
BACKEND_PORT=3000
FRONTEND_PORT=3001
PDF_PROCESSOR_PORT=3002

# Security
JWT_SECRET=your-secure-jwt-secret-key
AI_API_KEY=your-google-gemini-api-key

# CORS
CORS_ORIGINS=http://localhost:3001,http://localhost:5173
```

### Development vs Docker Compose

**Development Mode** (`npm run dev:local`):
- Services run directly on host
- Uses localhost for service communication
- Ideal for development and debugging

**Docker Compose Mode** (`npm run dev`):
- Services run in containers
- Uses Docker network for communication
- Production-like environment

## Service Architecture

### Backend (`backend/`)
**Technology**: Express.js + TypeScript
**Port**: 3000
**Features**:
- RESTful API endpoints
- JWT authentication
- MongoDB integration
- Local file storage
- AI integration (Google Gemini)

**Key Files**:
- `src/server.ts` - Main application server
- `src/routes/` - API route definitions
- `src/utils/index.ts` - Storage provider (local file system)
- `src/utils/aiAgent.ts` - Google Gemini integration
- `src/types/api.ts` - TypeScript type definitions

### Frontend (`frontend/`)
**Technology**: React + TypeScript + Vite
**Port**: 3001
**Features**:
- Responsive UI (desktop and mobile)
- Document upload interface
- User authentication
- Document management
- Real-time processing status

**Key Files**:
- `src/App.tsx` - Main application component
- `src/pages/` - Page components
- `src/types/api.ts` - TypeScript types (synced with backend)

### PDF Processor (`services/pdf-processor/`)
**Technology**: Python + Bottle + PyMuPDF
**Port**: 3002
**Features**:
- PDF parsing and text extraction
- Layout-aware content extraction
- Image processing
- RESTful API interface

**Key Files**:
- `main.py` - Bottle web server
- `run-dev.py` - Development server

### MongoDB
**Technology**: MongoDB (Docker container)
**Port**: 27017
**Collections**:
- `documents` - Document metadata and processing status
- `users` - User accounts and authentication

## API Documentation

### Authentication Endpoints
```
POST /api/auth/register   - User registration
POST /api/auth/login      - User login  
GET  /api/auth/me         - Current user info
```

### Document Endpoints
```
GET    /api/documents        - List documents
POST   /api/documents        - Upload document
GET    /api/documents/:id    - Get document details
DELETE /api/documents/:id    - Delete document
```

### AI Endpoints
```
POST /api/ai/analyze         - Analyze document with AI
```

### PDF Processor Endpoints
```
POST /extract                - Process PDF document
GET  /health                 - Health check
```

## Development Workflow

### 1. Setup Development Environment
```bash
# Clone repository
git clone <repository-url>
cd DEHN

# Copy environment config
cp .env.example .env

# Install dependencies
npm install
```

### 2. Start Services

**Option A: Docker Compose (Recommended)**
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f pdf-processor
```

**Option B: Development Mode**
```bash
# Start backend and frontend only
npm run dev:local

# PDF processor runs in Docker
docker compose up pdf-processor mongodb
```

### 3. Access Applications
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **PDF Processor**: http://localhost:3002
- **MongoDB**: localhost:27017

## File Storage

### Local File System Storage
The MVP uses local file system storage instead of cloud storage:

```typescript
// Storage structure
/app/storage/
├── private/          # Private documents (admin access)
└── public/           # Public documents (user access)
```

### Storage Configuration
```typescript
// backend/src/utils/index.ts
export function createStorageProvider(cfg: StorageProviderConfig): StorageProvider {
  return new LocalFileSystemProvider(cfg);
}
```

## Database Schema

### Documents Collection
```typescript
{
  _id: ObjectId,
  title: string,
  originalFilename: string,
  fileSize: number,
  contentType: string,
  status: 'processing' | 'completed' | 'error',
  uploadedBy: ObjectId,
  uploadedAt: Date,
  processedAt?: Date,
  extractedContent?: any,
  aiAnalysis?: any,
  privateFileUrl: string,
  publicFileUrl?: string
}
```

### Users Collection
```typescript
{
  _id: ObjectId,
  email: string,
  password: string, // bcrypt hashed
  role: 'admin' | 'user',
  createdAt: Date,
  lastLoginAt?: Date
}
```

## AI Integration

### Google Gemini Integration
```typescript
// backend/src/utils/aiAgent.ts
export class AIAgent {
  async analyzeDocument(content: string, prompt?: string): Promise<AIAnalysisResult>
  async translateContent(content: string, targetLanguage: string): Promise<AITranslationResult>
  async extractKeywords(content: string): Promise<string[]>
}
```

### Usage Example
```typescript
const aiAgent = new AIAgent({ apiKey: process.env.AI_API_KEY });
const analysis = await aiAgent.analyzeDocument(documentContent);
```

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### PDF Processor Tests
```bash
cd services/pdf-processor
python -m pytest
```

### Integration Testing
```bash
# Start services
docker compose up -d

# Run integration tests
npm run test
```

## Debugging

### Check Service Health
```bash
# Backend health check
curl http://localhost:3000/health

# PDF Processor health check  
curl http://localhost:3002/health

# Check service logs
docker compose logs backend
docker compose logs pdf-processor
```

### Database Debugging
```bash
# Connect to MongoDB
docker compose exec mongodb mongosh

# Or use MongoDB Compass
# Connection: mongodb://localhost:27017
```

### Storage Debugging
```bash
# Check storage directory
docker compose exec backend ls -la /app/storage

# Check file permissions
docker compose exec backend ls -la /app/storage/private
docker compose exec backend ls -la /app/storage/public
```

## Common Issues

### MongoDB Connection Issues
```bash
# Check MongoDB container
docker compose logs mongodb

# Reset MongoDB data
docker compose down -v
docker volume rm dehn_mongodb_data
docker compose up -d
```

### Storage Permission Issues
```bash
# Fix storage permissions
docker compose exec backend mkdir -p /app/storage/private /app/storage/public
docker compose exec backend chmod -R 755 /app/storage
```

### Port Conflicts
```bash
# Check port usage
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Stop conflicting processes or change ports in .env
```

## Contributing

### Code Style
- TypeScript for all backend and frontend code
- ESLint + Prettier for code formatting
- Functional programming patterns preferred
- Comprehensive error handling

### Commit Guidelines
```bash
# Feature commits
git commit -m "feat: add document upload functionality"

# Bug fixes
git commit -m "fix: resolve MongoDB connection issue"

# Documentation
git commit -m "docs: update API documentation"
```

## Deployment

### Docker Compose Deployment
```bash
# Production deployment
docker compose up -d

# Check service status
docker compose ps

# View production logs
docker compose logs -f
```

### Environment Variables for Production
```bash
# Use strong secrets in production
JWT_SECRET=strong-random-secret-256-bits
AI_API_KEY=production-gemini-api-key

# Configure for production URLs
BACKEND_URL=http://your-domain.com:3000
FRONTEND_PORT=80

# Use production MongoDB
MONGODB_URI=mongodb://mongodb:27017/dehn_production
```

## Security Considerations

### Authentication & Authorization
- JWT tokens with secure secrets
- Password hashing with bcryptjs
- Role-based access control (admin/user)

### Input Validation
- File upload restrictions (PDF only, size limits)
- Request body validation
- SQL injection prevention

### CORS Configuration
- Restricted to known frontend origins
- Credentials support for authentication
- Preflight request handling

### File Storage Security
- Private/public file separation
- Access control through API authentication
- File type validation
