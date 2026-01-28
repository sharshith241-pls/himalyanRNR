
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const stripQuotes = (s: string) => s.trim().replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const rawSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? "";

const supabaseUrl = stripQuotes(rawSupabaseUrl);
const supabaseKey = stripQuotes(rawSupabaseKey);

export const createClient = async () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY are set (no surrounding quotes)."
    );
  }

  const cookieStore = await cookies();
  
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};

/**
 * Create a Supabase client using the service role key for privileged server-side operations.
 * Requires `SUPABASE_SERVICE_ROLE_KEY` to be set in server environment (do NOT expose to client).
 */
export const createServiceRoleClient = () => {
  const rawServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const serviceRoleKey = stripQuotes(rawServiceRole);

  if (!supabaseUrl || !serviceRoleKey) {
    // Provide a clear debugging hint (don't leak the key value)
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in server environment. Set the service role key (no surrounding quotes) and redeploy."
    );
  }

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
};
