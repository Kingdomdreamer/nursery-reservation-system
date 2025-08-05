async function testUpdatedFormConfig() {
  console.log('=== Testing Updated Form Config API ===');
  
  try {
    console.log('Testing form config API for preset 6...');
    const response = await fetch('http://localhost:3000/api/form/6');
    
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
        console.log('\n=== Products from pickup_windows ===');
        config.products.forEach((product, index) => {
          console.log(`${index + 1}. ${product.name} - ¥${product.price}`);
        });
      }
      
      if (config.pickup_windows && config.pickup_windows.length > 0) {
        console.log('\n=== Pickup Windows ===');
        config.pickup_windows.forEach((window, index) => {
          console.log(`${index + 1}. ${window.pickup_start} - ${window.pickup_end}`);
          console.log(`   Product: ${window.product?.name || 'None'}`);
          console.log(`   Price: ¥${window.price || 'N/A'}`);
          console.log(`   Comment: ${window.comment || 'N/A'}`);
        });
      }
      
      console.log('\n✅ Form config is working with pickup_windows products!');
    } else {
      console.error('❌ API response was not successful');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testUpdatedFormConfig().catch(console.error);