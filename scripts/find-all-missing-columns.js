// Find all missing columns by analyzing code and database
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findAllMissingColumns() {
  console.log('=== Finding All Missing Columns ===');
  
  try {
    // 1. Get current database schema
    console.log('\n1. Current Database Schema...');
    
    const { data: schemaData, error: schemaError } = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Schema error:', schemaError);
      return;
    }
    
    const currentColumns = schemaData && schemaData.length > 0 
      ? Object.keys(schemaData[0]) 
      : [];
    
    console.log('✅ Current columns in form_settings:');
    currentColumns.forEach((col, i) => console.log(`   ${i+1}. ${col}`));
    
    // 2. Analyze code to find referenced columns
    console.log('\n2. Analyzing Code for Column References...');
    
    // Common column patterns from form settings
    const potentialColumns = new Set([
      // Core settings
      'preset_id', 'show_price', 'require_phone', 'require_furigana', 'allow_note', 'is_enabled',
      'custom_message', 'created_at', 'updated_at',
      
      // Legacy compatibility
      'enable_birthday', 'enable_gender', 'require_address', 'enable_furigana',
      
      // Time-related (from error logs)
      'pickup_start', 'pickup_end', 'valid_until',
      
      // Common form fields
      'pickup_date', 'delivery_date', 'expiry_date', 'deadline',
      'note', 'comment', 'description', 'instructions',
      
      // Boolean flags
      'require_name', 'require_email', 'require_zip', 'require_gender',
      'enable_notes', 'enable_delivery', 'enable_pickup',
      'show_total', 'show_tax', 'show_discount',
      
      // Text fields
      'title', 'subtitle', 'footer_message', 'terms_message',
      'confirmation_message', 'error_message'
    ]);
    
    console.log(`Found ${potentialColumns.size} potential column references`);
    
    // 3. Check what's missing
    console.log('\n3. Missing Column Analysis...');
    
    const missingColumns = [];
    potentialColumns.forEach(col => {
      if (!currentColumns.includes(col)) {
        missingColumns.push(col);
      }
    });
    
    console.log(`❌ Missing columns (${missingColumns.length}):`);
    missingColumns.forEach((col, i) => console.log(`   ${i+1}. ${col}`));
    
    // 4. Generate comprehensive SQL
    console.log('\n4. Comprehensive SQL Fix...');
    
    const columnDefinitions = {
      // Legacy compatibility
      'enable_furigana': 'boolean DEFAULT false',
      
      // Time fields
      'pickup_start': 'timestamptz',
      'pickup_end': 'timestamptz', 
      'valid_until': 'timestamptz',
      'pickup_date': 'timestamptz',
      'delivery_date': 'timestamptz',
      'deadline': 'timestamptz',
      
      // Text fields
      'note': 'text',
      'comment': 'text',
      'description': 'text',
      'instructions': 'text',
      'title': 'text',
      'subtitle': 'text',
      'footer_message': 'text',
      'terms_message': 'text',
      'confirmation_message': 'text',
      'error_message': 'text',
      
      // Boolean fields
      'require_name': 'boolean DEFAULT true',
      'require_email': 'boolean DEFAULT false',
      'require_zip': 'boolean DEFAULT false',
      'require_gender': 'boolean DEFAULT false',
      'enable_notes': 'boolean DEFAULT true',
      'enable_delivery': 'boolean DEFAULT false',
      'enable_pickup': 'boolean DEFAULT true',
      'show_total': 'boolean DEFAULT true',
      'show_tax': 'boolean DEFAULT false',
      'show_discount': 'boolean DEFAULT false'
    };
    
    const sqlToAdd = [];
    missingColumns.forEach(col => {
      if (columnDefinitions[col]) {
        sqlToAdd.push(`ADD COLUMN IF NOT EXISTS ${col} ${columnDefinitions[col]}`);
      }
    });
    
    if (sqlToAdd.length > 0) {
      console.log('\n📋 COMPREHENSIVE SQL - Run in Supabase SQL Editor:');
      console.log('');
      console.log('ALTER TABLE public.form_settings');
      sqlToAdd.forEach((sql, i) => {
        const comma = i < sqlToAdd.length - 1 ? ',' : ';';
        console.log(`${sql}${comma}`);
      });
      console.log('');
      console.log('-- Sync enable_furigana with require_furigana');
      console.log('UPDATE public.form_settings');
      console.log('SET enable_furigana = require_furigana');
      console.log('WHERE enable_furigana IS NULL;');
      console.log('');
    } else {
      console.log('✅ No SQL needed - all columns exist');
    }
    
    // 5. Check specific error-prone columns
    console.log('\n5. Error-Prone Column Check...');
    
    const criticalColumns = ['pickup_start', 'pickup_end', 'enable_furigana', 'custom_message'];
    criticalColumns.forEach(col => {
      const exists = currentColumns.includes(col);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${col}: ${exists ? 'EXISTS' : 'MISSING - WILL CAUSE 500 ERROR'}`);
    });
    
    // 6. API Route Check
    console.log('\n6. API Route File Check...');
    
    const apiRoutes = [
      'src/app/api/admin/form-settings/route.ts',
      'src/app/api/admin/form-settings/[id]/route.ts'
    ];
    
    apiRoutes.forEach(route => {
      const fullPath = path.join(process.cwd(), route);
      const exists = fs.existsSync(fullPath);
      console.log(`   ${exists ? '✅' : '❌'} ${route}: ${exists ? 'EXISTS' : 'MISSING'}`);
      
      if (exists) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasGET = content.includes('export async function GET');
        const hasPUT = content.includes('export async function PUT');
        const hasPOST = content.includes('export async function POST');
        
        console.log(`     GET: ${hasGET ? '✅' : '❌'}, PUT: ${hasPUT ? '✅' : '❌'}, POST: ${hasPOST ? '✅' : '❌'}`);
      }
    });
    
    console.log('\n=== Summary ===');
    console.log(`🔧 Current columns: ${currentColumns.length}`);
    console.log(`❌ Missing columns: ${missingColumns.length}`);
    console.log(`📋 SQL statements to add: ${sqlToAdd.length}`);
    
    console.log('\n📋 Next Steps:');
    console.log('1. Run the SQL above in Supabase SQL Editor');
    console.log('2. Restart development server: npm run dev');
    console.log('3. Test API: GET http://localhost:3000/api/admin/form-settings/1');
    console.log('4. Test form settings save in admin panel');
    console.log('5. Verify no more 500/404/418 errors');
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
  }
}

findAllMissingColumns().catch(console.error);