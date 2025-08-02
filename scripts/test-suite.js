#!/usr/bin/env node

/**
 * ベジライス予約システム - 自動テストスイート
 * 
 * このスクリプトは以下のテストを実行します:
 * - 環境変数の確認
 * - データベース接続テスト
 * - フォーム設定の確認
 * - 商品データの整合性チェック
 * - プリセット関連付けの確認
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// 環境変数の読み込み
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// テスト結果を格納
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// カラー出力用のユーティリティ
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
  testResults.passed++;
}

function error(message, err = null) {
  log(`❌ ${message}`, colors.red);
  if (err) {
    log(`   詳細: ${err.message}`, colors.red);
    testResults.errors.push({ message, error: err.message });
  }
  testResults.failed++;
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function header(title) {
  log(`\n${colors.bold}=== ${title} ===${colors.reset}`, colors.blue);
}

// Supabaseクライアントの初期化
let supabase;

async function initializeSupabase() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase環境変数が設定されていません');
    }
    
    supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    });
    
    success('Supabaseクライアントを初期化しました');
    return true;
  } catch (err) {
    error('Supabaseクライアントの初期化に失敗', err);
    return false;
  }
}

// 環境変数のテスト
async function testEnvironmentVariables() {
  header('環境変数確認テスト');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_LIFF_ID',
    'NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID',
    'LINE_MINIAPP_CHANNEL_SECRET',
    'LINE_MESSAGING_CHANNEL_ID',
    'LINE_MESSAGING_CHANNEL_SECRET',
    'LINE_MESSAGING_ACCESS_TOKEN'
  ];
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      success(`${varName} が設定されています`);
    } else {
      error(`${varName} が設定されていません`);
    }
  }
  
  // URLの形式チェック
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co')) {
    success('Supabase URLの形式が正しいです');
  } else if (supabaseUrl) {
    warning('Supabase URLの形式を確認してください');
  }
  
  // LIFF IDの形式チェック
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (liffId && /^\d+-\w+$/.test(liffId)) {
    success('LIFF IDの形式が正しいです');
  } else if (liffId) {
    warning('LIFF IDの形式を確認してください (例: 1234567890-abcdefgh)');
  }
}

// データベース接続テスト
async function testDatabaseConnection() {
  header('データベース接続テスト');
  
  try {
    // 基本的な接続テスト
    const { data, error } = await supabase
      .from('product_presets')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    success('データベースに正常に接続できました');
    
    // テーブルの存在確認
    const tables = [
      'product_presets',
      'products', 
      'preset_products',
      'form_settings',
      'reservations'
    ];
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });
        
        if (tableError) throw tableError;
        success(`テーブル '${table}' が存在します`);
      } catch (err) {
        error(`テーブル '${table}' にアクセスできません`, err);
      }
    }
    
  } catch (err) {
    error('データベース接続に失敗', err);
  }
}

// フォーム設定テスト
async function testFormSettings() {
  header('フォーム設定テスト');
  
  // Get existing presets dynamically
  const { data: existingPresets, error: presetsError } = await supabase
    .from('product_presets')
    .select('id, preset_name');
    
  if (presetsError) {
    error('プリセット一覧の取得に失敗:', presetsError.message);
    return;
  }
  
  if (!existingPresets || existingPresets.length === 0) {
    warning('テスト対象のプリセットが見つかりません');
    return;
  }
  
  const presetIds = existingPresets.map(p => p.id);
  
  for (const presetId of presetIds) {
    try {
      const preset = existingPresets.find(p => p.id === presetId);
      success(`プリセット ${presetId} (${preset.preset_name}) が存在します`);
      
      // フォーム設定の確認
      const { data: formSettingsArray, error: settingsError } = await supabase
        .from('form_settings')
        .select('*')
        .eq('preset_id', presetId)
        .eq('is_enabled', true);

      const formSettings = formSettingsArray?.[0] || null;
      
      if (settingsError) throw settingsError;
      
      if (formSettings) {
        success(`プリセット ${presetId} のフォーム設定が有効です`);
      } else {
        warning(`プリセット ${presetId} のフォーム設定が見つかりません`);
      }
      
    } catch (err) {
      error(`プリセット ${presetId} のテストに失敗`, err);
    }
  }
}

// 商品データの整合性テスト
async function testProductData() {
  header('商品データ整合性テスト');
  
  try {
    // 全商品の取得
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('visible', true);
    
    if (productsError) throw productsError;
    success(`${products.length} 個の商品が見つかりました`);
    
    // 商品データの基本チェック
    for (const product of products) {
      if (!product.name || !product.price || product.price <= 0) {
        warning(`商品 ID ${product.id} にデータの問題があります: ${JSON.stringify(product)}`);
      }
    }
    
    // プリセットと商品の関連付け確認
    const { data: presetProducts, error: relationError } = await supabase
      .from('preset_products')
      .select('preset_id, product_id, display_order');
    
    if (relationError) throw relationError;
    success(`${presetProducts.length} 個の商品-プリセット関連付けが見つかりました`);
    
    // 関連付けデータの整合性チェック
    const presetGroups = {};
    for (const relation of presetProducts) {
      if (!presetGroups[relation.preset_id]) {
        presetGroups[relation.preset_id] = [];
      }
      presetGroups[relation.preset_id].push(relation);
    }
    
    // 各プリセットの商品数をチェック
    for (const [presetId, relations] of Object.entries(presetGroups)) {
      // プリセット名を個別に取得
      const { data: presetData } = await supabase
        .from('product_presets')
        .select('name')
        .eq('id', presetId)
        .single();
      
      const presetName = presetData?.name || `プリセット${presetId}`;
      info(`${presetName}: ${relations.length} 個の商品`);
      
      if (relations.length === 0) {
        warning(`プリセット ${presetId} に商品が関連付けられていません`);
      }
    }
    
  } catch (err) {
    error('商品データの整合性テストに失敗', err);
  }
}

// プリセット別商品フィルタリングテスト
async function testProductFiltering() {
  header('商品フィルタリングテスト');
  
  const presetIds = [1, 2, 3];
  
  for (const presetId of presetIds) {
    try {
      // プリセット関連商品の取得 (実際のフォームロジックと同じ)
      const { data: presetProductsData, error: presetError } = await supabase
        .from('preset_products')
        .select('product_id, display_order')
        .eq('preset_id', presetId);
      
      if (presetError) throw presetError;
      
      if (presetProductsData.length === 0) {
        warning(`プリセット ${presetId} に関連付けられた商品がありません`);
        continue;
      }
      
      const productIds = presetProductsData.map(pp => pp.product_id);
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('visible', true);
      
      if (productsError) throw productsError;
      
      success(`プリセット ${presetId}: ${productsData.length} 個の商品が正しくフィルタリングされました`);
      
      // 表示順序のチェック
      const sortedProducts = productsData.sort((a, b) => {
        const orderA = Number(presetProductsData?.find(pp => pp.product_id === a.id)?.display_order) || 999;
        const orderB = Number(presetProductsData?.find(pp => pp.product_id === b.id)?.display_order) || 999;
        return orderA - orderB;
      });
      
      info(`  ソート済み商品: ${sortedProducts.map(p => p.name).join(', ')}`);
      
    } catch (err) {
      error(`プリセット ${presetId} の商品フィルタリングテストに失敗`, err);
    }
  }
}

// LINE API設定テスト (基本的な設定確認のみ)
async function testLineApiSettings() {
  header('LINE API設定テスト');
  
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const channelId = process.env.NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID;
  const messagingChannelId = process.env.LINE_MESSAGING_CHANNEL_ID;
  const accessToken = process.env.LINE_MESSAGING_ACCESS_TOKEN;
  
  if (liffId) {
    success('LIFF ID が設定されています');
  }
  
  if (channelId) {
    success('LINE Mini App チャネル ID が設定されています');
  }
  
  if (messagingChannelId) {
    success('LINE Messaging API チャネル ID が設定されています');
  }
  
  if (accessToken) {
    success('LINE Messaging API アクセストークンが設定されています');
    
    // トークンの形式チェック
    if (accessToken.length > 100 && accessToken.includes('+')) {
      success('アクセストークンの形式が正しいようです');
    } else {
      warning('アクセストークンの形式を確認してください');
    }
  }
  
  info('実際のLINE API接続テストはLINE Developersコンソールで実行してください');
}

// テスト結果のサマリー表示
function displaySummary() {
  header('テスト結果サマリー');
  
  const total = testResults.passed + testResults.failed;
  const passRate = total > 0 ? Math.round((testResults.passed / total) * 100) : 0;
  
  log(`\n📊 テスト実行結果:`);
  log(`   合計テスト数: ${total}`);
  success(`   成功: ${testResults.passed}`);
  
  if (testResults.failed > 0) {
    error(`   失敗: ${testResults.failed}`);
  }
  
  log(`   成功率: ${passRate}%\n`);
  
  if (testResults.errors.length > 0) {
    warning('発生したエラー:');
    testResults.errors.forEach((err, index) => {
      log(`   ${index + 1}. ${err.message}: ${err.error}`, colors.red);
    });
  }
  
  if (passRate >= 90) {
    success('🎉 テストの大部分が成功しました! システムは正常に動作しているようです。');
  } else if (passRate >= 70) {
    warning('⚠️  いくつかの問題が見つかりました。上記のエラーを確認して修正してください。');
  } else {
    error('❌ 多くの問題が見つかりました。システム設定を見直すことをお勧めします。');
  }
}

// メイン実行関数
async function runTestSuite() {
  log(`${colors.bold}${colors.blue}ベジライス予約システム - 自動テストスイート${colors.reset}`);
  log(`実行時刻: ${new Date().toLocaleString('ja-JP')}\n`);
  
  // 環境変数テスト
  await testEnvironmentVariables();
  
  // Supabase初期化
  const supabaseInitialized = await initializeSupabase();
  
  if (supabaseInitialized) {
    // データベーステスト
    await testDatabaseConnection();
    await testFormSettings();
    await testProductData();
    await testProductFiltering();
  } else {
    warning('Supabaseが初期化できないため、データベース関連のテストをスキップします');
  }
  
  // LINE API設定テスト
  await testLineApiSettings();
  
  // 結果表示
  displaySummary();
  
  // 終了コード設定
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// スクリプト実行
if (require.main === module) {
  runTestSuite().catch(err => {
    error('テストスイートの実行中にエラーが発生しました', err);
    process.exit(1);
  });
}

module.exports = { runTestSuite, testResults };