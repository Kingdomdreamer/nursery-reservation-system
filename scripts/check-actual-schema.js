const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkActualSchema() {
  console.log('=== Checking Actual Database Schema ===');
  
  try {
    // Get the actual form_settings record to see what columns exist
    console.log('1. Getting sample form_settings record...');
    const { data: sampleRecord, error: sampleError } = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .limit(1)
      .single();
    
    console.log('Sample record:', sampleRecord);
    console.log('Sample error:', sampleError);
    
    if (sampleRecord) {
      console.log('\n2. Actual columns in form_settings table:');
      Object.keys(sampleRecord).forEach(column => {
        console.log(`  - ${column}: ${typeof sampleRecord[column]} = ${sampleRecord[column]}`);
      });
    }
    
    // Test what columns are available by trying to insert/update
    console.log('\n3. Testing column availability with update...');
    
    // Try to update with minimal valid columns
    const validUpdateData = {
      show_price: true,
      require_phone: true,
      require_furigana: true,
      allow_note: true,
      is_enabled: true,
      updated_at: new Date().toISOString()
    };
    
    console.log('Testing with valid columns:', validUpdateData);
    
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('form_settings')
      .update(validUpdateData)
      .eq('id', sampleRecord?.id)
      .select()
      .single();
    
    console.log('Update result:', updateResult);
    console.log('Update error:', updateError);
    
    // Test what happens with invalid columns
    console.log('\n4. Testing with invalid columns...');
    
    const invalidUpdateData = {
      show_price: true,
      enable_birthday: false,  // This should fail
      enable_gender: false,    // This should fail
      require_address: false,  // This should fail
      enable_furigana: false   // This should fail
    };
    
    const { data: invalidResult, error: invalidError } = await supabaseAdmin
      .from('form_settings')
      .update(invalidUpdateData)
      .eq('id', sampleRecord?.id)
      .select()
      .single();
    
    console.log('Invalid update result:', invalidResult);
    console.log('Invalid update error:', invalidError);
    
  } catch (error) {
    console.error('Schema check error:', error);
  }
}

checkActualSchema().catch(console.error);