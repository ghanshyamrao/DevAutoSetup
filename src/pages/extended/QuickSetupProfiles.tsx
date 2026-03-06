import { useState } from 'react';
import { Package, Database, Code, Gamepad2, FlaskConical, Server } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fetchEnabledSoftware, type SoftwareItem } from '../../lib/catalog';

const PROFILES = [
  { id: 'mern', name: 'MERN Stack Developer', description: 'Full-stack JavaScript. Runtime, DB tools, editors.', tags: ['Node.js 18 LTS', 'MongoDB Compass', 'Git', 'VS Code'], icon: Code },
  { id: 'python-ai', name: 'Python AI Stack', description: 'ML, data processing, Jupyter.', tags: ['Python 3.11', 'Anaconda', 'Jupyter', 'CUDA'], icon: FlaskConical },
  { id: 'dotnet', name: '.NET Stack', description: 'Full .NET development.', tags: ['.NET 8 SDK', 'VS Build Tools', 'C#'], icon: Server },
  { id: 'flutter', name: 'Flutter Stack', description: 'Mobile and desktop with Flutter.', tags: ['Flutter SDK', 'Dart', 'Android SDK'], icon: Package },
  { id: 'java-spring', name: 'Java Spring Stack', description: 'Enterprise Java with Spring Boot.', tags: ['JDK 17', 'Maven', 'Spring Boot'], icon: Database },
  { id: 'cpp-game', name: 'C++ Game Engine Dev', description: 'C++ game development.', tags: ['Visual Studio 2022', 'CMake', 'Vulkan SDK'], icon: Gamepad2 },
];

const PROFILE_WINGET: Record<string, string[]> = {
  mern: ['OpenJS.NodeJS.LTS', 'MongoDB.Compass', 'Git.Git', 'Microsoft.VisualStudioCode'],
  'python-ai': ['Python.Python.3.12'],
  dotnet: ['Microsoft.DotNet.SDK.8', 'Microsoft.VisualStudio.2022.Community'],
  flutter: ['Google.AndroidStudio'],
  'java-spring': ['EclipseAdoptium.Temurin.17.JDK', 'PostgreSQL.PostgreSQL'],
  'cpp-game': ['Microsoft.VisualStudio.2022.Community', 'Microsoft.VisualStudioCode'],
};

export function QuickSetupProfiles() {
  const { state, setQueue, addActivity } = useApp();
  const [deployingId, setDeployingId] = useState<string | null>(null);

  const deploy = async (profileId: string, profileName: string) => {
    const wingetIds = PROFILE_WINGET[profileId];
    if (!wingetIds || deployingId) return;
    setDeployingId(profileId);
    try {
      const all = await fetchEnabledSoftware();
      const toAdd: SoftwareItem[] = all.filter((item) => wingetIds.includes(item.winget_id));
      if (!toAdd.length) return;
      const existingIds = new Set(state.queue.map((q) => q.id));
      const merged = [...state.queue, ...toAdd.filter((item) => !existingIds.has(item.id))];
      setQueue(merged);
      addActivity({
        type: 'queued',
        title: `${profileName} stack queued`,
        message: `${toAdd.length} tools added to the installation queue.`,
        time: 'Just now',
      });
    } finally {
      setDeployingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Quick Setup Profiles</h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
          One-click deploy predefined development stacks. Installs software, configures PATH, and sets up settings globally.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {PROFILES.map((profile) => {
          const Icon = profile.icon;
          const isDeploying = deployingId === profile.id;
          return (
            <div
              key={profile.id}
              style={{
                padding: 24,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Icon size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{profile.name}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{profile.description}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {profile.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    {tag}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => deploy(profile.id, profile.name)}
                disabled={!!deployingId}
                style={{
                  marginTop: 'auto',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: deployingId ? 'wait' : 'pointer',
                  opacity: deployingId && !isDeploying ? 0.7 : 1,
                }}
              >
                {isDeploying ? 'Deploying…' : 'Deploy Stack'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
