// Diagnose enable_birthday issue - Find where it's being referenced
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseEnableBirthdayIssue() {
  console.log('=== Diagnosing enable_birthday Issue ===');
  
  try {
    // 1. Check actual database schema
    console.log('\n1. Checking actual database schema...');
    
    const { data: formSettings, error: schemaError } = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Schema check error:', schemaError);
      return;
    }
    
    if (formSettings && formSettings.length > 0) {
      const actualColumns = Object.keys(formSettings[0]);
      console.log('✅ Actual database columns:', actualColumns);
      
      const hasEnableBirthday = actualColumns.includes('enable_birthday');
      console.log('   Has enable_birthday column:', hasEnableBirthday);
      
      if (hasEnableBirthday) {
        console.log('⚠️  enable_birthday column exists in database');
      } else {
        console.log('✅ enable_birthday column does not exist in database');
      }
    }
    
    // 2. Test form settings API directly
    console.log('\n2. Testing form settings API...');
    
    try {
      const getResponse = await fetch('http://localhost:3004/api/admin/form-settings/1');
      const responseText = await getResponse.text();
      
      console.log('API Response Status:', getResponse.status);
      
      if (getResponse.status === 500) {
        console.log('❌ 500 Error Response:', responseText);
        
        // Check if error mentions enable_birthday
        if (responseText.includes('enable_birthday')) {
          console.log('⚠️  Error message contains enable_birthday reference');
        }
      } else if (getResponse.ok) {
        const responseData = JSON.parse(responseText);
        console.log('✅ API working, returned fields:', Object.keys(responseData.data || {}));
      }
    } catch (apiError) {
      console.log('❌ API test error:', apiError.message);
    }
    
    // 3. Test form settings creation with minimal data
    console.log('\n3. Testing form settings creation...');
    
    try {
      const createData = {
        preset_id: 1,
        show_price: true,
        require_phone: true,
        require_furigana: true,
        allow_note: true,
        is_enabled: true,
        custom_message: '診断テスト'
      };
      
      const createResponse = await fetch('http://localhost:3004/api/admin/form-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData)
      });
      
      const createText = await createResponse.text();
      console.log('Create API Status:', createResponse.status);
      
      if (createResponse.status === 500) {
        console.log('❌ Create Error Response:', createText);
      } else if (createResponse.ok) {
        console.log('✅ Create API working');
      }
    } catch (createError) {
      console.log('❌ Create API test error:', createError.message);
    }
    
    // 4. Check if we need to add enable_birthday column
    console.log('\n4. Recommendation...');
    
    if (formSettings && formSettings.length > 0) {
      const actualColumns = Object.keys(formSettings[0]);
      const hasEnableBirthday = actualColumns.includes('enable_birthday');
      
      if (!hasEnableBirthday) {
        console.log('\n📋 RECOMMENDATION: Add enable_birthday column to database');
        console.log('Run this SQL in Supabase SQL Editor:');
        console.log('');
        console.log('ALTER TABLE public.form_settings');
        console.log('ADD COLUMN IF NOT EXISTS enable_birthday boolean DEFAULT false,');
        console.log('ADD COLUMN IF NOT EXISTS enable_gender boolean DEFAULT false,');
        console.log('ADD COLUMN IF NOT EXISTS require_address boolean DEFAULT false;');
        console.log('');
        console.log('Then restart the development server.');
      } else {
        console.log('\n✅ Database schema appears to be complete');
        console.log('The issue might be in the code or caching');
      }
    }
    
    console.log('\n=== Diagnosis Complete ===');
    
  } catch (error) {
    console.error('❌ Diagnosis error:', error);
  }
}

diagnoseEnableBirthdayIssue().catch(console.error);