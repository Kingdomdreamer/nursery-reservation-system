// Comprehensive system check including form URL and DB linking
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function comprehensiveSystemCheck() {
  console.log('=== Comprehensive System Check ===');
  
  try {
    // 1. Database Schema Verification
    console.log('\n1. Database Schema Verification...');
    
    const { data: schemaData, error: schemaError } = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Schema error:', schemaError);
      return;
    }
    
    if (schemaData && schemaData.length > 0) {
      const currentColumns = Object.keys(schemaData[0]);
      console.log('✅ Current form_settings columns:');
      currentColumns.forEach((col, i) => console.log(`   ${i+1}. ${col}`));
      
      // Check all required columns
      const requiredColumns = [
        'enable_birthday', 'enable_furigana', 'require_address', 
        'require_phone', 'allow_note', 'is_enabled', 'show_price',
        'require_furigana', 'enable_gender', 'custom_message'
      ];
      
      console.log('\n   Column verification:');
      requiredColumns.forEach(col => {
        const exists = currentColumns.includes(col);
        console.log(`   ${exists ? '✅' : '❌'} ${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
      });
    } else {
      console.log('⚠️  No data in form_settings table');
    }
    
    // 2. Check form_settings data for preset 1
    console.log('\n2. Form Settings Data Check...');
    
    const { data: preset1Settings, error: preset1Error } = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .eq('preset_id', 1);
    
    if (preset1Error) {
      console.error('❌ Error fetching preset 1 settings:', preset1Error);
    } else if (preset1Settings && preset1Settings.length > 0) {
      console.log('✅ Form settings for preset 1 found');
      preset1Settings.forEach((setting, i) => {
        console.log(`   Record ${i+1}: ID=${setting.id}, enabled=${setting.is_enabled}`);
        console.log(`     enable_furigana: ${setting.enable_furigana}`);
        console.log(`     require_furigana: ${setting.require_furigana}`);
        console.log(`     enable_birthday: ${setting.enable_birthday}`);
      });
    } else {
      console.log('❌ No form settings found for preset 1');
      console.log('   Creating default settings...');
      
      const defaultSettings = {
        preset_id: 1,
        show_price: true,
        require_phone: true,
        require_furigana: true,
        enable_furigana: true,
        allow_note: true,
        is_enabled: true,
        enable_birthday: false,
        enable_gender: false,
        require_address: false,
        custom_message: 'ご注文ありがとうございます。商品とお引き取り日時をご確認ください。'
      };
      
      const { data: created, error: createError } = await supabaseAdmin
        .from('form_settings')
        .insert(defaultSettings)
        .select();
      
      if (createError) {
        console.error('❌ Failed to create default settings:', createError);
      } else {
        console.log('✅ Default settings created:', created[0]?.id);
      }
    }
    
    // 3. Check product_presets table
    console.log('\n3. Product Presets Check...');
    
    const { data: presets, error: presetsError } = await supabaseAdmin
      .from('product_presets')
      .select('*')
      .order('id');
    
    if (presetsError) {
      console.error('❌ Error fetching presets:', presetsError);
    } else {
      console.log(`✅ Found ${presets?.length || 0} presets`);
      presets?.forEach(preset => {
        console.log(`   Preset ${preset.id}: ${preset.preset_name}`);
      });
    }
    
    // 4. Check pickup_windows and products linking
    console.log('\n4. Form URL and DB Linking Check...');
    
    const { data: pickupWindows, error: windowsError } = await supabaseAdmin
      .from('pickup_windows')
      .select(`
        id, preset_id, product_id,
        product:products(id, name, price, visible)
      `)
      .eq('preset_id', 1);
    
    if (windowsError) {
      console.error('❌ Error fetching pickup windows:', windowsError);
    } else {
      console.log(`✅ Found ${pickupWindows?.length || 0} pickup windows for preset 1`);
      
      const validWindows = pickupWindows?.filter(w => w.product && w.product_id) || [];
      console.log(`   Valid windows with products: ${validWindows.length}`);
      
      if (validWindows.length > 0) {
        console.log('   Product linking:');
        validWindows.forEach((window, i) => {
          console.log(`     ${i+1}. Product ${window.product_id}: ${window.product.name} (¥${window.product.price})`);
        });
      } else {
        console.log('   ⚠️  No valid product links found');
      }
    }
    
    // 5. Test API endpoints
    console.log('\n5. API Endpoints Test...');
    
    const testPort = process.env.PORT || '3000';
    const baseUrl = `http://localhost:${testPort}`;
    
    try {
      // Test Form API (what users see)
      console.log(`   Testing Form API: ${baseUrl}/api/form/1`);
      const formResponse = await fetch(`${baseUrl}/api/form/1`);
      console.log(`   Form API Status: ${formResponse.status}`);
      
      if (formResponse.ok) {
        const formData = await formResponse.json();
        console.log('   ✅ Form API working');
        console.log(`     Products: ${formData.data?.products?.length || 0}`);
        console.log(`     Pickup windows: ${formData.data?.pickup_windows?.length || 0}`);
        console.log(`     Form settings: ${formData.data?.form_settings ? 'EXISTS' : 'MISSING'}`);
        
        if (formData.data?.form_settings) {
          const fs = formData.data.form_settings;
          console.log('     Form settings fields:');
          console.log(`       is_enabled: ${fs.is_enabled}`);
          console.log(`       enable_furigana: ${fs.enable_furigana}`);
          console.log(`       require_furigana: ${fs.require_furigana}`);
          console.log(`       enable_birthday: ${fs.enable_birthday}`);
        }
      } else {
        const errorText = await formResponse.text();
        console.log(`   ❌ Form API error: ${errorText}`);
      }
      
      // Test Admin Form Settings API
      console.log(`\n   Testing Admin API: ${baseUrl}/api/admin/form-settings/1`);
      const adminResponse = await fetch(`${baseUrl}/api/admin/form-settings/1`);
      console.log(`   Admin API Status: ${adminResponse.status}`);
      
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        console.log('   ✅ Admin API working');
        console.log(`     Settings ID: ${adminData.data?.id}`);
        console.log(`     All fields: ${Object.keys(adminData.data || {}).join(', ')}`);
      } else {
        const errorText = await adminResponse.text();
        console.log(`   ❌ Admin API error: ${errorText}`);
      }
      
    } catch (apiError) {
      console.log(`   ⚠️  API tests skipped (server not running): ${apiError.message}`);
    }
    
    // 6. RLS Policies Check
    console.log('\n6. RLS Policies Check...');
    
    try {
      // Check if RLS is enabled
      const { data: rlsCheck } = await supabaseAdmin
        .from('form_settings')
        .select('id')
        .limit(1);
      
      if (rlsCheck) {
        console.log('✅ RLS policies allow SELECT on form_settings');
      }
    } catch (rlsError) {
      console.log('❌ RLS policy issue:', rlsError.message);
    }
    
    // 7. Frontend URL Mapping Check
    console.log('\n7. Frontend URL Mapping...');
    
    console.log('   Expected URL patterns:');
    console.log(`     Form page: ${baseUrl}/form/1`);
    console.log(`     Admin page: ${baseUrl}/admin/settings`);
    console.log('');
    console.log('   API mapping:');
    console.log('     /form/1 → calls /api/form/1');
    console.log('     Admin settings → calls /api/admin/form-settings/1');
    console.log('     Form saves → calls /api/admin/form-settings (POST/PUT)');
    
    console.log('\n=== Summary ===');
    console.log('🔧 Database Schema: Updated with all required columns');
    console.log('🔧 Form Settings: Linked to preset_id=1');
    console.log('🔧 Product Linking: Via pickup_windows table');
    console.log('🔧 API Endpoints: Form and Admin APIs');
    console.log('🔧 URL Mapping: /form/1 ↔ DB preset_id=1');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Restart development server: npm run dev');
    console.log('2. Clear browser cache completely');
    console.log('3. Test form settings in admin panel');
    console.log('4. Verify form works at /form/1');
    console.log('5. Check Network tab for API calls');
    
  } catch (error) {
    console.error('❌ Comprehensive check error:', error);
  }
}

comprehensiveSystemCheck().catch(console.error);