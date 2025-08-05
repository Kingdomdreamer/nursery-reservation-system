// Add enable_furigana column for compatibility
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addEnableFuriganaColumn() {
  console.log('=== Adding enable_furigana Column for Compatibility ===');
  
  try {
    // Check current schema
    const { data: currentData, error: schemaError } = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Schema check error:', schemaError);
      return;
    }
    
    if (currentData && currentData.length > 0) {
      const columns = Object.keys(currentData[0]);
      console.log('Current columns:', columns);
      
      const hasEnableFurigana = columns.includes('enable_furigana');
      
      if (hasEnableFurigana) {
        console.log('✅ enable_furigana column already exists');
      } else {
        console.log('❌ enable_furigana column missing');
        console.log('\n📋 Run this SQL in Supabase SQL Editor:');
        console.log('');
        console.log('ALTER TABLE public.form_settings');
        console.log('ADD COLUMN IF NOT EXISTS enable_furigana boolean DEFAULT false;');
        console.log('');
        console.log('-- Update existing records to sync enable_furigana with require_furigana');
        console.log('UPDATE public.form_settings');
        console.log('SET enable_furigana = require_furigana');
        console.log('WHERE enable_furigana IS NULL;');
        console.log('');
        return;
      }
    }
    
    // Test if we can now insert with enable_furigana
    console.log('\nTesting compatibility after adding enable_furigana...');
    
    const testData = {
      preset_id: 1,
      show_price: true,
      require_phone: true,
      require_furigana: true,
      enable_furigana: true, // This should now work
      allow_note: true,
      is_enabled: true,
      enable_birthday: false,
      enable_gender: false,
      require_address: false,
      custom_message: 'Compatibility test with enable_furigana'
    };
    
    // Update existing record
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('form_settings')
      .update(testData)
      .eq('preset_id', 1)
      .select();
    
    if (updateError) {
      console.log('❌ Update test failed:', updateError);
    } else {
      console.log('✅ Update test successful');
      console.log('Updated record columns:', Object.keys(updateResult[0] || {}));
      
      // Verify both fields exist and match
      const record = updateResult[0];
      if (record) {
        console.log('Field verification:');
        console.log('  require_furigana:', record.require_furigana);
        console.log('  enable_furigana:', record.enable_furigana);
        console.log('  Fields match:', record.require_furigana === record.enable_furigana);
      }
    }
    
    console.log('\n=== Next Steps ===');
    console.log('1. If enable_furigana column was missing, run the SQL above');
    console.log('2. Restart your development server');
    console.log('3. Clear browser cache completely');
    console.log('4. Test the form settings functionality');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

addEnableFuriganaColumn().catch(console.error);