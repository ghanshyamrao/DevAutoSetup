import { Puzzle, Code2, GitBranch, BookOpen } from 'lucide-react';

export function ExtendableVersion() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          <Puzzle size={26} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
            Extendable DevOnboard
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
            This section is for the extendable version of DevOnboard. Full control of the system: add plugins, custom repair scripts, and your own stacks without changing the current UI or core functionality.
          </p>
        </div>
      </header>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
          What the extendable version includes
        </h2>
        <ul style={{ margin: 0, paddingLeft: 24, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 2 }}>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Plugin API</strong> – Register custom repair actions, diagnostics, and stack profiles.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Custom PowerShell scripts</strong> – Run your own fix scripts via IPC with elevation when needed.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Config-driven stacks</strong> – Define Quick Setup Profiles via JSON or a central server.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Hooks and events</strong> – React to install completion, scan results, and system checks.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>No changes to current UI</strong> – All extensions are additive; existing screens and behavior stay the same.
          </li>
        </ul>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {[
          { icon: Code2, label: 'Developer docs', desc: 'API and plugin guide' },
          { icon: GitBranch, label: 'Extendable repo', desc: 'Branch or fork for plugins' },
          { icon: BookOpen, label: 'Schema & config', desc: 'Stack and repair definitions' },
        ].map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            style={{
              padding: 20,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <Icon size={22} style={{ color: 'var(--accent)' }} />
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{desc}</div>
          </div>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
        The features in the Extended section (System Repair Center, Environment Doctor, Quick Profiles, AI Assistant, Performance Monitor, Security Scanner, Project Health, Team Mode) are designed to work with this extendable architecture so you keep full control of the system.
      </p>
    </div>
  );
}
