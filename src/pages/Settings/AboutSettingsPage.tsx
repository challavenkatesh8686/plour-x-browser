import { Info } from 'lucide-react';
import { SettingsSubpageHeader } from '../../components/settings/SettingsSubpageHeader';
import { SettingsSection, SettingsRow } from '../../components/settings/SettingsSection';

export function AboutSettingsPage() {
  return (
    <div>
      <SettingsSubpageHeader title="About" />

      <SettingsSection title="PlourX Browser" icon={Info}>
        <SettingsRow label="Version" description={__APP_VERSION__} />
      </SettingsSection>
    </div>
  );
}
