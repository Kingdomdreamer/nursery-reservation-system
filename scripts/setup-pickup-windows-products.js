const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupPickupWindowsProducts() {
  console.log('=== Setting up pickup_windows with product relationships ===');
  
  try {
    // Get existing products for preset 6
    const { data: presetProducts, error: ppError } = await supabaseAdmin
      .from('preset_products')
      .select('product_id')
      .eq('preset_id', 6)
      .eq('is_active', true)
      .order('display_order');
    
    if (ppError) {
      console.error('Error fetching preset products:', ppError);
      return;
    }
    
    console.log('Found preset products:', presetProducts);
    
    // Get existing pickup windows for preset 6
    const { data: pickupWindows, error: pwError } = await supabaseAdmin
      .from('pickup_windows')
      .select('*')
      .eq('preset_id', 6)
      .order('pickup_start');
    
    if (pwError) {
      console.error('Error fetching pickup windows:', pwError);
      return;
    }
    
    console.log('Found pickup windows:', pickupWindows);
    
    // Clear existing pickup windows to avoid duplicates
    console.log('\n1. Clearing existing pickup windows...');
    const { error: deleteError } = await supabaseAdmin
      .from('pickup_windows')
      .delete()
      .eq('preset_id', 6);
    
    if (deleteError) {
      console.error('Error deleting pickup windows:', deleteError);
      return;
    }
    
    // Create new pickup windows with product relationships
    console.log('\n2. Creating pickup windows with product relationships...');
    
    const newPickupWindows = [];
    const baseDateTime = '2025-08-10';
    
    // For each product, create pickup windows
    for (let i = 0; i < presetProducts.length; i++) {
      const product = presetProducts[i];
      const productId = product.product_id;
      
      // Get product details
      const { data: productDetails, error: productError } = await supabaseAdmin
        .from('products')
        .select('name, price')
        .eq('id', productId)
        .single();
      
      if (productError) {
        console.error(`Error fetching product ${productId}:`, productError);
        continue;
      }
      
      console.log(`Creating windows for product: ${productDetails.name}`);
      
      // Create morning pickup window
      newPickupWindows.push({
        preset_id: 6,
        product_id: productId,
        pickup_start: `${baseDateTime}T09:00:00+00:00`,
        pickup_end: `${baseDateTime}T12:00:00+00:00`,
        price: productDetails.price,
        comment: `${productDetails.name} - 午前中受け取り`,
        variation: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      // Create afternoon pickup window
      newPickupWindows.push({
        preset_id: 6,
        product_id: productId,
        pickup_start: `${baseDateTime}T13:00:00+00:00`,
        pickup_end: `${baseDateTime}T17:00:00+00:00`,
        price: productDetails.price,
        comment: `${productDetails.name} - 午後受け取り`,
        variation: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      // Create next day morning window
      const nextDay = '2025-08-11';
      newPickupWindows.push({
        preset_id: 6,
        product_id: productId,
        pickup_start: `${nextDay}T09:00:00+00:00`,
        pickup_end: `${nextDay}T12:00:00+00:00`,
        price: productDetails.price,
        comment: `${productDetails.name} - 翌日午前受け取り`,
        variation: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    console.log(`\n3. Inserting ${newPickupWindows.length} pickup windows...`);
    
    const { data: insertedWindows, error: insertError } = await supabaseAdmin
      .from('pickup_windows')
      .insert(newPickupWindows)
      .select();
    
    if (insertError) {
      console.error('Error inserting pickup windows:', insertError);
      return;
    }
    
    console.log('✅ Successfully created pickup windows with product relationships');
    console.log(`Inserted ${insertedWindows.length} pickup windows`);
    
    // Verify the result
    console.log('\n4. Verification - Fetching updated pickup windows...');
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('pickup_windows')
      .select(`
        *,
        product:products(id, name, price)
      `)
      .eq('preset_id', 6)
      .order('pickup_start, product_id');
    
    if (verifyError) {
      console.error('Verification error:', verifyError);
    } else {
      console.log('Verification result:', verifyData);
    }
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupPickupWindowsProducts().catch(console.error);