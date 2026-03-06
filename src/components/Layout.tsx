import { useEffect, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { WifiOff, RefreshCw, Settings } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { APP_NAME } from '../lib/appInfo';

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

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', flexDirection: 'column', overflow: 'hidden' }}>
      <Sidebar style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, flexShrink: 0, overflow: 'hidden', zIndex: 10 }} />
      <main style={{ flex: 1, marginLeft: SIDEBAR_WIDTH, padding: 24, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
