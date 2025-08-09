import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validation
if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Client-side Supabase client with singleton pattern
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'nursery-reservation-system-auth',
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }
    });
  }
  return supabaseInstance;
})();

// Service role client (for admin operations) - only create if key is available
console.log('Supabase Admin Client Initialization:', {
  hasServiceRoleKey: !!supabaseServiceRoleKey,
  serviceRoleKeyPrefix: supabaseServiceRoleKey ? supabaseServiceRoleKey.substring(0, 20) + '...' : 'None',
  supabaseUrl: supabaseUrl || 'Missing',
  timestamp: new Date().toISOString()
});

export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }
    })
  : null;

console.log('Supabase Admin Client Created:', {
  isNull: supabaseAdmin === null,
  hasFrom: supabaseAdmin ? typeof supabaseAdmin.from === 'function' : false
});

// Legacy JSON type for backward compatibility
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Export typed clients
export type SupabaseClient = ReturnType<typeof createClient<Database>>;
export type SupabaseAdminClient = ReturnType<typeof createClient<Database>> | null;