#!/usr/bin/env node

/**
 * プリセット4に商品を追加するスクリプト
 * React #310エラーの原因となる空商品配列を修正
 */

const https = require('https');
const fs = require('fs');

console.log('🔧 プリセット4商品設定修正スクリプト');

// 環境変数確認
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 環境変数が設定されていません');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
  process.exit(1);
}

// プリセット4の状態確認
async function checkPreset4() {
  try {
    console.log('\n📊 プリセット4の現在の状態を確認中...');
    
    const response = await fetch(`http://localhost:3000/api/presets/4/config`);
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ プリセット4が見つかりました');
      console.log(`📦 商品数: ${result.data.products?.length || 0}`);
      console.log(`📅 ピックアップウィンドウ数: ${result.data.pickup_windows?.length || 0}`);
      console.log(`⚙️  フォーム設定: ${result.data.form_settings ? '設定済み' : '未設定'}`);
      
      if (!result.data.products || result.data.products.length === 0) {
        console.log('⚠️  商品が設定されていません - これがReact #310エラーの原因です');
        return true; // 修正が必要
      }
      
      return false; // 修正不要
    } else {
      console.error('❌ プリセット4が見つかりません:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ プリセット4確認エラー:', error.message);
    return false;
  }
}

// 利用可能な商品を取得
async function getAvailableProducts() {
  try {
    console.log('\n🛍️  利用可能な商品を取得中...');
    
    const response = await fetch('http://localhost:3000/api/admin/products/all');
    const result = await response.json();
    
    if (response.ok && result.success) {
      const products = result.data || [];
      console.log(`✅ ${products.length}個の商品が見つかりました`);
      
      // 表示状態の商品のみ返す（最初の3個）
      const visibleProducts = products
        .filter(p => p.visible)
        .slice(0, 3);
        
      console.log(`📋 表示可能商品: ${visibleProducts.length}個`);
      return visibleProducts;
    } else {
      console.error('❌ 商品取得エラー:', result.error);
      return [];
    }
  } catch (error) {
    console.error('❌ 商品取得エラー:', error.message);
    return [];
  }
}

// プリセット4に商品を追加
async function addProductsToPreset4(products) {
  if (!products || products.length === 0) {
    console.log('⚠️  追加する商品がありません');
    return false;
  }
  
  try {
    console.log(`\n➕ プリセット4に${products.length}個の商品を追加中...`);
    
    const presetProducts = products.map((product, index) => ({
      product_id: product.id,
      display_order: index + 1,
      is_active: true
    }));
    
    const response = await fetch('http://localhost:3000/api/presets/4/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(presetProducts)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ 商品の追加が完了しました');
      console.log('📦 追加された商品:');
      products.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.display_name} (¥${p.price})`);
      });
      return true;
    } else {
      console.error('❌ 商品追加エラー:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ 商品追加エラー:', error.message);
    return false;
  }
}

// フォーム設定の確認と作成
async function ensureFormSettings() {
  try {
    console.log('\n⚙️  フォーム設定を確認中...');
    
    const response = await fetch('http://localhost:3000/api/admin/form-settings/4');
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ フォーム設定が存在します');
      return true;
    } else {
      console.log('⚠️  フォーム設定が見つかりません - 作成します');
      
      const createResponse = await fetch('http://localhost:3000/api/admin/form-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset_id: 4,
          show_price: true,
          require_phone: true,
          require_furigana: false,
          allow_note: true,
          is_enabled: true
        })
      });
      
      const createResult = await createResponse.json();
      
      if (createResponse.ok && createResult.success) {
        console.log('✅ フォーム設定を作成しました');
        return true;
      } else {
        console.error('❌ フォーム設定作成エラー:', createResult.error);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ フォーム設定確認エラー:', error.message);
    return false;
  }
}

// メイン実行
async function main() {
  console.log('🚀 プリセット4修正開始');
  
  const needsFix = await checkPreset4();
  
  if (!needsFix) {
    console.log('✅ プリセット4は既に正常です');
    return;
  }
  
  const products = await getAvailableProducts();
  
  if (products.length === 0) {
    console.error('❌ 利用可能な商品がありません');
    return;
  }
  
  const formSettingsOk = await ensureFormSettings();
  
  if (!formSettingsOk) {
    console.error('❌ フォーム設定の確保に失敗しました');
    return;
  }
  
  const success = await addProductsToPreset4(products);
  
  if (success) {
    console.log('\n🎉 プリセット4の修正が完了しました！');
    console.log('🔗 フォームURL: http://localhost:3000/form/4');
    console.log('✨ React #310エラーは解決されるはずです');
  } else {
    console.error('❌ 修正に失敗しました');
  }
}

if (require.main === module) {
  main().catch(console.error);
}