async function testFormApi() {
  console.log('=== Testing Form API Response ===');
  
  try {
    console.log('Fetching form config for preset 6...');
    const response = await fetch('http://localhost:3000/api/form/6');
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    console.log('\n=== Detailed Analysis ===');
    console.log('Success:', data.success);
    console.log('Has data:', !!data.data);
    
    if (data.data) {
      console.log('Form settings exists:', !!data.data.form_settings);
      console.log('Products type:', typeof data.data.products);
      console.log('Products is array:', Array.isArray(data.data.products));
      console.log('Products length:', data.data.products?.length || 0);
      console.log('Pickup windows length:', data.data.pickup_windows?.length || 0);
      console.log('Preset info:', data.data.preset);
      
      if (data.data.products && data.data.products.length > 0) {
        console.log('First product:', data.data.products[0]);
      }
    }
    
  } catch (error) {
    console.error('Request error:', error);
  }
}

testFormApi().catch(console.error);