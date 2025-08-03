// Frontend display test script
// This simulates how the frontend would process the pickup_windows data

function simulateFrontendProcessing() {
  console.log('=== Simulating Frontend Processing ===');
  
  // Sample data from our API
  const sampleData = {
    products: [
      { id: 3995, name: '中生タマネギ苗　OK黄　100本', price: 598 },
      { id: 3991, name: '極早生タマネギ苗　ハイパーリニア　50本', price: 398 },
      { id: 3992, name: '極早生タマネギ苗　ハイパーリニア　50本', price: 398 }
    ],
    pickup_windows: [
      {
        id: 11,
        product_id: 3995,
        pickup_start: '2025-08-10T09:00:00+00:00',
        pickup_end: '2025-08-10T12:00:00+00:00',
        price: 598,
        comment: '中生タマネギ苗　OK黄　100本 - 午前中受け取り',
        product: { id: 3995, name: '中生タマネギ苗　OK黄　100本', price: 598 }
      },
      {
        id: 5,
        product_id: 3991,
        pickup_start: '2025-08-10T09:00:00+00:00',
        pickup_end: '2025-08-10T12:00:00+00:00',
        price: 398,
        comment: '極早生タマネギ苗　ハイパーリニア　50本 - 午前中受け取り',
        product: { id: 3991, name: '極早生タマネギ苗　ハイパーリニア　50本', price: 398 }
      }
      // ... more windows
    ]
  };
  
  console.log('1. Products available for selection:');
  sampleData.products.forEach((product, index) => {
    console.log(`   ${index + 1}. ${product.name} - ¥${product.price}`);
    
    // Find corresponding pickup windows
    const productWindows = sampleData.pickup_windows.filter(w => w.product_id === product.id);
    console.log(`      Available pickup times: ${productWindows.length} slots`);
    productWindows.forEach(window => {
      const date = new Date(window.pickup_start).toLocaleDateString('ja-JP');
      const startTime = new Date(window.pickup_start).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
      const endTime = new Date(window.pickup_end).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
      console.log(`        - ${date} ${startTime}-${endTime}`);
    });
  });
  
  console.log('\n2. How the user experience works:');
  console.log('   - User sees 3 unique products to choose from');
  console.log('   - User selects products and quantities');
  console.log('   - User selects pickup date/time based on available windows');
  console.log('   - System matches selections with appropriate pickup_windows');
  
  console.log('\n✅ Frontend processing simulation complete');
}

simulateFrontendProcessing();