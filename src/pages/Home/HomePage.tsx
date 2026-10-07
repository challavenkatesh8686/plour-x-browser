import { Toolbar } from '../../components/browser/Toolbar';
import { BrowserContentHost } from '../../components/browser/BrowserContentHost';
import { useFullscreen } from '../../hooks/useFullscreen';
import styles from './HomePage.module.css';

export function HomePage() {
  const { isFullscreen } = useFullscreen();
  return (
    <div className={styles.page}>
      {!isFullscreen && <Toolbar />}
      <BrowserContentHost />
    </div>
  );
}
