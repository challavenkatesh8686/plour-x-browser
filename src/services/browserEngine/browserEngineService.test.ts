import { describe, expect, it } from 'vitest';
import { BrowserEngineUnavailableError, createTab, isEngineAvailable } from './browserEngineService';

// Neither the Capacitor Android runtime nor the Electron preload bridge
// exist under this test environment (jsdom, plain web) -- exactly the real
// "open the web-preview build in a plain browser" scenario the app itself
// has to detect honestly rather than pretending to have a working engine.
describe('browserEngineService in a plain web context', () => {
  it('reports the engine as unavailable', () => {
    expect(isEngineAvailable()).toBe(false);
  });

  it('rejects engine calls with BrowserEngineUnavailableError instead of hanging or silently no-op-ing', async () => {
    await expect(createTab('tab-1')).rejects.toBeInstanceOf(BrowserEngineUnavailableError);
  });
});
