import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchAllSoftware, getEstimatedInstallMinutes, type SoftwareItem } from '../lib/catalog';
import { getSoftwareIcon } from '../lib/softwareIcons';

const CATEGORIES = ['All', 'browser', 'Development Tools', 'Dev Tools', 'Databases', 'Utilities', 'AI Tools', 'Custom'];

function formatApiError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>;
    const msg = [o.message, o.details, o.hint].filter(Boolean).map(String).join(' — ');
    if (msg) return msg;
    const code = o.code != null ? ` [${o.code}]` : '';
    return (String(o.message ?? o.error_description ?? JSON.stringify(o)) + code).trim();
  }
  return String(err);
}

const FAILED_FETCH_HINT =
  'Check that public/software-list.json exists or refresh the page.';

export function SoftwareCatalog() {
  const navigate = useNavigate();
  const { state, toggleSelect, selectAll, setTotalSoftware, setQueue, addActivity, setInstalledIds, markUninstalled, setSelectedVersion } = useApp();
  const [list, setList] = useState<SoftwareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [apiError, setApiError] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<SoftwareItem | null>(null);
  const [uninstallPopup, setUninstallPopup] = useState<{ itemName: string; status: 'uninstalling' | 'success' | 'failed' } | null>(null);
  const [page, setPage] = useState(1);
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  const [dynamicPageSize, setDynamicPageSize] = useState(12);
  const CARD_ROW_HEIGHT = 140;
  const CARD_MIN_WIDTH = 320;

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
    setApiError(null);
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAllSoftware();
        if (cancelled) return;
        setList(data);
        setTotalSoftware(data.length);
        setLoading(false);
        const api = window.electronAPI;
        if (api?.wingetListInstalled) {
          api.wingetListInstalled().then(({ ids: wingetIds }) => {
            if (cancelled) return;
            const installed = data.filter((item) => wingetIds.includes(item.winget_id)).map((item) => item.id);
            setInstalledIds(installed);
          }).catch(() => {});
        }
      } catch (err) {
        if (!cancelled) {
          const fallback = await fetchAllSoftware();
          setList(fallback);
          setTotalSoftware(fallback.length);
          let msg = formatApiError(err) || 'Could not load catalog. Using built-in list.';
          if (msg.toLowerCase().includes('failed to fetch')) {
            msg = `${msg}. ${FAILED_FETCH_HINT}`;
          }
          setApiError(msg);
          addActivity({
            type: 'failed',
            title: 'Catalog Load Failed',
            message: msg,
            time: 'Just now',
          });
        }
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [setTotalSoftware, addActivity, setInstalledIds]);

  const filtered = list.filter((item) => {
    if (state.installedIds.has(item.id)) return false;
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.winget_id.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || item.category === category;
    return matchSearch && matchCat;
  });

  useEffect(() => {
    setPage(1);
  }, [search, category]);

  useEffect(() => {
    const totalPages = Math.ceil(filtered.length / dynamicPageSize) || 1;
    setPage((p) => Math.min(p, totalPages));
  }, [filtered.length, dynamicPageSize]);

  const handleSelectAll = () => selectAll(filtered.filter((f) => f.enabled));
  const selectedCount = state.selectedIds.size;

  const handleInstallSelected = () => {
    const toInstall = list.filter((item) => state.selectedIds.has(item.id));
    if (toInstall.length === 0) return;
    const ordered =
      toInstall.length > 1
        ? [...toInstall].sort((a, b) => getEstimatedInstallMinutes(a) - getEstimatedInstallMinutes(b))
        : toInstall;
    setQueue(ordered);
    addActivity({
      type: 'queued',
      title: `${toInstall.length} package(s) added to queue`,
      message: toInstall.length > 1 ? 'Queue ordered: faster/smaller installs first.' : 'Added to the pending installation queue.',
      time: 'Just now',
    });
    navigate('/queue');
  };

  const totalPages = Math.ceil(filtered.length / dynamicPageSize) || 1;
  const paginatedItems = filtered.slice((page - 1) * dynamicPageSize, page * dynamicPageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {apiError && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--radius)',
            color: 'var(--error)',
            fontSize: 13,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong>API error:</strong> {apiError}
          </div>
          <button
            type="button"
            onClick={() => setApiError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '0 4px',
              fontSize: 18,
              lineHeight: 1,
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Software Catalog</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
              Browse, manage and enable/disable software to install.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSelectAll}
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                padding: '10px 16px',
                borderRadius: 'var(--radius)',
                fontSize: 14,
              }}
            >
              Select All
            </button>
            <button
              onClick={handleInstallSelected}
              disabled={selectedCount === 0}
              style={{
                background: selectedCount ? 'var(--accent)' : 'var(--border)',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Install Selected ({selectedCount})
            </button>
          </div>
        </div>

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

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                background: category === cat ? 'var(--accent)' : 'var(--bg-card)',
                color: category === cat ? '#fff' : 'var(--text-primary)',
                border: `1px solid ${category === cat ? 'var(--accent)' : 'var(--border)'}`,
                padding: '8px 14px',
                borderRadius: 'var(--radius)',
                fontSize: 13,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollSectionRef}
        style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
      >
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
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="skeleton" style={{ height: 16, width: '75%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 12, width: '55%' }} />
                  </div>
                </div>
                <div className="skeleton" style={{ width: 18, height: 18, borderRadius: 4 }} />
              </div>
              <div className="skeleton" style={{ height: 13, width: '40%', marginTop: 12 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
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
          No software found. Ensure public/software-list.json exists or refresh the page.
        </div>
      ) : (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, alignContent: 'start' }}>
          {paginatedItems.map((item) => (
            <SoftwareCard
              key={item.id}
              item={item}
              selected={state.selectedIds.has(item.id)}
              installed={state.installedIds.has(item.id)}
              onShowDetails={() => setDetailItem(item)}
              onToggle={() => toggleSelect(item)}
              onUninstall={async () => {
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
              }}
            />
          ))}
        </div>
        {filtered.length > dynamicPageSize && (
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

      {detailItem && (
        <SoftwareDetailModal
          item={detailItem}
          installed={state.installedIds.has(detailItem.id)}
          selected={state.selectedIds.has(detailItem.id)}
          selectedVersion={state.selectedVersions[detailItem.winget_id]}
          onClose={() => setDetailItem(null)}
          onToggleSelect={() => toggleSelect(detailItem)}
          onAddToQueue={() => {
            const inQueue = state.queue.some((q) => q.id === detailItem.id);
            if (!inQueue) setQueue([...state.queue, detailItem]);
            addActivity({
              type: 'queued',
              title: `${detailItem.name} added to queue`,
              message: inQueue ? 'Already in queue.' : 'Added to the installation queue.',
              time: 'Just now',
            });
            navigate('/queue');
            setDetailItem(null);
          }}
          onSetVersion={(v) => setSelectedVersion(detailItem.winget_id, v)}
        />
      )}

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

function SoftwareDetailModal({
  item,
  installed,
  selected,
  selectedVersion,
  onClose,
  onToggleSelect,
  onAddToQueue,
  onSetVersion,
}: {
  item: SoftwareItem;
  installed: boolean;
  selected: boolean;
  selectedVersion: string | undefined;
  onClose: () => void;
  onToggleSelect: () => void;
  onAddToQueue: () => void;
  onSetVersion: (version: string | null) => void;
}) {
  const [versions, setVersions] = useState<string[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [descFromWinget, setDescFromWinget] = useState<string | null>(null);
  const Icon = getSoftwareIcon(item);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.wingetShow || !item.winget_id) return;
    setLoadingVersions(true);
    api.wingetShow({ wingetId: item.winget_id }).then(({ versions: v, description }) => {
      setVersions(v);
      setDescFromWinget(description);
      setLoadingVersions(false);
    }).catch(() => setLoadingVersions(false));
  }, [item.winget_id]);

  const description = item.description || descFromWinget;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: 520,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="software-icon" style={{ width: 48, height: 48, background: 'var(--bg-secondary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={26} strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{item.name}</h2>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{item.category}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: 2 }}>winget id: {item.winget_id}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {description && (
          <p style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{description}</p>
        )}

        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Status:</strong> {installed ? 'Installed on this machine' : 'Not installed'}
        </div>

        {versions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Version (optional)</label>
            <select
              value={selectedVersion || ''}
              onChange={(e) => onSetVersion(e.target.value || null)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            >
              <option value="">Latest (recommended)</option>
              {versions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            {loadingVersions && <span style={{ marginLeft: 8, fontSize: 12 }}>Loading…</span>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: 13 }}
          >
            Close
          </button>
          {!installed && (
            <>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', fontSize: 13 }}>
                <input type="checkbox" checked={selected} onChange={onToggleSelect} style={{ accentColor: 'var(--accent)' }} />
                Include in this run
              </label>
              <button
                type="button"
                onClick={onAddToQueue}
                style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                Add to installation queue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SoftwareCard({
  item,
  selected,
  installed,
  onShowDetails,
  onToggle,
  onUninstall,
}: {
  item: SoftwareItem;
  selected: boolean;
  installed: boolean;
  onShowDetails: () => void;
  onToggle: () => void;
  onUninstall: () => void | Promise<void>;
}) {
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
        border: `1px solid ${selected ? 'var(--accent)' : installed ? 'var(--success)' : 'var(--border)'}`,
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
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}
          >
            <span
              style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
              onClick={() => onShowDetails()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onShowDetails()}
              title={item.name}
            >
              {item.name}
            </span>
            <button
              type="button"
              onClick={() => onShowDetails()}
              title="View details"
              style={{ flexShrink: 0, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2, display: 'flex' }}
            >
              <Info size={14} />
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.winget_id}
          </div>
        </div>
        <div style={{ width: 100, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          {installed ? (
            <>
              <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>✓ Installed</span>
              <button
                type="button"
                onClick={handleUninstall}
                disabled={uninstalling}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  fontSize: 11,
                  color: 'var(--error)',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid var(--error)',
                  borderRadius: 6,
                  cursor: uninstalling ? 'wait' : 'pointer',
                }}
                title="Uninstall via winget"
              >
                <Trash2 size={12} />
                Uninstall
              </button>
            </>
          ) : (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: item.enabled ? 'pointer' : 'default', fontSize: 12, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={selected}
                onChange={onToggle}
                disabled={!item.enabled}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
              />
              <span>{item.enabled ? 'Select' : 'Disabled'}</span>
            </label>
          )}
        </div>
      </div>
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
        {item.category}
      </div>
    </div>
  );
}
