/**
 * Supabase client initialization for server-side use
 * Uses service role key for authenticated database access
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  console.warn('[Supabase] SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.warn('[Supabase] SUPABASE_KEY:', supabaseKey ? 'SET' : 'MISSING');
}

/**
 * Server-side Supabase client with service role privileges
 * This client bypasses Row Level Security (RLS) and should only be used in API routes
 */
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Check if Supabase is properly configured
 */
export const isSupabaseConfigured = () => {
  return supabase !== null;
};

