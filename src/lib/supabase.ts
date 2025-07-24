import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client (for admin operations)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Database type definitions for better TypeScript support
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      product_presets: {
        Row: {
          id: number;
          preset_name: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          preset_name?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          preset_name?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      products: {
        Row: {
          id: number;
          name: string;
          external_id: string | null;
          category_id: number | null;
          price: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          external_id?: string | null;
          category_id?: number | null;
          price?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          external_id?: string | null;
          category_id?: number | null;
          price?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      form_settings: {
        Row: {
          id: number;
          preset_id: number | null;
          show_price: boolean;
          require_address: boolean;
          enable_gender: boolean;
          enable_birthday: boolean;
          enable_furigana: boolean;
          pickup_start: string | null;
          pickup_end: string | null;
          valid_until: string | null;
          is_enabled: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          preset_id?: number | null;
          show_price?: boolean;
          require_address?: boolean;
          enable_gender?: boolean;
          enable_birthday?: boolean;
          enable_furigana?: boolean;
          pickup_start?: string | null;
          pickup_end?: string | null;
          valid_until?: string | null;
          is_enabled?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          preset_id?: number | null;
          show_price?: boolean;
          require_address?: boolean;
          enable_gender?: boolean;
          enable_birthday?: boolean;
          enable_furigana?: boolean;
          pickup_start?: string | null;
          pickup_end?: string | null;
          valid_until?: string | null;
          is_enabled?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      pickup_windows: {
        Row: {
          id: number;
          product_id: number | null;
          pickup_start: string;
          pickup_end: string;
          preset_id: number | null;
          dates: string[];
          price: number | null;
          comment: string | null;
          variation: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          product_id?: number | null;
          pickup_start: string;
          pickup_end: string;
          preset_id?: number | null;
          dates?: string[];
          price?: number | null;
          comment?: string | null;
          variation?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          product_id?: number | null;
          pickup_start?: string;
          pickup_end?: string;
          preset_id?: number | null;
          dates?: string[];
          price?: number | null;
          comment?: string | null;
          variation?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      reservations: {
        Row: {
          id: string;
          user_id: string;
          product_preset_id: number | null;
          user_name: string;
          furigana: string | null;
          phone_number: string;
          zip: string | null;
          address: string | null;
          product: string[];
          product_category: string | null;
          quantity: number;
          unit_price: number;
          pickup_date: string | null;
          variation: string | null;
          comment: string | null;
          note: string | null;
          total_amount: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_preset_id?: number | null;
          user_name: string;
          furigana?: string | null;
          phone_number: string;
          zip?: string | null;
          address?: string | null;
          product?: string[];
          product_category?: string | null;
          quantity?: number;
          unit_price?: number;
          pickup_date?: string | null;
          variation?: string | null;
          comment?: string | null;
          note?: string | null;
          total_amount?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_preset_id?: number | null;
          user_name?: string;
          furigana?: string | null;
          phone_number?: string;
          zip?: string | null;
          address?: string | null;
          product?: string[];
          product_category?: string | null;
          quantity?: number;
          unit_price?: number;
          pickup_date?: string | null;
          variation?: string | null;
          comment?: string | null;
          note?: string | null;
          total_amount?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      notification_logs: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          message: Json | null;
          sent_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          message?: Json | null;
          sent_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          message?: Json | null;
          sent_at?: string | null;
          created_at?: string | null;
        };
      };
    };
  };
}