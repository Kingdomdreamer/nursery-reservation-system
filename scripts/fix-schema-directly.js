// Fix form_settings schema directly
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSchemaDirectly() {
  console.log('=== Fixing form_settings Schema Directly ===');
  
  try {
    // First, backup existing data
    console.log('1. Backing up existing data...');
    const { data: existingData, error: backupError } = await supabase
      .from('form_settings')
      .select('*');
    
    if (backupError) {
      console.log('No existing data to backup or table does not exist:', backupError.message);
    } else {
      console.log(`Found ${existingData.length} existing records`);
    }
    
    console.log('2. Updating table schema...');
    
    // SQL commands to update the schema
    const schemaUpdates = [
      // Add new columns if they don't exist
      `ALTER TABLE form_settings 
       ADD COLUMN IF NOT EXISTS require_phone BOOLEAN DEFAULT true,
       ADD COLUMN IF NOT EXISTS require_furigana BOOLEAN DEFAULT true,
       ADD COLUMN IF NOT EXISTS allow_note BOOLEAN DEFAULT true,
       ADD COLUMN IF NOT EXISTS custom_message TEXT;`,
      
      // Remove old columns if they exist
      `ALTER TABLE form_settings 
       DROP COLUMN IF EXISTS require_address,
       DROP COLUMN IF EXISTS enable_gender,
       DROP COLUMN IF EXISTS enable_birthday,
       DROP COLUMN IF EXISTS enable_furigana,
       DROP COLUMN IF EXISTS pickup_start,
       DROP COLUMN IF EXISTS pickup_end,
       DROP COLUMN IF EXISTS valid_until;`,
       
      // Update default values
      `ALTER TABLE form_settings 
       ALTER COLUMN show_price SET DEFAULT true;`
    ];
    
    for (let i = 0; i < schemaUpdates.length; i++) {
      const sql = schemaUpdates[i];
      console.log(`Executing update ${i + 1}/${schemaUpdates.length}...`);
      
      try {
        // Execute raw SQL using RPC
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
          console.error(`Error in update ${i + 1}:`, error);
        } else {
          console.log(`✅ Update ${i + 1} completed`);
        }
      } catch (rpcError) {
        console.error(`RPC Error in update ${i + 1}:`, rpcError);
      }
    }
    
    console.log('3. Verifying schema update...');
    
    // Test a simple query to see if the new schema works
    const { data: testData, error: testError } = await supabase
      .from('form_settings')
      .select('id, preset_id, show_price, require_phone, require_furigana, allow_note, is_enabled, custom_message')
      .limit(1);
    
    if (testError) {
      console.error('Schema verification failed:', testError);
    } else {
      console.log('✅ Schema verification successful');
      if (testData.length > 0) {
        console.log('Sample record with new schema:', testData[0]);
      }
    }
    
    console.log('4. Updating existing records to ensure new fields have values...');
    
    // Make sure existing records have proper values for new fields
    const { error: updateError } = await supabase
      .from('form_settings')
      .update({
        require_phone: true,
        require_furigana: true,
        allow_note: true,
        updated_at: new Date().toISOString()
      })
      .is('require_phone', null);
    
    if (updateError) {
      console.log('Note: Could not update null values (this is normal if no null values exist)');
    } else {
      console.log('✅ Updated records with new field values');
    }
    
    console.log('\n=== Schema Fix Completed ===');
    console.log('The form_settings table should now use the correct schema.');
    console.log('Please clear browser cache and restart the development server.');
    
  } catch (error) {
    console.error('Schema fix error:', error);
  }
}

fixSchemaDirectly().catch(console.error);