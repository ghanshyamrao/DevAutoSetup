import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldCheck, Package, CreditCard } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../lib/appInfo';
import { useAuth } from '../context/AuthContext';

const HIGHLIGHTS = [
  { Icon: ShieldCheck, title: 'Secure Google sign-in', body: 'OAuth via your Google account - no passwords to manage.' },
  { Icon: Package, title: '14-day free trial', body: 'Try DevOnboard with 1 free install. No card required.' },
  { Icon: CreditCard, title: 'Upgrade any time', body: 'Monthly, yearly, or lifetime plans via Stripe.' },
];

export function Login() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from || '/';

  const handleSignIn = async () => {
    setBusy(true);
    setError(null);
    const result = await signInWithGoogle();
    setBusy(false);
    if (!result.ok) {
      setError(result.error || 'Sign-in failed. Please try again.');
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 920,
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 360px)',
          gap: 32,
          alignItems: 'center',
        }}
      >
        <div>
          <div className="logo-css logo-css--large" style={{ marginBottom: 16 }} aria-hidden>
            <div className="logo-css__inner">
              <div className="logo-css__cell" />
              <div className="logo-css__cell" />
              <div className="logo-css__cell" />
              <div className="logo-css__cell" />
            </div>
          </div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>Welcome to {APP_NAME}</h1>
          <p style={{ margin: '8px 0 24px', color: 'var(--text-secondary)', fontSize: 15 }}>
            {APP_TAGLINE}. Sign in to start your free trial.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {HIGHLIGHTS.map(({ Icon, title, body }) => (
              <li key={title} style={{ display: 'flex', gap: 12 }}>
                <Icon size={22} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{body}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Sign in</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Use your Google account to continue. We&apos;ll open your default browser to authorize.
          </p>
          <button
            type="button"
            onClick={handleSignIn}
            disabled={busy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: '#fff',
              color: '#111',
              border: '1px solid #dadce0',
              padding: '11px 18px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: busy ? 'wait' : 'pointer',
              marginTop: 8,
            }}
          >
            {busy ? (
              <Loader2 size={18} className="spinner" style={{ display: 'inline-block' }} />
            ) : (
              <GoogleGlyph />
            )}
            {busy ? 'Waiting for Google...' : 'Continue with Google'}
          </button>
          {error && (
            <div
              style={{
                marginTop: 4,
                padding: '10px 12px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid var(--error)',
                color: 'var(--error)',
                fontSize: 13,
                borderRadius: 8,
              }}
            >
              {error}
            </div>
          )}
          <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            By signing in you agree to start a 14-day free trial. You can upgrade or cancel any time.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.63z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.46-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.94v2.33A8.99 8.99 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.94A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.94 4.05l3.03-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 .94 4.95l3.03 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  );
}
