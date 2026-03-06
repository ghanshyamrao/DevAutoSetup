import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Wifi,
  Package,
  LayoutDashboard,
  CheckSquare,
  CheckCircle,
  Clock,
  RefreshCw,
  ClipboardList,
  AlertTriangle,
  Play,
  Loader2,
  Circle,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchEnabledSoftware, fetchAllSoftware, invalidateSoftwareCache } from '../lib/catalog';

type SystemChecks = {
  admin: boolean | null;
  internet: boolean | null;
  winget: { available: boolean; version: string | null };
};

type StepStatus = 'pending' | 'running' | 'done';

const STARTUP_STEPS = [
  { key: 'system', label: 'Verifying system requirements' },
  { key: 'catalog', label: 'Loading software catalog' },
  { key: 'sync', label: 'Syncing installed packages' },
] as const;

export function Dashboard() {
  const navigate = useNavigate();
  const { state, setTotalSoftware, setQueue, addActivity, setInstalledIds, setInitialDataLoaded } = useApp();
  const [checks, setChecks] = useState<SystemChecks>({
    admin: null,
    internet: null,
    winget: { available: false, version: null },
  });
  const [loading, setLoading] = useState(!state.initialDataLoaded);
  const [syncing, setSyncing] = useState(false);
  const [startupSteps, setStartupSteps] = useState<Record<string, StepStatus>>({
    system: 'pending',
    catalog: 'pending',
    sync: 'pending',
  });

  useEffect(() => {
    const api = window.electronAPI;

    if (state.initialDataLoaded) {
      setLoading(false);
      if (api) {
        Promise.all([api.checkAdmin(), api.checkInternet(), api.checkWinget()]).then(([admin, internet, winget]) => {
          setChecks({
            admin: admin.granted,
            internet: internet.connected,
            winget: { available: winget.available, version: winget.version },
          });
        });
      } else {
        setChecks((c) => ({ ...c, admin: true, internet: true, winget: { available: true, version: '1.0' } }));
      }
      return;
    }

    let cancelled = false;
    const setStep = (key: string, status: StepStatus) => {
      if (!cancelled) setStartupSteps((s) => ({ ...s, [key]: status }));
    };

    const run = async () => {
      if (!api) {
        setChecks((c) => ({ ...c, admin: true, internet: true, winget: { available: true, version: '1.0' } }));
        setStep('system', 'done');
        setStep('catalog', 'running');
        try {
          const data = await fetchAllSoftware();
          if (cancelled) return;
          setTotalSoftware(data.length);
          setStep('catalog', 'done');
        } catch {
          if (!cancelled) setStep('catalog', 'done');
        }
        setStep('sync', 'done');
        if (!cancelled) {
          setLoading(false);
          setInitialDataLoaded(true);
        }
        return;
      }

      setStep('system', 'running');
      const [admin, internet, winget] = await Promise.all([
        api.checkAdmin(),
        api.checkInternet(),
        api.checkWinget(),
      ]);
      if (cancelled) return;
      setChecks({
        admin: admin.granted,
        internet: internet.connected,
        winget: { available: winget.available, version: winget.version },
      });
      setStep('system', 'done');

      setStep('catalog', 'running');
      let data: Awaited<ReturnType<typeof fetchAllSoftware>> = [];
      try {
        data = await fetchAllSoftware();
        if (cancelled) return;
        setTotalSoftware(data.length);
      } catch {
        if (!cancelled) {
          try {
            data = await fetchAllSoftware();
            if (!cancelled) setTotalSoftware(data.length);
          } catch {
          }
        }
      }
      if (!cancelled) setStep('catalog', 'done');

      setStep('sync', 'running');
      if (api.wingetListInstalled && data.length > 0) {
        try {
          const { ids: wingetIds } = await api.wingetListInstalled();
          if (!cancelled) {
            const installed = data.filter((item) => wingetIds.includes(item.winget_id)).map((item) => item.id);
            setInstalledIds(installed);
          }
        } catch {
        }
      }
      if (!cancelled) {
        setStep('sync', 'done');
        setLoading(false);
        setInitialDataLoaded(true);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [state.initialDataLoaded, setTotalSoftware, setInstalledIds, setInitialDataLoaded]);

  const handleRefreshCatalog = async () => {
    setSyncing(true);
    invalidateSoftwareCache();
    try {
      const list = await fetchEnabledSoftware();
      setTotalSoftware(list.length);
      addActivity({
        type: 'sync',
        title: 'Catalog refreshed',
        message: `Loaded ${list.length} packages from software-list.json.`,
        time: 'Just now',
      });
    } catch (e) {
      addActivity({
        type: 'failed',
        title: 'Refresh failed',
        message: e instanceof Error ? e.message : 'Could not load catalog.',
        time: 'Just now',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleInstallAll = async () => {
    if (state.selectedIds.size === 0) return;
    try {
      const enabled = await fetchEnabledSoftware();
      const toInstall = enabled.filter((item) => state.selectedIds.has(item.id));
      setQueue(toInstall);
      addActivity({
        type: 'queued',
        title: `${toInstall.length} package(s) added to queue`,
        message: 'Added to the pending installation queue.',
        time: 'Just now',
      });
      navigate('/queue');
    } catch {
      addActivity({
        type: 'failed',
        title: 'Cannot build queue',
        message: 'Failed to fetch software list.',
        time: 'Just now',
      });
    }
  };

  const selectedCount = state.selectedIds.size;
  const pendingCount = state.queue.length;
  const installedCount = state.installedIds.size;

  if (loading) {
    const doneCount = STARTUP_STEPS.filter((s) => startupSteps[s.key] === 'done').length;
    const progress = STARTUP_STEPS.length ? Math.round((doneCount / STARTUP_STEPS.length) * 100) : 0;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100%',
          width: '100%',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 480, width: '100%' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, textAlign: 'center' }}>Starting system components…</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, textAlign: 'center' }}>{progress}%</p>
        <div
          style={{
            height: 8,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--accent)',
              transition: 'width 0.25s ease',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STARTUP_STEPS.map(({ key, label }) => {
            const status = startupSteps[key];
            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: status === 'running' ? 'rgba(139, 92, 246, 0.12)' : 'var(--bg-card)',
                  border: `1px solid ${status === 'running' ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                }}
              >
                {status === 'done' && (
                  <CheckCircle size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
                )}
                {status === 'running' && (
                  <Loader2 size={20} className="spinner" style={{ color: 'var(--accent)', flexShrink: 0, display: 'inline-block' }} />
                )}
                {status === 'pending' && (
                  <Circle size={20} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                )}
                <span style={{ fontSize: 14, color: status === 'pending' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            Automated Developer Environment Installer. Your system is ready.
          </p>
        </div>
        <button
          onClick={handleInstallAll}
          disabled={selectedCount === 0}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: selectedCount ? 'var(--accent)' : 'var(--border)',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <Play size={18} />
          Install All ({selectedCount})
        </button>
      </div>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
          System Checks
        </h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Card
            Icon={Shield}
            label="Admin Access"
            value={checks.admin === null ? 'Checking…' : checks.admin ? 'Granted' : 'Not granted'}
            ok={checks.admin === true}
          />
          <Card
            Icon={Wifi}
            label="Internet Status"
            value={checks.internet === null ? 'Checking…' : checks.internet ? 'Connected' : 'Disconnected'}
            ok={checks.internet === true}
          />
          <Card
            Icon={Package}
            label="Winget CLI"
            value={
              checks.winget.available
                ? `v${checks.winget.version ?? '?'} Available`
                : 'Not found'
            }
            ok={checks.winget.available}
          />
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
          Overview
        </h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <StatCard Icon={LayoutDashboard} label="Total Software" value={String(state.totalSoftware)} />
          <StatCard Icon={CheckSquare} label="Selected for Install" value={String(selectedCount)} />
          <StatCard Icon={CheckCircle} label="Installed" value={String(installedCount)} accent="var(--success)" />
          <StatCard Icon={Clock} label="Pending Queue" value={String(pendingCount)} accent="var(--warning)" />
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text-secondary)' }}>
          Recent Activity
        </h2>
        <button
          onClick={handleRefreshCatalog}
          disabled={syncing}
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            padding: '6px 12px',
            borderRadius: 'var(--radius)',
            fontSize: 13,
          }}
        >
          {syncing ? 'Refreshing…' : 'Refresh catalog'}
        </button>
      </div>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {state.activity.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
            No recent activity. Use &quot;Refresh catalog&quot; to load the software list.
          </div>
        ) : (
          state.activity.slice(0, 10).map((a) => (
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
              <span style={{ flexShrink: 0, marginTop: 2 }}>
                {a.type === 'sync' && <RefreshCw size={18} style={{ color: 'var(--accent)' }} />}
                {a.type === 'installed' && <CheckCircle size={18} style={{ color: 'var(--success)' }} />}
                {a.type === 'queued' && <ClipboardList size={18} style={{ color: 'var(--accent)' }} />}
                {a.type === 'failed' && <AlertTriangle size={18} style={{ color: 'var(--error)' }} />}
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

function Card({
  Icon,
  label,
  value,
  ok,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        minWidth: 160,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Icon size={24} style={{ flexShrink: 0, color: ok ? 'var(--success)' : 'var(--text-secondary)' }} strokeWidth={2} />
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
        <div style={{ fontWeight: 600, color: ok ? 'var(--success)' : 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}

function StatCard({
  Icon,
  label,
  value,
  accent,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={20} style={{ flexShrink: 0, color: accent ?? 'var(--accent)' }} strokeWidth={2} />
        <span style={{ fontSize: 24, fontWeight: 700, color: accent ?? 'var(--accent)' }}>{value}</span>
      </div>
    </div>
  );
}
