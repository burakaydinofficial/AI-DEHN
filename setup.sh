#!/bin/bash

# DEHN Project Setup Script
# This script sets up all the dependencies and builds the project

echo "🚀 Setting up DEHN Hackathon Project..."

# Install root dependencies first
echo "📦 Installing root dependencies..."
cd /Users/burakk/Hackathon/DEHN
npm install --ignore-workspaces

# Build shared packages first
echo "🔧 Building shared packages..."

# API Models
echo "Building API models..."
cd packages/api-models
npm install
npm run build
cd ../..

# AI Agent
echo "Building AI agent..."
cd packages/ai-agent
npm install
npm run build
cd ../..

# Install backend services dependencies
echo "📦 Installing backend services..."

# Admin Backend
cd services/admin-backend
npm install
cd ../..

# User Backend
cd services/user-backend
npm install
cd ../..

# Install frontend apps dependencies
echo "🎨 Installing frontend applications..."

# Admin Frontend
cd apps/admin-frontend
npm install
cd ../..

# Mobile Frontend
cd apps/mobile-frontend
npm install
cd ../..

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
cd services/pdf-processor
pip3 install -r requirements.txt
cd ../..

echo "✅ Project setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Copy infrastructure/terraform/terraform.tfvars.example to terraform.tfvars"
echo "2. Update the project_id in terraform.tfvars with your GCP project"
echo "3. Set up environment variables for AI API key"
echo "4. Run 'npm run dev' to start all services"
echo ""
echo "📝 Available commands:"
echo "  npm run dev              - Start all services"
echo "  npm run build           - Build all packages"
echo "  npm run install:python  - Install Python dependencies"
