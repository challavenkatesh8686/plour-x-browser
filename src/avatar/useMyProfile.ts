import { useEffect, useState } from 'react';
import { supabase } from '../services/auth/supabaseClient';
import { AVATAR_EVENT, PLOURX_API_ORIGIN } from '../services/auth/plourxApi';

export interface MyProfile {
  /** Absolute URL of the uploaded picture, or null. */
  avatarUrl: string | null;
  isAdmin: boolean;
}

const NONE: MyProfile = { avatarUrl: null, isAdmin: false };

/** Makes a stored avatar path absolute (server-relative paths live on the PlourX AI server). */
export function absoluteAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return /^https?:\/\//i.test(path) ? path : `${PLOURX_API_ORIGIN}${path}`;
}

/** A signed-in user's picture + role from the shared `profiles` table (own row, via RLS). */
export function useMyProfile(userId: string | null | undefined): MyProfile {
  const [state, setState] = useState<{ id: string; profile: MyProfile } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const load = () => {
      void supabase
        .from('profiles')
        .select('avatar_url, role')
        .eq('id', userId)
        .maybeSingle()
        .then(({ data }) => {
          if (!active) return;
          setState({
            id: userId,
            profile: { avatarUrl: absoluteAvatarUrl(data?.avatar_url as string | null | undefined), isAdmin: data?.role === 'admin' },
          });
        });
    };
    load();
    window.addEventListener(AVATAR_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(AVATAR_EVENT, load);
    };
  }, [userId]);

  return state && state.id === userId ? state.profile : NONE;
}
