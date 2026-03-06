const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  checkOnboardingStatus: () => ipcRenderer.invoke('onboarding:status'),
  completeOnboarding: () => ipcRenderer.invoke('onboarding:complete'),
  checkAdmin: () => ipcRenderer.invoke('check:admin'),
  checkInternet: () => ipcRenderer.invoke('check:internet'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  checkWinget: () => ipcRenderer.invoke('check:winget'),
  wingetListInstalled: () => ipcRenderer.invoke('winget:list'),
  wingetShow: (payload) => ipcRenderer.invoke('winget:show', payload),
  wingetUninstall: (payload) => ipcRenderer.invoke('winget:uninstall', payload),
  wingetInstall: (payload) => ipcRenderer.invoke('winget:install', payload),
  runPowerShellScript: (script) => ipcRenderer.invoke('run-powershell-script', script),
  updateCheck: () => ipcRenderer.invoke('update:check'),
  updateQuitAndInstall: () => ipcRenderer.invoke('update:quitAndInstall'),
  onUpdateAvailable: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('update:available', handler);
    return () => ipcRenderer.removeListener('update:available', handler);
  },
  onUpdateDownloaded: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('update:downloaded', handler);
    return () => ipcRenderer.removeListener('update:downloaded', handler);
  },
  onWingetLog: (cb) => {
    const handler = (_, data) => cb(data);
    ipcRenderer.on('winget:log', handler);
    return () => ipcRenderer.removeListener('winget:log', handler);
  },
});
