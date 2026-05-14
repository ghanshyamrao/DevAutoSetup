import { Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LockedPanel({
  title,
  message,
  cta = 'View plans',
  to = '/pricing',
}: {
  title: string;
  message: string;
  cta?: string;
  to?: string;
}) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 120px)',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 460,
          textAlign: 'center',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 32,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.18)',
            border: '1px solid var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Lock size={28} style={{ color: 'var(--accent)' }} />
        </div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{title}</h2>
        <p style={{ margin: '8px 0 20px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{message}</p>
        <button
          type="button"
          onClick={() => navigate(to)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {cta}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
