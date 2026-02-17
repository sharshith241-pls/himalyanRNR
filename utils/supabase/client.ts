import { createBrowserClient } from "@supabase/ssr";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? "";

const stripQuotes = (s: string) => s.trim().replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");

const supabaseUrl = stripQuotes(rawUrl);
const supabaseAnonKey = stripQuotes(rawKey);

if ((!supabaseUrl || !supabaseAnonKey) && typeof window !== "undefined") {
  console.warn(
    "Supabase client not initialized: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY. Check environment variables (remove surrounding quotes)."
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createBrowserClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          flowType: "pkce",
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      })
    : null;

if (typeof window !== "undefined" && supabaseUrl) {
  // Temporary debug: print only the URL (never the anon key) so we can confirm
  // which Supabase domain the browser-side bundle is using.
  // Remove this after debugging.
  // eslint-disable-next-line no-console
  console.debug("Supabase URL (browser):", supabaseUrl);
}
