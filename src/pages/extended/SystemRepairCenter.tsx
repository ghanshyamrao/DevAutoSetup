import { useState } from 'react';
import { Wrench, Play, Download, Shield } from 'lucide-react';

const REPAIR_ACTIONS = [
  { id: 'path', label: 'Fix broken PATH variables', requiresElevation: true },
  { id: 'winget', label: 'Repair Winget', requiresElevation: false },
  { id: 'devmode', label: 'Enable Developer Mode', requiresElevation: true },
  { id: 'execpolicy', label: 'Fix Execution Policy', requiresElevation: true },
  { id: 'npm', label: 'Repair npm / node corruption', requiresElevation: false },
  { id: 'temp', label: 'Clean temp files', requiresElevation: false },
  { id: 'network', label: 'Reset network stack', requiresElevation: true },
];

export function SystemRepairCenter() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState<string | null>(null);

  const runRepair = async (id: string) => {
    const api = window.electronAPI as { runPowerShellScript?: (script: string) => Promise<{ stdout?: string; stderr?: string; code?: number }> } | undefined;
    if (!api?.runPowerShellScript) {
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] IPC not available (run in Electron).`]);
      return;
    }
    setRunning(id);
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Starting repair: ${id}...`]);
    try {
      const script = `Write-Host "Repair ${id} - placeholder"; Start-Sleep -Seconds 1`;
      const result = await api.runPowerShellScript(script);
      setLogs((prev) => [...prev, result.stdout || result.stderr || 'Done.', `Exit code: ${result.code ?? 0}`]);
    } catch (e) {
      setLogs((prev) => [...prev, `Error: ${String(e)}`]);
    } finally {
      setRunning(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
            System Repair Center
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
            Fix PATH, Winget, Execution Policy, npm/node, temp files, and network. Runs PowerShell with elevation when needed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLogs([])}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <Download size={18} />
          Export Report
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {REPAIR_ACTIONS.map((item) => (
          <div
            key={item.id}
            style={{
              padding: 20,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Wrench size={20} style={{ color: 'var(--accent)' }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</span>
            </div>
            {item.requiresElevation && (
              <span style={{ fontSize: 11, color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Shield size={12} />
                Requires elevation
              </span>
            )}
            <button
              type="button"
              onClick={() => runRepair(item.id)}
              disabled={running !== null}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: running ? 'wait' : 'pointer',
              }}
            >
              <Play size={16} />
              {running === item.id ? 'Running…' : 'Run Repair'}
            </button>
          </div>
        ))}
      </div>

      <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Status logs (Electron IPC to PowerShell)
        </h2>
        <pre
          style={{
            margin: 0,
            padding: 12,
            background: 'var(--bg-primary)',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: 'Consolas, monospace',
            color: 'var(--text-secondary)',
            maxHeight: 240,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {logs.length === 0 ? 'Run a repair to see logs here.' : logs.join('\n')}
        </pre>
      </section>
    </div>
  );
}
