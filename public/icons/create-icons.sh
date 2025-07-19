#!/bin/bash

# PWA用のアイコンファイルを作成するスクリプト
# ImageMagickを使用して適切なサイズのPNGアイコンを生成

# 色設定
BG_COLOR="#8bc34a"
TEXT_COLOR="white"

# 各サイズのアイコンを作成
SIZES=(72 96 128 144 152 192 384 512)

for size in "${SIZES[@]}"; do
    echo "Creating icon-${size}x${size}.png..."
    
    # ImageMagickのmagickコマンドを使用
    if command -v magick >/dev/null 2>&1; then
        # ImageMagick 7
        magick -size ${size}x${size} xc:transparent \
            -fill "${BG_COLOR}" \
            -draw "circle $((size/2)),$((size/2)) $((size/2)),$((size/4))" \
            -pointsize $((size/3)) \
            -font Arial-Bold \
            -fill "${TEXT_COLOR}" \
            -gravity center \
            -draw "text 0,0 'V'" \
            icon-${size}x${size}.png
    elif command -v convert >/dev/null 2>&1; then
        # ImageMagick 6
        convert -size ${size}x${size} xc:transparent \
            -fill "${BG_COLOR}" \
            -draw "circle $((size/2)),$((size/2)) $((size/2)),$((size/4))" \
            -pointsize $((size/3)) \
            -font Arial-Bold \
            -fill "${TEXT_COLOR}" \
            -gravity center \
            -draw "text 0,0 'V'" \
            icon-${size}x${size}.png
    else
        echo "ImageMagick not found. Creating simple PNG with base64..."
        # シンプルな緑色のPNGを作成（base64エンコード）
        base64 -d > icon-${size}x${size}.png << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hRxuUgAAAABJRU5ErkJggg==
EOF
    fi
    
    echo "Created: icon-${size}x${size}.png"
done

# ショートカット用アイコンをコピー
echo "Creating shortcut icons..."
cp icon-96x96.png shortcut-reservation.png
cp icon-96x96.png shortcut-admin.png
cp icon-96x96.png shortcut-products.png
cp icon-72x72.png action-view.png
cp icon-96x96.png action-dismiss.png

echo "All icons created successfully!"