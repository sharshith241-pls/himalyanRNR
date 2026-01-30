
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const stripQuotes = (s: string) => s.trim().replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const rawSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? "";
const rawSupabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const supabaseUrl = stripQuotes(rawSupabaseUrl);
const supabaseKey = stripQuotes(rawSupabaseKey);
const supabaseServiceRoleKey = stripQuotes(rawSupabaseServiceRoleKey);

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

export const createServiceRoleClient = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase service role environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey);
};
