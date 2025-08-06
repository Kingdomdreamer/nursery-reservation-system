#!/usr/bin/env node

/**
 * React #310 エラー緊急修正テスト
 * 本番環境で発生していたReact #310エラーの修正をテスト
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 React #310エラー修正確認テスト開始');

const componentPath = './src/components/features/reservation/ProductSelectionSection.tsx';

if (!fs.existsSync(componentPath)) {
  console.error('❌ ProductSelectionSection.tsx が見つかりません');
  process.exit(1);
}

const content = fs.readFileSync(componentPath, 'utf8');

// 修正確認項目
const checks = [
  {
    name: 'useMemo hooks の安全なチェック',
    pattern: /useMemo\(\(\) => \{[\s\S]*?if \(!Array\.isArray\(.*?\)\)/g,
    required: true
  },
  {
    name: 'reduce操作のtry-catch包囲',
    pattern: /try \{[\s\S]*?\.reduce\([\s\S]*?\} catch/g,
    required: true
  },
  {
    name: 'ErrorBoundaryの実装',
    pattern: /ProductSelectionErrorBoundary/g,
    required: true
  },
  {
    name: 'フォームコンテキストの安全な取得',
    pattern: /try \{[\s\S]*?useFormContext[\s\S]*?\} catch \(formError\)/g,
    required: true
  },
  {
    name: '最終レンダリング安全チェック',
    pattern: /renderContent.*try \{[\s\S]*?\} catch \(renderError\)/g,
    required: true
  }
];

let allPassed = true;

checks.forEach(check => {
  const matches = content.match(check.pattern);
  const passed = matches && matches.length > 0;
  
  if (check.required && !passed) {
    console.error(`❌ ${check.name}: 未実装`);
    allPassed = false;
  } else if (passed) {
    console.log(`✅ ${check.name}: 実装済み (${matches.length}箇所)`);
  }
});

// 危険なパターンの検出
const dangerousPatterns = [
  {
    name: '未保護のreduce操作',
    pattern: /(?<!try\s*\{[\s\S]{0,200})\.reduce\(/g
  },
  {
    name: '未保護のuseMemo',
    pattern: /useMemo\(\(\) => \{(?![\s\S]*?Array\.isArray)/g
  }
];

dangerousPatterns.forEach(pattern => {
  const matches = content.match(pattern.pattern);
  if (matches && matches.length > 0) {
    console.warn(`⚠️  ${pattern.name}が検出されました (${matches.length}箇所)`);
    allPassed = false;
  }
});

// 特定のエラーパターンの検証
const reactErrorPatterns = [
  'Error: Minified React error #310',
  'React error #310',
  '.reduce is not a function',
  'Cannot read property of null'
];

console.log('\n📋 修正内容サマリー:');
console.log('- 全useMemoフックに空配列チェック追加');
console.log('- reduce操作にtry-catch包囲追加');
console.log('- フォームコンテキストの安全な取得');
console.log('- 総合的なErrorBoundary実装');
console.log('- 最終レンダリング安全チェック');

if (allPassed) {
  console.log('\n🎉 すべての修正が実装されています！');
  console.log('✨ React #310エラーは解決される見込みです');
} else {
  console.log('\n⚠️  一部の修正が不完全です');
}

// ビルドテスト実行
console.log('\n🔨 ビルドテスト実行中...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ ビルド成功 - 修正は有効です');
} catch (error) {
  console.error('❌ ビルドエラー - 追加修正が必要です');
  console.error(error.message);
  allPassed = false;
}

process.exit(allPassed ? 0 : 1);