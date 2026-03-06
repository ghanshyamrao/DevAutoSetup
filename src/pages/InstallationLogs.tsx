import { useApp } from '../context/AppContext';

export function InstallationLogs() {
  const { state } = useApp();

  return (
    <div>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Installation Logs</h1>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        History of installation events and outcomes.
      </p>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {state.activity.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            No log entries yet.
          </div>
        ) : (
          state.activity.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 18 }}>
                {a.type === 'sync' && '🔄'}
                {a.type === 'installed' && '✅'}
                {a.type === 'queued' && '📋'}
                {a.type === 'failed' && '⚠️'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{a.message}</div>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{a.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
