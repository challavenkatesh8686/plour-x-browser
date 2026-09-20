import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthCard } from '../../components/auth/AuthCard';
import styles from '../../components/auth/AuthCard.module.css';
import { FormField } from '../../components/auth/FormField';
import { AuthButton } from '../../components/auth/AuthButton';
import { useAuth } from '../../services/auth/AuthContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginPage() {
  const { signIn, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || '/', { replace: true });
    }
  }, [loading, isAuthenticated, location.state, navigate]);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = 'Email is required.';
    else if (!EMAIL_PATTERN.test(email)) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Password is required.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);

    if (result.error) setError(result.error);
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue to PlourX"
      footer={
        <>
          Don&rsquo;t have an account? <Link to="/signup">Sign up</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <FormField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          error={fieldErrors.email}
          autoComplete="email"
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          error={fieldErrors.password}
          autoComplete="current-password"
        />
        <Link to="/forgot-password" className={styles.footer} style={{ textAlign: 'left' }}>
          Forgot password?
        </Link>
        {error && <p className={styles.error}>{error}</p>}
        <AuthButton type="submit" variant="primary" fullWidth disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
