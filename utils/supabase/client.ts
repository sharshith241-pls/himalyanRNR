import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const stripQuotes = (s: string) => s.trim().replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");

// Lazy initialization - only create client when first accessed at runtime
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  // Return cached client if already created
  if (_supabase) return _supabase;
  
  // Only create client in browser environment
  if (typeof window === "undefined") return null;
  
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  
  const supabaseUrl = stripQuotes(rawUrl);
  const supabaseAnonKey = stripQuotes(rawKey);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase client not initialized: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return null;
  }

  _supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });

  return _supabase;
}

// Export a getter that lazily initializes the client
export const supabase = typeof window !== "undefined" ? getSupabaseClient() : null;

// Also export the getter function for cases where you need fresh access
export { getSupabaseClient };
