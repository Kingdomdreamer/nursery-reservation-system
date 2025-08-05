const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkPreset6() {
  console.log('=== Checking Preset 6 Configuration ===');
  
  // 1. Check if preset exists
  console.log('1. Checking if preset 6 exists...');
  const { data: preset, error: presetError } = await supabase
    .from('product_presets')
    .select('*')
    .eq('id', 6)
    .single();
  
  console.log('Preset 6:', preset);
  console.log('Preset Error:', presetError);
  
  // 2. Check form_settings for preset 6
  console.log('\n2. Checking form_settings for preset 6...');
  const { data: formSettings, error: formError } = await supabase
    .from('form_settings')
    .select('*')
    .eq('preset_id', 6);
  
  console.log('Form settings:', formSettings);
  console.log('Form Error:', formError);
  
  // 3. Check preset_products for preset 6
  console.log('\n3. Checking preset_products for preset 6...');
  const { data: presetProducts, error: ppError } = await supabase
    .from('preset_products')
    .select('*')
    .eq('preset_id', 6);
  
  console.log('Preset products:', presetProducts);
  console.log('Preset products Error:', ppError);
  
  // 4. Check pickup_windows for preset 6
  console.log('\n4. Checking pickup_windows for preset 6...');
  const { data: pickupWindows, error: pwError } = await supabase
    .from('pickup_windows')
    .select('*')
    .eq('preset_id', 6);
  
  console.log('Pickup windows:', pickupWindows);
  console.log('Pickup windows Error:', pwError);
  
  // 5. Check what form_settings exist in general
  console.log('\n5. Checking all form_settings...');
  const { data: allFormSettings, error: allError } = await supabase
    .from('form_settings')
    .select('*');
  
  console.log('All form settings count:', allFormSettings?.length || 0);
  console.log('All form settings:', allFormSettings);
  console.log('All form settings Error:', allError);
}

checkPreset6().catch(console.error);