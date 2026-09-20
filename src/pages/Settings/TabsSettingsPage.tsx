import { Layers } from 'lucide-react';
import { SettingsSubpageHeader } from '../../components/settings/SettingsSubpageHeader';
import { SettingsSection, SettingsRow } from '../../components/settings/SettingsSection';
import { SettingsNote } from '../../components/settings/SettingsNote';
import { Switch } from '../../components/common/Switch';
import { usePreferences } from '../../hooks/usePreferences';

export function TabsSettingsPage() {
  const { preferences, update } = usePreferences();

  return (
    <div>
      <SettingsSubpageHeader title="Tabs" />

      <SettingsSection title="Behavior" icon={Layers}>
        <SettingsRow
          label="Confirm before closing multiple tabs"
          control={
            <Switch
              checked={preferences.confirmBeforeClosingMultipleTabs}
              onChange={(v) => update('confirmBeforeClosingMultipleTabs', v)}
              label="Confirm before closing multiple tabs"
            />
          }
        />
      </SettingsSection>

      <SettingsNote>
        To keep memory use in check, PlourX Browser keeps at most 4 tabs actively rendering at once. Background tabs beyond
        that are suspended (a snapshot is kept, but the page reloads when you switch back to it) -- the same tradeoff every
        mobile browser makes under memory pressure.
      </SettingsNote>
    </div>
  );
}
