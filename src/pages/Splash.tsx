import { Loader2 } from 'lucide-react';
import { APP_NAME } from '../lib/appInfo';

export function Splash() {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: 24,
      }}
    >
      <div className="logo-css logo-css--large" style={{ marginBottom: 24 }} aria-hidden>
        <div className="logo-css__inner">
          <div className="logo-css__cell" />
          <div className="logo-css__cell" />
          <div className="logo-css__cell" />
          <div className="logo-css__cell" />
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', marginBottom: 24 }}>{APP_NAME}</div>
      <Loader2
        size={32}
        className="spinner"
        style={{ color: 'var(--accent)', display: 'inline-block' }}
      />
    </div>
  );
}
