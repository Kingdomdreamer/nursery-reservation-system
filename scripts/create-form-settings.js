const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use service role key for admin operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required for this operation');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createFormSettingsForPreset6() {
  console.log('=== Creating Form Settings for Preset 6 ===');
  
  try {
    // Try with minimal data first to see what columns exist
    const minimalData = {
      preset_id: 6,
      is_enabled: true
    };
    
    console.log('Trying minimal insert first:', minimalData);
    const { data: minimalResult, error: minimalError } = await supabase
      .from('form_settings')
      .insert(minimalData)
      .select()
      .single();
    
    console.log('Minimal result:', minimalResult);
    console.log('Minimal error:', minimalError);
    
    if (minimalResult) {
      console.log('✅ Minimal insert successful! Now checking the actual structure...');
      console.log('Created record:', minimalResult);
      return;
    }
    
    // Create form_settings record for preset 6 with basic fields only
    const formSettingsData = {
      preset_id: 6,
      show_price: true,
      is_enabled: true
    };
    
    console.log('Inserting form_settings:', formSettingsData);
    
    const { data: formSettings, error: formError } = await supabase
      .from('form_settings')
      .insert(formSettingsData)
      .select()
      .single();
    
    if (formError) {
      console.error('Error creating form_settings:', formError);
      return;
    }
    
    console.log('✅ Form settings created:', formSettings);
    
    // Create some pickup windows for preset 6
    const pickupWindowsData = [
      {
        preset_id: 6,
        pickup_start: '2025-08-10T09:00:00.000Z',
        pickup_end: '2025-08-10T12:00:00.000Z',
        comment: '午前中の受け取り'
      },
      {
        preset_id: 6,
        pickup_start: '2025-08-10T13:00:00.000Z',
        pickup_end: '2025-08-10T17:00:00.000Z',
        comment: '午後の受け取り'
      }
    ];
    
    console.log('Inserting pickup_windows:', pickupWindowsData);
    
    const { data: pickupWindows, error: pickupError } = await supabase
      .from('pickup_windows')
      .insert(pickupWindowsData)
      .select();
    
    if (pickupError) {
      console.error('Error creating pickup_windows:', pickupError);
      return;
    }
    
    console.log('✅ Pickup windows created:', pickupWindows);
    
    // Now test the API call that was failing
    console.log('\n=== Testing API Call ===');
    const testResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/form/6`);
    const testData = await testResponse.json();
    
    console.log('API Response Status:', testResponse.status);
    console.log('API Response:', testData);
    
  } catch (error) {
    console.error('Error in setup:', error);
  }
}

createFormSettingsForPreset6().catch(console.error);