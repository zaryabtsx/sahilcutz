// lib/supabaseClient.ts
// Single source of truth — re-export the SSR client
export { supabase, SupabaseSession } from './supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://diiyjpyrswxsnjutpcqq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_SbU9tAMMQedGGXxG4SSQsA_Q4k0Pmw7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,       // ✅ save session to localStorage
    autoRefreshToken: true,     // ✅ keep token alive automatically
    detectSessionInUrl: true,   // ✅ handle OAuth/magic link redirects
  },
});


export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://diiyjpyrswxsnjutpcqq.supabase.co'
  );
}