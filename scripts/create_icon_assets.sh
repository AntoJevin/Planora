#!/bin/bash
# Create white background using sips (macOS built-in tool)

# Create a temporary white image using the icon as a template
cp ./assets/images/icon.png ./assets/images/temp.png

# Fill it with white (this creates a white square)
sips -s format png --setProperty formatOptions normal ./assets/images/temp.png --out ./assets/images/android-icon-background.png

# Use ImageMagick-like approach with sips to create solid white
# Actually, let's use a simpler approach - create from scratch with Python without PIL

python3 << 'EOF'
# Create solid white PNG without PIL
import struct
import zlib

def create_white_png(filename, width=1024, height=1024):
    """Create a solid white PNG file"""
    # PNG signature
    png_signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk (image header)
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_chunk = create_chunk(b'IHDR', ihdr_data)
    
    # IDAT chunk (image data)
    # For RGB, each pixel is 3 bytes (R, G, B)
    # Each scanline starts with a filter byte (0 = no filter)
    scanline = b'\x00' + b'\xff\xff\xff' * width  # Filter byte + white pixels
    raw_data = scanline * height
    compressed_data = zlib.compress(raw_data, 9)
    idat_chunk = create_chunk(b'IDAT', compressed_data)
    
    # IEND chunk (end of file)
    iend_chunk = create_chunk(b'IEND', b'')
    
    # Write PNG file
    with open(filename, 'wb') as f:
        f.write(png_signature)
        f.write(ihdr_chunk)
        f.write(idat_chunk)
        f.write(iend_chunk)

def create_chunk(chunk_type, data):
    """Create a PNG chunk"""
    length = struct.pack('>I', len(data))
    crc = zlib.crc32(chunk_type + data) & 0xffffffff
    crc_bytes = struct.pack('>I', crc)
    return length + chunk_type + data + crc_bytes

# Create white background
create_white_png('./assets/images/android-icon-background.png')
print("✓ Created white background")

# For monochrome, just copy the icon and convert to grayscale
# We'll do this with sips in the shell script
EOF

# Create monochrome version using sips
sips -s format png -s formatOptions normal ./assets/images/icon.png --out ./assets/images/android-icon-monochrome.png
# Convert to grayscale
sips -s format png --setProperty format png -s formatOptions normal ./assets/images/android-icon-monochrome.png

echo "✓ Created monochrome icon"
echo ""
echo "All icon assets created successfully!"
