import { afterEach, describe, expect, it } from 'vitest';
import { isElectronDesktop, isNativeAndroid } from './platform';

describe('isNativeAndroid', () => {
  it('is false outside a native Capacitor Android shell', () => {
    // This test suite runs under jsdom, never inside the real Capacitor
    // Android runtime -- Capacitor's own web fallback should report false.
    expect(isNativeAndroid()).toBe(false);
  });
});

describe('isElectronDesktop', () => {
  afterEach(() => {
    delete (window as unknown as { plourxDesktop?: unknown }).plourxDesktop;
  });

  it('is false when no preload bridge is present', () => {
    expect(isElectronDesktop()).toBe(false);
  });

  it('is true once the preload-injected bridge global exists', () => {
    (window as unknown as { plourxDesktop?: unknown }).plourxDesktop = {};
    expect(isElectronDesktop()).toBe(true);
  });
});
