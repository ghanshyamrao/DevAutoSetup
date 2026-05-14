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
  Crown,
  User,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import { APP_NAME, APP_VERSION, APP_TAGLINE } from '../lib/appInfo';
import { useAuth } from '../context/AuthContext';

const mainNav: { to: string; label: string; Icon: LucideIcon; key?: string }[] = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/catalog', label: 'Software Catalog', Icon: Library },
  { to: '/queue', label: 'Installation Queue', Icon: ListOrdered },
  { to: '/logs', label: 'Installation Logs', Icon: ScrollText },
  { to: '/manage', label: 'Manage Software', Icon: PackageMinus, key: 'manage' },
];

const accountNav: { to: string; label: string; Icon: LucideIcon }[] = [
  { to: '/account', label: 'Account', Icon: User },
  { to: '/pricing', label: 'Plans & Pricing', Icon: Crown },
];

const systemNav: { to: string; label: string; Icon: LucideIcon }[] = [
  { to: '/settings', label: 'Settings', Icon: Settings },
  { to: '/about', label: 'About', Icon: Info },
];

export function Sidebar({ style = {} }: { style?: React.CSSProperties }) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const { subscription } = useAuth();

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

  const manageLocked = !subscription.manageEnabled;

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
      <nav style={{ flex: 1, paddingTop: 12, overflowY: 'auto' }}>
        <SectionLabel>Main Menu</SectionLabel>
        {mainNav.map(({ to, label, Icon, key }) => {
          const isLocked = key === 'manage' && manageLocked;
          return (
            <NavLinkRow
              key={to}
              to={to}
              label={label}
              Icon={Icon}
              end={to === '/'}
              locked={isLocked}
            />
          );
        })}
        <SectionLabel style={{ marginTop: 12 }}>Account</SectionLabel>
        {accountNav.map(({ to, label, Icon }) => (
          <NavLinkRow key={to} to={to} label={label} Icon={Icon} />
        ))}
        <SectionLabel style={{ marginTop: 12 }}>System</SectionLabel>
        {systemNav.map(({ to, label, Icon }) => (
          <NavLinkRow key={to} to={to} label={label} Icon={Icon} />
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

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 10,
        color: 'var(--text-secondary)',
        padding: '0 16px 6px',
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function NavLinkRow({
  to,
  label,
  Icon,
  end,
  locked,
}: {
  to: string;
  label: string;
  Icon: LucideIcon;
  end?: boolean;
  locked?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
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
        position: 'relative',
      })}
    >
      <Icon size={18} strokeWidth={2} style={{ opacity: 0.9, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      {locked && <Lock size={13} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />}
    </NavLink>
  );
}
