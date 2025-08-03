// Test the actual API response to see what's being returned to the frontend
async function testApiResponse() {
  console.log('=== Testing Form API Response ===');
  
  try {
    console.log('Testing form API for preset 6...');
    const response = await fetch('http://localhost:3001/api/form/6');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return;
    }
    
    const data = await response.json();
    console.log('API Response Status:', response.status);
    console.log('Success:', data.success);
    
    if (data.success && data.data) {
      const config = data.data;
      
      console.log('\n=== Form Configuration ===');
      console.log('Form settings exists:', !!config.form_settings);
      console.log('Products count:', config.products?.length || 0);
      console.log('Pickup windows count:', config.pickup_windows?.length || 0);
      console.log('Preset name:', config.preset?.preset_name);
      
      if (config.products && config.products.length > 0) {
        console.log('\n=== Products from API ===');
        config.products.forEach((product, index) => {
          console.log(`${index + 1}. ID:${product.id} ${product.name} - ¥${product.price} (visible: ${product.visible})`);
        });
      } else {
        console.log('\n❌ No products returned from API - this is the issue!');
      }
      
      if (config.pickup_windows && config.pickup_windows.length > 0) {
        console.log('\n=== Pickup Windows from API ===');
        config.pickup_windows.slice(0, 3).forEach((window, index) => {
          console.log(`${index + 1}. Window ${window.id}`);
          console.log(`   Product ID: ${window.product_id}`);
          console.log(`   Has product data: ${!!window.product}`);
          if (window.product) {
            console.log(`   Product: ${window.product.name} - ¥${window.product.price}`);
          }
          console.log(`   Time: ${window.pickup_start} - ${window.pickup_end}`);
        });
      }
      
    } else {
      console.error('❌ API response was not successful');
      console.log('Full response:', data);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testApiResponse().catch(console.error);