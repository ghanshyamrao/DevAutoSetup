import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Lock, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type NotificationKind = 'info' | 'success' | 'warning' | 'locked';

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  message?: string;
  actionLabel?: string;
  actionTo?: string;
};

type NotificationContextValue = {
  notify: (n: Omit<NotificationItem, 'id'>) => void;
  notifyLocked: (message: string) => void;
  dismiss: (id: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const DURATION_MS = 6000;

const KIND_STYLES: Record<NotificationKind, { bg: string; border: string; color: string; Icon: typeof Info }> = {
  info: { bg: 'rgba(59, 130, 246, 0.14)', border: '#3b82f6', color: '#93c5fd', Icon: Info },
  success: { bg: 'rgba(34, 197, 94, 0.14)', border: '#22c55e', color: '#86efac', Icon: CheckCircle2 },
  warning: { bg: 'rgba(245, 158, 11, 0.14)', border: '#f59e0b', color: '#fcd34d', Icon: AlertTriangle },
  locked: { bg: 'rgba(139, 92, 246, 0.16)', border: '#8b5cf6', color: '#c4b5fd', Icon: Lock },
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const navigate = useNavigate();

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback((n: Omit<NotificationItem, 'id'>) => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { ...n, id }]);
    setTimeout(() => dismiss(id), DURATION_MS);
  }, [dismiss]);

  const notifyLocked = useCallback((message: string) => {
    notify({
      kind: 'locked',
      title: 'Locked resource',
      message,
      actionLabel: 'View plans',
      actionTo: '/pricing',
    });
  }, [notify]);

  const value = useMemo(() => ({ notify, notifyLocked, dismiss }), [notify, notifyLocked, dismiss]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 2000,
          maxWidth: 380,
          width: 'min(380px, calc(100vw - 40px))',
        }}
      >
        {items.map((n) => {
          const s = KIND_STYLES[n.kind];
          const Icon = s.Icon;
          return (
            <div
              key={n.id}
              style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 10,
                padding: '12px 14px',
                display: 'flex',
                gap: 10,
                color: 'var(--text-primary)',
                boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <Icon size={20} style={{ color: s.color, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: s.color }}>{n.title}</div>
                {n.message && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                    {n.message}
                  </div>
                )}
                {n.actionLabel && n.actionTo && (
                  <button
                    type="button"
                    onClick={() => { navigate(n.actionTo!); dismiss(n.id); }}
                    style={{
                      marginTop: 8,
                      background: s.border,
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {n.actionLabel}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(n.id)}
                aria-label="Dismiss"
                style={{
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  alignSelf: 'flex-start',
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}

export function useTrialExpiringWarning(daysRemaining: number | null, planId: string) {
  const { notify } = useNotifications();
  useEffect(() => {
    if (planId !== 'pro' || daysRemaining == null) return;
    if (daysRemaining > 0 && daysRemaining <= 3) {
      notify({
        kind: 'warning',
        title: 'Subscription renews soon',
        message: `Your Pro plan renews in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`,
        actionLabel: 'Manage plan',
        actionTo: '/account',
      });
    }
  }, [daysRemaining, planId, notify]);
}
