import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** False when the Supabase env vars are missing; the login gate is skipped then so an unconfigured build stays usable. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — set them in .env. PlourX account sign-in will not work until then.',
  );
}

// createClient throws synchronously on an empty/invalid URL, which would
// otherwise crash the entire app at boot before React even renders --
// browsing, bookmarks, history, and settings don't depend on auth and
// should keep working even with no PlourX account configured. Falling back
// to a syntactically valid placeholder means auth calls fail gracefully at
// request time (caught by AuthContext's try/catch) instead of at import time.
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-anon-key');

/** Authorization header carrying the current Supabase access token, for calls to the PlourX AI server. */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
