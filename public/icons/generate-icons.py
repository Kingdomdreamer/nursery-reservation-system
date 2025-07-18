#!/usr/bin/env python3
"""
PWAアイコン生成スクリプト
このスクリプトはプレースホルダーPNG画像を生成します
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    """指定サイズのアイコンを作成"""
    # 緑色のグラデーション背景
    img = Image.new('RGB', (size, size), '#8bc34a')
    draw = ImageDraw.Draw(img)
    
    # 簡単な植物のアイコンを描画
    center = size // 2
    
    # 葉っぱの形を簡単に描画
    leaf_size = size // 3
    draw.ellipse([center - leaf_size//2, center - leaf_size//2, 
                  center + leaf_size//2, center + leaf_size//2], 
                 fill='#7cb342')
    
    # 中央に「V」文字
    try:
        font_size = size // 3
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()
        
        text = "V"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = (size - text_width) // 2
        y = (size - text_height) // 2
        
        draw.text((x, y), text, fill='white', font=font)
    except:
        # フォントが使えない場合は小さな円を描画
        draw.ellipse([center - 10, center - 10, center + 10, center + 10], fill='white')
    
    img.save(filename)
    print(f"Created {filename} ({size}x{size})")

def main():
    """メイン処理"""
    # 必要なアイコンサイズ
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    for size in sizes:
        filename = f"icon-{size}x{size}.png"
        create_icon(size, filename)
    
    # ショートカット用のアイコンも作成
    create_icon(96, "shortcut-reservation.png")
    create_icon(96, "shortcut-admin.png")
    create_icon(96, "shortcut-products.png")
    
    # プッシュ通知用のアイコン
    create_icon(72, "icon-72x72.png")  # すでに作成済みだが確実に
    create_icon(96, "action-view.png")
    create_icon(96, "action-dismiss.png")

if __name__ == "__main__":
    main()