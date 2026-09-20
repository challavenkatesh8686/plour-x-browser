import { registerPlugin } from '@capacitor/core';
import type { PlourxBrowserEnginePlugin } from './types';

export const BrowserEngine = registerPlugin<PlourxBrowserEnginePlugin>('PlourxBrowserEngine');
