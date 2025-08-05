// Apply cascade delete trigger to database
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyCascadeDeleteTrigger() {
  console.log('=== Applying Cascade Delete Trigger ===');
  
  try {
    // プリセット削除時の関連データクリーンアップ関数
    const cleanupFunction = `
      CREATE OR REPLACE FUNCTION cleanup_preset_related_data()
      RETURNS TRIGGER AS $$
      BEGIN
          -- pickup_windows の削除
          DELETE FROM pickup_windows WHERE preset_id = OLD.id;
          
          -- form_settings の削除
          DELETE FROM form_settings WHERE preset_id = OLD.id;
          
          -- preset_products の削除
          DELETE FROM preset_products WHERE preset_id = OLD.id;
          
          RETURN OLD;
      END;
      $$ language 'plpgsql';
    `;
    
    console.log('1. Creating cleanup function...');
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: cleanupFunction });
    
    if (functionError) {
      console.error('Function creation error:', functionError);
      return;
    }
    
    // プリセット削除トリガー
    const trigger = `
      DROP TRIGGER IF EXISTS cleanup_preset_data_on_delete ON product_presets;
      CREATE TRIGGER cleanup_preset_data_on_delete
          BEFORE DELETE ON product_presets
          FOR EACH ROW
          EXECUTE FUNCTION cleanup_preset_related_data();
    `;
    
    console.log('2. Creating trigger...');
    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: trigger });
    
    if (triggerError) {
      console.error('Trigger creation error:', triggerError);
      return;
    }
    
    console.log('✅ Cascade delete trigger applied successfully');
    
    // テスト用のプリセットを作成して削除テストを実行
    console.log('\n3. Testing cascade delete...');
    
    // テスト用プリセット作成
    const { data: testPreset, error: presetError } = await supabase
      .from('product_presets')
      .insert({
        preset_name: 'テスト用プリセット（削除予定）',
        description: 'カスケード削除テスト用'
      })
      .select()
      .single();
    
    if (presetError) {
      console.error('Test preset creation error:', presetError);
      return;
    }
    
    console.log(`Test preset created: ${testPreset.id}`);
    
    // 関連データ作成
    await supabase.from('form_settings').insert({
      preset_id: testPreset.id,
      show_price: true,
      require_phone: true,
      require_furigana: true,
      allow_note: true,
      is_enabled: true
    });
    
    await supabase.from('pickup_windows').insert({
      preset_id: testPreset.id,
      pickup_start: '2025-08-15T09:00:00+00:00',
      pickup_end: '2025-08-15T12:00:00+00:00'
    });
    
    console.log('Related data created');
    
    // 削除前の関連データ数確認
    const { count: formSettingsBefore } = await supabase
      .from('form_settings')
      .select('*', { count: 'exact', head: true })
      .eq('preset_id', testPreset.id);
    
    const { count: pickupWindowsBefore } = await supabase
      .from('pickup_windows')
      .select('*', { count: 'exact', head: true })
      .eq('preset_id', testPreset.id);
    
    console.log(`Before delete - form_settings: ${formSettingsBefore}, pickup_windows: ${pickupWindowsBefore}`);
    
    // プリセット削除
    const { error: deleteError } = await supabase
      .from('product_presets')
      .delete()
      .eq('id', testPreset.id);
    
    if (deleteError) {
      console.error('Delete error:', deleteError);
      return;
    }
    
    console.log('Test preset deleted');
    
    // 削除後の関連データ数確認
    const { count: formSettingsAfter } = await supabase
      .from('form_settings')
      .select('*', { count: 'exact', head: true })
      .eq('preset_id', testPreset.id);
    
    const { count: pickupWindowsAfter } = await supabase
      .from('pickup_windows')
      .select('*', { count: 'exact', head: true })
      .eq('preset_id', testPreset.id);
    
    console.log(`After delete - form_settings: ${formSettingsAfter}, pickup_windows: ${pickupWindowsAfter}`);
    
    if (formSettingsAfter === 0 && pickupWindowsAfter === 0) {
      console.log('✅ Cascade delete working correctly');
    } else {
      console.log('❌ Cascade delete not working properly');
    }
    
  } catch (error) {
    console.error('Error applying trigger:', error);
  }
}

applyCascadeDeleteTrigger().catch(console.error);