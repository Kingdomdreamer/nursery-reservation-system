// Debug form settings API error
async function debugFormSettingsError() {
  console.log('=== Debugging Form Settings API Error ===');
  
  try {
    // Test GET request
    console.log('1. Testing GET /api/admin/form-settings/1');
    const getResponse = await fetch('http://localhost:3001/api/admin/form-settings/1');
    
    console.log('GET Response status:', getResponse.status);
    const getText = await getResponse.text();
    console.log('GET Response text:', getText);
    
    if (getResponse.status === 500) {
      console.log('500 error detected - checking for schema issues');
    }
    
    // Test with preset ID 6 instead
    console.log('\n2. Testing GET /api/admin/form-settings/6 (preset_id)');
    const getPresetResponse = await fetch('http://localhost:3001/api/admin/form-settings/6');
    
    console.log('GET Preset Response status:', getPresetResponse.status);
    const getPresetText = await getPresetResponse.text();
    console.log('GET Preset Response text:', getPresetText);
    
    // Test PUT with minimal data
    if (getPresetResponse.ok) {
      console.log('\n3. Testing PUT with minimal data');
      const putResponse = await fetch('http://localhost:3001/api/admin/form-settings/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          show_price: true,
          require_phone: true,
          require_furigana: true,
          allow_note: true,
          is_enabled: true
        })
      });
      
      console.log('PUT Response status:', putResponse.status);
      const putText = await putResponse.text();
      console.log('PUT Response text:', putText);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugFormSettingsError().catch(console.error);