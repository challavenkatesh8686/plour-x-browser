import { ArrowLeft } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconButton } from '../../components/common/IconButton';
import styles from './SettingsLayout.module.css';

/** Mounts once for the whole /settings/* route tree so the header never remounts as the user drills into a category. */
export function SettingsLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHub = pathname === '/settings';

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        {!isHub && <IconButton icon={<ArrowLeft size={20} />} label="Back" size="sm" onClick={() => navigate(-1)} />}
        <h1 className={styles.title}>Settings</h1>
        {!isHub && <div className={styles.spacer} />}
      </div>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
