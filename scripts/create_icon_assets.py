#!/usr/bin/env python3
"""
Script to create Android adaptive icon assets:
1. White background for android-icon-background.png
2. Monochrome version for android-icon-monochrome.png
"""

from PIL import Image, ImageDraw
import os

# Get the project root directory
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
assets_dir = os.path.join(project_root, 'assets', 'images')

# Create solid white background (1024x1024)
white_bg = Image.new('RGB', (1024, 1024), 'white')
white_bg.save(os.path.join(assets_dir, 'android-icon-background.png'))
print("✓ Created white background")

# For monochrome, we'll convert the main icon to grayscale/white on transparent
# Load the main icon
icon_path = os.path.join(assets_dir, 'icon.png')
icon = Image.open(icon_path).convert('RGBA')

# Create monochrome version - convert to grayscale then to white on transparent
# Get the alpha channel
alpha = icon.split()[3]

# Create a white image
monochrome = Image.new('RGBA', (1024, 1024), (255, 255, 255, 0))

# Use the icon's luminance as the alpha for the white color
gray = icon.convert('L')
# Create white image with alpha from grayscale
for x in range(1024):
    for y in range(1024):
        r, g, b, a = icon.getpixel((x, y))
        if a > 0:  # If not transparent
            # Calculate luminance
            luminance = int(0.299 * r + 0.587 * g + 0.114 * b)
            # Use luminance as alpha for white
            monochrome.putpixel((x, y), (255, 255, 255, luminance))

monochrome.save(os.path.join(assets_dir, 'android-icon-monochrome.png'))
print("✓ Created monochrome icon")

print("\nAll icon assets created successfully!")
