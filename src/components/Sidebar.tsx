import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Library,
  ListOrdered,
  ScrollText,
  PackageMinus,
  Settings,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { APP_NAME, APP_VERSION, APP_TAGLINE } from '../lib/appInfo';

const nav: { to: string; label: string; Icon: LucideIcon }[] = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/catalog', label: 'Software Catalog', Icon: Library },
  { to: '/queue', label: 'Installation Queue', Icon: ListOrdered },
  { to: '/logs', label: 'Installation Logs', Icon: ScrollText },
  { to: '/manage', label: 'Manage Software', Icon: PackageMinus },
  { to: '/settings', label: 'Settings', Icon: Settings },
  { to: '/about', label: 'About', Icon: Info },
];

export function Sidebar({ style = {} }: { style?: React.CSSProperties }) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

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

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 0',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div className="sidebar-brand" style={{ padding: '0 16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-css" aria-hidden>
            <div className="logo-css__inner">
              <div className="logo-css__cell" />
              <div className="logo-css__cell" />
              <div className="logo-css__cell" />
              <div className="logo-css__cell" />
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.02em' }}>{APP_NAME}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>
              {APP_TAGLINE}
            </div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, paddingTop: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', padding: '0 16px 6px', textTransform: 'uppercase' }}>
          Main Menu
        </div>
        {nav.slice(0, 5).map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              margin: '0 8px',
              borderRadius: 6,
              color: isActive ? '#fff' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent)' : 'transparent',
              textDecoration: 'none',
              fontSize: 14,
            })}
          >
            <Icon size={18} strokeWidth={2} style={{ opacity: 0.9, flexShrink: 0 }} />
            {label}
          </NavLink>
        ))}
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', padding: '16px 16px 6px', textTransform: 'uppercase' }}>
          System
        </div>
        {nav.slice(5).map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              margin: '0 8px',
              borderRadius: 6,
              color: isActive ? '#fff' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent)' : 'transparent',
              textDecoration: 'none',
              fontSize: 14,
            })}
          >
            <Icon size={18} strokeWidth={2} style={{ opacity: 0.9, flexShrink: 0 }} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div
        style={{
          flexShrink: 0,
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '10px 12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              flexShrink: 0,
              marginTop: 6,
              background: isOnline ? 'var(--success)' : 'var(--error)',
            }}
            aria-hidden
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
              {isOnline ? 'System Online' : 'System Offline'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              v{APP_VERSION} – {isOnline ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
