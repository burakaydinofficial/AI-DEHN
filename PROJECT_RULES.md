# 🎯 DEHN PROJECT RULES & STANDARDS

**Multi-Language Document Processing & Publishing Platform**

## 📍 **PORT ASSIGNMENTS - NEVER CHANGE THESE**

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| PDF Processor | **3095** | http://localhost:3095 | Layout-aware PDF extraction & image processing |
| Admin Backend | **3091** | http://localhost:3091 | Document workflow API (processing pipeline) |
| User Backend | **3090** | http://localhost:3090 | Public document access API (multi-language) |
| Admin Panel | **8091** | http://localhost:8091 | Document processing workflow interface |
| User App | **8090** | http://localhost:8090 | Multi-language document viewer |
| MinIO Storage | **9000** | http://localhost:9000 | S3-compatible storage API |
| MinIO Console | **9001** | http://localhost:9001 | MinIO web interface |

## 🗄️ **STORAGE ARCHITECTURE RULES**

### **Dual-Bucket Strategy:**
- **🔒 Private Bucket (`dehn-private`)**: Original PDFs, processing artifacts, admin-only
- **🌐 Public Bucket (`dehn-public`)**: Published content, CDN-ready, public access
- **📊 Database (MongoDB Atlas)**: Metadata, processing status, content relationships

### **Environment-Based Storage:**
- **Development**: MinIO containers (localhost:9000/9001)
- **Production**: Google Cloud Storage with proper IAM policies

## 🔄 **DOCUMENT PROCESSING WORKFLOW RULES**

### **Phase 1: Upload & Extraction**
1. Admin uploads PDF via admin panel (port 8091)
2. Admin backend (3091) sends to PDF processor (3095)
3. PDF processor extracts layout-aware JSON + images
4. Original PDF + ZIP stored in **private bucket**
5. Database updated with processing status

### **Phase 2: Content Grouping**
1. AI analyzes extracted content for repeated components
2. Text grouped by language and semantic meaning
3. Layout relationships preserved in grouping data
4. Processed groups stored in **private bucket**

### **Phase 3: Translation Generation**  
1. AI generates missing language versions
2. Layout context maintained during translation
3. Generated content stored in **private bucket** (pending approval)
4. Multiple versions tracked in database

### **Phase 4: Publishing**
1. Admin selects approved versions for publishing
2. Selected content moved to **public bucket**
3. User app (8090) accesses via user backend (3090)
4. Layout-aware rendering for multi-language display

## 🤖 **AI INTEGRATION RULES**

### **Content Analysis:**
- Use AI for component detection across languages
- Preserve layout relationships in AI outputs
- Track confidence scores for AI decisions

### **Translation Generation:**
- Maintain source layout context during translation  
- Use multiple language versions as translation context
- Store AI-generated content separately from originals

### **Layout Preservation:**
- Extract precise positioning data (x, y, width, height)
- Maintain font properties and styling information
- Preserve reading order and document structure

## 📁 **FILE STRUCTURE RULES**

### **Single Source of Truth:**
- **One** main `.env.example` at project root
- **One** main Docker Compose file: `docker-compose.yml`
- **One** development override: `docker-compose.override.yml`
- **One** production override: `docker-compose.prod.yml`
- **One** main README at project root
- **One** development guide: `DEVELOPMENT.md`

### **No Duplicates Allowed:**
- ❌ Service-specific `.env.example` files
- ❌ Multiple README files with same content
- ❌ Duplicate Docker configurations
- ❌ Multiple setup scripts doing the same thing

## 🐳 **Docker Standards**

### **Service Naming:**
- `pdf-processor` (not pdf_processor)
- `admin-backend`
- `user-backend`
- `admin-frontend`
- `mobile-frontend`

### **Health Check Standards:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${CORRECT_PORT}/health || exit 1
```

### **Environment Variable Standards:**
- Always use `PORT` not `port`
- Always use `HOST=0.0.0.0` in containers
- Service-to-service communication uses service names (e.g., `http://pdf-processor:8080`)
- External access uses localhost (e.g., `http://localhost:3095`)

## 🔧 **Development Rules**

### **Before Making Changes:**
1. **READ** this rules file
2. **CHECK** existing port assignments
3. **SEARCH** for existing files before creating new ones
4. **VERIFY** no duplicates are being created

### **When Adding New Features:**
1. Update shared API models first (`packages/api-models/src/index.ts`)
2. Implement backend endpoints
3. Update frontend to consume APIs
4. Update Docker configurations if needed
5. Test with Docker Compose

### **Service Communication:**
- **Internal** (container-to-container): Use service names (`http://pdf-processor:8080`)
- **External** (browser/testing): Use localhost (`http://localhost:3095`)
- **Environment variables**: Support both internal and external URLs

## 🧪 **Testing Standards**

### **Default Test URLs:**
- PDF Processor: `http://localhost:3095`
- Admin Backend: `http://localhost:3091`
- User Backend: `http://localhost:3090`

### **Test Output Organization:**
- All test outputs go to service-specific folders:
  - PDF Processor: `services/pdf-processor/test_processor/`
  - Backend tests: `services/*/test-results/`

## 🗄️ **Database & Storage Rules**

### **MongoDB Atlas:**
- Single connection string in root `.env`
- Same database for all services: `dehn`
- Collections: `users`, `documents`, `sessions`

### **Storage:**
- **Development**: MinIO at `http://localhost:9000`
- **Production**: Google Cloud Storage
- **Bucket**: `pdf-documents`
- **Access**: S3-compatible API

## 📦 **Package Management**

### **Workspace Structure:**
- Root `package.json` manages all workspaces
- Individual services have their own `package.json`
- Shared packages: `@dehn/api-models`, `@dehn/ai-agent`

### **Commands:**
- `npm run dev` - Start everything with Docker
- `npm run dev:local` - Start without Docker (manual)
- `npm run docker:down` - Stop Docker services
- `npm run docker:clean` - Clean restart

## 🚨 **CRITICAL RULES**

### **NEVER:**
- ❌ Change port assignments without updating this file
- ❌ Create duplicate configuration files
- ❌ Hardcode URLs (use environment variables)
- ❌ Mix internal and external URLs in same context

### **ALWAYS:**
- ✅ Check this file before making changes
- ✅ Use Docker for development
- ✅ Update API models when changing interfaces
- ✅ Test entire stack after changes
- ✅ Use consistent naming conventions

## 📋 **Pre-Change Checklist**

Before making any changes:
1. [ ] Read this rules file
2. [ ] Check current port assignments
3. [ ] Search for existing files/configurations
4. [ ] Verify no duplicates will be created
5. [ ] Plan changes to maintain consistency
6. [ ] Test changes with Docker Compose

---

**🎯 Follow these rules to keep the project clean and maintainable!**
