// Check current database schema
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCurrentSchema() {
  console.log('=== Checking Current Database Schema ===');
  
  try {
    // Try to insert a test form_settings record to see what fields exist
    console.log('1. Testing form_settings table structure...');
    
    // First, try to get all form_settings records
    const { data: allFormSettings, error: allError } = await supabase
      .from('form_settings')
      .select('*');
    
    console.log('All form_settings records:', allFormSettings?.length || 0);
    if (allError) {
      console.error('Error fetching form_settings:', allError);
    }
    
    // Try to insert a basic record to see what fields are required
    console.log('\n2. Testing INSERT to understand schema...');
    const testInsert = {
      preset_id: 1,
      show_price: true,
      require_phone: true,
      require_furigana: true,
      allow_note: true,
      is_enabled: true,
      custom_message: 'Test schema check'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('form_settings')
      .insert(testInsert)
      .select();
    
    if (insertError) {
      console.error('Insert error (this tells us about schema):', insertError.message);
      
      // If insert fails due to missing columns, try with minimal data
      console.log('\n3. Trying minimal insert...');
      const minimalInsert = {
        preset_id: 1,
        is_enabled: true
      };
      
      const { data: minResult, error: minError } = await supabase
        .from('form_settings')
        .insert(minimalInsert)
        .select();
      
      if (minError) {
        console.error('Minimal insert error:', minError.message);
      } else {
        console.log('Minimal insert success:', minResult);
      }
      
    } else {
      console.log('Insert success:', insertResult);
    }
    
    // Check what we have now
    const { data: currentFormSettings, error: currentError } = await supabase
      .from('form_settings')
      .select('*');
    
    if (currentFormSettings && currentFormSettings.length > 0) {
      console.log('\n4. Current form_settings structure:');
      console.log('Columns:', Object.keys(currentFormSettings[0]));
      console.log('Sample record:', currentFormSettings[0]);
    }
    
    // Test pickup_windows table
    console.log('\n5. Testing pickup_windows table...');
    const { data: windowsData, error: windowsError } = await supabase
      .from('pickup_windows')
      .select('*')
      .limit(1);
    
    if (windowsError) {
      console.error('pickup_windows error:', windowsError);
    } else {
      console.log('pickup_windows count:', windowsData?.length || 0);
    }
    
    // Create sample pickup_windows if empty
    if (!windowsData || windowsData.length === 0) {
      console.log('\n6. Creating sample pickup_windows...');
      const windowInsert = {
        preset_id: 1,
        product_id: 3991,
        pickup_start: '2025-08-10T09:00:00+00:00',
        pickup_end: '2025-08-10T12:00:00+00:00',
        price: 398,
        comment: 'Test window'
      };
      
      const { data: windowResult, error: windowInsertError } = await supabase
        .from('pickup_windows')
        .insert(windowInsert)
        .select();
      
      if (windowInsertError) {
        console.error('pickup_windows insert error:', windowInsertError);
      } else {
        console.log('pickup_windows insert success:', windowResult);
      }
    }
    
  } catch (error) {
    console.error('Schema check error:', error);
  }
}

checkCurrentSchema().catch(console.error);