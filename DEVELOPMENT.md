# DEHN Hackathon - Development Guide

## Quick Start

1. **Clone and Setup**
   ```bash
   cd /Users/burakk/Hackathon/DEHN
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment templates
   cp services/admin-backend/.env.example services/admin-backend/.env
   cp services/user-backend/.env.example services/user-backend/.env
   cp services/pdf-processor/.env.example services/pdf-processor/.env
   
   # Update the .env files with your values
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

## Project Architecture

```
DEHN/
├── services/                    # Backend services
│   ├── pdf-processor/          # Python service (PyMuPDF + Bottle)
│   ├── admin-backend/          # Express TS admin API
│   └── user-backend/           # Express TS user API
├── apps/                       # Frontend applications
│   ├── admin-frontend/         # React admin panel (desktop-first)
│   └── mobile-frontend/        # React mobile app (mobile-first)
├── packages/                   # Shared libraries
│   ├── api-models/            # TypeScript types and interfaces
│   └── ai-agent/              # Gemini LLM integration
└── infrastructure/            # Deployment configuration
    └── terraform/             # Google Cloud infrastructure
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

### PDF Processor Service (Python)
- `GET /health` - Health check
- `POST /extract` - Extract content from PDF file

### Admin Backend Service (TypeScript)
- `POST /api/auth/login` - Admin login
- `GET /api/users` - List all users
- `GET /api/documents` - List all documents
- `POST /api/documents/upload` - Upload document
- `POST /api/ai/chat/start` - Start AI chat session
- `POST /api/ai/analyze-document` - Analyze document with AI

### User Backend Service (TypeScript)
- `GET /health` - Health check
- Additional endpoints coming soon...

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
