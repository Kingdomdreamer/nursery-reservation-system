const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function debugSupabaseAccess() {
  console.log('=== Supabase Access Debug ===');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
  
  console.log('\n=== Testing Direct Table Access ===');
  
  // Test form_settings access
  console.log('1. Testing form_settings table access...');
  try {
    const { data, error, status } = await supabase
      .from('form_settings')
      .select('*')
      .limit(5);
    
    console.log('Status:', status);
    console.log('Error:', error);
    console.log('Data count:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('Sample data:', data[0]);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
  
  // Test specific query that's failing
  console.log('\n2. Testing the failing query pattern...');
  try {
    const { data, error, status } = await supabase
      .from('form_settings')
      .select('*')
      .eq('preset_id', 1)
      .eq('is_enabled', true);
    
    console.log('Status:', status);
    console.log('Error:', error);
    console.log('Data:', data);
  } catch (err) {
    console.error('Exception:', err);
  }
  
  // Test preset 10 specifically
  console.log('\n3. Testing preset 10 query...');
  try {
    const { data, error, status } = await supabase
      .from('form_settings')
      .select('*')
      .eq('preset_id', 10)
      .eq('is_enabled', true);
    
    console.log('Status:', status);
    console.log('Error:', error);
    console.log('Data:', data);
  } catch (err) {
    console.error('Exception:', err);
  }
  
  // Test product_presets access
  console.log('\n4. Testing product_presets table access...');
  try {
    const { data, error, status } = await supabase
      .from('product_presets')
      .select('*')
      .limit(5);
    
    console.log('Status:', status);
    console.log('Error:', error);
    console.log('Data:', data);
  } catch (err) {
    console.error('Exception:', err);
  }
  
  // Test products access
  console.log('\n5. Testing products table access...');
  try {
    const { data, error, status } = await supabase
      .from('products')
      .select('id, name, visible')
      .limit(5);
    
    console.log('Status:', status);
    console.log('Error:', error);
    console.log('Data count:', data?.length || 0);
  } catch (err) {
    console.error('Exception:', err);
  }
  
  // Test preset_products access
  console.log('\n6. Testing preset_products table access...');
  try {
    const { data, error, status } = await supabase
      .from('preset_products')
      .select('*')
      .limit(5);
    
    console.log('Status:', status);
    console.log('Error:', error);
    console.log('Data:', data);
  } catch (err) {
    console.error('Exception:', err);
  }
}

debugSupabaseAccess().catch(console.error);