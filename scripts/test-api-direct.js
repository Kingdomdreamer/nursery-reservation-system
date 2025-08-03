const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testApiDirectly() {
  console.log('=== Testing API Directly ===');
  
  // Test the same query that the API would make
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  console.log('1. Testing form_settings query for preset 6...');
  try {
    const { data: formSettingsArray, error: settingsError } = await supabase
      .from('form_settings')
      .select('*')
      .eq('preset_id', 6)
      .eq('is_enabled', true);

    console.log('Form settings result:', formSettingsArray);
    console.log('Form settings error:', settingsError);
    
    if (formSettingsArray && formSettingsArray.length > 0) {
      console.log('✅ Form settings found successfully!');
      
      // Test the full API endpoint logic
      console.log('\n2. Testing full preset lookup...');
      
      // Get preset info
      const { data: preset, error: presetError } = await supabase
        .from('product_presets')
        .select('*')
        .eq('id', 6)
        .single();

      console.log('Preset result:', preset);
      console.log('Preset error:', presetError);
      
      if (preset) {
        console.log('✅ The form config API should now work!');
        console.log('✅ The 406 error should be resolved.');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testApiDirectly().catch(console.error);