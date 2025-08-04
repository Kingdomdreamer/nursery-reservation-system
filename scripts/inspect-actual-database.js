// Inspect actual database structure and create comprehensive analysis
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectActualDatabase() {
  console.log('=== Comprehensive Database Structure Inspection ===');
  
  try {
    // Get all table names first
    console.log('1. Getting all table names...');
    
    const tableNames = [
      'product_presets',
      'products', 
      'form_settings',
      'pickup_windows',
      'preset_products',
      'reservations',
      'notification_logs'
    ];
    
    const tableStructures = {};
    
    for (const tableName of tableNames) {
      console.log(`\n--- Analyzing ${tableName} ---`);
      
      try {
        // Try to get sample data to understand structure
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
          tableStructures[tableName] = { error: error.message };
        } else if (data && data.length > 0) {
          console.log(`✅ ${tableName}: ${data.length} record(s) found`);
          console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
          console.log(`   Sample:`, JSON.stringify(data[0], null, 2));
          tableStructures[tableName] = {
            exists: true,
            columns: Object.keys(data[0]),
            sampleData: data[0]
          };
        } else {
          console.log(`⚠️  ${tableName}: Table exists but is empty`);
          // Try to insert a minimal record to understand structure
          try {
            const { error: insertError } = await supabaseAdmin
              .from(tableName)
              .insert({})
              .select();
            
            if (insertError) {
              console.log(`   Required fields error: ${insertError.message}`);
              tableStructures[tableName] = { 
                exists: true, 
                empty: true, 
                insertError: insertError.message 
              };
            }
          } catch (e) {
            console.log(`   Cannot determine structure: ${e.message}`);
            tableStructures[tableName] = { exists: true, empty: true };
          }
        }
      } catch (e) {
        console.log(`❌ ${tableName}: ${e.message}`);
        tableStructures[tableName] = { error: e.message };
      }
    }
    
    // Specific focus on form_settings
    console.log('\n=== FORM_SETTINGS DETAILED ANALYSIS ===');
    
    if (tableStructures.form_settings?.exists) {
      // Try different approaches to understand form_settings schema
      console.log('2. Testing form_settings structure...');
      
      // Try minimal insert to see required fields
      const testData = [
        { preset_id: 1 },
        { preset_id: 1, is_enabled: true },
        { preset_id: 1, is_enabled: true, show_price: true },
        { 
          preset_id: 1, 
          is_enabled: true, 
          show_price: true,
          require_phone: true,
          require_furigana: true,
          allow_note: true
        }
      ];
      
      for (let i = 0; i < testData.length; i++) {
        console.log(`\nTest ${i + 1}: ${JSON.stringify(testData[i])}`);
        const { data: testResult, error: testError } = await supabaseAdmin
          .from('form_settings')
          .insert(testData[i])
          .select();
        
        if (testError) {
          console.log(`   Error: ${testError.message}`);
        } else {
          console.log(`   ✅ Success:`, testResult[0]);
          
          // Clean up test data
          await supabaseAdmin
            .from('form_settings')
            .delete()
            .eq('id', testResult[0].id);
          
          break; // Found working structure
        }
      }
    }
    
    // Check relationships
    console.log('\n=== RELATIONSHIP ANALYSIS ===');
    
    if (tableStructures.product_presets?.exists && tableStructures.products?.exists) {
      console.log('3. Checking preset-product relationships...');
      
      const { data: presets } = await supabaseAdmin
        .from('product_presets')
        .select('id, preset_name');
      
      console.log('Available presets:', presets?.map(p => `${p.id}: ${p.preset_name}`) || []);
      
      if (presets && presets.length > 0) {
        const presetId = presets[0].id;
        
        // Check preset_products
        const { data: presetProducts } = await supabaseAdmin
          .from('preset_products')
          .select('*')
          .eq('preset_id', presetId);
        
        console.log(`Preset ${presetId} has ${presetProducts?.length || 0} associated products`);
        
        // Check pickup_windows
        const { data: pickupWindows } = await supabaseAdmin
          .from('pickup_windows')
          .select('*')
          .eq('preset_id', presetId);
        
        console.log(`Preset ${presetId} has ${pickupWindows?.length || 0} pickup windows`);
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('Table Status:');
    Object.entries(tableStructures).forEach(([table, info]) => {
      if (info.exists) {
        console.log(`✅ ${table}: EXISTS ${info.empty ? '(EMPTY)' : '(HAS DATA)'}`);
        if (info.columns) {
          console.log(`   Columns: ${info.columns.join(', ')}`);
        }
      } else {
        console.log(`❌ ${table}: ERROR - ${info.error}`);
      }
    });
    
    return tableStructures;
    
  } catch (error) {
    console.error('Inspection error:', error);
  }
}

inspectActualDatabase().catch(console.error);