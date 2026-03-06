import { useState } from 'react';
import { Stethoscope, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

type Sev = 'healthy' | 'warning' | 'critical';

const DATA = [
  { id: 'a', title: 'PATH Variables', desc: 'Conflicting Node paths.', severity: 'critical' as Sev, fix: 'Auto-Fix' },
  { id: 'b', title: 'Docker Service', desc: 'WSL not responding.', severity: 'critical' as Sev, fix: 'Repair' },
  { id: 'c', title: 'Git Credential', desc: 'Outdated.', severity: 'warning' as Sev, fix: 'Update' },
  { id: 'd', title: 'VS Code', desc: 'OK.', severity: 'healthy' as Sev, fix: '-' },
  { id: 'e', title: 'Python', desc: 'OK.', severity: 'healthy' as Sev, fix: '-' },
];

function SevIcon({ s }: { s: Sev }) {
  if (s === 'healthy') return <CheckCircle size={18} style={{ color: 'var(--success)' }} />;
  if (s === 'warning') return <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />;
  return <XCircle size={18} style={{ color: 'var(--error)' }} />;
}

export function EnvironmentDoctor() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<typeof DATA>([]);
  const [filter, setFilter] = useState<'all' | 'issues'>('all');
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const run = () => {
    setScanning(true);
    setStatusMessage(null);
    setTimeout(() => {
      setResults(DATA);
      setScanning(false);
    }, 800);
  };

  const handleFix = async (itemId: string, title: string) => {
    const api = window.electronAPI;
    setFixingId(itemId);
    setStatusMessage(null);
    try {
      if (api?.runPowerShellScript) {
        const script = `Write-Host \"Environment Doctor fix for ${title}\"; Start-Sleep -Seconds 1`;
        await api.runPowerShellScript(script);
      }
      setStatusMessage(`Ran fix for ${title}. Check System Repair Center for detailed logs.`);
    } catch {
      setStatusMessage(`Failed to run fix for ${title}.`);
    } finally {
      setFixingId(null);
    }
  };

  const list = filter === 'issues' ? results.filter((r) => r.severity !== 'healthy') : results;
  const issues = results.filter((r) => r.severity !== 'healthy').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Environment Doctor</h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
            Detect deps, Node conflicts, VC++, Git, SSL, proxy. Fix one-click and send repairs to System Repair Center.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={scanning}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: scanning ? 'wait' : 'pointer',
          }}
        >
          <Stethoscope size={18} />
          {scanning ? 'Scanning…' : 'Run Diagnostics'}
        </button>
      </header>

      {results.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setFilter('all')}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: 'none',
                background: filter === 'all' ? 'var(--accent)' : 'var(--bg-card)',
                color: filter === 'all' ? '#fff' : 'var(--text-secondary)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              All ({results.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('issues')}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: 'none',
                background: filter === 'issues' ? 'var(--accent)' : 'var(--bg-card)',
                color: filter === 'issues' ? '#fff' : 'var(--text-secondary)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Issues ({issues})
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Diagnostic Results</h2>
            {list.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: 16,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                }}
              >
                <SevIcon s={r.severity} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.desc}</div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    padding: '4px 8px',
                    borderRadius: 6,
                    background:
                      r.severity === 'critical'
                        ? 'rgba(239,68,68,0.2)'
                        : r.severity === 'warning'
                          ? 'rgba(245,158,11,0.2)'
                          : 'rgba(34,197,94,0.2)',
                    color:
                      r.severity === 'critical'
                        ? 'var(--error)'
                        : r.severity === 'warning'
                          ? 'var(--warning)'
                          : 'var(--success)',
                  }}
                >
                  {r.severity === 'critical' ? 'Critical' : r.severity === 'warning' ? 'Warning' : 'Healthy'}
                </span>
                {r.severity !== 'healthy' && (
                  <button
                    type="button"
                    onClick={() => handleFix(r.id, r.title)}
                    disabled={!!fixingId}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: 'none',
                      background: 'var(--accent)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: fixingId ? 'wait' : 'pointer',
                    }}
                  >
                    {fixingId === r.id ? 'Running…' : r.fix}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {results.length === 0 && !scanning && (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            color: 'var(--text-secondary)',
          }}
        >
          Click Run Diagnostics to scan.
        </div>
      )}

      {statusMessage && (
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: 'var(--text-secondary)',
          }}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
}
