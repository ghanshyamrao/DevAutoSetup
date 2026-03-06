import { Zap, RefreshCw, Shield, LayoutGrid } from 'lucide-react';
import { APP_NAME } from '../../../lib/appInfo';

export function FeatureOverviewStep() {
  const features = [
    { Icon: Zap, title: 'One-Click Provisioning', desc: 'Instantly install required runtimes, linters, and compilers with our automated winget integration.' },
    { Icon: RefreshCw, title: 'Configuration Sync', desc: 'Keep your catalog and installed software in sync across the app.' },
    { Icon: Shield, title: 'Automated Permissions', desc: 'Seamlessly handle admin elevation and system path modifications when needed.' },
    { Icon: LayoutGrid, title: 'Workspace Ready', desc: 'Bootstrap your developer environment with a curated software catalog.' },
  ];

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 700 }}>Discover Powerful Features</h1>
      <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {APP_NAME} streamlines your environment setup with automated tools, intelligent configurations, and a unified workspace.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 32 }}>
        {features.map(({ Icon, title, desc }) => (
          <div
            key={title}
            style={{
              padding: 20,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Icon size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
