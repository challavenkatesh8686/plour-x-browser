import { useEffect, useState } from 'react';
import * as downloadsService from '../services/downloads/downloadsService';
import type { DesktopDownloadItem } from '../services/downloads/downloadsService';

export function useDownloads() {
  const [downloads, setDownloads] = useState<DesktopDownloadItem[]>([]);

  useEffect(() => {
    void downloadsService.listDownloads().then(setDownloads);
    return downloadsService.onDownloadUpdated((updated) => {
      setDownloads((prev) => {
        const index = prev.findIndex((d) => d.id === updated.id);
        if (index === -1) return [updated, ...prev];
        const next = [...prev];
        next[index] = updated;
        return next;
      });
    });
  }, []);

  return downloads;
}
