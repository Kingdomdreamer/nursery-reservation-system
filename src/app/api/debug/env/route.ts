import { NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing',
    timestamp: new Date().toISOString()
  };
  
  console.log('Environment variables check:', envCheck);
  
  return NextResponse.json(envCheck);
}