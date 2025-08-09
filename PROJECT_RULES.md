# 🎯 DEHN PROJECT RULES & STANDARDS

## 📍 **PORT ASSIGNMENTS - NEVER CHANGE THESE**

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| PDF Processor | **8080** | http://localhost:8080 | PDF analysis & image extraction |
| Admin Backend | **3001** | http://localhost:3001 | Admin API |
| User Backend | **3002** | http://localhost:3002 | User API |
| Admin Frontend | **5173** | http://localhost:5173 | Admin panel (Vite default) |
| Mobile Frontend | **5174** | http://localhost:5174 | Mobile app (Vite + 1) |
| MinIO Storage | **9000** | http://localhost:9000 | S3-compatible storage |
| MinIO Console | **9001** | http://localhost:9001 | MinIO web interface |
| Redis | **6379** | localhost:6379 | Cache (standard Redis port) |

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
- External access uses localhost (e.g., `http://localhost:8080`)

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
- **External** (browser/testing): Use localhost (`http://localhost:8080`)
- **Environment variables**: Support both internal and external URLs

## 🧪 **Testing Standards**

### **Default Test URLs:**
- PDF Processor: `http://localhost:8080`
- Admin Backend: `http://localhost:3001`
- User Backend: `http://localhost:3002`

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
