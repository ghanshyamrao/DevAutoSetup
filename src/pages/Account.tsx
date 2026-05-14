import { useNavigate } from 'react-router-dom';
import { LogOut, Crown, Calendar, Package as PackageIcon, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { expiryBadge, installsBadge } from '../lib/entitlements';

export function Account() {
  const navigate = useNavigate();
  const { user, subscription, signOut } = useAuth();

  if (!user) {
    return (
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Account</h1>
        <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>Sign in to view your account.</p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          style={{
            marginTop: 12,
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
          }}
        >
          Sign in
        </button>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Account</h1>
      <p style={{ margin: '4px 0 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
        Manage your profile and subscription.
      </p>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Avatar user={user} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{user.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user.email}</div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            padding: '8px 14px',
            borderRadius: 'var(--radius)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Crown size={18} style={{ color: 'var(--accent)' }} />
          <strong>Subscription</strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Stat label="Current plan" value={subscription.planLabel} />
          <Stat label="Installs" value={installsBadge(subscription)} Icon={PackageIcon} />
          <Stat label="Validity" value={expiryBadge(subscription) || '-'} Icon={Calendar} />
          <Stat label="Manage software" value={subscription.manageEnabled ? 'Enabled' : 'Locked'} Icon={SettingsIcon} />
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => navigate('/pricing')}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {subscription.planId === 'lifetime' ? 'View plans' : 'Upgrade plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Avatar({ user }: { user: { picture: string | null; name: string } }) {
  if (user.picture) {
    return (
      <img
        src={user.picture}
        alt={user.name}
        width={56}
        height={56}
        style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
        referrerPolicy="no-referrer"
      />
    );
  }
  const initial = user.name?.[0]?.toUpperCase() || '?';
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'var(--accent)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        fontWeight: 700,
      }}
    >
      {initial}
    </div>
  );
}

function Stat({ label, value, Icon }: { label: string; value: string; Icon?: typeof PackageIcon }) {
  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 12,
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
        {Icon && <Icon size={14} style={{ color: 'var(--text-secondary)' }} />}
        {value}
      </div>
    </div>
  );
}
