import { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, MemoryStick, Server, Zap } from 'lucide-react';

function useMetrics() {
  const [cpu, setCpu] = useState(12);
  const [ram, setRam] = useState(64);
  const [disk, setDisk] = useState(45);
  useEffect(() => {
    const t = setInterval(() => {
      setCpu((c) => Math.min(100, Math.max(0, c + (Math.random() - 0.5) * 8)));
      setRam((r) => Math.min(100, Math.max(0, r + (Math.random() - 0.5) * 4)));
      setDisk((d) => Math.min(100, Math.max(0, d + (Math.random() - 0.5) * 2)));
    }, 1500);
    return () => clearInterval(t);
  }, []);
  return { cpu, ram, disk };
}

const ITEMS = [
  { label: 'CPU usage', key: 'cpu', Icon: Cpu, color: 'var(--accent)' },
  { label: 'RAM usage', key: 'ram', Icon: MemoryStick, color: 'var(--success)' },
  { label: 'Disk used', key: 'disk', Icon: HardDrive, color: 'var(--warning)' },
  { label: 'Node', value: 'Active', Icon: Zap, color: 'var(--text-secondary)' },
  { label: 'Service', value: 'Running', Icon: Server, color: 'var(--success)' },
];

export function PerformanceMonitor() {
  const m = useMetrics();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Activity size={28} style={{ color: 'var(--accent)' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Performance & Health Monitor</h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>CPU, RAM, disk, Node, service status.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {ITEMS.map((item) => {
          const val = item.key ? (item.key === 'cpu' ? m.cpu : item.key === 'ram' ? m.ram : m.disk) : (item as { value?: string }).value;
          const str = typeof val === 'number' ? `${Math.round(val)}%` : val;
          const Icon = item.Icon;
          return (
            <div key={item.label} style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Icon size={24} style={{ color: item.color }} />
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{str}</div>
              {item.key && (
                <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-primary)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round(typeof val === 'number' ? val : 0)}%`, background: item.color, borderRadius: 3, transition: 'width 0.3s ease' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Live monitoring</h2>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>Wire to Electron for real metrics.</p>
      </section>
    </div>
  );
}
