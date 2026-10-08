import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../../avatar/UserAvatar';
import { useAuth } from '../../services/auth/AuthContext';
import styles from './ProfileAvatarButton.module.css';

/** Opens the Account card (Settings > General). `withName` adds the display name beside the avatar. */
export function ProfileAvatarButton({ size = 32, withName = false, className }: { size?: number; withName?: boolean; className?: string }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const name = profile?.name || (user.user_metadata?.name as string | undefined) || user.email || 'Account';

  return (
    <button
      type="button"
      className={`${styles.button} ${className ?? ''}`}
      aria-label="Account"
      title={withName ? name : 'Account'}
      onClick={() => navigate('/settings/general#account')}
    >
      <UserAvatar userId={user.id} size={size} />
      {withName && <span className={styles.name}>{name}</span>}
    </button>
  );
}
