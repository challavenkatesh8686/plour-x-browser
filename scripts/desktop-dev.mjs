// Spawns the Vite dev server and Electron side by side. No `wait-on`/
// `concurrently` dependency needed: electron/main.cjs itself retry-loops
// loading the dev URL for ~15s, so we don't need to detect readiness here --
// just start both and let Electron catch up.
//
// `electronPath` (from the `electron` npm package's main export) resolves
// to the actual platform binary path -- spawning it directly, with a plain
// args array and no shell, avoids `npx electron ...`'s shell-quoting
// problems on Windows (which silently ran plain Node instead of the real
// Electron runtime, crashing on `app` being undefined).
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import electronPath from 'electron';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const isWindows = process.platform === 'win32';
const DEV_URL = 'http://localhost:5173';

const vite = spawn('npx', ['vite'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: isWindows,
});

// ELECTRON_RUN_AS_NODE forces the electron binary to behave as plain Node
// (no app/BrowserWindow/etc.) instead of a real Electron process -- some
// shells/CI environments set this globally, which would otherwise silently
// turn every `electron main.cjs` launch into `node main.cjs` and crash on
// `app` being undefined. Explicitly unset it for this child process.
const electronEnv = { ...process.env, ELECTRON_START_URL: DEV_URL };
delete electronEnv.ELECTRON_RUN_AS_NODE;

const electron = spawn(electronPath, ['electron/main.cjs'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: electronEnv,
});

function shutdown() {
  vite.kill();
  electron.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

electron.on('exit', (code) => {
  vite.kill();
  process.exit(code ?? 0);
});
