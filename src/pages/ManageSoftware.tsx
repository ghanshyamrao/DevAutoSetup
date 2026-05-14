import { useEffect, useState, useRef } from 'react';
import { Trash2, Box } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchAllSoftware, type SoftwareItem } from '../lib/catalog';
import { getSoftwareIcon } from '../lib/softwareIcons';
import { useAuth } from '../context/AuthContext';
import { LockedPanel } from '../components/LockedPanel';

type SystemEntry = { id: string; name: string };

const CATEGORIES = ['All', 'browser', 'Development Tools', 'Dev Tools', 'Databases', 'Utilities', 'AI Tools', 'Custom'];

type ListItem =
  | { type: 'catalog'; item: SoftwareItem }
  | { type: 'system'; entry: SystemEntry };

export function ManageSoftware() {
  const { subscription } = useAuth();
  if (!subscription.manageEnabled) {
    return (
      <LockedPanel
        title="Manage Software is locked"
        message={
          subscription.planId === 'free'
            ? 'Manage Software is a paid feature. Upgrade to Pro or Lifetime to uninstall, swap versions, and clean up packages.'
            : 'Your Pro subscription has expired. Renew to regain access to Manage Software.'
        }
      />
    );
  }
  return <ManageSoftwareInner />;
}

function ManageSoftwareInner() {
  const { state, markUninstalled, addActivity } = useApp();
  const [catalogList, setCatalogList] = useState<SoftwareItem[]>([]);
  const [systemEntries, setSystemEntries] = useState<SystemEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<(typeof CATEGORIES)[number]>('All');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [uninstallPopup, setUninstallPopup] = useState<{ itemName: string; status: 'uninstalling' | 'success' | 'failed' } | null>(null);
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  const [dynamicPageSize, setDynamicPageSize] = useState(12);
  const CARD_ROW_HEIGHT = 140;
  const CARD_MIN_WIDTH = 300;

  useEffect(() => {
    const el = scrollSectionRef.current;
    if (!el) return;
    const updatePageSize = () => {
      const { clientWidth, clientHeight } = el;
      const cols = Math.max(1, Math.floor(clientWidth / CARD_MIN_WIDTH));
      const rows = Math.max(1, Math.floor(clientHeight / CARD_ROW_HEIGHT));
      setDynamicPageSize(cols * rows);
    };
    updatePageSize();
    const ro = new ResizeObserver(updatePageSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [data, api] = [await fetchAllSoftware(), window.electronAPI];
      if (cancelled) return;
      setCatalogList(data);
      if (api?.wingetListInstalled) {
        const res = await api.wingetListInstalled().catch(() => ({ ids: [] as string[], entries: [] as SystemEntry[] }));
        if (cancelled) return;
        const catalogWingetIds = new Set(data.map((item) => item.winget_id));
        const entries = (res as { ids?: string[]; entries?: SystemEntry[] }).entries ?? [];
        const system = entries.filter((e) => e.id && e.name && !catalogWingetIds.has(e.id));
        setSystemEntries(system);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const installedViaCatalog = catalogList.filter((item) => state.installedIds.has(item.id));

  const catalogFiltered = installedViaCatalog.filter((item) => {
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.winget_id.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || item.category === category;
    return matchSearch && matchCat;
  });

  const systemFiltered = systemEntries.filter((entry) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return entry.name.toLowerCase().includes(q) || entry.id.toLowerCase().includes(q);
  });

  const combined: ListItem[] = [];
  if (source === 'All' || source === 'Installed via DevOnboard') {
    catalogFiltered.forEach((item) => combined.push({ type: 'catalog', item }));
  }
 

  useEffect(() => setPage(1), [search, source, category]);
  const totalPages = Math.ceil(combined.length / dynamicPageSize) || 1;
  useEffect(() => setPage((p) => Math.min(p, totalPages)), [combined.length, dynamicPageSize]);

  const paginatedItems = combined.slice((page - 1) * dynamicPageSize, page * dynamicPageSize);
  const hasAny = installedViaCatalog.length > 0 || systemEntries.length > 0;

  const handleUninstallCatalog = async (item: SoftwareItem) => {
    if (!window.electronAPI?.wingetUninstall) return;
    setUninstallPopup({ itemName: item.name, status: 'uninstalling' });
    try {
      const { success } = await window.electronAPI.wingetUninstall({ wingetId: item.winget_id });
      setUninstallPopup((p) => (p ? { ...p, status: success ? 'success' : 'failed' } : null));
      if (success) {
        markUninstalled(item.id);
        addActivity({
          type: 'sync',
          title: `Uninstalled ${item.name}`,
          message: `${item.winget_id} was removed.`,
          time: 'Just now',
        });
      } else {
        addActivity({
          type: 'failed',
          title: `Uninstall failed: ${item.name}`,
          message: `${item.winget_id} could not be uninstalled.`,
          time: 'Just now',
        });
      }
    } catch {
      setUninstallPopup((p) => (p ? { ...p, status: 'failed' } : null));
      addActivity({
        type: 'failed',
        title: `Uninstall failed: ${item.name}`,
        message: 'An error occurred.',
        time: 'Just now',
      });
    }
    setTimeout(() => setUninstallPopup(null), 1500);
  };

  const handleUninstallSystem = async (entry: SystemEntry) => {
    if (!window.electronAPI?.wingetUninstall) return;
    setUninstallPopup({ itemName: entry.name, status: 'uninstalling' });
    try {
      const { success } = await window.electronAPI.wingetUninstall({ wingetId: entry.id });
      setUninstallPopup((p) => (p ? { ...p, status: success ? 'success' : 'failed' } : null));
      if (success) {
        setSystemEntries((prev) => prev.filter((e) => e.id !== entry.id));
        addActivity({
          type: 'sync',
          title: `Uninstalled ${entry.name}`,
          message: `${entry.id} was removed.`,
          time: 'Just now',
        });
      } else {
        addActivity({
          type: 'failed',
          title: `Uninstall failed: ${entry.name}`,
          message: `${entry.id} could not be uninstalled.`,
          time: 'Just now',
        });
      }
    } catch {
      setUninstallPopup((p) => (p ? { ...p, status: 'failed' } : null));
      addActivity({
        type: 'failed',
        title: `Uninstall failed: ${entry.name}`,
        message: 'An error occurred.',
        time: 'Just now',
      });
    }
    setTimeout(() => setUninstallPopup(null), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Manage Software</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          Uninstall software: apps you installed via DevOnboard and other installed system software (winget).
        </p>

        <input
          type="text"
          placeholder="Search software..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            maxWidth: 400,
            padding: '10px 14px',
            marginBottom: 16,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-primary)',
            fontSize: 14,
          }}
        />
        {(source === 'All' || source === 'Installed via DevOnboard') && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    background: category === cat ? 'var(--accent)' : 'var(--bg-card)',
                    color: category === cat ? '#fff' : 'var(--text-primary)',
                    border: `1px solid ${category === cat ? 'var(--accent)' : 'var(--border)'}`,
                    padding: '8px 14px',
                    borderRadius: 'var(--radius)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </>
        )}
      
      </div>

      <div ref={scrollSectionRef} style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 16,
                  minHeight: 120,
                }}
              >
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '50%' }} />
              </div>
            ))}
          </div>
        ) : !hasAny ? (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 48,
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            No installed software to show. Install apps from the Software Catalog to manage them here; system apps will appear after winget sync.
          </div>
        ) : combined.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 48,
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            No software matches your search or filters.
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, alignContent: 'start' }}>
              {paginatedItems.map((row) =>
                row.type === 'catalog' ? (
                  <ManageSoftwareCard
                    key={`c-${row.item.id}`}
                    item={row.item}
                    onUninstall={() => handleUninstallCatalog(row.item)}
                  />
                ) : (
                  <SystemSoftwareCard
                    key={`s-${row.entry.id}`}
                    entry={row.entry}
                    onUninstall={() => handleUninstallSystem(row.entry)}
                  />
                )
              )}
            </div>
            {combined.length > dynamicPageSize && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: page <= 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                    cursor: page <= 1 ? 'default' : 'pointer',
                    fontSize: 13,
                  }}
                >
                  Previous
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: page >= totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
                    cursor: page >= totalPages ? 'default' : 'pointer',
                    fontSize: 13,
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {uninstallPopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: 24,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              minWidth: 280,
              maxWidth: 360,
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            {uninstallPopup.status === 'uninstalling' && (
              <>
                <div className="spinner" style={{ fontSize: 32, marginBottom: 12, color: 'var(--accent)' }}>◐</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Uninstalling…</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{uninstallPopup.itemName}</div>
              </>
            )}
            {uninstallPopup.status === 'success' && (
              <>
                <div style={{ fontSize: 32, marginBottom: 12, color: 'var(--success)' }}>✓</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--success)' }}>Uninstalled</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{uninstallPopup.itemName}</div>
              </>
            )}
            {uninstallPopup.status === 'failed' && (
              <>
                <div style={{ fontSize: 32, marginBottom: 12, color: 'var(--error)' }}>✗</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--error)' }}>Uninstall failed</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{uninstallPopup.itemName}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ManageSoftwareCard({ item, onUninstall }: { item: SoftwareItem; onUninstall: () => void | Promise<void> }) {
  const [uninstalling, setUninstalling] = useState(false);
  const Icon = getSoftwareIcon(item);

  const handleUninstall = async () => {
    if (uninstalling) return;
    setUninstalling(true);
    try {
      await onUninstall();
    } finally {
      setUninstalling(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--success)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minHeight: 0 }}>
        <div
          className="software-icon"
          style={{
            width: 44,
            height: 44,
            minWidth: 44,
            minHeight: 44,
            background: 'var(--bg-secondary)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={24} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>
            {item.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.winget_id}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleUninstall}
            disabled={uninstalling}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              fontSize: 12,
              color: 'var(--error)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--error)',
              borderRadius: 6,
              cursor: uninstalling ? 'wait' : 'pointer',
            }}
            title="Uninstall via winget"
          >
            <Trash2 size={14} />
            Uninstall
          </button>
        </div>
      </div>
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
        {item.category}
      </div>
    </div>
  );
}

function SystemSoftwareCard({ entry, onUninstall }: { entry: SystemEntry; onUninstall: () => void | Promise<void> }) {
  const [uninstalling, setUninstalling] = useState(false);

  const handleUninstall = async () => {
    if (uninstalling) return;
    setUninstalling(true);
    try {
      await onUninstall();
    } finally {
      setUninstalling(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minHeight: 0 }}>
        <div
          style={{
            width: 44,
            height: 44,
            minWidth: 44,
            minHeight: 44,
            background: 'var(--bg-secondary)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box size={24} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={entry.name}>
            {entry.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.id}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleUninstall}
            disabled={uninstalling}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              fontSize: 12,
              color: 'var(--error)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--error)',
              borderRadius: 6,
              cursor: uninstalling ? 'wait' : 'pointer',
            }}
            title="Uninstall via winget"
          >
            <Trash2 size={14} />
            Uninstall
          </button>
        </div>
      </div>
     
    </div>
  );
}
