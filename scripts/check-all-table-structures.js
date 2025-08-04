// Check all database table structures
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAllTableStructures() {
  console.log('=== Checking All Database Table Structures ===');
  
  try {
    // 1. Check form_settings table structure
    console.log('\n1. Checking form_settings table structure...');
    const { data: formSettings, error: formError } = await supabase
      .from('form_settings')
      .select('*')
      .limit(1);
    
    if (formError) {
      console.error('form_settings error:', formError);
    } else if (formSettings && formSettings.length > 0) {
      console.log('form_settings columns:', Object.keys(formSettings[0]));
      console.log('Sample data:', formSettings[0]);
    } else {
      console.log('form_settings table is empty');
    }
    
    // 2. Check product_presets table structure
    console.log('\n2. Checking product_presets table structure...');
    const { data: presets, error: presetsError } = await supabase
      .from('product_presets')
      .select('*')
      .limit(1);
    
    if (presetsError) {
      console.error('product_presets error:', presetsError);
    } else if (presets && presets.length > 0) {
      console.log('product_presets columns:', Object.keys(presets[0]));
      console.log('Sample data:', presets[0]);
    } else {
      console.log('product_presets table is empty');
    }
    
    // 3. Check products table structure
    console.log('\n3. Checking products table structure...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (productsError) {
      console.error('products error:', productsError);
    } else if (products && products.length > 0) {
      console.log('products columns:', Object.keys(products[0]));
      console.log('Sample data:', products[0]);
    } else {
      console.log('products table is empty');
    }
    
    // 4. Check pickup_windows table structure
    console.log('\n4. Checking pickup_windows table structure...');
    const { data: windows, error: windowsError } = await supabase
      .from('pickup_windows')
      .select('*')
      .limit(1);
    
    if (windowsError) {
      console.error('pickup_windows error:', windowsError);
    } else if (windows && windows.length > 0) {
      console.log('pickup_windows columns:', Object.keys(windows[0]));
      console.log('Sample data:', windows[0]);
    } else {
      console.log('pickup_windows table is empty');
    }
    
    // 5. Check preset_products table structure
    console.log('\n5. Checking preset_products table structure...');
    const { data: presetProducts, error: presetProductsError } = await supabase
      .from('preset_products')
      .select('*')
      .limit(1);
    
    if (presetProductsError) {
      console.error('preset_products error:', presetProductsError);
    } else if (presetProducts && presetProducts.length > 0) {
      console.log('preset_products columns:', Object.keys(presetProducts[0]));
      console.log('Sample data:', presetProducts[0]);
    } else {
      console.log('preset_products table is empty');
    }
    
    // 6. Check reservations table structure
    console.log('\n6. Checking reservations table structure...');
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('*')
      .limit(1);
    
    if (reservationsError) {
      console.error('reservations error:', reservationsError);
    } else if (reservations && reservations.length > 0) {
      console.log('reservations columns:', Object.keys(reservations[0]));
      console.log('Sample data:', reservations[0]);
    } else {
      console.log('reservations table is empty');
    }
    
    // 7. Test specific form_settings queries
    console.log('\n7. Testing form_settings queries...');
    
    // Test GET by ID
    const { data: formById, error: formByIdError } = await supabase
      .from('form_settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    console.log('GET by ID result:', formByIdError ? 'Error: ' + formByIdError.message : 'Success');
    if (formById) {
      console.log('Data:', formById);
    }
    
    // Test GET by preset_id
    const { data: formByPreset, error: formByPresetError } = await supabase
      .from('form_settings')
      .select('*')
      .eq('preset_id', 6)
      .single();
    
    console.log('GET by preset_id result:', formByPresetError ? 'Error: ' + formByPresetError.message : 'Success');
    if (formByPreset) {
      console.log('Data:', formByPreset);
    }
    
    console.log('\n=== Analysis Complete ===');
    
  } catch (error) {
    console.error('Check error:', error);
  }
}

checkAllTableStructures().catch(console.error);