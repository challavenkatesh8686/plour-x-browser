import { supabase } from '../services/auth/supabaseClient';

export interface DefaultAvatarUrls {
  user: string | null;
  admin: string | null;
}

/**
 * Admin-managed default avatars (Supabase Storage URLs recorded in design_global_settings; public read).
 * `null` means "use the built-in image bundled with the app".
 */
export async function getDefaultAvatars(): Promise<DefaultAvatarUrls> {
  const client = supabase;
  if (!client) return { user: null, admin: null };
  const { data, error } = await client
    .from('design_global_settings')
    .select('default_user_avatar_url, default_admin_avatar_url')
    .eq('id', 'global')
    .maybeSingle();
  if (error || !data) return { user: null, admin: null };
  return { user: data.default_user_avatar_url ?? null, admin: data.default_admin_avatar_url ?? null };
}
