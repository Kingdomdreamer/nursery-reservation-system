const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testFormSettingsAPI() {
  console.log('=== Testing Form Settings API ===');
  
  try {
    // Test GET request
    console.log('1. Testing GET /api/admin/form-settings/1');
    const getResponse = await fetch('http://localhost:3000/api/admin/form-settings/1');
    
    console.log('GET Response Status:', getResponse.status);
    console.log('GET Response Headers:', Object.fromEntries(getResponse.headers.entries()));
    
    const responseText = await getResponse.text();
    console.log('GET Response Text:', responseText);
    
    let getData;
    try {
      getData = JSON.parse(responseText);
      console.log('GET Response Data:', getData);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      return;
    }
    
    if (getResponse.status === 200) {
      // Test PUT request with valid data
      console.log('\n2. Testing PUT /api/admin/form-settings/1');
      const updateData = {
        show_price: true,
        require_phone: true,
        require_furigana: true,
        allow_note: true,
        is_enabled: true,
        custom_message: 'Test message'
      };
      
      const putResponse = await fetch('http://localhost:3000/api/admin/form-settings/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      
      const putData = await putResponse.json();
      
      console.log('PUT Response Status:', putResponse.status);
      console.log('PUT Response Data:', putData);
    }
    
    // Test with invalid old schema data (should fail)
    console.log('\n3. Testing PUT with old schema (should fail)');
    const invalidData = {
      show_price: true,
      enable_birthday: false,  // This should cause error
      enable_gender: false,
      require_address: false
    };
    
    const invalidResponse = await fetch('http://localhost:3000/api/admin/form-settings/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData)
    });
    
    const invalidResponseData = await invalidResponse.json();
    
    console.log('Invalid PUT Response Status:', invalidResponse.status);
    console.log('Invalid PUT Response Data:', invalidResponseData);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testFormSettingsAPI().catch(console.error);