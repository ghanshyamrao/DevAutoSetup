const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  checkOnboardingStatus: () => ipcRenderer.invoke('onboarding:status'),
  completeOnboarding: () => ipcRenderer.invoke('onboarding:complete'),
  checkAdmin: () => ipcRenderer.invoke('check:admin'),
  checkInternet: () => ipcRenderer.invoke('check:internet'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getCatalogList: () => ipcRenderer.invoke('catalog:list'),
  checkWinget: () => ipcRenderer.invoke('check:winget'),
  wingetListInstalled: () => ipcRenderer.invoke('winget:list'),
  wingetShow: (payload) => ipcRenderer.invoke('winget:show', payload),
  wingetUninstall: (payload) => ipcRenderer.invoke('winget:uninstall', payload),
  wingetInstall: (payload) => ipcRenderer.invoke('winget:install', payload),
  cancelInstall: () => ipcRenderer.invoke('winget:cancelInstall'),
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
  authStatus: () => ipcRenderer.invoke('auth:status'),
  signInWithGoogle: () => ipcRenderer.invoke('auth:google'),
  signOut: () => ipcRenderer.invoke('auth:signOut'),
  getSubscription: () => ipcRenderer.invoke('subscription:get'),
  checkInstallAllowed: () => ipcRenderer.invoke('subscription:checkInstall'),
  checkManageAllowed: () => ipcRenderer.invoke('subscription:checkManage'),
  recordInstall: () => ipcRenderer.invoke('subscription:recordInstall'),
  startCheckout: (planId) => ipcRenderer.invoke('subscription:startCheckout', { planId }),
  onSubscriptionUpdated: (cb) => {
    const handler = (_, data) => cb(data);
    ipcRenderer.on('subscription:updated', handler);
    return () => ipcRenderer.removeListener('subscription:updated', handler);
  },
});
