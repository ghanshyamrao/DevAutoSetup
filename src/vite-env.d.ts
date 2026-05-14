import 'vite/client';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  email_verified: boolean;
};

export type SubscriptionSummary = {
  planId: 'none' | 'free' | 'pro' | 'lifetime' | 'expired';
  planLabel: string;
  installLimit: number | null;
  installsUsed: number;
  installsRemaining: number | null;
  manageEnabled: boolean;
  expiresAt: number | null;
  daysRemaining: number | null;
  expired: boolean;
  trialActive: boolean;
};

export type EntitlementResult = { allowed: boolean; reason?: string };

declare global {
  interface Window {
    electronAPI?: {
      checkOnboardingStatus: () => Promise<{ completed: boolean }>;
      completeOnboarding: () => Promise<{ ok: boolean }>;
      checkAdmin: () => Promise<{ granted: boolean }>;
      checkInternet: () => Promise<{ connected: boolean }>;
      getCatalogList: () => Promise<unknown[]>;
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
      authStatus: () => Promise<{ signedIn: boolean; user: AuthUser | null; subscription: SubscriptionSummary }>;
      signInWithGoogle: () => Promise<{ ok: boolean; user?: AuthUser; subscription?: SubscriptionSummary; error?: string }>;
      signOut: () => Promise<{ ok: boolean }>;
      getSubscription: () => Promise<{ subscription: SubscriptionSummary }>;
      checkInstallAllowed: () => Promise<EntitlementResult>;
      checkManageAllowed: () => Promise<EntitlementResult>;
      recordInstall: () => Promise<{ ok: boolean; subscription?: SubscriptionSummary }>;
      startCheckout: (planId: string) => Promise<{
        ok: boolean;
        status: 'paid' | 'cancelled' | 'unpaid' | 'timeout' | 'error' | 'unauthenticated';
        subscription?: SubscriptionSummary;
        error?: string;
      }>;
      onSubscriptionUpdated: (cb: (data: SubscriptionSummary) => void) => () => void;
    };
  }
}

export {};
