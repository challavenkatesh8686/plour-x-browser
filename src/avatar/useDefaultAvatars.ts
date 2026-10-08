import { useSyncExternalStore } from 'react';
import { getDefaultAvatars, type DefaultAvatarUrls } from './defaultAvatars';

// One shared fetch for every <UserAvatar> on the page.
let current: DefaultAvatarUrls = { user: null, admin: null };
let started = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    void getDefaultAvatars().then((next) => {
      if (next.user === current.user && next.admin === current.admin) return;
      current = next;
      listeners.forEach((l) => l());
    });
  }
  return () => listeners.delete(listener);
}

export function useDefaultAvatars(): DefaultAvatarUrls {
  return useSyncExternalStore(subscribe, () => current, () => current);
}
