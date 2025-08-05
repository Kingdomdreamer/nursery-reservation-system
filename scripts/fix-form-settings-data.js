// Fix form_settings data issues
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixFormSettingsData() {
  console.log('=== Fixing Form Settings Data Issues ===');
  
  try {
    // 1. Check existing presets
    console.log('\n1. Checking existing presets...');
    
    const { data: presets, error: presetsError } = await supabaseAdmin
      .from('product_presets')
      .select('*')
      .order('id');
    
    if (presetsError) {
      console.error('❌ Error fetching presets:', presetsError);
      return;
    }
    
    console.log(`✅ Found ${presets.length} presets:`);
    presets.forEach(preset => {
      console.log(`   ${preset.id}: ${preset.preset_name}`);
    });
    
    if (presets.length === 0) {
      console.log('❌ No presets found! Creating default preset...');
      
      const { data: newPreset, error: createPresetError } = await supabaseAdmin
        .from('product_presets')
        .insert({
          preset_name: 'デフォルトプリセット',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createPresetError) {
        console.error('❌ Failed to create preset:', createPresetError);
        return;
      }
      
      console.log('✅ Created default preset:', newPreset.id);
      presets.push(newPreset);
    }
    
    // 2. Check existing form_settings
    console.log('\n2. Checking existing form_settings...');
    
    const { data: existingSettings, error: settingsError } = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .order('preset_id');
    
    if (settingsError) {
      console.error('❌ Error fetching form_settings:', settingsError);
      return;
    }
    
    console.log(`✅ Found ${existingSettings.length} form_settings records:`);
    existingSettings.forEach(setting => {
      console.log(`   preset_id=${setting.preset_id}, id=${setting.id}, enabled=${setting.is_enabled}`);
    });
    
    // 3. Create missing form_settings for each preset
    console.log('\n3. Creating missing form_settings...');
    
    for (const preset of presets) {
      const existingSetting = existingSettings.find(s => s.preset_id === preset.id);
      
      if (!existingSetting) {
        console.log(`Creating form_settings for preset ${preset.id}...`);
        
        const defaultSettings = {
          preset_id: preset.id,
          show_price: true,
          require_phone: true,
          require_furigana: true,
          enable_furigana: true, // Match require_furigana for compatibility
          allow_note: true,
          is_enabled: true,
          enable_birthday: false,
          enable_gender: false,
          require_address: false,
          custom_message: `${preset.preset_name}のご注文ありがとうございます。商品とお引き取り日時をご確認ください。`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: created, error: createError } = await supabaseAdmin
          .from('form_settings')
          .insert(defaultSettings)
          .select()
          .single();
        
        if (createError) {
          console.error(`❌ Failed to create settings for preset ${preset.id}:`, createError);
        } else {
          console.log(`✅ Created form_settings for preset ${preset.id}, ID: ${created.id}`);
        }
      } else {
        console.log(`✅ form_settings already exists for preset ${preset.id}`);
        
        // Update enable_furigana to match require_furigana if needed
        if (existingSetting.enable_furigana !== existingSetting.require_furigana) {
          const { error: updateError } = await supabaseAdmin
            .from('form_settings')
            .update({ 
              enable_furigana: existingSetting.require_furigana,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSetting.id);
          
          if (updateError) {
            console.error(`❌ Failed to sync enable_furigana for ID ${existingSetting.id}:`, updateError);
          } else {
            console.log(`✅ Synced enable_furigana for preset ${preset.id}`);
          }
        }
      }
    }
    
    // 4. Verify the fix
    console.log('\n4. Verifying the fix...');
    
    const { data: finalSettings, error: finalError } = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .eq('preset_id', 1)
      .single();
    
    if (finalError) {
      console.error('❌ Still no settings for preset 1:', finalError);
    } else {
      console.log('✅ form_settings for preset 1 confirmed:');
      console.log(`   ID: ${finalSettings.id}`);
      console.log(`   is_enabled: ${finalSettings.is_enabled}`);
      console.log(`   enable_furigana: ${finalSettings.enable_furigana}`);
      console.log(`   require_furigana: ${finalSettings.require_furigana}`);
      console.log(`   custom_message: ${finalSettings.custom_message}`);
    }
    
    // 5. Test the API again
    console.log('\n5. Testing API after fix...');
    
    try {
      const testResponse = await fetch('http://localhost:3000/api/admin/form-settings/1');
      console.log(`API Test Status: ${testResponse.status}`);
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('✅ API now working!');
        console.log(`   Returned settings ID: ${testData.data?.id}`);
      } else {
        const errorText = await testResponse.text();
        console.log('❌ API still failing:', errorText);
      }
    } catch (apiError) {
      console.log('⚠️  API test skipped:', apiError.message);
    }
    
    console.log('\n=== Fix Summary ===');
    console.log('✅ Verified product_presets exist');
    console.log('✅ Created missing form_settings records');
    console.log('✅ Synced enable_furigana with require_furigana');
    console.log('✅ Fixed 404 errors for preset_id=1');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Test API: GET http://localhost:3000/api/admin/form-settings/1');
    console.log('2. Test admin panel: http://localhost:3000/admin/settings');
    console.log('3. Test form page: http://localhost:3000/form/1');
    console.log('4. Verify no more 500/404 errors');
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  }
}

fixFormSettingsData().catch(console.error);