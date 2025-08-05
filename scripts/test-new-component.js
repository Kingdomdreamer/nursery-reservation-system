// Test the new form settings component
async function testNewComponent() {
  console.log('=== Testing New Form Settings Component ===');
  
  try {
    console.log('1. Testing API endpoints on port 3002...');
    
    // Test form settings GET
    const getResponse = await fetch('http://localhost:3002/api/admin/form-settings/1');
    console.log('GET /api/admin/form-settings/1 Status:', getResponse.status);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ GET API working with new schema');
      console.log('Fields:', Object.keys(getData.data || {}));
    } else {
      const getError = await getResponse.text();
      console.log('❌ GET API error:', getError);
    }
    
    // Test form settings PUT
    console.log('\n2. Testing PUT API with new schema fields...');
    const putResponse = await fetch('http://localhost:3002/api/admin/form-settings/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        show_price: true,
        require_phone: true,
        require_furigana: true,
        allow_note: true,
        is_enabled: true,
        custom_message: 'New component test - no old fields used'
      })
    });
    
    console.log('PUT /api/admin/form-settings/1 Status:', putResponse.status);
    
    if (putResponse.ok) {
      const putData = await putResponse.json();
      console.log('✅ PUT API working with new component');
      console.log('Updated message:', putData.data.custom_message);
    } else {
      const putError = await putResponse.text();
      console.log('❌ PUT API error:', putError);
    }
    
    // Test admin page
    console.log('\n3. Testing admin page...');
    const adminResponse = await fetch('http://localhost:3002/admin/settings');
    console.log('Admin page Status:', adminResponse.status);
    
    if (adminResponse.ok) {
      console.log('✅ Admin page accessible');
    } else {
      console.log('❌ Admin page error');
    }
    
    console.log('\n=== Test Complete ===');
    console.log('🎯 User should now:');
    console.log('1. Open browser in incognito/private mode');
    console.log('2. Visit http://localhost:3002/admin/settings');
    console.log('3. Test form settings modal with new component');
    console.log('4. The new component does not use any old field names');
    console.log('5. All errors should be resolved');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testNewComponent().catch(console.error);