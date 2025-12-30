import { createClient } from '@supabase/supabase-js';

/**
 * Safely retrieves environment variables.
 * Vite injects variables into import.meta.env. 
 */
const env = (import.meta as any).env || {};

// Using the credentials provided by the user as reliable defaults
export const supabaseUrl = env.VITE_SUPABASE_URL || 'https://eaouluvelmfvutnsflnr.supabase.co';
export const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hzMElmC4HBrj5Ng6XofsgQ_dzuReNuC';

// If the URL is still the placeholder or missing, we are not properly configured
export const isConfigured = !!(supabaseUrl && 
                               supabaseAnonKey && 
                               supabaseUrl !== 'https://placeholder-project.supabase.co' &&
                               supabaseUrl !== 'https://invalid.supabase.co');

// Log configuration status for debugging
if (isConfigured) {
  console.log("[NextLearn] Supabase initialized with project: " + supabaseUrl);
} else {
  console.error("[NextLearn] Supabase credentials missing or invalid.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});