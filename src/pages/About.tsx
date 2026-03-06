import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION, APP_AUTHOR, APP_AUTHOR_EMAIL, APP_LICENSE, APP_VERSION } from '../lib/appInfo';

export function About() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div className="about-hero" style={{ textAlign: 'center', marginBottom: 32 }}>
        <div className="logo-css logo-css--large" style={{ margin: '0 auto 12px' }} aria-hidden>
          <div className="logo-css__inner">
            <div className="logo-css__cell" />
            <div className="logo-css__cell" />
            <div className="logo-css__cell" />
            <div className="logo-css__cell" />
          </div>
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '0.04em' }}>{APP_NAME.toUpperCase()}</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
          {APP_TAGLINE}
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>Version {APP_VERSION}</p>
      </div>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          maxWidth: 560,
        }}
      >
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
          {APP_DESCRIPTION}
        </p>
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Developer:</strong> {APP_AUTHOR}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Email:</strong>{' '}
            <a href={`mailto:${APP_AUTHOR_EMAIL}`} style={{ color: 'var(--accent)' }}>{APP_AUTHOR_EMAIL}</a>
          </p>
          <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
        <p style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
          {APP_LICENSE} License
        </p>
      </div>
    </div>
  );
}
