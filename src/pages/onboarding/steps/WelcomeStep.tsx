import { Zap, Shield, Settings } from 'lucide-react';
import { APP_NAME } from '../../../lib/appInfo';

const ITEMS = [
  { Icon: Zap, title: 'Lightning Fast Setup', desc: 'Automate your entire toolchain installation and configuration in seconds.' },
  { Icon: Shield, title: 'Secure by Default', desc: 'System permissions and access rights are handled securely and transparently.' },
  { Icon: Settings, title: 'Fully Customizable', desc: 'Tailor every aspect of your development environment to your exact needs.' },
];

export function WelcomeStep() {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 700 }}>Welcome to {APP_NAME}</h1>
      <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Get your development environment set up in minutes.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
        {ITEMS.map(({ Icon, title, desc }) => (
          <div
            key={title}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              padding: 16,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
