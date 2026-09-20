import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SETTINGS_CATEGORIES } from './settingsCategories';
import styles from './SettingsHubPage.module.css';

export function SettingsHubPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.list}>
      {SETTINGS_CATEGORIES.map(({ to, icon: Icon, title, description }) => (
        <button key={to} type="button" className={styles.row} onClick={() => navigate(to)}>
          <div className={styles.icon}>
            <Icon size={20} />
          </div>
          <div className={styles.text}>
            <span className={styles.title}>{title}</span>
            <span className={styles.description}>{description}</span>
          </div>
          <ChevronRight size={18} className={styles.chevron} />
        </button>
      ))}
    </div>
  );
}
