#!/usr/bin/env python3
"""
PDF Processing Service
A lightweight HTTP service for extracting text and metadata from PDF files using PyMuPDF.
"""

import os
import json
import logging
from io import BytesIO
from typing import Dict, Any, Optional

import fitz  # PyMuPDF
from bottle import Bottle, request, response, run, HTTPError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Bottle()

class PDFProcessor:
    """PDF processing utility class."""
    
    @staticmethod
    def extract_pdf_content(pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Extract text and metadata from PDF bytes.
        
        Args:
            pdf_bytes: PDF file as bytes
            
        Returns:
            Dictionary containing extracted content and metadata
        """
        try:
            doc = fitz.open("pdf", pdf_bytes)
            
            # Extract metadata
            metadata = doc.metadata
            page_count = doc.page_count
            
            # Extract text from all pages
            pages_text = []
            for page_num in range(page_count):
                page = doc[page_num]
                text = page.get_text()
                pages_text.append({
                    "page_number": page_num + 1,
                    "text": text.strip(),
                    "char_count": len(text)
                })
            
            # Extract images info
            images_info = []
            for page_num in range(page_count):
                page = doc[page_num]
                image_list = page.get_images()
                for img_index, img in enumerate(image_list):
                    images_info.append({
                        "page_number": page_num + 1,
                        "image_index": img_index,
                        "width": img[2],
                        "height": img[3]
                    })
            
            doc.close()
            
            # Combine all text
            full_text = "\n\n".join([page["text"] for page in pages_text if page["text"]])
            
            return {
                "success": True,
                "metadata": {
                    "title": metadata.get("title", ""),
                    "author": metadata.get("author", ""),
                    "subject": metadata.get("subject", ""),
                    "creator": metadata.get("creator", ""),
                    "producer": metadata.get("producer", ""),
                    "creation_date": metadata.get("creationDate", ""),
                    "modification_date": metadata.get("modDate", ""),
                    "page_count": page_count
                },
                "content": {
                    "full_text": full_text,
                    "pages": pages_text,
                    "total_chars": len(full_text),
                    "images_count": len(images_info)
                },
                "images": images_info
            }
            
        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to process PDF: {str(e)}"
            }

@app.route('/health', method='GET')
def health_check():
    """Health check endpoint."""
    response.headers['Content-Type'] = 'application/json'
    return json.dumps({
        "status": "healthy",
        "service": "pdf-processor",
        "version": "1.0.0"
    })

@app.route('/extract', method='POST')
def extract_pdf():
    """
    Extract content from uploaded PDF file.
    
    Expected: multipart/form-data with 'file' field containing PDF
    Returns: JSON with extracted content and metadata
    """
    try:
        # Set CORS headers
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Content-Type'] = 'application/json'
        
        # Get uploaded file
        upload = request.files.get('file')
        if not upload:
            raise HTTPError(400, "No file uploaded. Please provide a PDF file in 'file' field.")
        
        # Validate file type
        if not upload.filename.lower().endswith('.pdf'):
            raise HTTPError(400, "Invalid file type. Only PDF files are supported.")
        
        # Read file content
        pdf_bytes = upload.file.read()
        if not pdf_bytes:
            raise HTTPError(400, "Empty file uploaded.")
        
        logger.info(f"Processing PDF: {upload.filename} ({len(pdf_bytes)} bytes)")
        
        # Process PDF
        result = PDFProcessor.extract_pdf_content(pdf_bytes)
        
        if result["success"]:
            logger.info(f"Successfully processed PDF: {upload.filename}")
        else:
            logger.error(f"Failed to process PDF: {upload.filename}")
        
        return json.dumps(result, indent=2)
        
    except HTTPError:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPError(500, f"Internal server error: {str(e)}")

@app.route('/extract', method='OPTIONS')
def extract_pdf_options():
    """Handle preflight CORS requests."""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return {}

@app.error(404)
def not_found(error):
    """Handle 404 errors."""
    response.headers['Content-Type'] = 'application/json'
    return json.dumps({
        "error": "Endpoint not found",
        "available_endpoints": [
            "GET /health - Health check",
            "POST /extract - Extract PDF content"
        ]
    })

@app.error(500)
def server_error(error):
    """Handle 500 errors."""
    response.headers['Content-Type'] = 'application/json'
    return json.dumps({
        "error": "Internal server error",
        "message": str(error)
    })

def main():
    """Main function to start the server."""
    port = int(os.getenv('PORT', 3001))
    host = os.getenv('HOST', '0.0.0.0')
    debug = os.getenv('DEBUG', 'false').lower() == 'true'
    
    logger.info(f"Starting PDF Processor Service on {host}:{port}")
    logger.info(f"Debug mode: {debug}")
    
    try:
        run(app, host=host, port=port, debug=debug, reloader=debug)
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {str(e)}")

if __name__ == '__main__':
    main()
