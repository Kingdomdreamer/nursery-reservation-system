const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function createPickupWindows() {
  console.log('=== Creating Pickup Windows ===');
  
  // Create pickup windows for preset 11
  const presetId = 11;
  
  const pickupWindows = [
    {
      preset_id: presetId,
      pickup_start: '2025-08-10T09:00:00.000Z',
      pickup_end: '2025-08-10T12:00:00.000Z'
    },
    {
      preset_id: presetId,
      pickup_start: '2025-08-10T13:00:00.000Z',
      pickup_end: '2025-08-10T17:00:00.000Z'
    },
    {
      preset_id: presetId,
      pickup_start: '2025-08-11T09:00:00.000Z',
      pickup_end: '2025-08-11T12:00:00.000Z'
    }
  ];
  
  console.log('Creating pickup windows for preset', presetId);
  
  for (const window of pickupWindows) {
    try {
      const { data, error } = await supabase
        .from('pickup_windows')
        .insert(window)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating pickup window:', error);
      } else {
        console.log('Created pickup window:', data);
      }
    } catch (err) {
      console.error('Exception creating pickup window:', err);
    }
  }
  
  // Verify pickup windows were created
  const { data: windows, error } = await supabase
    .from('pickup_windows')
    .select('*')
    .eq('preset_id', presetId);
  
  console.log('Final pickup windows for preset', presetId, ':', windows?.length || 0, 'windows');
}

createPickupWindows().catch(console.error);