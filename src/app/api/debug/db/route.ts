import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  console.log('=== Database Connection Test ===');
  
  const dbStatus = {
    supabaseAdminExists: supabaseAdmin !== null,
    hasFromMethod: supabaseAdmin ? typeof supabaseAdmin.from === 'function' : false,
    timestamp: new Date().toISOString()
  };
  
  console.log('Database status check:', dbStatus);
  
  if (!supabaseAdmin) {
    console.error('Supabase admin client is null');
    return NextResponse.json({
      ...dbStatus,
      error: 'Supabase admin client is not available',
      message: 'Service role key may be missing or invalid'
    }, { status: 500 });
  }
  
  try {
    // 簡単なクエリを実行してデータベース接続をテスト
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id')
      .limit(1);
      
    console.log('Database query test:', {
      hasData: data !== null,
      dataLength: data?.length || 0,
      hasError: !!error,
      errorMessage: error?.message
    });
    
    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json({
        ...dbStatus,
        queryTest: 'failed',
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details
      }, { status: 500 });
    }
    
    return NextResponse.json({
      ...dbStatus,
      queryTest: 'success',
      message: 'Database connection is working'
    });
    
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({
      ...dbStatus,
      queryTest: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}