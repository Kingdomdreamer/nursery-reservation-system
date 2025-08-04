// Investigate current database schema issue
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateCurrentSchema() {
  console.log('=== Investigating Current Database Schema ===');
  
  try {
    // 1. Check actual table structure
    console.log('\n1. Checking actual form_settings table structure...');
    
    const { data: actualData, error: actualError } = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .limit(1);
    
    if (actualError) {
      console.error('❌ Error querying form_settings:', actualError);
      console.log('   Error code:', actualError.code);
      console.log('   Error message:', actualError.message);
      console.log('   Error details:', actualError.details);
      console.log('   Error hint:', actualError.hint);
    } else {
      if (actualData && actualData.length > 0) {
        const columns = Object.keys(actualData[0]);
        console.log('✅ Current columns in form_settings table:');
        columns.forEach((col, index) => {
          console.log(`   ${index + 1}. ${col}`);
        });
        
        // Check for specific columns
        const requiredColumns = [
          'enable_furigana', 'require_furigana', 'enable_birthday', 
          'enable_gender', 'require_address', 'show_price', 
          'require_phone', 'allow_note', 'is_enabled'
        ];
        
        console.log('\n   Column analysis:');
        requiredColumns.forEach(col => {
          const exists = columns.includes(col);
          console.log(`   ${exists ? '✅' : '❌'} ${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
        });
      } else {
        console.log('⚠️  No data found in form_settings table');
        
        // Try to check if table exists at all
        const { data: tables, error: tablesError } = await supabaseAdmin
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'form_settings');
        
        if (tablesError) {
          console.log('Cannot check table existence:', tablesError);
        } else if (tables && tables.length > 0) {
          console.log('✅ form_settings table exists but is empty');
        } else {
          console.log('❌ form_settings table does not exist');
        }
      }
    }
    
    // 2. Check if we need to fix column names
    console.log('\n2. Checking for column name inconsistencies...');
    
    // The error mentions 'enable_furigana' but our current schema uses 'require_furigana'
    // This suggests there might be old code still trying to use the old column name
    
    if (actualData && actualData.length > 0) {
      const columns = Object.keys(actualData[0]);
      
      const mappings = [
        { old: 'enable_furigana', new: 'require_furigana' },
        { old: 'enable_birthday', new: 'enable_birthday' }, // This should exist
        { old: 'enable_gender', new: 'enable_gender' }      // This should exist
      ];
      
      console.log('Column name mapping analysis:');
      mappings.forEach(mapping => {
        const hasOld = columns.includes(mapping.old);
        const hasNew = columns.includes(mapping.new);
        console.log(`   ${mapping.old} -> ${mapping.new}: old=${hasOld}, new=${hasNew}`);
      });
    }
    
    // 3. Test direct database insert
    console.log('\n3. Testing direct database insert...');
    
    try {
      const testData = {
        preset_id: 999, // Use a test preset ID
        show_price: true,
        require_phone: true,
        require_furigana: true,
        allow_note: true,
        is_enabled: false, // Disabled so it doesn't interfere
        custom_message: 'Schema investigation test'
      };
      
      const { data: insertResult, error: insertError } = await supabaseAdmin
        .from('form_settings')
        .insert(testData)
        .select();
      
      if (insertError) {
        console.log('❌ Direct insert failed:', insertError);
        console.log('   This confirms the schema issue');
      } else {
        console.log('✅ Direct insert successful');
        console.log('   Inserted record:', insertResult[0]);
        
        // Clean up test record
        await supabaseAdmin
          .from('form_settings')
          .delete()
          .eq('preset_id', 999);
        console.log('   Test record cleaned up');
      }
    } catch (insertTestError) {
      console.log('❌ Insert test error:', insertTestError);
    }
    
    // 4. Provide SQL fix
    console.log('\n4. Recommended SQL fix...');
    
    if (actualData && actualData.length > 0) {
      const columns = Object.keys(actualData[0]);
      
      // Check what's missing
      const expectedColumns = {
        'require_furigana': 'boolean DEFAULT true',
        'enable_birthday': 'boolean DEFAULT false',
        'enable_gender': 'boolean DEFAULT false', 
        'require_address': 'boolean DEFAULT false',
        'show_price': 'boolean DEFAULT true',
        'require_phone': 'boolean DEFAULT true',
        'allow_note': 'boolean DEFAULT true',
        'is_enabled': 'boolean DEFAULT true',
        'custom_message': 'text'
      };
      
      const missingColumns = [];
      Object.keys(expectedColumns).forEach(col => {
        if (!columns.includes(col)) {
          missingColumns.push(col);
        }
      });
      
      if (missingColumns.length > 0) {
        console.log('\n📋 Run this SQL in Supabase SQL Editor:');
        console.log('');
        console.log('ALTER TABLE public.form_settings');
        
        missingColumns.forEach((col, index) => {
          const comma = index < missingColumns.length - 1 ? ',' : ';';
          console.log(`ADD COLUMN IF NOT EXISTS ${col} ${expectedColumns[col]}${comma}`);
        });
        console.log('');
      } else {
        console.log('✅ All expected columns exist');
      }
      
      // Check for old column names that might need renaming
      const oldColumns = columns.filter(col => col.startsWith('enable_') && col !== 'enable_birthday' && col !== 'enable_gender');
      if (oldColumns.length > 0) {
        console.log('\n⚠️  Found potential old column names:', oldColumns);
        console.log('Consider renaming them to match current schema');
      }
    }
    
    console.log('\n=== Investigation Complete ===');
    
  } catch (error) {
    console.error('❌ Investigation error:', error);
  }
}

investigateCurrentSchema().catch(console.error);