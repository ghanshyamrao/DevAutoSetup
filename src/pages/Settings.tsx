import { useState, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { loadSettings, saveSettings, type AppSettings } from '../lib/settings';

export function Settings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onUpdateDownloaded) return;
    const unsub = api.onUpdateDownloaded(() => setUpdateDownloaded(true));
    return unsub;
  }, []);

  const update = (key: keyof AppSettings, value: boolean) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const checkForUpdates = async () => {
    const api = window.electronAPI;
    if (!api?.updateCheck) return;
    setUpdateChecking(true);
    try {
      await api.updateCheck();
    } finally {
      setUpdateChecking(false);
    }
  };

  const quitAndInstall = () => {
    window.electronAPI?.updateQuitAndInstall?.();
  };

  return (
    <div>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Settings</h1>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Configure installation behavior and notifications.
      </p>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          maxWidth: 560,
        }}
      >
        <SettingRow
          label="Auto-start installation"
          description="Begin installing as soon as items are added to the queue (no need to click Start)."
          checked={settings.autoStartInstall}
          onChange={(v) => update('autoStartInstall', v)}
        />
        <SettingRow
          label="Clear queue when done"
          description="Remove all items from the queue after every package is installed or failed."
          checked={settings.clearQueueWhenDone}
          onChange={(v) => update('clearQueueWhenDone', v)}
        />
        <SettingRow
          label="Notify when complete"
          description="Show a notice in the app when the full installation run finishes."
          checked={settings.notifyOnComplete}
          onChange={(v) => update('notifyOnComplete', v)}
          last
        />
      </div>

      {typeof window.electronAPI?.updateCheck === 'function' && (
        <div
          style={{
            marginTop: 24,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            maxWidth: 560,
          }}
        >
          <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>Updates</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
            Check for DevOnboard updates. Silent background check runs when the app starts (packaged build).
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={checkForUpdates}
              disabled={updateChecking}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: updateChecking ? 'wait' : 'pointer',
              }}
            >
              <RefreshCw size={18} className={updateChecking ? 'spinner' : ''} style={updateChecking ? { animation: 'spin 0.8s linear infinite' } : {}} />
              {updateChecking ? 'Checking…' : 'Check for updates'}
            </button>
            {updateDownloaded && (
              <button
                type="button"
                onClick={quitAndInstall}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--success)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Download size={18} />
                Restart & install
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SettingRow({
  label,
  description,
  checked,
  onChange,
  last,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 0',
        borderBottom: last ? 'none' : '1px solid var(--border)',
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--accent)', flexShrink: 0 }}
      />
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{description}</div>
      </div>
    </label>
  );
}
