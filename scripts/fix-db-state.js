const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fixDatabaseState() {
  console.log('=== Fixing Database State ===');
  
  // First, get current state
  console.log('\n1. Current database state:');
  
  const { data: presets } = await supabase.from('product_presets').select('*').order('id');
  console.log('Presets:', presets);
  
  const { data: formSettings } = await supabase.from('form_settings').select('*').order('preset_id');
  console.log('Form settings:', formSettings);
  
  const { data: presetProducts } = await supabase.from('preset_products').select('preset_id, product_id').order('preset_id');
  console.log('Preset products:', presetProducts?.length, 'records');
  
  // Check if we need to create standard presets
  const neededPresets = [
    { id: 1, preset_name: '野菜セット' },
    { id: 2, preset_name: '果物セット' },
    { id: 3, preset_name: 'お米セット' }
  ];
  
  console.log('\n2. Creating missing standard presets...');
  
  for (const neededPreset of neededPresets) {
    const existingPreset = presets?.find(p => p.id === neededPreset.id);
    
    if (!existingPreset) {
      console.log(`Creating preset ${neededPreset.id}: ${neededPreset.preset_name}`);
      
      // Try to create the preset
      const { data: newPreset, error: presetError } = await supabase
        .from('product_presets')
        .upsert({
          id: neededPreset.id,
          preset_name: neededPreset.preset_name
        })
        .select()
        .single();
      
      if (presetError) {
        console.error(`Error creating preset ${neededPreset.id}:`, presetError);
      } else {
        console.log(`Created preset ${neededPreset.id} successfully`);
        
        // Create form_settings for this preset
        const { error: settingsError } = await supabase
          .from('form_settings')
          .upsert({
            preset_id: neededPreset.id,
            show_price: true,
            require_address: false,
            enable_gender: false,
            enable_birthday: false,
            enable_furigana: true,
            is_enabled: true
          });
        
        if (settingsError) {
          console.error(`Error creating form_settings for preset ${neededPreset.id}:`, settingsError);
        } else {
          console.log(`Created form_settings for preset ${neededPreset.id}`);
        }
      }
    } else {
      console.log(`Preset ${neededPreset.id} already exists: ${existingPreset.preset_name}`);
      
      // Ensure form_settings exists
      const existingSettings = formSettings?.find(s => s.preset_id === neededPreset.id);
      if (!existingSettings) {
        const { error: settingsError } = await supabase
          .from('form_settings')
          .upsert({
            preset_id: neededPreset.id,
            show_price: true,
            require_address: false,
            enable_gender: false,
            enable_birthday: false,
            enable_furigana: true,
            is_enabled: true
          });
        
        if (settingsError) {
          console.error(`Error creating form_settings for existing preset ${neededPreset.id}:`, settingsError);
        } else {
          console.log(`Created missing form_settings for preset ${neededPreset.id}`);
        }
      }
    }
  }
  
  // Also ensure form_settings exists for preset 11 (current active preset)
  if (presets?.some(p => p.id === 11)) {
    const settings11 = formSettings?.find(s => s.preset_id === 11);
    if (!settings11) {
      console.log('Creating form_settings for preset 11...');
      const { error: settingsError } = await supabase
        .from('form_settings')
        .upsert({
          preset_id: 11,
          show_price: true,
          require_address: false,
          enable_gender: false,
          enable_birthday: false,
          enable_furigana: true,
          is_enabled: true
        });
      
      if (settingsError) {
        console.error('Error creating form_settings for preset 11:', settingsError);
      } else {
        console.log('Created form_settings for preset 11');
      }
    }
  }
  
  console.log('\n3. Final state check:');
  const { data: finalPresets } = await supabase.from('product_presets').select('*').order('id');
  const { data: finalSettings } = await supabase.from('form_settings').select('*').order('preset_id');
  
  console.log('Final presets:', finalPresets?.map(p => `${p.id}: ${p.preset_name}`));
  console.log('Final form_settings:', finalSettings?.map(s => `preset_id: ${s.preset_id}, enabled: ${s.is_enabled}`));
}

fixDatabaseState().catch(console.error);