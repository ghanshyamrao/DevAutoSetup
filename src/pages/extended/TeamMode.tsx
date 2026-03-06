import { Building2, Server, ListChecks, FileText } from 'lucide-react';

export function TeamMode() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Building2 size={28} style={{ color: 'var(--accent)' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
            Team Mode (Enterprise)
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
            Central config server, company standard stack, pre-approved software list, and auto audit logs. Full control for IT and teams.
          </p>
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 20,
        }}
      >
        {[
          { icon: Server, title: 'Central config server', desc: 'Fetch policies and approved stacks from your server.' },
          { icon: ListChecks, title: 'Company standard stack', desc: 'Enforce one-click standard dev environment.' },
          { icon: ListChecks, title: 'Pre-approved software list', desc: 'Only install from an allowlist defined by IT.' },
          { icon: FileText, title: 'Auto audit logs', desc: 'Log installs and repairs for compliance and review.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            style={{
              padding: 24,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <Icon size={24} style={{ color: 'var(--accent)' }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: 20,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          color: 'var(--text-secondary)',
          fontSize: 14,
        }}
      >
        Configure central server URL and allowlist in Settings. Audit logs can be exported or sent to your logging endpoint.
      </div>
    </div>
  );
}
