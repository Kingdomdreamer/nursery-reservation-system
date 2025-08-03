const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required for this operation');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('=== Checking Database Schema ===');
  
  try {
    // Check table columns using information_schema
    console.log('1. Checking form_settings table structure...');
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'form_settings' })
      .catch(() => null);
    
    if (columnError || !columns) {
      // Try alternative method using raw SQL
      console.log('Using alternative method to check columns...');
      const { data: altColumns, error: altError } = await supabase
        .from('form_settings')
        .select()
        .limit(0);
      
      console.log('Alt Error:', altError);
      
      // Try to describe the table by attempting to insert with all expected fields
      console.log('2. Testing form_settings insert with minimal data...');
      const testData = {
        preset_id: 999, // Use a non-existent preset for testing
        is_enabled: true
      };
      
      const { data: testInsert, error: testError } = await supabase
        .from('form_settings')
        .insert(testData)
        .select()
        .single();
      
      console.log('Test insert error (expected):', testError);
      
      // If error mentions specific columns, that tells us about the schema
      if (testError && testError.message) {
        console.log('Error message:', testError.message);
      }
      
      // Test with full schema
      console.log('3. Testing with full expected schema...');
      const fullTestData = {
        preset_id: 6,
        show_price: true,
        require_address: false,
        enable_gender: false,
        enable_furigana: true,
        pickup_start: '2025-08-10T09:00:00.000Z',
        pickup_end: '2025-08-10T18:00:00.000Z',
        valid_until: '2025-12-31T23:59:59.999Z',
        is_enabled: true
      };
      
      const { data: fullTest, error: fullError } = await supabase
        .from('form_settings')
        .insert(fullTestData)
        .select()
        .single();
      
      console.log('Full test result:', fullTest);
      console.log('Full test error:', fullError);
      
      if (fullTest) {
        console.log('✅ Successfully created form_settings record!');
      }
    }
    
  } catch (error) {
    console.error('Error in schema check:', error);
  }
}

checkSchema().catch(console.error);