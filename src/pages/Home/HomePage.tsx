import { Toolbar } from '../../components/browser/Toolbar';
import { BrowserContentHost } from '../../components/browser/BrowserContentHost';
import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <div className={styles.page}>
      <Toolbar />
      <BrowserContentHost />
    </div>
  );
}
