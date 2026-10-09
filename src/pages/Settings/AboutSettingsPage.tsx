import { useState } from 'react';
import { Info, LifeBuoy } from 'lucide-react';
import { SettingsSubpageHeader } from '../../components/settings/SettingsSubpageHeader';
import { SettingsSection, SettingsRow } from '../../components/settings/SettingsSection';
import { ContactFormSheet } from '../../components/settings/ContactFormSheet';
import { FeedbackFormSheet } from '../../components/settings/FeedbackFormSheet';

export function AboutSettingsPage() {
  const [contactOpen, setContactOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div>
      <SettingsSubpageHeader title="About" />

      <SettingsSection title="PlourX Browser" icon={Info}>
        <SettingsRow label="Version" description={__APP_VERSION__} />
      </SettingsSection>

      <SettingsSection title="Support" icon={LifeBuoy}>
        <SettingsRow label="Contact us" description="Questions or need help" onClick={() => setContactOpen(true)} />
        <SettingsRow label="Send feedback" description="Report a bug or share an idea" onClick={() => setFeedbackOpen(true)} />
      </SettingsSection>

      <ContactFormSheet open={contactOpen} onClose={() => setContactOpen(false)} />
      <FeedbackFormSheet open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
