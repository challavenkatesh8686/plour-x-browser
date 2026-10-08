import { useRef, useState } from 'react';
import { Camera, LogOut, Trash2, User } from 'lucide-react';
import { UserAvatar } from '../../avatar/UserAvatar';
import { useMyProfile } from '../../avatar/useMyProfile';
import { useAuth } from '../../services/auth/AuthContext';
import { AvatarError, changeAvatar, removeAvatar } from '../../services/auth/plourxApi';
import { showToast } from '../../services/toast/toastService';
import { SettingsSection } from './SettingsSection';
import styles from './AccountSection.module.css';

const MESSAGES = {
  change: 'Change photo',
  remove: 'Remove photo',
  uploading: 'Uploading…',
  hint: 'Used across all PlourX apps. JPG, PNG, WebP or GIF, up to 10 MB.',
  updated: 'Profile photo updated',
  removed: 'Profile photo removed',
  type: "That file isn't a supported image.",
  size: 'That image is too large. Choose one under 10 MB.',
  upload: "Couldn't upload the photo. Check your connection and try again.",
  save: "Couldn't save your profile photo. Please try again.",
};

/** Account card for Settings: identity, profile photo (shared across PlourX apps) and sign out. */
export function AccountSection() {
  const { user, profile, signOut } = useAuth();
  const { avatarUrl } = useMyProfile(user?.id);
  const photoInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  const displayName = profile?.name || (user.user_metadata?.name as string | undefined) || user.email || '';

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    try {
      await action();
      showToast(success);
    } catch (err) {
      const code = err instanceof AvatarError ? err.code : 'upload';
      showToast(MESSAGES[code]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsSection title="Account" icon={User}>
      <div className={styles.identity}>
        <UserAvatar userId={user.id} size={56} />
        <div className={styles.copy}>
          <p className={styles.name}>{displayName}</p>
          <p className={styles.email}>{user.email}</p>
        </div>
      </div>

      <input
        ref={photoInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        aria-label={MESSAGES.change}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void run(() => changeAvatar(file), MESSAGES.updated);
        }}
      />
      <div className={styles.photoRow}>
        <button type="button" className={`${styles.btn} ${styles.photoBtn}`} disabled={busy} onClick={() => photoInput.current?.click()}>
          <Camera size={16} aria-hidden="true" />
          {busy ? MESSAGES.uploading : MESSAGES.change}
        </button>
        {avatarUrl && (
          <button
            type="button"
            className={styles.removeBtn}
            disabled={busy}
            aria-label={MESSAGES.remove}
            title={MESSAGES.remove}
            onClick={() => void run(removeAvatar, MESSAGES.removed)}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <p className={styles.hint}>{MESSAGES.hint}</p>
      <div className={styles.signOut}>
        <button type="button" className={`${styles.btn} ${styles.signOutBtn}`} onClick={() => void signOut()}>
          <LogOut className={styles.logOutIcon} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </SettingsSection>
  );
}
