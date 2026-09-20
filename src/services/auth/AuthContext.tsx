import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { toFriendlyAuthError } from './authErrors';

// Ported from plour-x-website's src/context/AuthContext.tsx -- same shared
// Supabase project, same `profiles` table shape, same auth flows (signup
// collects name+country, email verification resend, real forgot/reset
// password). `updateProfile`/`getCurrentUser` were dropped: they go through
// plour-x-website's own Express server (profileApi.ts/apiClient.ts), which
// this app has no equivalent of and no profile-editing UI to call it from
// yet -- not needed for login/signup/session functionality.

export type UserRole = 'user' | 'admin' | 'guest';
export type UserPlan = 'free' | 'lite' | 'pro' | 'elite';
export type UserStatus = 'active' | 'blocked' | 'suspended' | 'restricted' | 'deactivated';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  plan: UserPlan;
  status: UserStatus;
  countryCode: string | null;
  createdAt: string;
}

interface ProfileRow {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  plan: UserPlan;
  status: UserStatus;
  country_code: string | null;
  created_at: string;
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    role: row.role,
    plan: row.plan,
    status: row.status,
    countryCode: row.country_code,
    createdAt: row.created_at,
  };
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, countryCode: string) => Promise<{ error?: string; session?: Session | null }>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data) {
      setProfile(null);
      return;
    }
    setProfile(toProfile(data as ProfileRow));
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (nextSession?.user) await loadProfile(nextSession.user.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: toFriendlyAuthError(error.message) } : {};
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, countryCode: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, country_code: countryCode } },
    });
    if (error) return { error: toFriendlyAuthError(error.message) };
    // A non-null session means email confirmation is disabled on this
    // project and the account is immediately usable; null means Supabase is
    // waiting on the user to confirm their email before a session exists.
    return { session: data.session };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resendVerificationEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    return error ? { error: toFriendlyAuthError(error.message) } : {};
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error ? { error: toFriendlyAuthError(error.message) } : {};
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error ? { error: toFriendlyAuthError(error.message) } : {};
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isAuthenticated: session != null,
    isAdmin: profile?.role === 'admin',
    signIn,
    signUp,
    signOut,
    resendVerificationEmail,
    requestPasswordReset,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook are colocated by design
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
