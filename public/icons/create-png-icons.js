const fs = require('fs');

// 各サイズの最小限だが有効なPNG（緑色の正方形）を作成
function createValidPNG(size) {
  // 最小限のPNGデータ（4x4の緑色画像）
  const pngBase64 = {
    // 4x4の緑色PNG
    small: `iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAG0lEQVQYV2P8z8AABEwjjFhGjYQ1arBGjYQJAQAAhgABVhIhpgAAAABJRU5ErkJggg==`,
    // 16x16の緑色PNG
    medium: `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAW0lEQVQ4T2NkYGAQAuJ/QMwAFGdkYoAABiADGBgZQcBkNAhkZGBgZEZhM4JiRjIwMjIwMjCMGgAyYBQQowaMGjBqwKgBowaMGjBqwKgBowaMGjBqwKgBowYAAPgWAhO1Y3EIAAAAAElFTkSuQmCC`,
    // 32x32の緑色PNG
    large: `iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAcUlEQVR4Xu3UsQ3AIAxEUUYgM7ADKzCC42cERnAEdsAIzMAmrMECjMAmBLEBBcQKSi5BYFv/TZzD2xOIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiH7MARgAASC4DQ5rAAAAAElFTkSuQmCC`
  };
  
  // サイズに応じて適切なPNGを選択
  let base64Data;
  if (size <= 96) {
    base64Data = pngBase64.small;
  } else if (size <= 192) {
    base64Data = pngBase64.medium;
  } else {
    base64Data = pngBase64.large;
  }
  
  return Buffer.from(base64Data, 'base64');
}

// 各サイズのアイコンを作成
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const pngData = createValidPNG(size);
  const filename = `icon-${size}x${size}.png`;
  
  // PNGファイルを保存
  fs.writeFileSync(filename, pngData);
  console.log(`Created: ${filename} (${pngData.length} bytes)`);
});

// ショートカット用アイコンをコピー
const shortcuts = [
  'shortcut-reservation.png',
  'shortcut-admin.png', 
  'shortcut-products.png',
  'action-view.png',
  'action-dismiss.png'
];

shortcuts.forEach(shortcut => {
  const pngData = createValidPNG(96);
  fs.writeFileSync(shortcut, pngData);
  console.log(`Created: ${shortcut}`);
});

console.log('All PNG icons created successfully!');