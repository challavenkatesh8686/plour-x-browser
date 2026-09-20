import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../services/auth/AuthContext';
import styles from './AuthSheet.module.css';

export function AuthSheet({ onClose }: { onClose: () => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const { error: err } = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);
    if (err) setError(err);
    else onClose();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={`${styles.sheet} px-glass`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{mode === 'signIn' ? 'Sign in to PlourX' : 'Create your PlourX account'}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <input
          className={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button type="button" className={styles.submit} disabled={submitting || !email || !password} onClick={submit}>
          {mode === 'signIn' ? 'Sign in' : 'Sign up'}
        </button>

        <button
          type="button"
          className={styles.switchMode}
          onClick={() => {
            setMode(mode === 'signIn' ? 'signUp' : 'signIn');
            setError(null);
          }}
        >
          {mode === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
