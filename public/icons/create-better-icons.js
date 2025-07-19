// Node.js用のCanvasライブラリを使用してアイコンを作成
// 実行: node create-better-icons.js

const fs = require('fs');

// 各サイズのベースとなるSVGデータを作成
function createSVGIcon(size) {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8bc34a;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#7cb342;stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="url(#grad1)" />
    <text x="${size/2}" y="${size/2 + size/8}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size/2}" font-weight="bold" fill="white">V</text>
  </svg>`;
  
  return svg;
}

// より良いbase64 PNGを作成（各サイズに対応）
function createPNGBase64(size) {
  // 基本的なPNGヘッダー + データ（緑色の正方形）
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG署名
    0x00, 0x00, 0x00, 0x0D, // IHDRチャンクサイズ
    0x49, 0x48, 0x44, 0x52, // IHDRチャンクタイプ
    0x00, 0x00, 0x00, 0x01, // 幅（1ピクセル）
    0x00, 0x00, 0x00, 0x01, // 高さ（1ピクセル）
    0x08, 0x02, 0x00, 0x00, 0x00, // ビット深度、色タイプ等
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDATチャンクサイズ
    0x49, 0x44, 0x41, 0x54, // IDATチャンクタイプ
    0x08, 0x1D, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // 圧縮データ
    0x00, 0x00, 0x00, 0x00, // IENDチャンクサイズ
    0x49, 0x45, 0x4E, 0x44, // IENDチャンクタイプ
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return pngData.toString('base64');
}

// 各サイズのアイコンを作成
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  
  // SVGファイルを保存
  fs.writeFileSync(filename, svg);
  console.log(`Created: ${filename}`);
});

console.log('SVG icons created successfully!');
console.log('Note: For production use, convert SVG to PNG using online tools or ImageMagick');