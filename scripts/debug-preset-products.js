/**
 * プリセットと商品の関連付け状況をデバッグするスクリプト
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugPresetProducts() {
  console.log('=== プリセットと商品の関連付け状況デバッグ ===\n');

  try {
    // 1. 全プリセットを取得
    const { data: presets, error: presetsError } = await supabase
      .from('product_presets')
      .select('*')
      .order('id');

    if (presetsError) {
      console.error('プリセット取得エラー:', presetsError);
      return;
    }

    console.log(`📋 プリセット総数: ${presets?.length || 0}`);
    
    if (!presets || presets.length === 0) {
      console.log('⚠️  プリセットが存在しません');
      return;
    }

    // 2. 各プリセットの商品関連付け状況をチェック
    for (const preset of presets) {
      console.log(`\n--- プリセット: ${preset.preset_name} (ID: ${preset.id}) ---`);

      // preset_products テーブルの関連付けをチェック
      const { data: presetProducts, error: ppError } = await supabase
        .from('preset_products')
        .select('product_id, display_order, is_active')
        .eq('preset_id', preset.id)
        .order('display_order');

      if (ppError) {
        console.error(`  ❌ プリセット商品取得エラー: ${ppError.message}`);
        continue;
      }

      if (!presetProducts || presetProducts.length === 0) {
        console.log('  ⚠️  このプリセットには商品が関連付けられていません');
        continue;
      }

      console.log(`  📦 関連付けられた商品数: ${presetProducts.length}`);
      
      // 実際の商品情報を取得
      const productIds = presetProducts.map(pp => pp.product_id);
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, is_active')
        .in('id', productIds);

      if (productsError) {
        console.error(`  ❌ 商品情報取得エラー: ${productsError.message}`);
        continue;
      }

      // 関連付け詳細を表示
      presetProducts.forEach((pp, index) => {
        const product = products?.find(p => p.id === pp.product_id);
        const status = pp.is_active ? (product?.is_active ? '✅' : '⚠️ 商品無効') : '❌ 関連付け無効';
        console.log(`  ${index + 1}. ${product?.name || `商品ID:${pp.product_id}`} ${status}`);
      });
    }

    // 3. 全商品数もチェック
    const { data: allProducts, error: allProductsError } = await supabase
      .from('products')
      .select('id, name, is_active')
      .order('id');

    if (!allProductsError && allProducts) {
      const activeProducts = allProducts.filter(p => p.is_active);
      console.log(`\n📊 全商品数: ${allProducts.length} (有効: ${activeProducts.length})`);
    }

    // 4. フォーム設定の確認
    const { data: formSettings, error: fsError } = await supabase
      .from('form_settings')
      .select('preset_id, is_enabled');

    if (!fsError && formSettings) {
      console.log(`\n⚙️  フォーム設定数: ${formSettings.length}`);
      const enabledSettings = formSettings.filter(fs => fs.is_enabled);
      console.log(`   有効なフォーム設定: ${enabledSettings.length}`);
    }

  } catch (error) {
    console.error('デバッグ実行エラー:', error);
  }
}

// 商品関連付けの自動修正機能
async function autoFixPresetProducts() {
  console.log('\n=== 自動修正の提案 ===');
  
  try {
    // 関連付けのないプリセットを特定
    const { data: presets } = await supabase
      .from('product_presets')
      .select('id, preset_name');

    if (!presets) return;

    for (const preset of presets) {
      const { data: hasProducts } = await supabase
        .from('preset_products')
        .select('id')
        .eq('preset_id', preset.id)
        .limit(1);

      if (!hasProducts || hasProducts.length === 0) {
        console.log(`\n🔧 プリセット「${preset.preset_name}」(ID: ${preset.id}) に商品を関連付けするには:`);
        console.log(`   管理画面 > 設定 > プリセット管理 > 編集 > 商品選択`);
        console.log(`   または以下のAPIを使用:`);
        console.log(`   PUT /api/admin/preset-products/${preset.id}`);
        console.log(`   Body: { "products": [{"product_id": 1, "display_order": 1}] }`);
      }
    }
  } catch (error) {
    console.error('自動修正チェックエラー:', error);
  }
}

// メイン実行
async function main() {
  await debugPresetProducts();
  await autoFixPresetProducts();
  
  console.log('\n=== デバッグ完了 ===');
  console.log('問題が見つかった場合は、管理画面でプリセットに商品を関連付けてください。');
}

main().catch(console.error);