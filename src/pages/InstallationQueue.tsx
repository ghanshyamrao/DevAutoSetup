import { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { loadSettings } from '../lib/settings';
import { getEstimatedInstallMinutes } from '../lib/catalog';

type QueueStatus = 'pending' | 'installing' | 'installed' | 'failed';

export function InstallationQueue() {
  const { state, markInstalled, markUninstalled, addActivity, clearQueue, removeFromSelection } = useApp();
  const [statuses, setStatuses] = useState<Record<string, QueueStatus>>({});
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [completedStatus, setCompletedStatus] = useState<'success' | 'cancelled' | null>(null);
  const autoStartedRef = useRef(false);

  const queue = state.queue;
  const installedIds = state.installedIds;
  const selectedVersions = state.selectedVersions;

  useEffect(() => {
    if (queue.length === 0) {
      autoStartedRef.current = false;
      return;
    }
    setStatuses((s) => {
      const next = { ...s };
      queue.forEach((item) => {
        if (next[item.id] === undefined) {
          next[item.id] = installedIds.has(item.id) ? 'installed' : 'pending';
        }
      });
      return next;
    });
  }, [queue, installedIds]);

  const installedThisRunRef = useRef<Set<string>>(new Set());

  const runQueue = async () => {
    if (queue.length === 0 || running) return;
    setRunning(true);
    setJustCompleted(false);
    setCompletedStatus(null);
    installedThisRunRef.current = new Set();
    let hadFailure = false;
    await new Promise((r) => setTimeout(r, 0));
    const api = window.electronAPI;

    for (const item of queue) {
      if (installedIds.has(item.id) || installedThisRunRef.current.has(item.id)) {
        setStatuses((s) => ({ ...s, [item.id]: 'installed' }));
        continue;
      }
      setCurrentId(item.id);
      setStatuses((s) => ({ ...s, [item.id]: 'installing' }));

      if (api) {
        try {
          const version = selectedVersions[item.winget_id];
          const result = await api.wingetInstall({ wingetId: item.winget_id, ...(version && { version }) });
          if (result.success) {
            installedThisRunRef.current.add(item.id);
            setStatuses((s) => ({ ...s, [item.id]: 'installed' }));
            markInstalled(item.id);
            addActivity({
              type: 'installed',
              title: `${item.name} Installed`,
              message: 'Installation completed successfully.',
              time: 'Just now',
            });
          } else {
            hadFailure = true;
            markUninstalled(item.id);
            setStatuses((s) => ({ ...s, [item.id]: 'failed' }));
            addActivity({
              type: 'failed',
              title: `${item.name} failed`,
              message: result.stderr || `Exit code ${result.code}`,
              time: 'Just now',
            });
          }
        } catch (e) {
          hadFailure = true;
          markUninstalled(item.id);
          setStatuses((s) => ({ ...s, [item.id]: 'failed' }));
          addActivity({
            type: 'failed',
            title: `${item.name} failed`,
            message: e instanceof Error ? e.message : 'Unknown error',
            time: 'Just now',
          });
        }
      } else {
        hadFailure = true;
        markUninstalled(item.id);
        setStatuses((s) => ({ ...s, [item.id]: 'failed' }));
        addActivity({
          type: 'failed',
          title: `${item.name} – install skipped`,
          message: 'Run the app in Electron (npm run dev) to install via winget.',
          time: 'Just now',
        });
      }
    }

    setCurrentId(null);
    setRunning(false);
    setJustCompleted(true);
    if (hadFailure) {
      setCompletedStatus('cancelled');
      addActivity({
        type: 'failed',
        title: 'User cancelled the installation',
        message: 'One or more items could not be installed. You can try again or clear the queue.',
        time: 'Just now',
      });
    } else {
      setCompletedStatus('success');
      addActivity({
        type: 'sync',
        title: 'Installation complete',
        message: 'All selected software has been processed. Queue cleared.',
        time: 'Just now',
      });
    }
    setTimeout(() => {
      const ids = queue.map((q) => q.id);
      removeFromSelection(ids);
      clearQueue();
      setJustCompleted(false);
      setCompletedStatus(null);
    }, 1800);
  };

  useEffect(() => {
    const { autoStartInstall } = loadSettings();
    if (queue.length > 0 && !running && autoStartInstall && !autoStartedRef.current) {
      autoStartedRef.current = true;
      runQueue();
    }
  }, [queue.length, running]);

  const startInstall = () => {
    if (queue.length > 0 && !running) runQueue();
  };

  const currentItem = currentId ? queue.find((q) => q.id === currentId) : null;
  const showProgress = queue.length > 0 && (running || justCompleted);
  const totalEstMinutes = queue.reduce((sum, item) => sum + getEstimatedInstallMinutes(item), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Installation Queue</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            Track ongoing and pending software installations.
            {queue.length > 0 && (
              <span style={{ display: 'block', marginTop: 4, fontWeight: 500, color: 'var(--text-primary)' }}>
                Estimated total time: ~{totalEstMinutes} min (ordered: faster installs first)
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={startInstall}
            disabled={queue.length === 0 || running}
            style={{
              background: queue.length && !running ? 'var(--accent)' : 'var(--border)',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 'var(--radius)',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {running ? 'Installing…' : 'Start installation'}
          </button>
          <button
            onClick={clearQueue}
            disabled={queue.length === 0 || running}
            style={{
              background: queue.length && !running ? '#dc2626' : 'var(--border)',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 'var(--radius)',
              fontSize: 14,
            }}
          >
            Clear Queue
          </button>
        </div>
      </div>

      {showProgress && (
        <div style={{ marginBottom: 24 }}>
          {justCompleted ? (
            completedStatus === 'cancelled' ? (
              <div
                style={{
                  marginBottom: 12,
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid var(--error)',
                  borderRadius: 'var(--radius)',
                  fontSize: 14,
                  color: 'var(--error)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                User cancelled the installation
              </div>
            ) : (
              <div
                style={{
                  marginBottom: 12,
                  padding: '12px 16px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid var(--success)',
                  borderRadius: 'var(--radius)',
                  fontSize: 14,
                  color: 'var(--success)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                ✓ Installation complete
              </div>
            )
          ) : currentItem ? (
            <div
              style={{
                marginBottom: 12,
                padding: '10px 14px',
                background: 'var(--bg-card)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius)',
                fontSize: 14,
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span className="spinner" style={{ display: 'inline-block' }}>◐</span>
              <strong>Installing: {currentItem.name}</strong>
            </div>
          ) : null}
        </div>
      )}

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 200,
        }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
          Queue
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {queue.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Queue is empty. Select software from the Software Catalog and click &quot;Install Selected&quot;.
            </div>
          ) : (
            queue.map((item) => {
              const status = statuses[item.id];
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {status === 'installed' && <span style={{ color: 'var(--success)' }}>✓</span>}
                  {status === 'installing' && (
                    <span style={{ color: 'var(--accent)' }} className="spinner">◐</span>
                  )}
                  {status === 'failed' && <span style={{ color: 'var(--error)' }}>✗</span>}
                  {status === 'pending' && <span style={{ color: 'var(--text-secondary)' }}>○</span>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {item.winget_id}
                      <span style={{ marginLeft: 8, color: 'var(--text-secondary)', fontWeight: 400 }}>
                        ~{getEstimatedInstallMinutes(item)} min
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color:
                        status === 'installed'
                          ? 'var(--success)'
                          : status === 'installing'
                            ? 'var(--accent)'
                            : status === 'failed'
                              ? 'var(--error)'
                              : 'var(--text-secondary)',
                    }}
                  >
                    {status === 'installed' && 'Installed'}
                    {status === 'installing' && 'Installing...'}
                    {status === 'failed' && 'Failed'}
                    {status === 'pending' && 'Pending'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
