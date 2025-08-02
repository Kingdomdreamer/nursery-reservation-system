const { DatabaseService } = require('../src/lib/services/DatabaseService');
require('dotenv').config({ path: '.env.local' });

async function testAPIEndpoint() {
  console.log('=== Testing DatabaseService.getFormConfig directly ===');
  
  // Test preset 11 (existing)
  console.log('\n1. Testing preset 11 (should work):');
  try {
    const config11 = await DatabaseService.getFormConfig(11);
    if (config11) {
      console.log('✅ Preset 11 SUCCESS');
      console.log('- Form settings:', !!config11.form_settings);
      console.log('- Products count:', config11.products.length);
      console.log('- Pickup windows count:', config11.pickup_windows.length);
      console.log('- Preset name:', config11.preset.preset_name);
      console.log('- Product names:', config11.products.map(p => p.name));
    } else {
      console.log('❌ Preset 11 FAILED: No config returned');
    }
  } catch (err) {
    console.error('❌ Preset 11 ERROR:', err.message);
  }
  
  // Test preset 1 (non-existing)
  console.log('\n2. Testing preset 1 (should fail gracefully):');
  try {
    const config1 = await DatabaseService.getFormConfig(1);
    if (config1) {
      console.log('✅ Preset 1 SUCCESS (unexpected)');
    } else {
      console.log('✅ Preset 1 FAILED as expected (preset doesn\'t exist)');
    }
  } catch (err) {
    console.error('❌ Preset 1 ERROR:', err.message);
  }
  
  // Test preset 999 (definitely non-existing)
  console.log('\n3. Testing preset 999 (should fail gracefully):');
  try {
    const config999 = await DatabaseService.getFormConfig(999);
    if (config999) {
      console.log('❌ Preset 999 SUCCESS (unexpected)');
    } else {
      console.log('✅ Preset 999 FAILED as expected (preset doesn\'t exist)');
    }
  } catch (err) {
    console.error('❌ Preset 999 ERROR:', err.message);
  }
}

testAPIEndpoint().catch(console.error);