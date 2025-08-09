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
    def decode_font_flags(flags: int) -> Dict[str, bool]:
        """
        Decode font flags to readable format.
        
        Args:
            flags: Integer representing font flags
            
        Returns:
            Dictionary with font properties
        """
        return {
            "superscript": bool(flags & 2**0),
            "italic": bool(flags & 2**1),
            "serifed": bool(flags & 2**2),
            "monospaced": bool(flags & 2**3),
            "bold": bool(flags & 2**4)
        }
    
    @staticmethod
    def color_to_hex(color: int) -> str:
        """
        Convert integer color to hex string.
        
        Args:
            color: Integer color value
            
        Returns:
            Hex color string
        """
        if color == 0:
            return "#000000"
        # Convert to RGB hex
        r = (color >> 16) & 255
        g = (color >> 8) & 255
        b = color & 255
        return f"#{r:02x}{g:02x}{b:02x}"
    
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
            
            # Extract text from all pages with detailed information
            pages_text = []
            for page_num in range(page_count):
                page = doc[page_num]
                
                # Get basic text
                text = page.get_text()
                
                # Get text blocks with position and formatting
                text_blocks = []
                blocks = page.get_text("dict")
                
                for block in blocks.get("blocks", []):
                    if "lines" in block:  # Text block
                        block_info = {
                            "bbox": block.get("bbox", [0, 0, 0, 0]),  # [x0, y0, x1, y1]
                            "block_type": "text",
                            "lines": []
                        }
                        
                        for line in block["lines"]:
                            line_info = {
                                "bbox": line.get("bbox", [0, 0, 0, 0]),
                                "wmode": line.get("wmode", 0),  # Writing mode
                                "dir": line.get("dir", [1, 0]),  # Text direction
                                "spans": []
                            }
                            
                            for span in line.get("spans", []):
                                span_info = {
                                    "bbox": span.get("bbox", [0, 0, 0, 0]),
                                    "text": span.get("text", ""),
                                    "font": span.get("font", ""),
                                    "size": span.get("size", 0),
                                    "flags": span.get("flags", 0),  # Raw font flags
                                    "font_properties": PDFProcessor.decode_font_flags(span.get("flags", 0)),
                                    "color": span.get("color", 0),  # Raw color value
                                    "color_hex": PDFProcessor.color_to_hex(span.get("color", 0)),
                                    "ascender": span.get("ascender", 0),
                                    "descender": span.get("descender", 0),
                                    "origin": span.get("origin", [0, 0])  # Text origin point
                                }
                                line_info["spans"].append(span_info)
                            
                            block_info["lines"].append(line_info)
                        
                        text_blocks.append(block_info)
                
                # Get page dimensions
                page_rect = page.rect
                page_info = {
                    "width": page_rect.width,
                    "height": page_rect.height,
                    "rotation": page.rotation
                }
                
                pages_text.append({
                    "page_number": page_num + 1,
                    "text": text.strip(),
                    "char_count": len(text),
                    "page_dimensions": page_info,
                    "text_blocks": text_blocks
                })
            
            # Extract images info with detailed positioning
            images_info = []
            for page_num in range(page_count):
                page = doc[page_num]
                image_list = page.get_images()
                
                # Get image blocks from text dict for positioning
                blocks = page.get_text("dict")
                image_blocks = [block for block in blocks.get("blocks", []) if block.get("type") == 1]
                
                for img_index, img in enumerate(image_list):
                    # Basic image info from get_images()
                    img_info = {
                        "page_number": page_num + 1,
                        "image_index": img_index,
                        "xref": img[0],  # Image reference number
                        "smask": img[1],  # Soft mask reference
                        "width": img[2],
                        "height": img[3],
                        "bpc": img[4],  # Bits per component
                        "colorspace": img[5],  # Color space
                        "alt": img[6],  # Alternative text
                        "name": img[7],  # Image name
                        "filter": img[8],  # Compression filter
                        "bbox": [0, 0, 0, 0],  # Will be updated if found in blocks
                        "transform": None,  # Transformation matrix
                        "size_bytes": 0  # Image size in bytes
                    }
                    
                    # Try to get positioning from image blocks
                    if img_index < len(image_blocks):
                        img_block = image_blocks[img_index]
                        img_info["bbox"] = img_block.get("bbox", [0, 0, 0, 0])
                        img_info["transform"] = img_block.get("transform", None)
                    
                    # Try to get actual image size
                    try:
                        pix = fitz.Pixmap(doc, img[0])
                        if pix.n - pix.alpha < 4:  # GRAY or RGB
                            img_info["actual_width"] = pix.width
                            img_info["actual_height"] = pix.height
                            img_info["colorspace_details"] = pix.colorspace.name if pix.colorspace else "Unknown"
                            img_info["size_bytes"] = len(pix.tobytes())
                        pix = None  # Clean up
                    except:
                        # If we can't get pixmap, use basic info
                        img_info["actual_width"] = img[2]
                        img_info["actual_height"] = img[3]
                    
                    images_info.append(img_info)
            
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
                "images": images_info,
                "layout_info": {
                    "has_positioning_data": True,
                    "coordinate_system": "PDF coordinates (bottom-left origin)",
                    "bbox_format": "[x0, y0, x1, y1] where (x0,y0) is bottom-left, (x1,y1) is top-right",
                    "font_flags_decoded": True,
                    "color_format": "hex and integer values provided"
                }
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
