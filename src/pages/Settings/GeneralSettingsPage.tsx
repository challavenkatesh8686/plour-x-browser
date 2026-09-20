import { useState } from 'react';
import { Check, Globe, Search, User } from 'lucide-react';
import { SettingsSubpageHeader } from '../../components/settings/SettingsSubpageHeader';
import { SettingsSection, SettingsRow } from '../../components/settings/SettingsSection';
import { SettingsActionButton } from '../../components/settings/SettingsActionButton';
import { Switch } from '../../components/common/Switch';
import { usePreferences } from '../../hooks/usePreferences';
import { getSearchEngines } from '../../services/search/searchEngineService';
import { useAuth } from '../../services/auth/AuthContext';
import { AuthSheet } from '../../components/auth/AuthSheet';
import styles from './GeneralSettingsPage.module.css';

export function GeneralSettingsPage() {
  const { preferences, update } = usePreferences();
  const { isAuthenticated, user, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div>
      <SettingsSubpageHeader title="General" />

      <SettingsSection title="Search engine" icon={Search}>
        {getSearchEngines().map((engine) => (
          <SettingsRow
            key={engine.id}
            label={engine.name}
            onClick={() => update('defaultSearchEngineId', engine.id)}
            control={
              preferences.defaultSearchEngineId === engine.id ? <Check size={18} className={styles.checkIcon} /> : undefined
            }
          />
        ))}
      </SettingsSection>

      <SettingsSection title="Links" icon={Globe}>
        <SettingsRow
          label="Open links in new tab"
          description="Links that open a new window will open in a new tab instead of the current one"
          control={<Switch checked={preferences.openLinksInNewTab} onChange={(v) => update('openLinksInNewTab', v)} label="Open links in new tab" />}
        />
      </SettingsSection>

      <SettingsSection title="Account" icon={User}>
        {isAuthenticated ? (
          <SettingsRow
            label={user?.email ?? 'Signed in'}
            description="Signed in to your PlourX account"
            control={<SettingsActionButton label="Sign out" onClick={() => void signOut()} />}
          />
        ) : (
          <SettingsRow
            label="Not signed in"
            description="Sign in to your PlourX account"
            control={<SettingsActionButton label="Sign in" onClick={() => setShowAuth(true)} />}
          />
        )}
      </SettingsSection>

      {showAuth && <AuthSheet onClose={() => setShowAuth(false)} />}
    </div>
  );
}
