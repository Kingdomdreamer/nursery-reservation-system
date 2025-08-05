const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzePickupWindows() {
  console.log('=== Analyzing pickup_windows Table ===');
  
  try {
    // Check pickup_windows table structure and data
    console.log('1. All pickup_windows records:');
    const { data: pickupWindows, error: pwError } = await supabaseAdmin
      .from('pickup_windows')
      .select('*')
      .order('created_at');
    
    console.log('Pickup windows:', pickupWindows);
    console.log('Pickup windows error:', pwError);
    
    // Check pickup_windows for preset 6
    console.log('\n2. Pickup windows for preset 6:');
    const { data: preset6Windows, error: preset6Error } = await supabaseAdmin
      .from('pickup_windows')
      .select('*')
      .eq('preset_id', 6)
      .order('pickup_start');
    
    console.log('Preset 6 windows:', preset6Windows);
    console.log('Preset 6 error:', preset6Error);
    
    // Check products table
    console.log('\n3. Sample products:');
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, category_id, price, visible')
      .eq('visible', true)
      .limit(5);
    
    console.log('Sample products:', products);
    console.log('Products error:', productsError);
    
    // Check current preset_products relationships
    console.log('\n4. Current preset_products for preset 6:');
    const { data: presetProducts, error: ppError } = await supabaseAdmin
      .from('preset_products')
      .select(`
        *,
        product:products(id, name, price, category_id)
      `)
      .eq('preset_id', 6)
      .eq('is_active', true);
    
    console.log('Preset products:', presetProducts);
    console.log('Preset products error:', ppError);
    
  } catch (error) {
    console.error('Analysis error:', error);
  }
}

analyzePickupWindows().catch(console.error);