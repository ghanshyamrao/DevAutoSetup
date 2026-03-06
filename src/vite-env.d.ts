import 'vite/client';

interface Window {
  electronAPI?: {
    checkOnboardingStatus: () => Promise<{ completed: boolean }>;
    completeOnboarding: () => Promise<{ ok: boolean }>;
    checkAdmin: () => Promise<{ granted: boolean }>;
    checkInternet: () => Promise<{ connected: boolean }>;
    checkWinget: () => Promise<{ available: boolean; version: string | null }>;
    openExternal: (url: string) => Promise<void>;
    wingetListInstalled: () => Promise<{ ids: string[]; entries?: { id: string; name: string }[] }>;
    wingetShow: (payload: { wingetId: string }) => Promise<{ versions: string[]; description: string | null }>;
    wingetUninstall: (payload: { wingetId: string }) => Promise<{ success: boolean; stdout: string; stderr: string }>;
    wingetInstall: (payload: { wingetId: string; version?: string }) => Promise<{ success: boolean; code?: number; stdout: string; stderr: string }>;
    runPowerShellScript: (script: string) => Promise<{ stdout?: string; stderr?: string; code?: number }>;
    updateCheck: () => Promise<unknown>;
    updateQuitAndInstall: () => Promise<void>;
    onUpdateAvailable: (cb: () => void) => () => void;
    onUpdateDownloaded: (cb: () => void) => () => void;
    onWingetLog: (cb: (data: { type: string; text: string }) => void) => () => void;
  };
}
