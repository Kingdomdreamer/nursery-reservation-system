// Test API endpoints to identify remaining issues
require('dotenv').config({ path: '.env.local' });

async function testApiEndpoints() {
  console.log('=== Testing API Endpoints ===');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // 1. Test GET /api/admin/form-settings/1
    console.log('\n1. Testing GET /api/admin/form-settings/1...');
    
    const getResponse = await fetch(`${baseUrl}/api/admin/form-settings/1`);
    console.log(`Status: ${getResponse.status} ${getResponse.statusText}`);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ GET API working');
      console.log('Response structure:', {
        success: getData.success,
        hasData: !!getData.data,
        dataKeys: getData.data ? Object.keys(getData.data) : []
      });
      
      if (getData.data) {
        console.log('Form settings data:');
        console.log(`  ID: ${getData.data.id}`);
        console.log(`  preset_id: ${getData.data.preset_id}`);
        console.log(`  is_enabled: ${getData.data.is_enabled}`);
        console.log(`  enable_furigana: ${getData.data.enable_furigana}`);
        console.log(`  require_furigana: ${getData.data.require_furigana}`);
        console.log(`  custom_message: ${getData.data.custom_message}`);
      }
    } else {
      const errorText = await getResponse.text();
      console.log('❌ GET API error:');
      console.log(errorText);
    }
    
    // 2. Test POST /api/admin/form-settings (create test record)
    console.log('\n2. Testing POST /api/admin/form-settings...');
    
    const testPostData = {
      preset_id: 999, // Test preset ID
      show_price: true,
      require_phone: true,
      require_furigana: false,
      enable_furigana: false,
      allow_note: true,
      is_enabled: false, // Disabled for testing
      enable_birthday: false,
      enable_gender: false,
      require_address: false,
      custom_message: 'API test record - can be deleted'
    };
    
    const postResponse = await fetch(`${baseUrl}/api/admin/form-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPostData)
    });
    
    console.log(`Status: ${postResponse.status} ${postResponse.statusText}`);
    
    let createdId = null;
    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log('✅ POST API working');
      createdId = postData.data?.id;
      console.log(`Created record ID: ${createdId}`);
    } else {
      const errorText = await postResponse.text();
      console.log('❌ POST API error:');
      console.log(errorText);
    }
    
    // 3. Test PUT /api/admin/form-settings/[id] (update test record)
    if (createdId) {
      console.log(`\n3. Testing PUT /api/admin/form-settings/${createdId}...`);
      
      const testPutData = {
        ...testPostData,
        custom_message: 'Updated via PUT API test',
        require_furigana: true,
        enable_furigana: true
      };
      
      const putResponse = await fetch(`${baseUrl}/api/admin/form-settings/${createdId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPutData)
      });
      
      console.log(`Status: ${putResponse.status} ${putResponse.statusText}`);
      
      if (putResponse.ok) {
        const putData = await putResponse.json();
        console.log('✅ PUT API working');
        console.log(`Updated custom_message: ${putData.data?.custom_message}`);
      } else {
        const errorText = await putResponse.text();
        console.log('❌ PUT API error:');
        console.log(errorText);
      }
      
      // Clean up test record
      console.log('\n4. Cleaning up test record...');
      const { createClient } = require('@supabase/supabase-js');
      
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      await supabaseAdmin
        .from('form_settings')
        .delete()
        .eq('id', createdId);
      
      console.log('✅ Test record cleaned up');
    }
    
    // 4. Test Form API /api/form/1
    console.log('\n5. Testing Form API /api/form/1...');
    
    const formResponse = await fetch(`${baseUrl}/api/form/1`);
    console.log(`Status: ${formResponse.status} ${formResponse.statusText}`);
    
    if (formResponse.ok) {
      const formData = await formResponse.json();
      console.log('✅ Form API working');
      console.log('Form data structure:', {
        success: formData.success,
        hasData: !!formData.data,
        products: formData.data?.products?.length || 0,
        pickupWindows: formData.data?.pickup_windows?.length || 0,
        hasFormSettings: !!formData.data?.form_settings
      });
      
      if (formData.data?.form_settings) {
        const fs = formData.data.form_settings;
        console.log('Form settings in API response:');
        console.log(`  is_enabled: ${fs.is_enabled}`);
        console.log(`  enable_furigana: ${fs.enable_furigana}`);
        console.log(`  require_furigana: ${fs.require_furigana}`);
      }
    } else {
      const errorText = await formResponse.text();
      console.log('❌ Form API error:');
      console.log(errorText);
    }
    
    console.log('\n=== API Test Summary ===');
    console.log('🔧 GET /api/admin/form-settings/1 - Tests reading settings');
    console.log('🔧 POST /api/admin/form-settings - Tests creating settings'); 
    console.log('🔧 PUT /api/admin/form-settings/[id] - Tests updating settings');
    console.log('🔧 GET /api/form/1 - Tests form data for users');
    
    console.log('\n📋 Next Steps:');
    console.log('1. If all APIs return 200, test admin UI');
    console.log('2. If 500 errors persist, check the error details above');
    console.log('3. If columns are missing, run additional SQL');
    console.log('4. Clear browser cache and test admin panel');
    
  } catch (error) {
    console.error('❌ API test error:', error);
  }
}

testApiEndpoints().catch(console.error);