const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testGetFormConfig() {
  console.log('=== Testing DatabaseService.getFormConfig for preset 10 ===');
  
  const presetId = 10;
  
  // Simulate the DatabaseService.getFormConfig logic
  console.log('Fetching form config for preset:', presetId);
  
  // Get form settings
  const { data: formSettingsArray, error: settingsError } = await supabase
    .from('form_settings')
    .select('*')
    .eq('preset_id', presetId)
    .eq('is_enabled', true);

  const formSettings = formSettingsArray?.[0] || null;
  console.log('Form settings:', formSettings);

  if (!formSettings) {
    console.log('No form settings found for preset:', presetId);
    return;
  }

  // Get preset_products relationships
  const { data: presetProductsData, error: presetProductsError } = await supabase
    .from('preset_products')
    .select('product_id, display_order')
    .eq('preset_id', presetId)
    .eq('is_active', true)
    .order('display_order');

  console.log('Preset products data:', presetProductsData);

  if (presetProductsError) {
    console.error('Error fetching preset products:', presetProductsError);
    return;
  }

  // Get product IDs from the preset_products
  const productIds = (presetProductsData || []).map(pp => pp.product_id);
  
  console.log(`Found ${productIds.length} product IDs for preset ${presetId}:`, productIds);

  // If no products are associated with this preset, return empty array
  if (productIds.length === 0) {
    console.warn(`No products associated with preset ${presetId}`);
    return;
  }

  // Get the actual product data
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('visible', true)
    .order('name');

  console.log('Products data:', productsData);

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return;
  }

  // Sort products according to display_order from preset_products
  const sortedProducts = (productsData || []).sort((a, b) => {
    const aOrder = Number(presetProductsData?.find(pp => pp.product_id === a.id)?.display_order) || 999;
    const bOrder = Number(presetProductsData?.find(pp => pp.product_id === b.id)?.display_order) || 999;
    return aOrder - bOrder;
  });

  console.log(`Found ${sortedProducts.length} products for preset ${presetId}:`);
  sortedProducts.forEach(p => console.log(`- ID: ${p.id}, Name: ${p.name}, Price: ${p.price}`));
}

testGetFormConfig().catch(console.error);