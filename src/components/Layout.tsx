import { useEffect, useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { WifiOff, RefreshCw, Settings, Crown, LogOut, User } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { APP_NAME } from '../lib/appInfo';
import { useAuth } from '../context/AuthContext';
import { useTrialExpiringWarning } from './Notifications';
import { expiryBadge, installsBadge } from '../lib/entitlements';

const SIDEBAR_WIDTH = 220;

const TROUBLESHOOTING_STEPS = [
  'Check your network cables, modem, and router.',
  'Reconnect to Wi-Fi if your connection has dropped.',
  "Ensure proxy or firewall settings aren't blocking external connections.",
];

export function Layout() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [retrying, setRetrying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, subscription, signOut } = useAuth();

  useTrialExpiringWarning(subscription.daysRemaining, subscription.planId);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);

  const tryAgain = useCallback(async () => {
    setRetrying(true);
    const api = window.electronAPI;
    if (api?.checkInternet) {
      try {
        const { connected } = await api.checkInternet();
        setIsOnline(connected);
      } catch {
        setIsOnline(navigator.onLine);
      }
    } else {
      setIsOnline(navigator.onLine);
    }
    setRetrying(false);
  }, []);

  const openNetworkSettings = useCallback(() => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal('ms-settings:network');
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  if (!isOnline) {
    return (
      <div style={{ display: 'flex', flex: 1, minHeight: '100vh', flexDirection: 'column', overflow: 'hidden' }}>
        <Sidebar style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, flexShrink: 0, overflow: 'hidden', zIndex: 10 }} />
        <main
          style={{
            flex: 1,
            marginLeft: SIDEBAR_WIDTH,
            padding: 24,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'var(--bg-primary)',
          }}
        >
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              flexShrink: 0,
              marginBottom: 24,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 999,
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid var(--error)',
                color: 'var(--error)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <WifiOff size={14} />
              Offline Mode
            </span>
          </header>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 24,
              maxWidth: 480,
              margin: '0 auto',
            }}
          >
            <WifiOff size={72} style={{ color: 'var(--error)', marginBottom: 24 }} strokeWidth={1.5} />
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>
              No Internet Connection
            </h1>
            <p style={{ margin: '12px 0 0', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {APP_NAME} requires an active internet connection to fetch the software catalog and download packages
              via winget. Please connect to the internet to continue.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={tryAgain}
                disabled={retrying}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: retrying ? 'wait' : 'pointer',
                }}
              >
                <RefreshCw size={18} className={retrying ? 'spinner' : ''} style={retrying ? { animation: 'spin 0.8s linear infinite' } : {}} />
                Try Again
              </button>
              {typeof window.electronAPI?.openExternal === 'function' && (
                <button
                  type="button"
                  onClick={openNetworkSettings}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <Settings size={18} />
                  Network Settings
                </button>
              )}
            </div>
            <div style={{ marginTop: 32, textAlign: 'left', width: '100%' }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Troubleshooting steps:
              </h2>
              <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8 }}>
                {TROUBLESHOOTING_STEPS.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const trialExpired = subscription.expired && subscription.planId !== 'lifetime' && subscription.planId !== 'free';

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', flexDirection: 'column', overflow: 'hidden' }}>
      <Sidebar style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, flexShrink: 0, overflow: 'hidden', zIndex: 10 }} />
      <main style={{ flex: 1, marginLeft: SIDEBAR_WIDTH, padding: 24, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            marginBottom: 16,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/pricing')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              background: trialExpired ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.14)',
              border: `1px solid ${trialExpired ? 'var(--error)' : 'var(--accent)'}`,
              color: trialExpired ? 'var(--error)' : 'var(--accent)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title={`${subscription.planLabel} - ${installsBadge(subscription)}`}
          >
            <Crown size={14} />
            {trialExpired ? 'Plan expired - upgrade' : `${subscription.planLabel} - ${expiryBadge(subscription) || installsBadge(subscription)}`}
          </button>
          {user && (
            <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 10px 4px 4px',
                  borderRadius: 999,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt=""
                    width={26}
                    height={26}
                    style={{ borderRadius: '50%' }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </span>
              </button>
              {menuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    minWidth: 200,
                    padding: 6,
                    boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
                    zIndex: 50,
                  }}
                >
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{user.email}</div>
                  </div>
                  <MenuButton Icon={User} label="My account" onClick={() => { setMenuOpen(false); navigate('/account'); }} />
                  <MenuButton Icon={Crown} label="Plans & pricing" onClick={() => { setMenuOpen(false); navigate('/pricing'); }} />
                  <MenuButton Icon={LogOut} label="Sign out" onClick={() => { setMenuOpen(false); handleSignOut(); }} danger />
                </div>
              )}
            </div>
          )}
        </header>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function MenuButton({
  Icon,
  label,
  onClick,
  danger,
}: {
  Icon: typeof User;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '8px 10px',
        background: 'transparent',
        border: 'none',
        color: danger ? 'var(--error)' : 'var(--text-primary)',
        fontSize: 13,
        textAlign: 'left',
        borderRadius: 6,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon size={15} />
      <span>{label}</span>
    </button>
  );
}
