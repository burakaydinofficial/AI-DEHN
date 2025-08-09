# 🚀 DEHN Development Quick Start

**Multi-Language Document Processing & Publishing Platform**

Transform PDFs into layout-aware, multi-language content with AI-powered translation and publishing workflows.

## ⚡ One-Command Start

```bash
npm run dev
```

This starts the complete document processing pipeline:

| Service | Port | Purpose |
|---------|------|---------|  
| 🐍 PDF Processor | 3095 | Layout-aware PDF extraction & image processing |
| 🔐 Admin Backend | 3091 | Document workflow API (upload → process → translate → publish) |
| 👤 User Backend | 3090 | Public document access API with multi-language support |
| 💻 Admin Panel | 8091 | Document processing workflow interface |
| 📱 User App | 8090 | Multi-language document viewer |
| 🗄️ MinIO Console | 9001 | Local S3-compatible storage (private/public buckets) |

## 🧪 Test the Processing Pipeline

### 1. Upload & Extract
```bash
# Test PDF extraction with layout preservation
curl -X POST -F "file=@example-files/example-flyer.pdf" http://localhost:3095/extract

# Get complete extraction package (JSON + images)
curl -X POST -F "file=@example-files/example-flyer.pdf" http://localhost:3095/extract/zip --output extracted-content.zip
```

### 2. Check Storage Buckets
- **Private Bucket**: http://localhost:9001 → `dehn-private` (processing artifacts)  
- **Public Bucket**: http://localhost:9001 → `dehn-public` (published content)
- **Credentials**: `dehn-access-key` / `dehn-secret-key`

## 🛠️ Development Commands

```bash
npm run dev              # Start all services
npm run docker:down      # Stop all services
npm run docker:logs      # View logs from all containers
npm run docker:clean     # Clean restart with fresh containers
npm run test:pdf         # Test PDF processor with example file
```

## 🔄 Document Processing Workflow

1. **📄 Upload Phase**: Admin uploads PDF via web interface
2. **🔍 Extraction Phase**: PDF processor creates layout-aware JSON + image extraction
3. **🤖 AI Grouping Phase**: Content analysis and language component matching  
4. **🌐 Translation Phase**: AI generates missing language versions
5. **📝 Publishing Phase**: Admin selects versions → Content baked to public bucket with hash-named images
6. **👥 User Access Phase**: Direct JSON access for layout-perfect rendering

## 🗄️ Storage Architecture

- **🔒 Private Bucket**: Original files, processing artifacts, admin-only access
- **🌐 Public Bucket**: Published JSON + hash-named images, CDN-ready, direct access
- **📊 Database**: MongoDB Atlas for metadata, image hashes, layout relationships

## 🎯 Key Features

✅ **Exact Layout Preservation**: Pixel-perfect positioning matching source PDF  
✅ **Hash-Based Image Management**: SHA-based naming for efficient storage & caching  
✅ **Direct JSON Access**: Pre-baked content eliminates API calls for page data  
✅ **Print-Optimized Layout**: Proper pagination with image/text positioning  
✅ **Overlay-Aware Rendering**: Respects intentional text/image overlays from source  
✅ **CDN-Ready Publishing**: Public bucket optimized for global content delivery  

## 🔧 VS Code Integration

Use the **Command Palette (Cmd/Ctrl+Shift+P)**:
- "Tasks: Run Task" → "DEHN: Start All Services"

Your multi-language document processing platform is ready! 🎉
