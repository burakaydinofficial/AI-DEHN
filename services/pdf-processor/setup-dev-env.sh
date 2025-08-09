#!/bin/bash

# PDF Processor Development Environment Setup
# This script sets up a Python virtual environment for the PDF processor service

set -e  # Exit on any error

echo "🐍 Setting up PDF Processor Development Environment..."

# Check if we're in the correct directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: Please run this script from the services/pdf-processor directory"
    echo "Usage: cd services/pdf-processor && ./setup-dev-env.sh"
    exit 1
fi

# Check Python version
python_version=$(python3 --version 2>&1 | cut -d' ' -f2)
echo "🔍 Found Python version: $python_version"

# Check if Python 3.9+ is available
if python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)" 2>/dev/null; then
    echo "✅ Python 3.9+ is available"
else
    echo "❌ Error: Python 3.9 or higher is required"
    echo "Please install Python 3.9+ and try again"
    exit 1
fi

# Create virtual environment
VENV_NAME="venv"
if [ -d "$VENV_NAME" ]; then
    echo "⚠️  Virtual environment already exists. Removing old environment..."
    rm -rf "$VENV_NAME"
fi

echo "📦 Creating virtual environment..."
python3 -m venv "$VENV_NAME"

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source "$VENV_NAME/bin/activate"

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📚 Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo "❌ Error: requirements.txt not found"
    exit 1
fi

# Install development dependencies
echo "🛠️  Installing development dependencies..."
pip install \
    pytest \
    pytest-cov \
    black \
    flake8 \
    mypy \
    pre-commit

# Create development requirements file
echo "📝 Creating development requirements file..."
cat > requirements-dev.txt << EOF
# Development dependencies
pytest>=7.4.0
pytest-cov>=4.1.0
black>=23.7.0
flake8>=6.0.0
mypy>=1.5.0
pre-commit>=3.3.0

# Testing utilities
httpx>=0.24.0
pytest-asyncio>=0.21.0
EOF

echo "💾 Installing development requirements..."
pip install -r requirements-dev.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file. Please review and update the values as needed."
    else
        cat > .env << EOF
# PDF Processor Environment Variables
PORT=3001
HOST=0.0.0.0
DEBUG=true
EOF
        echo "✅ Created basic .env file"
    fi
fi

# Create pre-commit configuration
echo "🔧 Setting up code quality tools..."
cat > .pre-commit-config.yaml << EOF
repos:
  - repo: https://github.com/psf/black
    rev: 23.7.0
    hooks:
      - id: black
        language_version: python3

  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
        args: [--max-line-length=88, --extend-ignore=E203,W503]

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.5.0
    hooks:
      - id: mypy
        additional_dependencies: [types-requests]
EOF

# Install pre-commit hooks
echo "🪝 Installing pre-commit hooks..."
pre-commit install

# Create pytest configuration
cat > pytest.ini << EOF
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = --verbose --cov=. --cov-report=term-missing
EOF

# Create tests directory if it doesn't exist
if [ ! -d "tests" ]; then
    echo "📁 Creating tests directory..."
    mkdir -p tests
    touch tests/__init__.py
    
    # Create a basic test file
    cat > tests/test_pdf_processor.py << EOF
"""Tests for PDF processor service."""
import pytest
from main import PDFProcessor


def test_decode_font_flags():
    """Test font flags decoding."""
    flags = 16  # Bold flag
    result = PDFProcessor.decode_font_flags(flags)
    assert result["bold"] is True
    assert result["italic"] is False


def test_color_to_hex():
    """Test color conversion."""
    # Black color
    assert PDFProcessor.color_to_hex(0) == "#000000"
    
    # White color (assuming RGB)
    white = (255 << 16) | (255 << 8) | 255
    assert PDFProcessor.color_to_hex(white) == "#ffffff"
EOF
fi

# Create a development runner script
cat > run-dev.py << EOF
#!/usr/bin/env python3
"""
Development runner for PDF processor service.
This script provides additional development features.
"""
import os
import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

def main():
    """Run the development server."""
    # Set development environment
    os.environ.setdefault('DEBUG', 'true')
    os.environ.setdefault('PORT', '3001')
    os.environ.setdefault('HOST', '127.0.0.1')
    
    print("🚀 Starting PDF Processor in Development Mode")
    print(f"📡 Server will be available at: http://127.0.0.1:3001")
    print("🔄 Auto-reload enabled")
    print("🐛 Debug mode enabled")
    print()
    
    # Import and run main
    from main import main as run_server
    try:
        run_server()
    except KeyboardInterrupt:
        print("\n👋 Development server stopped")

if __name__ == "__main__":
    main()
EOF

chmod +x run-dev.py

# Create Makefile for common tasks
cat > Makefile << EOF
.PHONY: help install test lint format run dev clean

help:
	@echo "📋 Available commands:"
	@echo "  install    - Install dependencies"
	@echo "  test       - Run tests"
	@echo "  lint       - Run linting"
	@echo "  format     - Format code"
	@echo "  run        - Run production server"
	@echo "  dev        - Run development server"
	@echo "  clean      - Clean cache files"

install:
	pip install -r requirements.txt
	pip install -r requirements-dev.txt

test:
	pytest

lint:
	flake8 .
	mypy .

format:
	black .

run:
	python main.py

dev:
	python run-dev.py

clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .pytest_cache
	rm -rf .mypy_cache
	rm -rf .coverage
EOF

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Activate the virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "2. Start the development server:"
echo "   python run-dev.py"
echo "   # or use: make dev"
echo ""
echo "3. Run tests:"
echo "   pytest"
echo "   # or use: make test"
echo ""
echo "4. Format code:"
echo "   black ."
echo "   # or use: make format"
echo ""
echo "📚 Available make commands:"
echo "   make help      - Show all commands"
echo "   make install   - Install dependencies"
echo "   make test      - Run tests"
echo "   make lint      - Run linting"
echo "   make format    - Format code"
echo "   make dev       - Start development server"
echo "   make clean     - Clean cache files"
echo ""
echo "🌐 The development server will run at: http://127.0.0.1:3001"
echo "🔄 Auto-reload is enabled in development mode"
