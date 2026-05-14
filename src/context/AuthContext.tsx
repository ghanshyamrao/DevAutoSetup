import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthUser, SubscriptionSummary } from '../vite-env';

type AuthState = {
  ready: boolean;
  user: AuthUser | null;
  subscription: SubscriptionSummary;
};

const DEFAULT_SUBSCRIPTION: SubscriptionSummary = {
  planId: 'none',
  planLabel: 'Not signed in',
  installLimit: 0,
  installsUsed: 0,
  installsRemaining: 0,
  manageEnabled: false,
  expiresAt: null,
  daysRemaining: 0,
  expired: true,
  trialActive: false,
};

type CheckoutStatus = 'paid' | 'cancelled' | 'unpaid' | 'timeout' | 'error' | 'unauthenticated';

type AuthContextValue = AuthState & {
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  subscribeAndVerify: (planId: string) => Promise<{ ok: boolean; status: CheckoutStatus; error?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const WEB_FALLBACK_USER_KEY = 'devonboard_web_user';
const WEB_FALLBACK_SUB_KEY = 'devonboard_web_subscription';

function loadWebFallbackUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(WEB_FALLBACK_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function loadWebFallbackSub(): SubscriptionSummary {
  try {
    const raw = localStorage.getItem(WEB_FALLBACK_SUB_KEY);
    if (!raw) return DEFAULT_SUBSCRIPTION;
    return JSON.parse(raw) as SubscriptionSummary;
  } catch {
    return DEFAULT_SUBSCRIPTION;
  }
}

function saveWebFallbackSub(sub: SubscriptionSummary) {
  try {
    localStorage.setItem(WEB_FALLBACK_SUB_KEY, JSON.stringify(sub));
  } catch {
    // noop
  }
}

function makeTrialSummary(): SubscriptionSummary {
  return {
    planId: 'free',
    planLabel: 'Free',
    installLimit: 3,
    installsUsed: 0,
    installsRemaining: 3,
    manageEnabled: false,
    expiresAt: null,
    daysRemaining: null,
    expired: false,
    trialActive: true,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    ready: false,
    user: null,
    subscription: DEFAULT_SUBSCRIPTION,
  });

  const refresh = useCallback(async () => {
    const api = window.electronAPI;
    if (api?.authStatus) {
      try {
        const status = await api.authStatus();
        setState({ ready: true, user: status.user, subscription: status.subscription });
        return;
      } catch {
        // Fall through to web fallback.
      }
    }
    const user = loadWebFallbackUser();
    let sub = loadWebFallbackSub();
    if (user && (!sub || sub.planId === 'none')) {
      sub = makeTrialSummary();
      saveWebFallbackSub(sub);
    }
    setState({
      ready: true,
      user,
      subscription: user ? sub : DEFAULT_SUBSCRIPTION,
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onSubscriptionUpdated) return;
    const off = api.onSubscriptionUpdated((sub) => {
      setState((s) => ({ ...s, subscription: sub }));
    });
    return off;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const api = window.electronAPI;
    if (api?.signInWithGoogle) {
      const result = await api.signInWithGoogle();
      if (!result.ok) return { ok: false, error: result.error };
      setState({
        ready: true,
        user: result.user || null,
        subscription: result.subscription || DEFAULT_SUBSCRIPTION,
      });
      return { ok: true };
    }
    const mockUser: AuthUser = {
      id: 'web-demo-user',
      email: 'demo@devonboard.local',
      name: 'Demo User',
      picture: null,
      email_verified: true,
    };
    const sub = makeTrialSummary();
    try { localStorage.setItem(WEB_FALLBACK_USER_KEY, JSON.stringify(mockUser)); } catch { }
    saveWebFallbackSub(sub);
    setState({ ready: true, user: mockUser, subscription: sub });
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    const api = window.electronAPI;
    if (api?.signOut) await api.signOut();
    try {
      localStorage.removeItem(WEB_FALLBACK_USER_KEY);
      localStorage.removeItem(WEB_FALLBACK_SUB_KEY);
    } catch { }
    setState({ ready: true, user: null, subscription: DEFAULT_SUBSCRIPTION });
  }, []);

  const refreshSubscription = useCallback(async () => {
    const api = window.electronAPI;
    if (api?.getSubscription) {
      try {
        const { subscription } = await api.getSubscription();
        setState((s) => ({ ...s, subscription }));
        return;
      } catch { }
    }
    setState((s) => ({ ...s, subscription: loadWebFallbackSub() }));
  }, []);

  const subscribeAndVerify = useCallback(async (planId: string): Promise<{ ok: boolean; status: CheckoutStatus; error?: string }> => {
    const api = window.electronAPI;
    if (!api?.startCheckout) {
      return { ok: false, status: 'error', error: 'Checkout is only available in the desktop app.' };
    }
    const result = await api.startCheckout(planId);
    if (result.ok && result.subscription) {
      setState((s) => ({ ...s, subscription: result.subscription as SubscriptionSummary }));
    }
    return { ok: result.ok, status: result.status, error: result.error };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    signInWithGoogle,
    signOut,
    refreshSubscription,
    subscribeAndVerify,
  }), [state, signInWithGoogle, signOut, refreshSubscription, subscribeAndVerify]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
