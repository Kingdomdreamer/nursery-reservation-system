#!/bin/bash

# より良いPNGアイコンを作成するスクリプト

# 各サイズのアイコンを作成
SIZES=(72 96 128 144 152 192 384 512)

for size in "${SIZES[@]}"; do
    echo "Creating icon-${size}x${size}.png..."
    
    # SVGを使用してPNGを生成（ImageMagickまたはInkscape使用）
    if command -v magick >/dev/null 2>&1; then
        # ImageMagick 7
        magick -size ${size}x${size} xc:transparent \
            -fill "#8bc34a" -draw "circle $((size/2)),$((size/2)) $((size/2)),$((size/4))" \
            -pointsize $((size/3)) -font Arial-Bold -fill white \
            -gravity center -draw "text 0,0 'V'" \
            icon-${size}x${size}.png
    elif command -v convert >/dev/null 2>&1; then
        # ImageMagick 6
        convert -size ${size}x${size} xc:transparent \
            -fill "#8bc34a" -draw "circle $((size/2)),$((size/2)) $((size/2)),$((size/4))" \
            -pointsize $((size/3)) -font Arial-Bold -fill white \
            -gravity center -draw "text 0,0 'V'" \
            icon-${size}x${size}.png
    else
        echo "ImageMagick not found. Creating minimal PNG with base64..."
        # 最小限のPNGをbase64で作成（緑色の正方形）
        base64 -d > icon-${size}x${size}.png << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkiPj/HwADBAH/h3VmRAAAAABJRU5ErkJggg==
EOF
    fi
done

# ショートカットアイコンもコピー
cp icon-96x96.png shortcut-reservation.png
cp icon-96x96.png shortcut-admin.png
cp icon-96x96.png shortcut-products.png
cp icon-72x72.png action-view.png
cp icon-96x96.png action-dismiss.png

echo "All icons created successfully!"