import { useEffect, useState } from 'react';
import { Wifi, Package, Shield, Code2 } from 'lucide-react';

type Check = { label: string; desc: string; status: 'pending' | 'ok' | 'fail'; action?: string };

const INITIAL: Check[] = [
  { label: 'Network Connection', desc: 'Required to download packages.', status: 'pending' },
  { label: 'Winget Package Manager', desc: 'Used to install system-level dependencies.', status: 'pending' },
  { label: 'Administrator Privileges', desc: 'Required for elevated setup when needed.', status: 'pending' },
  { label: 'Developer Mode', desc: 'Enable for symlinks and advanced tools.', status: 'pending' },
];

const ICONS = [Wifi, Package, Shield, Code2];

export function SystemCheckStep() {
  const [checks, setChecks] = useState<Check[]>(INITIAL);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) {
      setChecks((c) => c.map((x, i) => ({ ...x, status: i < 2 ? 'ok' : 'pending' })));
      return;
    }
    Promise.all([api.checkInternet(), api.checkWinget(), api.checkAdmin()]).then(([internet, winget, admin]) => {
      setChecks((c) => [
        { ...c[0], status: internet.connected ? 'ok' : 'fail' },
        { ...c[1], status: winget.available ? 'ok' : 'fail' },
        { ...c[2], status: admin.granted ? 'ok' : 'pending', action: admin.granted ? undefined : 'Request Access' },
        c[3],
      ]);
    });
  }, []);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 700 }}>System Permissions</h1>
      <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        DevOnboard requires specific system access to configure your environment.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
        {checks.map((check, i) => {
          const Icon = ICONS[i];
          return (
            <div
              key={check.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} style={{ color: 'var(--accent)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{check.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{check.desc}</div>
              </div>
              {check.status === 'ok' && (
                <span style={{ display: 'inline-flex', padding: '6px 12px', background: 'rgba(124, 58, 237, 0.2)', color: 'var(--accent)', borderRadius: 6, fontSize: 13 }}>
                  ✓ OK
                </span>
              )}
              {check.status === 'fail' && <span style={{ fontSize: 13, color: 'var(--error)' }}>Not available</span>}
              {check.action && (
                <button type="button" style={{ padding: '6px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
                  {check.action}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
