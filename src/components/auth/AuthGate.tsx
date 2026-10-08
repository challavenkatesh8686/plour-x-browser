import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../services/auth/AuthContext';
import { isSupabaseConfigured } from '../../services/auth/supabaseClient';
import { useTheme } from '../../hooks/useTheme';
import { useAccentColor } from '../../hooks/useAccentColor';
import { useFontStyle } from '../../hooks/useFontStyle';
import { LoginPage } from '../../pages/Login/LoginPage';
import { SignupPage } from '../../pages/Signup/SignupPage';
import { ForgotPasswordPage } from '../../pages/ForgotPassword/ForgotPasswordPage';
import { ResetPasswordPage } from '../../pages/ResetPassword/ResetPasswordPage';

const screen = { height: '100dvh', width: '100%', overflowY: 'auto', background: 'var(--px-bg)', color: 'var(--px-text)' } as const;

/**
 * Login is required: signed-out users only ever see the sign-in family of pages (no app content, no guest mode).
 * Skipped when Supabase isn't configured so an unconfigured build stays usable.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated } = useAuth();
  // Theme/accent/font apply on the login screen too (AppShell, which normally does this, isn't mounted here).
  useTheme();
  useAccentColor();
  useFontStyle();

  if (!isSupabaseConfigured || isAuthenticated) return <>{children}</>;
  if (loading) return <div style={screen} aria-busy="true" />;

  return (
    <div style={screen}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}
