// Supabase client for frontend
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[supabaseClient] Initializing Supabase client...');
console.log('[supabaseClient] URL:', supabaseUrl);
console.log('[supabaseClient] Anon key present:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[supabaseClient] ERROR: Supabase credentials not found in environment variables');
  console.error('[supabaseClient] VITE_SUPABASE_URL:', supabaseUrl);
  console.error('[supabaseClient] VITE_SUPABASE_ANON_KEY present:', !!supabaseAnonKey);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

console.log('[supabaseClient] Supabase client created successfully');

export default supabase;
