// Add legacy columns to form_settings table for compatibility
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addLegacyColumns() {
  console.log('=== Adding Legacy Columns for Compatibility ===');
  
  try {
    // Note: We cannot execute ALTER TABLE directly via Supabase client
    // This would need to be run in Supabase SQL Editor
    
    console.log('📋 SQL to run in Supabase SQL Editor:');
    console.log('');
    console.log('ALTER TABLE public.form_settings');
    console.log('ADD COLUMN IF NOT EXISTS enable_birthday boolean DEFAULT false,');
    console.log('ADD COLUMN IF NOT EXISTS enable_gender boolean DEFAULT false,');
    console.log('ADD COLUMN IF NOT EXISTS require_address boolean DEFAULT false;');
    console.log('');
    
    // Test if we can insert/update with new columns after running SQL
    console.log('⚠️  After running the SQL above, test with this script:');
    console.log('');
    
    // Check current schema
    const { data: currentData, error: checkError } = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking current schema:', checkError);
      return;
    }
    
    if (currentData && currentData.length > 0) {
      const currentColumns = Object.keys(currentData[0]);
      console.log('Current columns:', currentColumns);
      
      const missingColumns = [];
      if (!currentColumns.includes('enable_birthday')) missingColumns.push('enable_birthday');
      if (!currentColumns.includes('enable_gender')) missingColumns.push('enable_gender');
      if (!currentColumns.includes('require_address')) missingColumns.push('require_address');
      
      if (missingColumns.length > 0) {
        console.log('❌ Missing columns:', missingColumns);
        console.log('⚠️  Please run the SQL above in Supabase SQL Editor first');
      } else {
        console.log('✅ All required columns exist');
        
        // Test update with all columns
        console.log('\nTesting update with all columns...');
        
        const { data: updateTest, error: updateError } = await supabaseAdmin
          .from('form_settings')
          .update({
            show_price: true,
            require_phone: true,
            require_furigana: true,
            allow_note: true,
            is_enabled: true,
            enable_birthday: false,
            enable_gender: false,
            require_address: false,
            custom_message: 'Legacy columns compatibility test',
            updated_at: new Date().toISOString()
          })
          .eq('preset_id', 1)
          .select();
        
        if (updateError) {
          console.error('❌ Update test error:', updateError);
        } else {
          console.log('✅ Update test successful');
          console.log('Updated record columns:', Object.keys(updateTest[0] || {}));
        }
      }
    }
    
    console.log('\n=== Instructions ===');
    console.log('1. Copy the SQL above');
    console.log('2. Go to Supabase Dashboard > SQL Editor');
    console.log('3. Paste and run the SQL');
    console.log('4. Restart your development server (npm run dev)');
    console.log('5. Test the form settings functionality');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

addLegacyColumns().catch(console.error);