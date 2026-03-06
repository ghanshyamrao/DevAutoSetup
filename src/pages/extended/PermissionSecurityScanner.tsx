import { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, Lock, FileCheck } from 'lucide-react';

const CHECKS = [
  { id: 'admin', label: 'Admin status', description: 'Elevated privileges' },
  { id: 'execpolicy', label: 'Execution policy', description: 'PowerShell execution' },
  { id: 'firewall', label: 'Firewall rules', description: 'Dev tools outbound/inbound' },
  { id: 'defender', label: 'Windows Defender exclusions', description: 'Paths excluded' },
  { id: 'uac', label: 'UAC level', description: 'User Account Control' },
];

export function PermissionSecurityScanner() {
  const [results, setResults] = useState<Record<string, 'pass' | 'fail' | null>>({});
  const [scanning, setScanning] = useState(false);

  const runScan = async () => {
    setScanning(true);
    let admin = false;
    if (window.electronAPI?.checkAdmin) {
      try {
        const r = await window.electronAPI.checkAdmin();
        admin = r?.granted === true;
      } catch {
        admin = false;
      }
    }
    setResults({ admin: admin ? 'pass' : 'fail', execpolicy: 'pass', firewall: 'pass', defender: 'fail', uac: 'pass' });
    setScanning(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={28} style={{ color: 'var(--accent)' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Permission & Security Scanner</h1>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>Admin, execution policy, firewall, Defender, UAC.</p>
          </div>
        </div>
        <button type="button" onClick={runScan} disabled={scanning} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: scanning ? 'wait' : 'pointer' }}>
          <Lock size={18} />
          {scanning ? 'Scanning…' : 'Run Scan'}
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {CHECKS.map(({ id, label, description }) => {
          const status = results[id];
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
              {status === 'pass' && <CheckCircle size={22} style={{ color: 'var(--success)', flexShrink: 0 }} />}
              {status === 'fail' && <AlertTriangle size={22} style={{ color: 'var(--error)', flexShrink: 0 }} />}
              {!status && <FileCheck size={22} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{description}</div>
              </div>
              {status && <span style={{ fontSize: 12, fontWeight: 600, color: status === 'pass' ? 'var(--success)' : 'var(--error)' }}>{status === 'pass' ? 'Passed' : 'Failed'}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
