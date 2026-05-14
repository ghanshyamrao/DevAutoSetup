const { app, BrowserWindow, ipcMain, nativeImage, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const Store = require('electron-store');
const { startGoogleSignIn } = require('./auth');
const subscription = require('./subscription');
const { startVerifiedCheckout } = require('./stripe');

const PLAN_TO_PRICE = {
  pro: { priceId: () => process.env.STRIPE_PRICE_PRO, mode: 'subscription' },
  lifetime: { priceId: () => process.env.STRIPE_PRICE_LIFETIME, mode: 'payment' },
};

try {
  const dotenv = require('dotenv');
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
} catch (_) { }

const isDev = !app.isPackaged;

const DEV_URL = process.env.DEV_URL || 'http://localhost:3000';
const PROD_INDEX_PATH = path.join(__dirname, '..', 'dist', 'index.html');

const store = new Store({ name: 'devonboard-config' });

let mainWindow;
let splashWindow;
let onboardingWindow;
let currentInstallProc = null;

// On some Windows setups, the default Chromium cache/userData location can end up locked or non-writable,
// which causes navigation to fail with ERR_FAILED (-2). Use a dedicated dev-only userData path.
if (isDev) {
  try {
    app.setPath('userData', path.join(app.getPath('temp'), 'DevOnboard-dev-userData'));
  } catch (_) { }
}

function getAppUrl(route = '/') {
  const safeRoute = route.startsWith('/') ? route : `/${route}`;
  if (isDev) return `${DEV_URL}/#${safeRoute}`;
  return `file://${PROD_INDEX_PATH}#${safeRoute}`;
}

function getHashForRoute(route = '/') {
  const safeRoute = route.startsWith('/') ? route : `/${route}`;
  return `#${safeRoute}`;
}

async function loadRoute(win, route = '/') {
  if (!win || win.isDestroyed()) return;
  if (isDev) {
    // Some Electron builds can intermittently fail `loadURL()` when a hash route is included.
    // Load the origin first, then set the hash in-page.
    await win.loadURL(`${DEV_URL}/`);
    await new Promise((resolve) => {
      if (win.webContents.isLoading()) win.webContents.once('did-finish-load', resolve);
      else resolve();
    });
    const hash = getHashForRoute(route);
    await win.webContents.executeJavaScript(`location.hash = ${JSON.stringify(hash)};`, true);
    return;
  }
  await win.loadURL(getAppUrl(route));
}

function getPreloadPath() {
  if (app.isPackaged) {
    const unpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'preload.js');
    return fs.existsSync(unpacked) ? unpacked : path.join(__dirname, 'preload.js');
  }
  return path.join(__dirname, 'preload.js');
}

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }
  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  const winIcon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : null;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    ...(winIcon && !winIcon.isEmpty() ? { icon: winIcon } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: getPreloadPath(),
      sandbox: false,
      webSecurity: true,
    },
    title: 'DevOnboard - Developer environment setup',
    show: false,
  });

  loadRoute(mainWindow, '/').catch((err) => console.error('Failed to load URL:', err));
  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL) => {
    console.error('did-fail-load:', { errorCode, errorDescription, validatedURL });
  });
  if (isDev) mainWindow.webContents.openDevTools();
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

function createSplashWindow() {
  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  const winIcon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : null;

  splashWindow = new BrowserWindow({
    width: 420,
    height: 320,
    frame: false,
    transparent: false,
    resizable: false,
    ...(winIcon && !winIcon.isEmpty() ? { icon: winIcon } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: getPreloadPath(),
      sandbox: false,
    },
    title: 'DevOnboard',
  });

  let splashRetried = false;
  splashWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL) => {
    // Note: for hash-based routes, `validatedURL` is usually just the origin (no hash),
    // so don't filter on `/splash` here.
    if (!splashRetried && errorCode === -2) {
      splashRetried = true;
      setTimeout(() => {
        if (!splashWindow || splashWindow.isDestroyed()) return;
        loadRoute(splashWindow, '/splash').catch((err) => console.error('Splash retry load error:', err));
      }, 800);
      return;
    }
    console.error('Splash load error:', { errorCode, errorDescription, validatedURL });
  });
  loadRoute(splashWindow, '/splash').catch((err) => console.error('Splash load error:', err));
  splashWindow.on('closed', () => { splashWindow = null; });

  const SPLASH_DELAY_MS = 2500;
  setTimeout(() => {
    if (!splashWindow || splashWindow.isDestroyed()) return;
    const completed = store.get('onboardingCompleted', false);
    if (completed) {
      createMainWindow();
    } else {
      onboardingWindow = new BrowserWindow({
        width: 900,
        height: 640,
        minWidth: 700,
        minHeight: 500,
        ...(winIcon && !winIcon.isEmpty() ? { icon: winIcon } : {}),
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: getPreloadPath(),
          sandbox: false,
        },
        title: 'DevOnboard - Setup',
        show: false,
      });
      loadRoute(onboardingWindow, '/onboarding').catch((err) => console.error('Onboarding load error:', err));
      onboardingWindow.once('ready-to-show', () => {
        onboardingWindow.show();
      });
      onboardingWindow.on('closed', () => { onboardingWindow = null; });
    }
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
  }, SPLASH_DELAY_MS);
}

function createOnboardingWindow() {
  if (onboardingWindow && !onboardingWindow.isDestroyed()) return;
  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  const winIcon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : null;

  onboardingWindow = new BrowserWindow({
    width: 900,
    height: 640,
    minWidth: 700,
    minHeight: 500,
    ...(winIcon && !winIcon.isEmpty() ? { icon: winIcon } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: getPreloadPath(),
      sandbox: false,
    },
    title: 'DevOnboard - Setup',
    show: false,
  });
  loadRoute(onboardingWindow, '/onboarding').catch((err) => console.error('Onboarding load error:', err));
  onboardingWindow.once('ready-to-show', () => onboardingWindow.show());
  onboardingWindow.on('closed', () => { onboardingWindow = null; });
}

app.whenReady().then(() => {
  createSplashWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createSplashWindow();
});

ipcMain.handle('onboarding:status', () => {
  return { completed: store.get('onboardingCompleted', false) };
});

ipcMain.handle('onboarding:complete', () => {
  store.set('onboardingCompleted', true);
  if (onboardingWindow && !onboardingWindow.isDestroyed()) {
    onboardingWindow.close();
    onboardingWindow = null;
  }
  createMainWindow();
  return { ok: true };
});

ipcMain.handle('open-external', (_, url) => {
  if (url && typeof url === 'string') shell.openExternal(url).catch(() => { });
});

ipcMain.handle('catalog:list', async () => {
  const packagedCandidates = [
    path.join(app.getAppPath(), 'dist', 'software-list.json'),
    path.join(app.getAppPath(), 'public', 'software-list.json'),
    path.join(__dirname, '..', 'dist', 'software-list.json'),
    path.join(__dirname, '..', 'public', 'software-list.json'),
  ];
  const devCandidates = [
    path.join(__dirname, '..', 'public', 'software-list.json'),
    path.join(__dirname, '..', 'dist', 'software-list.json'),
    path.join(app.getAppPath(), 'public', 'software-list.json'),
    path.join(app.getAppPath(), 'dist', 'software-list.json'),
  ];
  const candidates = isDev ? devCandidates : packagedCandidates;
  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    } catch (_) {
      // Try next candidate path.
    }
  }
  return [];
});

ipcMain.handle('run-powershell-script', async (_, script) => {
  if (!script || typeof script !== 'string') {
    return { stdout: '', stderr: 'Invalid script', code: -1 };
  }
  return new Promise((resolve) => {
    const proc = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    proc.on('close', (code) => resolve({ stdout, stderr, code: code ?? -1 }));
    proc.on('error', (err) => resolve({ stdout: '', stderr: String(err), code: -1 }));
  });
});

ipcMain.handle('check:admin', async () => {
  try {
    const { execSync } = require('child_process');
    execSync('net session', { stdio: 'ignore' });
    return { granted: true };
  } catch {
    return { granted: false };
  }
});

ipcMain.handle('check:internet', async () => {
  try {
    const https = require('https');
    return new Promise((resolve) => {
      const req = https.get('https://www.microsoft.com', { timeout: 5000 }, () => {
        resolve({ connected: true });
      });
      req.on('error', () => resolve({ connected: false }));
      req.on('timeout', () => { req.destroy(); resolve({ connected: false }); });
    });
  } catch {
    return { connected: false };
  }
});

ipcMain.handle('check:winget', async () => {
  try {
    const { execSync } = require('child_process');
    const out = execSync('winget --version', { encoding: 'utf8' });
    const match = out.match(/(\d+\.\d+\.\d+)/);
    return { available: true, version: match ? match[1] : 'unknown' };
  } catch {
    return { available: false, version: null };
  }
});

ipcMain.handle('winget:list', async () => {
  return new Promise((resolve) => {
    const proc = spawn('winget', ['list', '--accept-source-agreements'], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    proc.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr?.on('data', () => { });
    proc.on('close', () => {
      const ids = [];
      const entries = [];
      const lines = stdout.split(/\r?\n/);
      const sep = lines.findIndex((l) => /^-+$/.test(l.trim()));
      const dataStart = sep >= 0 ? sep + 1 : 1;
      for (let i = dataStart; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2 && parts[1].includes('.')) {
          const id = parts[1];
          const name = parts[0] || id;
          ids.push(id);
          entries.push({ id, name });
        }
      }
      resolve({ ids, entries });
    });
    proc.on('error', () => resolve({ ids: [], entries: [] }));
  });
});

ipcMain.handle('winget:show', async (_, { wingetId }) => {
  return new Promise((resolve) => {
    const proc = spawn('winget', ['show', '--id', wingetId, '--accept-source-agreements'], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    proc.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr?.on('data', () => { });
    proc.on('close', (code) => {
      const versions = [];
      if (code !== 0) return resolve({ versions: [], description: null });
      const lines = stdout.split(/\r?\n/);
      let inVersions = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s*Versions?:?\s*$/i.test(line.trim())) inVersions = true;
        else if (inVersions && line.trim()) {
          const verMatch = line.trim().match(/^([\d.]+)/);
          if (verMatch && !versions.includes(verMatch[1])) versions.push(verMatch[1]);
          else if (/^\s*[-]+\s*$/.test(line)) inVersions = false;
        }
      }
      const descMatch = stdout.match(/Description:\s*(.+?)(?=\n\w|\n\n|$)/is);
      const description = descMatch ? descMatch[1].trim().slice(0, 400) : null;
      resolve({ versions, description });
    });
    proc.on('error', () => resolve({ versions: [], description: null }));
  });
});

ipcMain.handle('winget:uninstall', async (_, { wingetId }) => {
  return new Promise((resolve) => {
    const proc = spawn('winget', ['uninstall', '--id', wingetId, '-e', '--silent', '--accept-source-agreements'], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    proc.on('close', (code) => {
      resolve({ success: code === 0, stdout, stderr });
    });
    proc.on('error', (err) => resolve({ success: false, stdout: '', stderr: String(err) }));
  });
});

ipcMain.handle('winget:install', async (_, { wingetId, version }) => {
  const args = ['install', '--id', wingetId, '-e', '--silent', '--accept-source-agreements', '--accept-package-agreements'];
  if (version) args.push('--version', version);
  return new Promise((resolve, reject) => {
    const proc = spawn('winget', args, {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    currentInstallProc = proc;

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('winget:log', { type: 'stdout', text });
      }
    });
    proc.stderr?.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('winget:log', { type: 'stderr', text });
      }
    });

    proc.on('close', (code) => {
      currentInstallProc = null;
      if (code === 0) resolve({ success: true, stdout, stderr });
      else resolve({ success: false, code, stdout, stderr });
    });
    proc.on('error', (err) => {
      currentInstallProc = null;
      reject(err);
    });
  });
});

ipcMain.handle('winget:cancelInstall', async () => {
  if (!currentInstallProc) {
    return { cancelled: false, reason: 'no-process' };
  }
  try {
    currentInstallProc.kill();
    return { cancelled: true };
  } catch (err) {
    return { cancelled: false, error: String(err) };
  }
});

let autoUpdaterRef = null;
if (app.isPackaged) {
  try {
    autoUpdaterRef = require('electron-updater').autoUpdater;
    autoUpdaterRef.autoDownload = true;
    autoUpdaterRef.autoInstallOnAppQuit = true;
    app.whenReady().then(() => {
      autoUpdaterRef.checkForUpdates().catch(() => { });
    });
    autoUpdaterRef.on('update-available', () => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update:available');
    });
    autoUpdaterRef.on('update-downloaded', () => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update:downloaded');
    });
  } catch (_) {
    autoUpdaterRef = null;
  }
}
ipcMain.handle('update:check', () => (autoUpdaterRef ? autoUpdaterRef.checkForUpdates().catch(() => null) : Promise.resolve(null)));
ipcMain.handle('update:quitAndInstall', () => {
  if (autoUpdaterRef) autoUpdaterRef.quitAndInstall(false, true);
});

ipcMain.handle('auth:status', () => {
  const user = store.get('authUser', null);
  if (!user) return { signedIn: false, user: null, subscription: subscription.summarize(null) };
  const profile = subscription.ensureProfile(store, user.id);
  return { signedIn: true, user, subscription: subscription.summarize(profile) };
});

ipcMain.handle('auth:google', async () => {
  try {
    const result = await startGoogleSignIn();
    store.set('authUser', result.user);
    store.set(`authTokens:${result.user.id}`, result.tokens);
    const profile = subscription.ensureProfile(store, result.user.id);
    return { ok: true, user: result.user, subscription: subscription.summarize(profile) };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
});

ipcMain.handle('auth:signOut', () => {
  const user = store.get('authUser', null);
  if (user && user.id) store.delete(`authTokens:${user.id}`);
  store.delete('authUser');
  return { ok: true };
});

ipcMain.handle('subscription:get', () => {
  const user = store.get('authUser', null);
  if (!user) return { subscription: subscription.summarize(null) };
  const profile = subscription.ensureProfile(store, user.id);
  return { subscription: subscription.summarize(profile) };
});

ipcMain.handle('subscription:checkInstall', () => {
  const user = store.get('authUser', null);
  if (!user) return { allowed: false, reason: 'Sign in to install software.' };
  const profile = subscription.ensureProfile(store, user.id);
  return subscription.canInstall(profile);
});

ipcMain.handle('subscription:checkManage', () => {
  const user = store.get('authUser', null);
  if (!user) return { allowed: false, reason: 'Sign in to manage installed software.' };
  const profile = subscription.ensureProfile(store, user.id);
  return subscription.canManage(profile);
});

ipcMain.handle('subscription:recordInstall', () => {
  const user = store.get('authUser', null);
  if (!user) return { ok: false };
  const profile = subscription.incrementInstall(store, user.id);
  return { ok: true, subscription: subscription.summarize(profile) };
});

ipcMain.handle('subscription:startCheckout', async (_, { planId }) => {
  const user = store.get('authUser', null);
  if (!user) return { ok: false, status: 'unauthenticated', error: 'You must be signed in to subscribe.' };
  const mapping = PLAN_TO_PRICE[planId];
  if (!mapping) return { ok: false, status: 'error', error: `Unknown plan: ${planId}` };
  const priceId = mapping.priceId();
  if (!priceId) {
    return {
      ok: false,
      status: 'error',
      error: `Missing STRIPE_PRICE_${planId.toUpperCase()} in .env`,
    };
  }
  try {
    const result = await startVerifiedCheckout({
      priceId,
      mode: mapping.mode,
      user,
      planId,
    });
    if (result.status === 'paid') {
      const receipt = result.session && result.session.id ? result.session.id : null;
      const profile = subscription.activatePaidPlan(store, user.id, planId, receipt);
      const summary = subscription.summarize(profile);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('subscription:updated', summary);
      }
      return { ok: true, status: 'paid', subscription: summary };
    }
    return { ok: false, status: result.status, error: result.error };
  } catch (err) {
    return { ok: false, status: 'error', error: err && err.message ? err.message : String(err) };
  }
});
