import { useState } from 'react';
import builtInUser from '../assets/avatars/default-user.png';
import builtInAdmin from '../assets/avatars/default-admin.png';
import { useDefaultAvatars } from './useDefaultAvatars';
import { useMyProfile } from './useMyProfile';

interface UserAvatarProps {
  /** Signed-in user's id (null/undefined for signed-out users, who get the default user avatar). */
  userId?: string | null;
  /** Diameter in px. */
  size?: number;
  className?: string;
}

/**
 * The signed-in user's avatar:
 *   uploaded picture > default avatar for their role (admin-managed, stored in the database)
 *                    > built-in default bundled with the app.
 * A picture that fails to load falls through to the next step.
 */
export function UserAvatar({ userId, size = 32, className }: UserAvatarProps) {
  const { avatarUrl, isAdmin } = useMyProfile(userId);
  const defaults = useDefaultAvatars();
  const [failed, setFailed] = useState<string[]>([]);

  const builtIn = isAdmin ? builtInAdmin : builtInUser;
  const candidates = [avatarUrl, isAdmin ? defaults.admin : defaults.user, builtIn].filter((u): u is string => Boolean(u));
  const shown = candidates.find((u) => !failed.includes(u)) ?? builtIn;
  const isDefault = shown !== avatarUrl;

  return (
    <span className={className} style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0, overflow: 'hidden', borderRadius: '50%' }}>
      <img
        src={shown}
        alt=""
        width={size}
        height={size}
        style={{ width: '100%', height: '100%', objectFit: isDefault ? 'contain' : 'cover' }}
        onError={() => setFailed((prev) => (prev.includes(shown) ? prev : [...prev, shown]))}
      />
    </span>
  );
}
