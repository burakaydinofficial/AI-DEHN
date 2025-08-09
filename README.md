# DEHN - Multi-Language Document Processing & Publishing Platform 🚀

A comprehensive document processing system that extracts, analyzes, translates, and publishes PDF documents while preserving layout integrity across multiple languages. Built for scalable multi-language content management with AI-powered translation and layout-aware rendering.

## 🎯 Project Overview

**DEHN** is a sophisticated document processing pipeline that:

1. **📄 Extracts & Analyzes** - Converts PDFs to structured JSON with layout information, images, and text positioning
2. **🔍 Groups & Reduces** - Uses AI to detect repeated components across languages and create matchable text groups
3. **🌐 Translates & Generates** - AI-powered translation while preserving layout structure and context
4. **📝 Publishes & Displays** - Multi-language publishing with layout-aware rendering for end users

### 🏗️ Core Workflow

```mermaid
graph TD
    A[Admin Uploads PDF] --> B[PDF Processor Extracts Content]
    B --> C[Store in Private Bucket - GCS/S3]
    C --> D[AI Content Grouping & Reduction]
    D --> E[Generate Translation Variants]
    E --> F[Admin Selects & Publishes]
    F --> G[Store in Public Bucket]
    G --> H[Users Access Multi-Language Content]
```

## 🏗️ Architecture

### Core Services
- **🐍 PDF Processor** (`services/pdf-processor/`) - Python service using PyMuPDF for layout-aware PDF extraction
- **💻 Backend** (`backend/`) - Consolidated Express TypeScript API for all operations (admin & user)
- **🎨 Frontend** (`frontend/`) - Consolidated React TypeScript application (admin & user interfaces)

### Infrastructure Components
- **�️ Database** - MongoDB Atlas for metadata, processing status, and content relationships
- **� Storage** - Private & Public buckets for document storage (GCS/MinIO)

### Storage Architecture
- **🔒 Private Bucket** - Original PDFs, extracted content, processing artifacts (Admin access only)
- **🌐 Public Bucket** - Published multi-language content, optimized for public access
- **🗄️ Database** - MongoDB Atlas for metadata, processing status, and content relationships

### Infrastructure
- **☁️ Google Cloud Platform** - Production deployment with Cloud Storage buckets
- **🐳 Local Development** - MinIO for S3-compatible local storage
- **🚀 Terraform** (`infrastructure/terraform/`) - Infrastructure as code

## � Document Processing Workflow

### Phase 1: Upload & Extraction
1. **Admin uploads PDF** via admin panel
2. **PDF Processor** extracts:
   - Layout-aware text with positioning
   - Images with bounding boxes
   - Font properties and styling
   - Page structure and hierarchy
3. **Storage**: Original PDF + extracted ZIP stored in **private bucket**
4. **Database**: Create document record with processing status
5. **Admin sees**: Real-time processing status with statistics or error details

### Phase 2: Content Grouping & Reduction
1. **AI Analysis**: Detect repeated components across languages
2. **Text Grouping**: 
   - Titles → Group by semantic meaning
   - Paragraphs → Merge words into coherent groups
   - Language tagging for all text elements
3. **Markdown Generation**: Create chunked markdown with metadata
4. **Layout Preservation**: Maintain source layout relationships
5. **Storage**: Processed groups and markdown chunks in **private bucket**

### Phase 3: Translation & Generation
1. **Language Selection**: Choose source language for layout/text reference
2. **AI Translation**: Generate missing language versions using:
   - Primary source language for context
   - Other language versions as secondary context
   - Layout-aware translation preserving structure
3. **Storage**: Generated translations stored separately in **private bucket**
4. **Quality Control**: Admin review and approval workflow

### Phase 4: Publishing & Display
1. **Content Selection**: Admin chooses languages and versions to publish
2. **Image Processing**: 
   - Generate SHA-256 hashes for all images
   - Copy images to public bucket with hash-based filenames (e.g., `a1b2c3d4.png`)
   - Update JSON references to use hash-based image names
   - Database stores hash → original filename mappings
3. **Content Baking**: 
   - Complete page layouts pre-rendered as JSON files
   - Direct public bucket access eliminates API calls for page data
   - Proper pagination with print-optimized layout
4. **Layout Precision**:
   - Images positioned exactly as in source PDF (pixel-perfect)
   - Intentional text/image overlays preserved from original design
   - Collision detection prevents unintended text/image overlapping
   - Responsive breakpoints maintain proportional relationships
5. **Public Access**: 
   - User app renders directly from public JSON + hash-named images
   - CDN-optimized for global content delivery
   - Print functionality maintains exact source layout

## �🚀 Quick Start with Docker (Recommended)

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

### PDF Processor (Port 3095) - Content Extraction
- `GET /health` - Health check
- `POST /extract` - Extract PDF content with layout information (returns JSON)
- `POST /extract/zip` - Extract PDF content + images as ZIP archive

### Backend (Port 3090) - Consolidated API
**Authentication & Users:**
- `POST /api/auth/login` - User/Admin authentication
- `POST /api/auth/logout` - User/Admin logout  
- `GET /api/auth/me` - Get current user
- `GET /api/admin/users` - List all users (paginated, admin only)
- `GET /api/admin/users/:id` - Get user by ID (admin only)
- `PUT /api/admin/users/:id` - Update user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)

**Document Processing Pipeline (Admin):**
- `GET /api/admin/documents` - List all documents with processing status (paginated)
- `POST /api/admin/documents/upload` - Upload PDF and trigger extraction workflow
- `GET /api/admin/documents/:id` - Get document details and processing status
- `GET /api/admin/documents/:id/status` - Poll processing status
- `DELETE /api/admin/documents/:id` - Delete document and all associated content

**Content Grouping & Reduction:**
- `POST /api/admin/documents/:id/analyze` - Trigger AI content grouping phase
- `GET /api/admin/documents/:id/groups` - Get content groups and language mappings
- `PUT /api/admin/documents/:id/groups` - Update content group assignments

**Translation & Generation:**
- `POST /api/admin/documents/:id/translate` - Generate missing language versions
- `GET /api/admin/documents/:id/translations` - Get available translations
- `PUT /api/admin/documents/:id/translations/:lang` - Update specific translation

**Publishing & Content Selection:**
- `GET /api/admin/documents/:id/versions` - Get all available versions by language
- `POST /api/admin/documents/:id/publish` - Publish selected languages with image hash processing
- `GET /api/admin/documents/:id/published` - Get published status and public URLs

**AI-Powered Processing:**
- `POST /api/ai/chat/start` - Start AI analysis session
- `POST /api/ai/chat/:sessionId` - Continue AI conversation
- `GET /api/ai/chat/sessions` - Get processing sessions
- `POST /api/ai/analyze-document` - Analyze document structure and content
- `POST /api/ai/insights` - Extract insights from document content
- `POST /api/ai/summarize` - Generate document summaries
- `POST /api/ai/questions` - Generate questions based on content

**Public Document Access:**
- `GET /api/documents` - List published documents with language availability
- `GET /api/documents/:id` - Get published document metadata and available languages
- `GET /api/documents/:id/pages/:lang` - Get page layout JSON for language
- `GET /api/documents/search` - Search published documents by content and language

**Direct Public Access (No API needed):**
- `https://public-bucket/documents/:id/:lang/pages.json` - Direct JSON access
- `https://public-bucket/images/:hash.png` - Direct image access by SHA-256 hash

## 🧪 Advanced PDF Processing Features

The PDF processor is optimized for **pixel-perfect layout preservation** crucial for professional publishing:

### Precision Layout Analysis
- **Exact Positioning**: Pixel-accurate coordinates (x, y, width, height) for all elements
- **Z-Index Detection**: Layer ordering for proper text/image overlay relationships
- **Intentional Overlays**: Preserve deliberate text-over-image designs from source PDF
- **Collision Detection**: Prevent unintended text/image overlapping in generated content
- **Print Boundaries**: Page margins, bleed areas, and print-safe zones
- **Font Metrics**: Precise line height, character spacing, and baseline positioning

### Advanced Image Processing
- **SHA-256 Hashing**: Content-based naming for efficient caching and deduplication
- **Context Preservation**: Maintain relationships between images and surrounding text
- **Multi-Resolution**: Generate optimized versions for web, print, and mobile
- **Format Optimization**: PNG for graphics, JPEG for photos, WebP for modern browsers
- **Metadata Retention**: DPI, color space, and print quality information

### Layout Intelligence
- **Component Recognition**: Headers, paragraphs, lists, tables, captions, sidebars
- **Reading Flow**: Logical content sequence across columns and pages
- **Responsive Breakpoints**: Layout adaptations that maintain design integrity
- **Print Optimization**: Ensure layouts work perfectly in print media
- **Cross-Language Compatibility**: Layout adjustments for different text lengths

### Processing Outputs
- **Structured JSON**: Complete document structure with pixel-perfect positioning
- **Hash-Named Assets**: SHA-256 filenames for images with metadata mapping
- **Print-Ready Layouts**: Optimized for exact reproduction in print format
- **CDN-Optimized**: Pre-compressed assets ready for global content delivery
- **Direct Access**: No API dependency - frontend renders from static JSON + images

## 🗄️ Storage & Database Architecture

### Dual-Bucket Strategy
- **🔒 Private Bucket (`dehn-private`)**:
  - Original PDF files with full metadata
  - Extracted ZIP archives (JSON + original images)
  - Processing artifacts and intermediate results  
  - AI analysis outputs and content groups
  - Generated translations (pre-approval)
  - Admin-only access with authentication

- **🌐 Public Bucket (`dehn-public`)**:
  - **Pre-baked JSON files**: Complete page layouts ready for direct access
  - **Hash-named images**: SHA-256 filenames (e.g., `a1b2c3d4e5f6.png`) for efficient caching
  - **Optimized assets**: Compressed images, minified JSON for CDN delivery
  - **Direct access**: No API calls needed - frontend reads JSON/images directly
  - **Print-optimized layouts**: Exact positioning data for pixel-perfect printing
  - **CDN-ready structure**: Optimized for global content delivery networks

### Database Schema (MongoDB Atlas)
- **Documents Collection**: Processing status, metadata, language mappings, public URLs
- **ImageHashes Collection**: SHA-256 hash → original filename → dimensions → optimization settings
- **ContentGroups Collection**: AI-generated content groupings and cross-language relationships  
- **Translations Collection**: Generated and approved translations with layout validation
- **ProcessingJobs Collection**: Background job tracking and error handling
- **PublishedContent Collection**: Publication history, version control, CDN invalidation tracking
- **LayoutValidation Collection**: Print compatibility checks, overlay detection, positioning validation

### Environment-Based Storage
- **Development**: MinIO (S3-compatible local containers)
- **Production**: Google Cloud Storage with proper IAM and lifecycle policies

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
