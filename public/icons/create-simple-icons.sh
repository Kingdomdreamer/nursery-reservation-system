#!/bin/bash

# Simple SVG to PNG icon generation using ImageMagick
# Creates placeholder icons for PWA

# Define the SVG content
SVG_CONTENT='<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8bc34a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7cb342;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#grad)" rx="64"/>
  <circle cx="256" cy="200" r="80" fill="#ffffff" opacity="0.9"/>
  <rect x="226" y="280" width="60" height="120" fill="#ffffff" opacity="0.9"/>
  <text x="256" y="400" font-family="Arial, sans-serif" font-size="120" font-weight="bold" text-anchor="middle" fill="#ffffff">V</text>
</svg>'

# Create the base SVG file
echo "$SVG_CONTENT" > icon-base.svg

# Define sizes needed
SIZES=(72 96 128 144 152 192 384 512)

# Create icons for each size
for size in "${SIZES[@]}"; do
    echo "Creating icon-${size}x${size}.png..."
    
    # Try different methods to convert SVG to PNG
    if command -v convert >/dev/null 2>&1; then
        # ImageMagick method
        convert -background none -size ${size}x${size} icon-base.svg icon-${size}x${size}.png
    elif command -v rsvg-convert >/dev/null 2>&1; then
        # librsvg method
        rsvg-convert -w $size -h $size icon-base.svg -o icon-${size}x${size}.png
    elif command -v inkscape >/dev/null 2>&1; then
        # Inkscape method
        inkscape -w $size -h $size icon-base.svg -o icon-${size}x${size}.png
    else
        echo "No SVG converter found. Creating placeholder files..."
        # Create a simple placeholder PNG using a basic method
        # This creates a 1x1 pixel PNG as a last resort
        printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x12IDATx\x9cc\xd8\xe1\xc1\x81\x81\x81\x81\x81\x01\x02\x02\x02\x00\x0e\x84\x01\xe5\x00\xc9\x8e\xe9\x00\x00\x00\x00IEND\xaeB`\x82' > icon-${size}x${size}.png
    fi
done

# Create shortcut icons
echo "Creating shortcut icons..."
cp icon-96x96.png shortcut-reservation.png 2>/dev/null || echo "shortcut-reservation.png placeholder created"
cp icon-96x96.png shortcut-admin.png 2>/dev/null || echo "shortcut-admin.png placeholder created"
cp icon-96x96.png shortcut-products.png 2>/dev/null || echo "shortcut-products.png placeholder created"

# Create action icons
echo "Creating action icons..."
cp icon-96x96.png action-view.png 2>/dev/null || echo "action-view.png placeholder created"
cp icon-96x96.png action-dismiss.png 2>/dev/null || echo "action-dismiss.png placeholder created"

echo "Icon generation completed!"