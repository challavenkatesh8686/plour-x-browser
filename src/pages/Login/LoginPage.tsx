import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthCard } from '../../components/auth/AuthCard';
import { Lock, Mail } from '../../lib/flatIcons/icons';
import { PillField, PillSocial, PillSubmit } from '../../components/auth/PillAuth';
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
      title="Welcome Back!"
      subtitle="Sign in to continue to PlourX"
      footer={
        <>
          Don&rsquo;t have an account? <Link to="/signup">Sign up</Link>
        </>
      }
    >
      <form className="pxa-form" onSubmit={onSubmit} noValidate>
        <PillField
          label="Email"
          icon={<Mail />}
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          error={fieldErrors.email}
          autoComplete="email"
        />
        <PillField
          label="Password"
          icon={<Lock />}
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          error={fieldErrors.password}
          autoComplete="current-password"
        />
        <Link to="/forgot-password" className="pxa-link">
          Forgot password?
        </Link>
        {error && <p className="pxa-msg pxa-msg-err" role="alert">{error}</p>}
        <PillSubmit disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</PillSubmit>
        <PillSocial />
      </form>
    </AuthCard>
  );
}
