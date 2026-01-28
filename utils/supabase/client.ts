import { createBrowserClient } from "@supabase/ssr";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? "";

const stripQuotes = (s: string) => s.trim().replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");

const supabaseUrl = stripQuotes(rawUrl);
const supabaseAnonKey = stripQuotes(rawKey);

if ((!supabaseUrl || !supabaseAnonKey) && typeof window !== "undefined") {
  // Helpful runtime warning to surface misconfigured env vars (common on Vercel if quotes were added)
  // Do not throw here to avoid hard crashes in production — instead log clear guidance.
  // If you see this warning, ensure the following env vars are set (without surrounding quotes):
  // - NEXT_PUBLIC_SUPABASE_URL
  // - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  // Example of an incorrect value: "https://xyz.supabase.co" (includes quotes)
  // Example of a correct value: https://xyz.supabase.co
  // Also confirm the project still exists and DNS resolves for your Supabase project ref.
  // This message helps debugging DNS / env var issues (ERR_NAME_NOT_RESOLVED).
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase client not initialized: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY. Check environment variables (remove surrounding quotes)."
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createBrowserClient(supabaseUrl, supabaseAnonKey)
    : null;

if (typeof window !== "undefined" && supabaseUrl) {
  // Temporary debug: print only the URL (never the anon key) so we can confirm
  // which Supabase domain the browser-side bundle is using.
  // Remove this after debugging.
  // eslint-disable-next-line no-console
  console.debug("Supabase URL (browser):", supabaseUrl);
}
