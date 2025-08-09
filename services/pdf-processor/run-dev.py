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
