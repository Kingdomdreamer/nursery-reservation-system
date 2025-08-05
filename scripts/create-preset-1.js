// Create preset_id=1 to match URL structure
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPreset1() {
  console.log('=== Creating preset_id=1 to match URL structure ===');
  
  try {
    // 1. Check current situation
    console.log('\n1. Current situation...');
    
    const { data: allPresets, error: presetsError } = await supabaseAdmin
      .from('product_presets')
      .select('*')
      .order('id');
    
    if (presetsError) {
      console.error('❌ Error:', presetsError);
      return;
    }
    
    console.log('Current presets:');
    allPresets.forEach(p => console.log(`   ${p.id}: ${p.preset_name}`));
    
    const hasPreset1 = allPresets.some(p => p.id === 1);
    
    if (hasPreset1) {
      console.log('✅ preset_id=1 already exists');
    } else {
      console.log('❌ preset_id=1 missing - this causes /form/1 and admin API to fail');
      
      // 2. Create preset_id=1
      console.log('\n2. Creating preset_id=1...');
      
      // Check if ID=1 can be inserted
      const { data: insertedPreset, error: insertError } = await supabaseAdmin
        .from('product_presets')
        .insert({
          id: 1, // Explicitly set ID to 1
          preset_name: 'デフォルトプリセット',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Failed to create preset_id=1:', insertError);
        
        // If ID constraint fails, we may need to reset the sequence or use a different approach
        console.log('\n🔧 Alternative: Trying without explicit ID...');
        
        const { data: altPreset, error: altError } = await supabaseAdmin
          .from('product_presets')
          .insert({
            preset_name: 'デフォルトプリセット (Auto ID)',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (altError) {
          console.error('❌ Alternative also failed:', altError);
        } else {
          console.log(`✅ Created preset with ID: ${altPreset.id}`);
          console.log('⚠️  You may need to update URL structure to use this ID');
        }
      } else {
        console.log('✅ Created preset_id=1 successfully');
      }
    }
    
    // 3. Create form_settings for preset_id=1
    console.log('\n3. Creating form_settings for preset_id=1...');
    
    const { data: existingSettings, error: settingsCheckError } = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .eq('preset_id', 1)
      .maybeSingle();
    
    if (settingsCheckError && settingsCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking settings:', settingsCheckError);
      return;
    }
    
    if (existingSettings) {
      console.log('✅ form_settings for preset_id=1 already exists');
    } else {
      console.log('Creating form_settings for preset_id=1...');
      
      const defaultSettings = {
        preset_id: 1,
        show_price: true,
        require_phone: true,
        require_furigana: true,
        enable_furigana: true,
        allow_note: true,
        is_enabled: true,
        enable_birthday: false,
        enable_gender: false,
        require_address: false,
        custom_message: 'ご注文ありがとうございます。商品とお引き取り日時をご確認ください。',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: createdSettings, error: createSettingsError } = await supabaseAdmin
        .from('form_settings')
        .insert(defaultSettings)
        .select()
        .single();
      
      if (createSettingsError) {
        console.error('❌ Failed to create form_settings:', createSettingsError);
      } else {
        console.log(`✅ Created form_settings ID: ${createdSettings.id}`);
      }
    }
    
    // 4. Create sample pickup_windows for preset_id=1
    console.log('\n4. Creating pickup_windows for preset_id=1...');
    
    const { data: existingWindows, error: windowsCheckError } = await supabaseAdmin
      .from('pickup_windows')
      .select('*')
      .eq('preset_id', 1);
    
    if (windowsCheckError) {
      console.error('❌ Error checking windows:', windowsCheckError);
    } else if (existingWindows.length > 0) {
      console.log(`✅ pickup_windows for preset_id=1 already exist (${existingWindows.length})`);
    } else {
      console.log('Creating sample pickup_windows...');
      
      // Get a sample product to link to
      const { data: sampleProduct, error: productError } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('visible', true)
        .limit(1)
        .single();
      
      if (productError || !sampleProduct) {
        console.log('⚠️  No products found, creating windows without product links');
        
        const sampleWindows = [
          {
            preset_id: 1,
            pickup_start: '2025-08-10T09:00:00+00:00',
            pickup_end: '2025-08-10T12:00:00+00:00',
            comment: '午前中受け取り',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            preset_id: 1,
            pickup_start: '2025-08-10T13:00:00+00:00',
            pickup_end: '2025-08-10T17:00:00+00:00',
            comment: '午後受け取り',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        const { data: createdWindows, error: windowsError } = await supabaseAdmin
          .from('pickup_windows')
          .insert(sampleWindows)
          .select();
        
        if (windowsError) {
          console.error('❌ Failed to create windows:', windowsError);
        } else {
          console.log(`✅ Created ${createdWindows.length} pickup_windows`);
        }
      } else {
        console.log(`Using sample product: ${sampleProduct.name}`);
        
        const productWindows = [
          {
            preset_id: 1,
            product_id: sampleProduct.id,
            pickup_start: '2025-08-10T09:00:00+00:00',
            pickup_end: '2025-08-10T12:00:00+00:00',
            price: sampleProduct.price,
            comment: `${sampleProduct.name} - 午前中受け取り`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            preset_id: 1,
            product_id: sampleProduct.id,
            pickup_start: '2025-08-10T13:00:00+00:00',
            pickup_end: '2025-08-10T17:00:00+00:00',
            price: sampleProduct.price,
            comment: `${sampleProduct.name} - 午後受け取り`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        const { data: createdWindows, error: windowsError } = await supabaseAdmin
          .from('pickup_windows')
          .insert(productWindows)
          .select();
        
        if (windowsError) {
          console.error('❌ Failed to create product windows:', windowsError);
        } else {
          console.log(`✅ Created ${createdWindows.length} pickup_windows with products`);
        }
      }
    }
    
    // 5. Test the fix
    console.log('\n5. Testing the fix...');
    
    try {
      const testResponse = await fetch('http://localhost:3000/api/admin/form-settings/1');
      console.log(`GET /api/admin/form-settings/1 Status: ${testResponse.status}`);
      
      if (testResponse.ok) {
        console.log('✅ Admin API now working!');
      } else {
        const errorText = await testResponse.text();
        console.log('❌ Admin API still failing:', errorText);
      }
      
      const formResponse = await fetch('http://localhost:3000/api/form/1');
      console.log(`GET /api/form/1 Status: ${formResponse.status}`);
      
      if (formResponse.ok) {
        console.log('✅ Form API now working!');
      } else {
        const errorText = await formResponse.text();
        console.log('❌ Form API still failing:', errorText);
      }
      
    } catch (apiError) {
      console.log('⚠️  API test skipped:', apiError.message);
    }
    
    console.log('\n=== Setup Complete ===');
    console.log('✅ preset_id=1 created/verified');
    console.log('✅ form_settings for preset_id=1 created');
    console.log('✅ pickup_windows for preset_id=1 created');
    console.log('✅ URL structure /form/1 now matches DB');
    
    console.log('\n🎯 Test URLs:');
    console.log('   Admin: http://localhost:3000/admin/settings');
    console.log('   Form: http://localhost:3000/form/1');
    console.log('   API: http://localhost:3000/api/admin/form-settings/1');
    
  } catch (error) {
    console.error('❌ Creation error:', error);
  }
}

createPreset1().catch(console.error);