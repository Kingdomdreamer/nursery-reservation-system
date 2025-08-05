// Test script to identify data linkage issues between database and product selection
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDataLinkage() {
  console.log('=== Testing Data Linkage Issues for Preset 6 ===');
  
  try {
    // 1. Test current API response
    console.log('\n1. Testing current API response...');
    
    // Simulate the DatabaseService.getFormConfig method
    const presetId = 6;
    
    // Get form settings
    const { data: formSettingsArray, error: settingsError } = await supabase
      .from('form_settings')
      .select('*')
      .eq('preset_id', presetId)
      .eq('is_enabled', true);

    const formSettings = formSettingsArray?.[0] || null;
    console.log('Form settings:', formSettings ? 'Found' : 'Not found');
    if (settingsError) console.error('Settings error:', settingsError);

    // Get pickup windows with product information
    const { data: pickupWindows, error: windowsError } = await supabase
      .from('pickup_windows')
      .select(`
        *,
        product:products(
          id,
          name,
          category_id,
          price,
          visible
        )
      `)
      .eq('preset_id', presetId)
      .not('product_id', 'is', null)
      .order('pickup_start, product_id');

    console.log('Pickup windows result:', {
      count: pickupWindows?.length || 0,
      error: windowsError?.message || 'None'
    });

    if (pickupWindows && pickupWindows.length > 0) {
      console.log('\n2. Pickup Windows with Product Info:');
      pickupWindows.forEach((window, index) => {
        console.log(`${index + 1}. Window ${window.id}:`);
        console.log(`   Product ID: ${window.product_id}`);
        console.log(`   Product info: ${window.product ? 'Found' : 'NULL'}`);
        if (window.product) {
          console.log(`   Product name: ${window.product.name}`);
          console.log(`   Product price: ¥${window.product.price}`);
        }
        console.log(`   Window price: ¥${window.price}`);
        console.log(`   Time: ${window.pickup_start} - ${window.pickup_end}`);
      });

      // Extract unique products like the real code does
      const productsFromWindows = new Map();
      
      pickupWindows.forEach(window => {
        if (window.product && window.product_id && typeof window.product === 'object' && 'id' in window.product) {
          const product = window.product;
          if (product.visible !== false) {
            productsFromWindows.set(product.id, {
              ...product,
              price: window.price || product.price
            });
          }
        }
      });

      const uniqueProducts = Array.from(productsFromWindows.values());
      
      console.log('\n3. Extracted Unique Products:');
      uniqueProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - ¥${product.price}`);
      });

      console.log(`\n✅ Should display ${uniqueProducts.length} products in the form`);
    } else {
      console.log('\n❌ No pickup windows found - this explains the connection issue');
    }

    // 3. Test if there are any orphaned pickup_windows
    console.log('\n4. Checking for data consistency...');
    
    const { data: allWindows } = await supabase
      .from('pickup_windows')
      .select('id, preset_id, product_id')
      .eq('preset_id', presetId);
    
    console.log(`Total pickup windows for preset ${presetId}: ${allWindows?.length || 0}`);
    
    if (allWindows) {
      const windowsWithProducts = allWindows.filter(w => w.product_id);
      const windowsWithoutProducts = allWindows.filter(w => !w.product_id);
      
      console.log(`- With product_id: ${windowsWithProducts.length}`);
      console.log(`- Without product_id: ${windowsWithoutProducts.length}`);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testDataLinkage().catch(console.error);