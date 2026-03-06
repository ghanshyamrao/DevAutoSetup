import { Palette, Bell, Layout } from 'lucide-react';

export function PreferencesStep() {
  const items = [
    { Icon: Palette, title: 'Theme', desc: 'Dark theme is applied by default. Change appearance later in Settings.' },
    { Icon: Bell, title: 'Notifications', desc: 'Get notified when installations complete or updates are available.' },
    { Icon: Layout, title: 'Layout', desc: 'Sidebar and catalog layout can be adjusted from the main app.' },
  ];

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 700 }}>Preferences</h1>
      <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        A few options you can customize now. You can change these anytime from Settings.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
        {items.map(({ Icon, title, desc }) => (
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
