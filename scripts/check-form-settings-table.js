const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFormSettingsTable() {
  console.log('=== Checking form_settings Table ===');
  
  try {
    // Check all records
    console.log('1. All form_settings records:');
    const { data: allRecords, error: allError } = await supabaseAdmin
      .from('form_settings')
      .select('*');
    
    console.log('All records:', allRecords);
    console.log('All records error:', allError);
    
    // Check specific record with id=1
    console.log('\n2. Checking record with id=1:');
    const { data: record1, error: error1 } = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    console.log('Record 1:', record1);
    console.log('Record 1 error:', error1);
    
    // Check by preset_id=6
    console.log('\n3. Checking record with preset_id=6:');
    const { data: presetRecord, error: presetError } = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .eq('preset_id', 6)
      .single();
    
    console.log('Preset 6 record:', presetRecord);
    console.log('Preset 6 error:', presetError);
    
  } catch (error) {
    console.error('Check error:', error);
  }
}

checkFormSettingsTable().catch(console.error);