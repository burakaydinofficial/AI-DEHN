# DEHN - Document Processing Platform MVP

A **Docker Compose** based document processing platform that enables multi-language content transformation and AI-powered analysis. Built for rapid MVP deployment with simplified local infrastructure.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for development)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd DEHN
cp .env.example .env
# Edit .env with your configuration
```

### 2. Start with Docker Compose
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001  
- **PDF Processor**: http://localhost:3002
- **MongoDB**: localhost:27017

## 📁 Project Structure

```
DEHN/
├── backend/              # Consolidated Express TypeScript API
├── frontend/             # Consolidated React TypeScript UI  
├── services/
│   └── pdf-processor/    # Python PDF processing service
├── docker-compose.yml    # Complete deployment stack
└── .env                  # Environment configuration
```

## 🛠️ Services

### Backend (`backend/`)
- **Technology**: Express.js + TypeScript
- **Port**: 3001
- **Features**: Authentication, document management, AI integration
- **Database**: MongoDB (local Docker container)
- **Storage**: Local file system

### Frontend (`frontend/`)
- **Technology**: React + TypeScript  
- **Port**: 3000
- **Features**: Responsive UI, document upload/management
- **API**: Connects to backend at port 3001

### PDF Processor (`services/pdf-processor/`)
- **Technology**: Python + Bottle + PyMuPDF
- **Port**: 3002
- **Features**: PDF parsing, text extraction, image processing

### MongoDB
- **Port**: 27017
- **Data**: Persistent volume (`mongodb_data`)
- **Collections**: documents, users

## 🔧 Development

### Local Development Mode
```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```

### Individual Service Development
```bash
# Backend only
cd backend && npm run dev

# Frontend only  
cd frontend && npm run dev

# PDF Processor only
cd services/pdf-processor && python run-dev.py
```

## 📝 Environment Configuration

Key environment variables (`.env`):

```bash
# Database
MONGODB_URI=mongodb://mongodb:27017/dehn

# Storage
STORAGE_ROOT=/app/storage

# Services
BACKEND_PORT=3001
FRONTEND_PORT=3000
PDF_PROCESSOR_PORT=3002

# Security
JWT_SECRET=your-secure-jwt-secret
AI_API_KEY=your-google-gemini-api-key
```

## 🎯 MVP Features

- ✅ **Document Upload**: PDF file upload and storage
- ✅ **User Management**: Authentication and user accounts  
- ✅ **AI Integration**: Google Gemini for document analysis
- ✅ **Responsive UI**: Works on desktop and mobile
- ✅ **Local Deployment**: No cloud dependencies
- ✅ **Persistent Storage**: MongoDB + local file system

## 🐳 Docker Deployment

The platform is designed for **Docker Compose only** deployment:

```yaml
# docker-compose.yml services:
- backend        # Express API server
- frontend       # React application  
- pdf-processor  # Python PDF service
- mongodb        # Database
```

All services communicate through Docker's internal network with persistent data volumes.

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Current user info

### Documents  
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete document

### AI Analysis
- `POST /api/ai/analyze` - Analyze document with AI

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# PDF Processor tests
cd services/pdf-processor && python -m pytest
```

## 🔒 Security

- JWT-based authentication
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- File upload restrictions

## 🚧 Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB container
docker compose logs mongodb

# Reset MongoDB data
docker compose down -v
docker compose up -d
```

### Storage Issues
```bash
# Check storage directory permissions
docker compose exec backend ls -la /app/storage
```

### Service Communication Issues  
```bash
# Check service networking
docker compose ps
docker network inspect dehn_default
```

## 📄 License

Private project for hackathon development.