import { createClient } from '@supabase/supabase-js';

// Accessing environment variables using Vite's standard pattern
// Fix: Use type assertion to any for import.meta to avoid TypeScript property 'env' error in environments without full Vite types
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://eaouluvelmfvutnsflnr.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hzMElmC4HBrj5Ng6XofsgQ_dzuReNuC';

// Configuration check
export const isConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder-project') &&
  !supabaseUrl.includes('invalid.supabase.co')
);

if (isConfigured) {
  console.log("[NextLearn] Supabase initialized.");
} else {
  console.warn("[NextLearn] Supabase configuration is missing or invalid.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});