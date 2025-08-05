// Migrate form_settings table schema to new format
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateFormSettingsSchema() {
  console.log('=== Migrating form_settings Schema ===');
  
  try {
    // Check current schema
    console.log('1. Checking current schema...');
    const { data: currentColumns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'form_settings')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      console.error('Error checking schema:', columnsError);
      return;
    }
    
    const columnNames = currentColumns.map(col => col.column_name);
    console.log('Current columns:', columnNames);
    
    // Check if migration is needed
    const hasOldFields = columnNames.includes('enable_birthday') || 
                        columnNames.includes('enable_gender') || 
                        columnNames.includes('require_address');
    
    const hasNewFields = columnNames.includes('require_phone') && 
                        columnNames.includes('require_furigana') && 
                        columnNames.includes('allow_note');
    
    if (!hasOldFields && hasNewFields) {
      console.log('✅ Schema is already up to date');
      return;
    }
    
    console.log('2. Performing schema migration...');
    
    // Backup existing data
    const { data: existingData, error: backupError } = await supabase
      .from('form_settings')
      .select('*');
    
    if (backupError) {
      console.error('Error backing up data:', backupError);
      return;
    }
    
    console.log(`Backing up ${existingData.length} existing records`);
    
    // Drop and recreate table with correct schema
    const migrations = [
      'DROP TABLE IF EXISTS form_settings CASCADE;',
      `CREATE TABLE form_settings (
        id SERIAL PRIMARY KEY,
        preset_id INTEGER NOT NULL,
        show_price BOOLEAN DEFAULT true,
        require_phone BOOLEAN DEFAULT true,
        require_furigana BOOLEAN DEFAULT true,
        allow_note BOOLEAN DEFAULT true,
        is_enabled BOOLEAN DEFAULT true,
        custom_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT fk_form_settings_preset 
          FOREIGN KEY (preset_id) REFERENCES product_presets(id) ON DELETE CASCADE
      );`
    ];
    
    for (const migration of migrations) {
      console.log('Executing:', migration.substring(0, 50) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql: migration });
      if (error) {
        console.error('Migration error:', error);
        return;
      }
    }
    
    // Restore data with new schema
    console.log('3. Restoring data with new schema...');
    
    for (const record of existingData) {
      const newRecord = {
        preset_id: record.preset_id,
        show_price: record.show_price || true,
        require_phone: true, // Default new field
        require_furigana: true, // Default new field  
        allow_note: true, // Default new field
        is_enabled: record.is_enabled !== false,
        custom_message: record.custom_message || null,
        created_at: record.created_at,
        updated_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('form_settings')
        .insert(newRecord);
      
      if (insertError) {
        console.error('Error restoring record:', insertError);
      }
    }
    
    console.log('✅ Schema migration completed successfully');
    
    // Verify the migration
    console.log('4. Verifying migration...');
    const { data: newData, error: verifyError } = await supabase
      .from('form_settings')
      .select('*');
    
    if (!verifyError && newData) {
      console.log(`✅ Verification complete: ${newData.length} records restored`);
      console.log('Sample record:', newData[0]);
    }
    
  } catch (error) {
    console.error('Migration error:', error);
  }
}

migrateFormSettingsSchema().catch(console.error);