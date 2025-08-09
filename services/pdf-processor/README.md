# PDF Processor Service - Enhanced Layout Information

This service extracts comprehensive text and layout information from PDF files, including detailed positioning, font properties, and image metadata that can be used to reconstruct the original layout in a user interface.

## 🚀 Features

### Enhanced Text Extraction
- **Positioning Data**: Exact bounding boxes for all text elements
- **Font Information**: Font family, size, style (bold, italic, etc.), and color
- **Layout Structure**: Text organized into blocks, lines, and spans
- **Page Dimensions**: Width, height, and rotation information

### Advanced Image Processing
- **Complete Metadata**: Size, color space, compression details
- **Positioning**: Exact placement coordinates on each page  
- **Image Properties**: Actual dimensions, file size, color space details
- **Reference Information**: Internal PDF references and masks

### Layout Reconstruction Support
- **Coordinate System**: PDF coordinate system with bottom-left origin
- **Bounding Boxes**: `[x0, y0, x1, y1]` format for precise positioning
- **Font Flags**: Decoded font properties (bold, italic, serif, monospace)
- **Color Information**: Both hex and integer color values

## 📡 API Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "pdf-processor", 
  "version": "1.0.0"
}
```

### Extract PDF Content
```http
POST /extract
Content-Type: multipart/form-data
```

**Parameters:**
- `file`: PDF file (multipart/form-data)

**Response Structure:**
```json
{
  "success": true,
  "metadata": {
    "title": "Document Title",
    "author": "Author Name", 
    "page_count": 3,
    // ... other metadata
  },
  "content": {
    "full_text": "Complete document text...",
    "pages": [
      {
        "page_number": 1,
        "text": "Page text...",
        "char_count": 1250,
        "page_dimensions": {
          "width": 612.0,
          "height": 792.0,
          "rotation": 0
        },
        "text_blocks": [
          {
            "bbox": [72.0, 720.0, 540.0, 750.0],
            "block_type": "text",
            "lines": [
              {
                "bbox": [72.0, 720.0, 540.0, 750.0],
                "wmode": 0,
                "dir": [1, 0],
                "spans": [
                  {
                    "bbox": [72.0, 720.0, 200.0, 750.0],
                    "text": "Sample Text",
                    "font": "TimesNewRoman",
                    "size": 12.0,
                    "flags": 16,
                    "font_properties": {
                      "bold": true,
                      "italic": false,
                      "serifed": true,
                      "monospaced": false,
                      "superscript": false
                    },
                    "color": 0,
                    "color_hex": "#000000",
                    "ascender": 0.8,
                    "descender": -0.2,
                    "origin": [72.0, 735.0]
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    "total_chars": 5000,
    "images_count": 2
  },
  "images": [
    {
      "page_number": 1,
      "image_index": 0,
      "xref": 15,
      "width": 300,
      "height": 200,
      "bbox": [100.0, 400.0, 400.0, 600.0],
      "colorspace": "RGB",
      "size_bytes": 45000,
      "actual_width": 300,
      "actual_height": 200,
      "colorspace_details": "DeviceRGB"
    }
  ],
  "layout_info": {
    "has_positioning_data": true,
    "coordinate_system": "PDF coordinates (bottom-left origin)",
    "bbox_format": "[x0, y0, x1, y1] where (x0,y0) is bottom-left, (x1,y1) is top-right",
    "font_flags_decoded": true,
    "color_format": "hex and integer values provided"
  }
}
```

## 🛠 Installation & Usage

### Prerequisites
```bash
pip install -r requirements.txt
```

### Running the Service
```bash
python main.py
```

The service will start on `http://localhost:3001` by default.

### Environment Variables
```bash
PORT=3001          # Server port
HOST=0.0.0.0       # Server host  
DEBUG=false        # Debug mode
```

## 🧪 Testing

### Using the Test Script
```bash
python test_processor.py sample.pdf
```

### Using curl
```bash
curl -X POST http://localhost:3001/extract \
  -F "file=@sample.pdf" \
  -H "Accept: application/json" | jq
```

### Test Output Example
The test script provides detailed analysis:
```
🧪 Testing PDF processor with file: sample.pdf
📡 Server URL: http://localhost:3001
🏥 Checking server health...
✅ Server is healthy
📄 Processing PDF...
✅ PDF processed successfully!

📊 Processing Results Summary:
   Success: True
   Title: Sample Document
   Pages: 2
   Total characters: 1245
   Images found: 1
   Has positioning data: True

📑 Page Details:
   Page 1:
     Dimensions: 612.0 x 792.0
     Rotation: 0°
     Text blocks: 3
     Font usage:
       **TimesNewRoman**
         Size: 12.0, Color: #000000, Count: 15
       *Arial*
         Size: 10.0, Color: #333333, Count: 8
```

## 🎨 UI Layout Reconstruction

### Coordinate System Understanding
- **Origin**: Bottom-left corner of the page
- **X-axis**: Left to right (0 to page width)
- **Y-axis**: Bottom to top (0 to page height)
- **Units**: Points (1 point = 1/72 inch)

### Converting to Web Coordinates
```javascript
// Convert PDF coordinates to web/canvas coordinates
function pdfToWebCoords(pdfBbox, pageHeight) {
  const [x0, y0, x1, y1] = pdfBbox;
  return [
    x0,                    // x0 stays the same
    pageHeight - y1,       // y0 = pageHeight - y1 (flip Y)
    x1,                    // x1 stays the same  
    pageHeight - y0        // y1 = pageHeight - y0 (flip Y)
  ];
}
```

### Font Properties Decoding
```javascript
// Font flags are decoded into readable properties
const fontProps = span.font_properties;
if (fontProps.bold) {
  element.style.fontWeight = 'bold';
}
if (fontProps.italic) {
  element.style.fontStyle = 'italic';
}
```

## 🔧 Technical Details

### Text Block Hierarchy
1. **Page** → Contains multiple text blocks and images
2. **Text Block** → Rectangular area containing related text
3. **Line** → Single line within a block
4. **Span** → Continuous text with same formatting

### Font Flag Bits
- Bit 0: Superscript
- Bit 1: Italic
- Bit 2: Serifed
- Bit 3: Monospaced  
- Bit 4: Bold

### Bounding Box Format
All bounding boxes use the format `[x0, y0, x1, y1]`:
- `(x0, y0)`: Bottom-left corner
- `(x1, y1)`: Top-right corner

## 🚀 Performance

- **Memory Efficient**: Streams file processing
- **Fast Extraction**: Optimized PyMuPDF usage
- **Detailed Analysis**: Complete layout information
- **Error Handling**: Graceful failure with detailed error messages

## 🔗 Integration

This service integrates with:
- **Admin Backend**: For document upload and processing
- **User Backend**: For document analysis and AI processing  
- **Frontend Apps**: For layout reconstruction and display

Use the shared `@dehn/api-models` types for full TypeScript integration.
