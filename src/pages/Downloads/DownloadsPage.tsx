import { Download, ExternalLink, FolderOpen, X } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { useDownloads } from '../../hooks/useDownloads';
import * as downloadsService from '../../services/downloads/downloadsService';
import styles from './DownloadsPage.module.css';

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function DownloadsPage() {
  const downloads = useDownloads();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Downloads</h1>
      </div>

      <div className={styles.list}>
        {downloads.length === 0 ? (
          <EmptyState icon={Download} message="Files you download will appear here." />
        ) : (
          downloads.map((item) => {
            const percent = item.totalBytes > 0 ? Math.round((item.receivedBytes / item.totalBytes) * 100) : 0;
            return (
              <div key={item.id} className={styles.row}>
                <div className={styles.iconWrap}>
                  <Download size={18} />
                </div>
                <div className={styles.info}>
                  <span className={styles.filename}>{item.filename}</span>
                  {item.state === 'progressing' ? (
                    <>
                      <div className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
                      </div>
                      <span className={styles.meta}>
                        {formatBytes(item.receivedBytes)} of {formatBytes(item.totalBytes)}
                      </span>
                    </>
                  ) : (
                    <span className={styles.meta}>
                      {formatBytes(item.totalBytes)} · {item.state === 'completed' ? 'Done' : item.state === 'cancelled' ? 'Cancelled' : 'Failed'}
                    </span>
                  )}
                </div>
                <div className={styles.actions}>
                  {item.state === 'progressing' ? (
                    <button type="button" className={styles.actionButton} aria-label="Cancel" onClick={() => void downloadsService.cancelDownload(item.id)}>
                      <X size={16} />
                    </button>
                  ) : item.state === 'completed' ? (
                    <>
                      <button type="button" className={styles.actionButton} aria-label="Open file" onClick={() => void downloadsService.openDownload(item.id)}>
                        <ExternalLink size={16} />
                      </button>
                      <button
                        type="button"
                        className={styles.actionButton}
                        aria-label="Show in folder"
                        onClick={() => void downloadsService.showDownloadInFolder(item.id)}
                      >
                        <FolderOpen size={16} />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
