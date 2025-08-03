const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugProductSelection() {
  console.log('=== Product Selection Debug for Preset 6 ===');
  
  // 1. Check preset_products for preset_id=6
  console.log('1. Checking preset_products for preset_id=6...');
  const { data: presetProducts, error: ppError } = await supabase
    .from('preset_products')
    .select('*')
    .eq('preset_id', 6)
    .eq('is_active', true);
  
  console.log('Preset products:', presetProducts);
  console.log('Preset products error:', ppError);
  
  // 2. Check all products available
  console.log('\n2. Checking all visible products...');
  const { data: allProducts, error: allError } = await supabase
    .from('products')
    .select('id, name, visible')
    .eq('visible', true)
    .limit(10);
  
  console.log('All visible products:', allProducts);
  console.log('All products error:', allError);
  
  // 3. Check what the API would return for preset 6
  console.log('\n3. Testing API response simulation...');
  try {
    // Get form settings
    const { data: formSettingsArray } = await supabase
      .from('form_settings')
      .select('*')
      .eq('preset_id', 6)
      .eq('is_enabled', true);

    const formSettings = formSettingsArray?.[0];
    
    // Get preset_products relationships
    const { data: presetProductsData } = await supabase
      .from('preset_products')
      .select('product_id, display_order')
      .eq('preset_id', 6)
      .eq('is_active', true)
      .order('display_order');

    console.log('Form settings:', formSettings);
    console.log('Preset products data:', presetProductsData);

    // Get product IDs from the preset_products
    const productIds = (presetProductsData || []).map(pp => pp.product_id);
    console.log('Product IDs for preset 6:', productIds);

    if (productIds.length === 0) {
      console.log('❌ No products associated with preset 6!');
      console.log('This explains why no products are showing in the selection.');
      return false;
    }

    // Get the actual product data
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('visible', true)
      .order('name');

    console.log('Products for preset 6:', productsData);
    
    if (!productsData || productsData.length === 0) {
      console.log('❌ No visible products found for the associated product IDs!');
      return false;
    }
    
    console.log('✅ Products should be available for selection');
    return true;
    
  } catch (error) {
    console.error('API simulation error:', error);
    return false;
  }
}

debugProductSelection().then(success => {
  if (!success) {
    console.log('\n=== SOLUTION NEEDED ===');
    console.log('Need to create product associations for preset 6');
  }
}).catch(console.error);