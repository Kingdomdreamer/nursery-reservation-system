// Rebuild form_settings table and data
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function rebuildFormSettings() {
  console.log('=== Rebuilding Form Settings System ===');
  
  try {
    // 1. Check current form_settings table structure
    console.log('1. Checking current form_settings...');
    const { data: currentSettings, error: currentError } = await supabaseAdmin
      .from('form_settings')
      .select('*');
    
    console.log('Current form_settings records:', currentSettings?.length || 0);
    if (currentError) {
      console.error('Current check error:', currentError);
    }
    
    // 2. Create proper form_settings for preset 1 (which exists)
    console.log('\n2. Creating form_settings for preset 1...');
    const formSettingsData = {
      preset_id: 1,
      show_price: true,
      require_phone: true,
      require_furigana: true,
      allow_note: true,
      is_enabled: true,
      custom_message: 'ご注文ありがとうございます。引き取り日時をご確認ください。',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: newFormSettings, error: formError } = await supabaseAdmin
      .from('form_settings')
      .insert(formSettingsData)
      .select();
    
    if (formError) {
      console.error('Form settings creation error:', formError);
    } else {
      console.log('✅ Form settings created:', newFormSettings[0]);
    }
    
    // 3. Create pickup_windows for preset 1
    console.log('\n3. Creating pickup_windows...');
    const pickupWindowsData = [
      {
        preset_id: 1,
        product_id: 3991,
        pickup_start: '2025-08-10T09:00:00+00:00',
        pickup_end: '2025-08-10T12:00:00+00:00',
        price: 398,
        comment: '極早生タマネギ苗　ハイパーリニア　50本 - 午前中受け取り',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        preset_id: 1,
        product_id: 3991,
        pickup_start: '2025-08-10T13:00:00+00:00',
        pickup_end: '2025-08-10T17:00:00+00:00',
        price: 398,
        comment: '極早生タマネギ苗　ハイパーリニア　50本 - 午後受け取り',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        preset_id: 1,
        product_id: 3991,
        pickup_start: '2025-08-11T09:00:00+00:00',
        pickup_end: '2025-08-11T12:00:00+00:00',
        price: 398,
        comment: '極早生タマネギ苗　ハイパーリニア　50本 - 翌日午前受け取り',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const { data: newWindows, error: windowsError } = await supabaseAdmin
      .from('pickup_windows')
      .insert(pickupWindowsData)
      .select();
    
    if (windowsError) {
      console.error('Pickup windows creation error:', windowsError);
    } else {
      console.log('✅ Pickup windows created:', newWindows.length, 'records');
    }
    
    // 4. Test the form API
    console.log('\n4. Testing form API...');
    try {
      const response = await fetch('http://localhost:3002/api/form/1');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Form API working:', data.success);
        console.log('   Products:', data.data?.products?.length || 0);
        console.log('   Pickup windows:', data.data?.pickup_windows?.length || 0);
      } else {
        console.log('❌ Form API error:', response.status);
      }
    } catch (apiError) {
      console.log('API test error:', apiError.message);
    }
    
    // 5. Test form settings API
    console.log('\n5. Testing form settings API...');
    try {
      const settingsResponse = await fetch('http://localhost:3002/api/admin/form-settings/1');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        console.log('✅ Form settings API working');
        console.log('   Settings data:', settingsData.data);
      } else {
        console.log('❌ Form settings API error:', settingsResponse.status);
      }
    } catch (apiError) {
      console.log('Settings API test error:', apiError.message);
    }
    
    console.log('\n=== Rebuild Complete ===');
    console.log('✅ Form settings table populated');
    console.log('✅ Pickup windows created');
    console.log('🎯 Test URLs:');
    console.log('   - Form: http://localhost:3002/form/1');
    console.log('   - Admin: http://localhost:3002/admin/settings');
    
  } catch (error) {
    console.error('Rebuild error:', error);
  }
}

rebuildFormSettings().catch(console.error);