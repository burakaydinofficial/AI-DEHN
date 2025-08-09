# 🚀 DEHN Development Quick Start

Your comprehensive Docker-based development environment is ready!

## ⚡ One-Command Start

```bash
npm run dev
```

This starts the entire stack with hot-reload enabled:

| Service | Port | Purpose |
|---------|------|---------|  
| 🐍 PDF Processor | 8080 | PDF analysis & image extraction |
| 🔐 Admin Backend | 3001 | Admin API with MongoDB |
| 👤 User Backend | 3002 | User API with MongoDB |
| 💻 Admin Frontend | 5173 | React admin panel |
| 📱 Mobile Frontend | 5174 | React mobile app |
| �️ MinIO Console | 9001 | S3-compatible storage web UI |

## 🧪 Test Your Setup

```bash
# Test PDF processing
npm run test:pdf

# Or manually test endpoints
curl -X POST -F "file=@example-files/example-flyer.pdf" http://localhost:8080/extract
curl -X POST -F "file=@example-files/example-flyer.pdf" http://localhost:8080/extract/zip --output result.zip
```

## 🛠️ Development Commands

```bash
npm run dev              # Start all services
npm run dev:local        # Start without Docker (manual setup)
npm run docker:down      # Stop all services
npm run docker:logs      # View logs
npm run docker:clean     # Clean restart
```

## 🗄️ Database Setup

1. **MongoDB Atlas**: Create account → Get connection string → Update `.env`
2. **MinIO**: Auto-configured via Docker (credentials in `.env.example`)

## 🎯 What's New

✅ **Enhanced PDF Processing**: Image extraction + ZIP export  
✅ **Docker-First Development**: Complete containerized stack  
✅ **MongoDB Atlas Integration**: Production-ready database  
✅ **S3-Compatible Storage**: MinIO (local) + GCS (production)  
✅ **Clean Project Structure**: Removed Makefile, organized tests  
✅ **Test Organization**: Results go to `test_processor/` folder  

## 🐳 Architecture

- **Backend**: Express TypeScript services with MongoDB
- **Frontend**: React + TypeScript with Vite hot-reload  
- **PDF Processing**: Python with PyMuPDF and image extraction
- **Storage**: S3-compatible (MinIO local, GCS production)
- **Caching**: Redis for performance

## 🔧 VS Code Integration

Use the **Command Palette (Cmd/Ctrl+Shift+P)**:
- "Tasks: Run Task" → "DEHN: Start All Services (Docker)"
- "Tasks: Run Task" → "DEHN: Test PDF Processor"

Your development environment is production-ready and Docker-based! 🎉
