import { createClient } from '@supabase/supabase-js';

/**
 * Safely retrieves environment variables.
 * Vite injects variables into import.meta.env. 
 * We use optional chaining and a fallback object to prevent runtime crashes.
 */
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Log helpful debugging information in the console
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[NextLearn Config] Critical Error: Supabase credentials are missing.\n" +
    "If you are seeing this in production (Netlify), ensure you have added " +
    "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Site Environment Variables."
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);