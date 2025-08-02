const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function configureExistingPreset() {
  // Work with preset 6 since it exists
  const presetId = 6;
  
  // Check and create form_settings
  const { data: existingSettings } = await supabase
    .from('form_settings')
    .select('*')
    .eq('preset_id', presetId)
    .single();
    
  if (!existingSettings) {
    const formSettings = {
      preset_id: presetId,
      show_price: true,
      require_address: false,
      enable_gender: false,
      enable_birthday: false,
      enable_furigana: true,
      is_enabled: true
    };
    
    const { error: formError } = await supabase.from('form_settings').upsert(formSettings);
    if (formError) {
      console.error('Error creating form_settings:', formError);
    } else {
      console.log('Created form_settings for preset 6');
    }
  } else {
    console.log('Form settings already exist for preset 6');
  }
  
  // Check pickup_windows
  const { data: windows } = await supabase
    .from('pickup_windows')
    .select('*')
    .eq('preset_id', presetId);
    
  console.log('Pickup windows for preset 6:', windows);
  
  if (!windows || windows.length === 0) {
    // Create some basic pickup windows
    const pickupWindows = [
      {
        preset_id: presetId,
        pickup_start: '2025-08-10 09:00:00',
        pickup_end: '2025-08-10 12:00:00'
      },
      {
        preset_id: presetId,
        pickup_start: '2025-08-10 13:00:00',
        pickup_end: '2025-08-10 17:00:00'
      }
    ];
    
    for (const window of pickupWindows) {
      const { error } = await supabase.from('pickup_windows').insert(window);
      if (error) {
        console.error('Error creating pickup window:', error);
      } else {
        console.log('Created pickup window:', window);
      }
    }
  }
  
  // Show preset products
  const { data: presetProducts } = await supabase
    .from('preset_products')
    .select('*')
    .eq('preset_id', presetId);
    
  console.log('Preset products for preset 6:', presetProducts?.length || 0, 'products');
}

configureExistingPreset().catch(console.error);