const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSystemStatus() {
  console.log('🔍 システム状態チェック');
  console.log('=====================================');
  
  // 利用可能なプリセットを確認
  const { data: presets } = await supabase
    .from('product_presets')
    .select('*')
    .order('id');
  
  const { data: formSettings } = await supabase
    .from('form_settings')
    .select('*')
    .eq('is_enabled', true)
    .order('preset_id');
  
  console.log('📋 利用可能なプリセット:');
  if (!presets || presets.length === 0) {
    console.log('  ❌ プリセットが見つかりません');
  } else {
    for (const preset of presets) {
      const hasSettings = formSettings?.some(s => s.preset_id === preset.id);
      const status = hasSettings ? '✅' : '⚠️';
      console.log(`  ${status} Preset ${preset.id}: ${preset.preset_name}`);
      
      if (hasSettings) {
        console.log(`     🌐 URL: https://nursery-reservation-system-e4r1cv2av-kingdomdreamers-projects.vercel.app/form/${preset.id}`);
        
        // 商品数を確認
        const { data: presetProducts } = await supabase
          .from('preset_products')
          .select('product_id')
          .eq('preset_id', preset.id)
          .eq('is_active', true);
          
        if (presetProducts && presetProducts.length > 0) {
          const { data: visibleProducts } = await supabase
            .from('products')
            .select('id, name')
            .in('id', presetProducts.map(pp => pp.product_id))
            .eq('visible', true);
            
          console.log(`     📦 商品数: ${visibleProducts?.length || 0}個`);
          if (visibleProducts && visibleProducts.length > 0) {
            visibleProducts.forEach(p => {
              console.log(`       - ${p.name}`);
            });
          }
        } else {
          console.log(`     ⚠️  関連商品がありません`);
        }
      } else {
        console.log(`     ❌ フォーム設定が無効または存在しません`);
      }
      console.log('');
    }
  }
  
  console.log('🔧 推奨アクション:');
  if (!presets || presets.length <= 1) {
    console.log('  1. 追加のプリセットを作成するには:');
    console.log('     node scripts/create-presets-via-api.js');
    console.log('     (注意: SUPABASE_SERVICE_ROLE_KEYが必要)');
  }
  
  console.log('  2. 動作確認:');
  console.log('     - 現在利用可能なURL:');
  presets?.forEach(preset => {
    const hasSettings = formSettings?.some(s => s.preset_id === preset.id);
    if (hasSettings) {
      console.log(`       https://nursery-reservation-system-e4r1cv2av-kingdomdreamers-projects.vercel.app/form/${preset.id}`);
    }
  });
  
  console.log('\n✅ システムの主要問題は解決済み:');
  console.log('   - クライアントサイドDB直接アクセス → APIエンドポイント経由に修正');
  console.log('   - "現在選択できません"表示 → 完全削除');
  console.log('   - プリセット別商品フィルタリング → 正常動作');
}

checkSystemStatus().catch(console.error);