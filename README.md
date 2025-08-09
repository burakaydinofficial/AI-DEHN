# DEHN - Hackathon Project

A comprehensive multi-service application for document processing and management.

## Project Structure

This monorepo contains the following services:

### Services
- **`services/pdf-processor`** - Python service for PDF processing using PyMuPDF
- **`services/admin-backend`** - Express TypeScript backend for admin operations
- **`services/user-backend`** - Express TypeScript backend for user operations

### Frontend Applications
- **`apps/admin-frontend`** - React admin panel (desktop-first)
- **`apps/mobile-frontend`** - React mobile app (mobile-first)

### Shared Libraries
- **`packages/api-models`** - Shared TypeScript API models and types
- **`packages/ai-agent`** - Common AI agent library for LLM integration

### Infrastructure
- **`infrastructure/terraform`** - Terraform configurations for Google Cloud deployment

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- Docker (optional)
- Google Cloud CLI (for deployment)

### Development Setup

1. Install dependencies for all services:
```bash
npm install
```

2. Set up Python environment for PDF processor:
```bash
cd services/pdf-processor
pip install -r requirements.txt
```

3. Start development servers:
```bash
# Start all services in development mode
npm run dev
```

## Services Overview

### PDF Processor Service
- **Technology**: Python, Bottle, PyMuPDF
- **Port**: 3001
- **Purpose**: Extract text and metadata from PDF files via HTTP endpoints

### Admin Backend Service  
- **Technology**: Express.js, TypeScript
- **Port**: 3002
- **Purpose**: Admin operations, database access, AI agent integration

### User Backend Service
- **Technology**: Express.js, TypeScript  
- **Port**: 3003
- **Purpose**: User operations, database access, AI agent integration

### Admin Frontend
- **Technology**: React, TypeScript
- **Port**: 3000
- **Purpose**: Desktop-first admin panel

### Mobile Frontend
- **Technology**: React, TypeScript
- **Port**: 3004  
- **Purpose**: Mobile-first user interface

## Deployment

This project is configured for deployment to Google Cloud Platform using Terraform.

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## License

MIT License
