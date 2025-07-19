#!/usr/bin/env python3
"""
PWA用のアイコンファイルを作成するスクリプト
PIL (Pillow) を使って適切なサイズのPNGアイコンを生成
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    """指定されたサイズのアイコンを作成"""
    # 背景色（緑色のテーマカラー）
    bg_color = (139, 195, 74)  # #8bc34a
    text_color = (255, 255, 255)  # 白
    
    # 新しい画像を作成
    img = Image.new('RGBA', (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    
    # 円形の背景を描画
    margin = size // 8
    draw.ellipse([margin, margin, size-margin, size-margin], fill=bg_color)
    
    # テキスト「V」を描画
    try:
        # フォントサイズを動的に調整
        font_size = size // 2
        font = ImageFont.load_default()
        
        # テキストの位置を計算
        text = "V"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = (size - text_width) // 2
        y = (size - text_height) // 2 - size // 10
        
        draw.text((x, y), text, fill=text_color, font=font)
        
    except Exception as e:
        print(f"フォント描画エラー: {e}")
        # フォールバック：シンプルな図形
        center = size // 2
        radius = size // 4
        draw.ellipse([center-radius, center-radius, center+radius, center+radius], 
                    fill=text_color)
    
    # ファイルを保存
    img.save(filename, 'PNG')
    print(f"作成完了: {filename} ({size}x{size})")

def main():
    """メイン関数"""
    # 必要なアイコンサイズ
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    # アイコンを作成
    for size in sizes:
        filename = f"icon-{size}x{size}.png"
        create_icon(size, filename)
    
    # ショートカット用アイコンもコピー
    shortcuts = [
        ("shortcut-reservation.png", "icon-96x96.png"),
        ("shortcut-admin.png", "icon-96x96.png"),
        ("shortcut-products.png", "icon-96x96.png"),
        ("action-view.png", "icon-72x72.png"),
        ("action-dismiss.png", "icon-96x96.png")
    ]
    
    for shortcut, source in shortcuts:
        if os.path.exists(source):
            import shutil
            shutil.copy2(source, shortcut)
            print(f"コピー完了: {shortcut}")

if __name__ == "__main__":
    main()