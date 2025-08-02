// RLSを回避してSupabase Admin APIを使用してプリセットを作成するスクリプト
// 注意: これはSupabaseのサービスロールキーが必要です

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// サービスロールキーが必要（.env.localに設定）
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createPresetsViaAdmin() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.log('ℹ️  SUPABASE_SERVICE_ROLE_KEY環境変数が設定されていません。');
    console.log('Supabaseダッシュボードからサービスロールキーを取得して.env.localに追加してください:');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
    console.log('');
    console.log('現在はプリセット11のみ利用可能です。');
    return;
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('=== Creating Additional Presets via Admin API ===');

  const presetsToCreate = [
    { id: 1, preset_name: '野菜セット' },
    { id: 2, preset_name: '果物セット' },
    { id: 3, preset_name: 'お米セット' }
  ];

  for (const preset of presetsToCreate) {
    try {
      // プリセットを作成
      const { data: newPreset, error: presetError } = await supabaseAdmin
        .from('product_presets')
        .upsert({
          id: preset.id,
          preset_name: preset.preset_name
        })
        .select()
        .single();

      if (presetError) {
        console.error(`❌ Error creating preset ${preset.id}:`, presetError);
        continue;
      }

      console.log(`✅ Created preset ${preset.id}: ${preset.preset_name}`);

      // フォーム設定を作成
      const { error: settingsError } = await supabaseAdmin
        .from('form_settings')
        .upsert({
          preset_id: preset.id,
          show_price: true,
          require_address: false,
          enable_gender: false,
          enable_birthday: false,
          enable_furigana: true,
          is_enabled: true
        });

      if (settingsError) {
        console.error(`❌ Error creating form_settings for preset ${preset.id}:`, settingsError);
      } else {
        console.log(`✅ Created form_settings for preset ${preset.id}`);
      }

      // ピックアップウィンドウを作成
      const pickupWindows = [
        {
          preset_id: preset.id,
          pickup_start: '2025-08-10T09:00:00.000Z',
          pickup_end: '2025-08-10T12:00:00.000Z'
        },
        {
          preset_id: preset.id,
          pickup_start: '2025-08-10T13:00:00.000Z',
          pickup_end: '2025-08-10T17:00:00.000Z'
        }
      ];

      for (const window of pickupWindows) {
        const { error: windowError } = await supabaseAdmin
          .from('pickup_windows')
          .insert(window);

        if (windowError) {
          console.error(`❌ Error creating pickup window for preset ${preset.id}:`, windowError);
        }
      }

      console.log(`✅ Created pickup windows for preset ${preset.id}`);

    } catch (error) {
      console.error(`❌ Exception creating preset ${preset.id}:`, error);
    }
  }

  // 最終確認
  const { data: finalPresets } = await supabaseAdmin
    .from('product_presets')
    .select('*')
    .order('id');

  console.log('');
  console.log('📊 Final presets in database:');
  finalPresets?.forEach(p => {
    console.log(`  - Preset ${p.id}: ${p.preset_name}`);
    console.log(`    URL: https://nursery-reservation-system-e4r1cv2av-kingdomdreamers-projects.vercel.app/form/${p.id}`);
  });
}

createPresetsViaAdmin().catch(console.error);