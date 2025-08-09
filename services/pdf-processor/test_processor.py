#!/usr/bin/env python3
"""
Test script for the enhanced PDF processor.
This demonstrates the new layout and positioning features.
"""

import requests
import json
import sys
from pathlib import Path

def test_pdf_processor(pdf_path: str, server_url: str = "http://localhost:8080"):
    """Test the PDF processor with enhanced layout information."""
    
    print(f"🧪 Testing PDF processor with file: {pdf_path}")
    print(f"📡 Server URL: {server_url}")
    
    # Check if file exists
    if not Path(pdf_path).exists():
        print(f"❌ Error: File {pdf_path} not found")
        return
    
    try:
        # Test health endpoint first
        print("🏥 Checking server health...")
        health_response = requests.get(f"{server_url}/health")
        if health_response.status_code == 200:
            print("✅ Server is healthy")
        else:
            print(f"⚠️ Server health check failed: {health_response.status_code}")
        
        # Upload and process PDF
        print("📄 Processing PDF...")
        with open(pdf_path, 'rb') as pdf_file:
            files = {'file': pdf_file}
            response = requests.post(f"{server_url}/extract", files=files)
        
        if response.status_code == 200:
            result = response.json()
            
            print("✅ PDF processed successfully!")
            print("\n📊 Processing Results Summary:")
            print(f"   Success: {result.get('success', False)}")
            
            # Metadata
            metadata = result.get('metadata', {})
            print(f"   Title: {metadata.get('title', 'N/A')}")
            print(f"   Pages: {metadata.get('page_count', 0)}")
            
            # Content stats
            content = result.get('content', {})
            print(f"   Total characters: {content.get('total_chars', 0)}")
            print(f"   Images found: {content.get('images_count', 0)}")
            
            # Layout information
            layout_info = result.get('layout_info', {})
            print(f"   Has positioning data: {layout_info.get('has_positioning_data', False)}")
            
            # Detailed page analysis
            pages = content.get('pages', [])
            print(f"\n📑 Page Details:")
            
            for page in pages[:2]:  # Show first 2 pages
                page_num = page.get('page_number', 0)
                dimensions = page.get('page_dimensions', {})
                text_blocks = page.get('text_blocks', [])
                
                print(f"   Page {page_num}:")
                print(f"     Dimensions: {dimensions.get('width', 0):.1f} x {dimensions.get('height', 0):.1f}")
                print(f"     Rotation: {dimensions.get('rotation', 0)}°")
                print(f"     Text blocks: {len(text_blocks)}")
                
                # Show font information from first few spans
                span_count = 0
                font_info = {}
                
                for block in text_blocks:
                    for line in block.get('lines', []):
                        for span in line.get('spans', []):
                            if span_count < 5:  # Analyze first 5 spans
                                font = span.get('font', 'Unknown')
                                size = span.get('size', 0)
                                font_props = span.get('font_properties', {})
                                color_hex = span.get('color_hex', '#000000')
                                
                                key = f"{font}_{size}_{color_hex}"
                                if key not in font_info:
                                    font_info[key] = {
                                        'font': font,
                                        'size': size,
                                        'color': color_hex,
                                        'bold': font_props.get('bold', False),
                                        'italic': font_props.get('italic', False),
                                        'count': 0
                                    }
                                font_info[key]['count'] += 1
                                span_count += 1
                
                if font_info:
                    print(f"     Font usage:")
                    for info in list(font_info.values())[:3]:  # Show top 3 fonts
                        bold_marker = "**" if info['bold'] else ""
                        italic_marker = "*" if info['italic'] else ""
                        print(f"       {bold_marker}{italic_marker}{info['font']}{italic_marker}{bold_marker}")
                        print(f"         Size: {info['size']:.1f}, Color: {info['color']}, Count: {info['count']}")
            
            # Image details
            images = result.get('images', [])
            if images:
                print(f"\n🖼️ Image Details:")
                for img in images[:3]:  # Show first 3 images
                    print(f"   Image {img.get('image_index', 0)} on page {img.get('page_number', 0)}:")
                    print(f"     Size: {img.get('actual_width', 0)} x {img.get('actual_height', 0)} pixels")
                    print(f"     Position: {img.get('bbox', [0,0,0,0])}")
                    print(f"     Color space: {img.get('colorspace_details', 'Unknown')}")
                    print(f"     File size: {img.get('size_bytes', 0)} bytes")
            
            # Save detailed results to subfolder
            test_output_dir = Path("test_processor")
            test_output_dir.mkdir(exist_ok=True)
            
            timestamp = Path(pdf_path).stem
            output_file = test_output_dir / f"pdf_analysis_{timestamp}.json"
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Detailed results saved to: {output_file}")
            
            # Test the new zip endpoint if images were found
            if result.get('images'):
                print(f"\n📦 Testing zip endpoint with images...")
                try:
                    with open(pdf_path, 'rb') as pdf_file:
                        files = {'file': pdf_file}
                        zip_response = requests.post(f"{server_url}/extract/zip", files=files)
                    
                    if zip_response.status_code == 200:
                        zip_file = test_output_dir / f"pdf_content_{timestamp}.zip"
                        with open(zip_file, 'wb') as f:
                            f.write(zip_response.content)
                        print(f"✅ Zip file saved to: {zip_file}")
                    else:
                        print(f"⚠️ Zip endpoint failed: {zip_response.status_code}")
                except Exception as e:
                    print(f"⚠️ Could not test zip endpoint: {e}")
            
        else:
            print(f"❌ Error processing PDF: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to server at {server_url}")
        print("Make sure the PDF processor service is running:")
        print("  cd services/pdf-processor")
        print("  python main.py")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def main():
    """Main function."""
    if len(sys.argv) < 2:
        print("Usage: python test_pdf_processor.py <pdf_file_path> [server_url]")
        print("Example: python test_pdf_processor.py sample.pdf")
        print("Example: python test_pdf_processor.py sample.pdf http://localhost:8080")
        return
    
    pdf_path = sys.argv[1]
    server_url = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8080"
    
    test_pdf_processor(pdf_path, server_url)

if __name__ == "__main__":
    main()
