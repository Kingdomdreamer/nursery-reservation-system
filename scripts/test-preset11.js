const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testApiLogic() {
  console.log('=== Testing API Logic for Preset 11 ===');
  
  const presetId = 11;
  
  try {
    // Simulate the DatabaseService.getFormConfig logic exactly
    console.log('Fetching form config for preset:', presetId);
    
    // Get form settings
    const { data: formSettingsArray, error: settingsError } = await supabase
      .from('form_settings')
      .select('*')
      .eq('preset_id', presetId)
      .eq('is_enabled', true);

    const formSettings = formSettingsArray?.[0] || null;

    console.log('Form settings query result:', { formSettings, settingsError });

    if (settingsError) {
      console.error('Supabase query error details:', {
        message: settingsError.message,
        code: settingsError.code,
        details: settingsError.details,
        hint: settingsError.hint
      });
      return;
    }

    if (!formSettings) {
      console.warn('No form settings found for preset:', presetId, 'with is_enabled=true');
      // プリセット自体が存在するかチェック
      const { data: presetExists } = await supabase
        .from('product_presets')
        .select('id')
        .eq('id', presetId)
        .single();
      
      if (!presetExists) {
        console.error('Preset does not exist:', presetId);
      }
      return;
    }

    // Get pickup windows
    const { data: pickupWindows, error: windowsError } = await supabase
      .from('pickup_windows')
      .select('*')
      .eq('preset_id', presetId)
      .order('pickup_start');

    console.log('Pickup windows:', pickupWindows, 'Error:', windowsError);

    // Get preset info
    const { data: preset, error: presetError } = await supabase
      .from('product_presets')
      .select('*')
      .eq('id', presetId)
      .single();

    console.log('Preset:', preset, 'Error:', presetError);

    // Get preset_products relationships
    const { data: presetProductsData, error: presetProductsError } = await supabase
      .from('preset_products')
      .select('product_id, display_order')
      .eq('preset_id', presetId)
      .eq('is_active', true)
      .order('display_order');

    console.log('Preset products:', presetProductsData?.length, 'Error:', presetProductsError);

    // Get product IDs from the preset_products
    const productIds = (presetProductsData || []).map(pp => pp.product_id);
    
    console.log(`Found ${productIds.length} product IDs for preset ${presetId}:`, productIds);

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

    console.log('Products:', productsData?.length, 'Error:', productsError);

    if (productsData && productsData.length > 0) {
      console.log('SUCCESS: Found', productsData.length, 'products for preset', presetId);
      console.log('Products:', productsData.map(p => p.name));
    } else {
      console.log('No visible products found for preset', presetId);
    }

  } catch (error) {
    console.error('Error in test:', error);
  }
}

testApiLogic().catch(console.error);