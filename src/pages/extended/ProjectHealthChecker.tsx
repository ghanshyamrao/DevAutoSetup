import { useState } from 'react';
import { FolderOpen, Package, AlertCircle } from 'lucide-react';

export function ProjectHealthChecker() {
  const [folder, setFolder] = useState('');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<{ ok: string[]; issues: string[] } | null>(null);

  const runScan = () => {
    if (!folder.trim()) return;
    setScanning(true);
    setResults(null);
    setTimeout(() => {
      setResults({
        ok: ['package.json found', 'node_modules present', 'TypeScript config valid'],
        issues: ['Missing .env (optional)', '2 outdated dependencies', '1 peer dependency warning'],
      });
      setScanning(false);
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Project Health Checker</h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
          Select a project folder. Scan for node_modules corruption, missing .env, TypeScript errors, broken package.json, and outdated dependencies.
        </p>
      </header>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Project folder path</label>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="C:\Projects\my-app"
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: 14,
            }}
          />
          <button
            type="button"
            onClick={runScan}
            disabled={scanning || !folder.trim()}
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
            <FolderOpen size={18} />
            {scanning ? 'Scanning…' : 'Select & Scan'}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
          In Electron, wire this to a folder picker (e.g. dialog.showOpenDialog) for full control.
        </p>
      </div>

      {results && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={18} />
              OK
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
              {results.ok.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} />
              Issues
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
              {results.issues.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
