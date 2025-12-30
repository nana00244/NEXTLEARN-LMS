
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const supabaseUrl = 'https://eaouluvelmfvutnsflnr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhb3VsdXZlbG1mdnV0bnNmbG5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDYxMTQsImV4cCI6MjA4MjY4MjExNH0.hnj9_eiK1ngrD73RFnzlbKwnBiAN9zKKa8driOJbE1g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
