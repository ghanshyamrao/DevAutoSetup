export interface SoftwareItem {
  id: string;
  name: string;
  winget_id: string;
  category: string;
  enabled: boolean;
  icon_url?: string | null;
  description?: string | null;
  created_at?: string;
  estimated_minutes?: number;
}

const ESTIMATED_MINUTES: Record<string, number> = {
  'Notepad++.Notepad++': 2,
  '7zip.7zip': 2,
  'Git.Git': 3,
  'PuTTY.PuTTY': 2,
  'Microsoft.WindowsTerminal': 3,
  'OpenJS.NodeJS.LTS': 4,
  'Python.Python.3.12': 5,
  'Microsoft.VisualStudioCode': 5,
  'Mozilla.Firefox': 4,
  'Brave.Brave': 4,
  'Google.Chrome': 4,
  'Microsoft.Edge': 4,
  'GitHub.GitHubDesktop': 4,
  'Postman.Postman': 5,
  'EclipseAdoptium.Temurin.17.JDK': 6,
  'Microsoft.DotNet.SDK.8': 8,
  'Microsoft.AzureCLI': 5,
  'Oracle.MySQL': 8,
  'PostgreSQL.PostgreSQL': 6,
  'Redis.Redis': 4,
  'MongoDB.Compass': 5,
  'Docker.DockerDesktop': 12,
  'Microsoft.PowerToys': 4,
  'Figma.Figma': 5,
  'SlackTechnologies.Slack': 5,
  'Discord.Discord': 4,
  'Zoom.Zoom': 5,
  'Google.AndroidStudio': 18,
  'Microsoft.VisualStudio.2022.Community': 25,
  'Microsoft.VisualStudio.2022.Professional': 25,
  'Microsoft.VisualStudio.2022.Enterprise': 25,
};

const DEFAULT_ESTIMATED_MINUTES = 5;

export function getEstimatedInstallMinutes(item: SoftwareItem): number {
  if (item.estimated_minutes != null && item.estimated_minutes > 0) return item.estimated_minutes;
  const key = item.winget_id.replace(/\s/g, '');
  return ESTIMATED_MINUTES[key] ?? DEFAULT_ESTIMATED_MINUTES;
}

const FALLBACK: SoftwareItem[] = [
  { id: '1', name: 'Google Chrome', winget_id: 'Google.Chrome', category: 'browser', enabled: true, icon_url: 'https://logo.clearbit.com/google.com' },
  { id: '2', name: 'Brave Browser', winget_id: 'Brave.Brave', category: 'browser', enabled: true, icon_url: 'https://logo.clearbit.com/brave.com' },
  { id: '3', name: 'Mozilla Firefox', winget_id: 'Mozilla.Firefox', category: 'browser', enabled: true, icon_url: 'https://logo.clearbit.com/mozilla.org' },
  { id: '4', name: 'Node.js (LTS)', winget_id: 'OpenJS.NodeJS.LTS', category: 'Development Tools', enabled: true, icon_url: 'https://logo.clearbit.com/nodejs.org' },
  { id: '5', name: 'Visual Studio Code', winget_id: 'Microsoft.VisualStudioCode', category: 'Development Tools', enabled: true, icon_url: 'https://logo.clearbit.com/code.visualstudio.com' },
  { id: '6', name: 'Git', winget_id: 'Git.Git', category: 'Development Tools', enabled: true, icon_url: 'https://logo.clearbit.com/git-scm.com' },
  { id: '7', name: 'GitHub Desktop', winget_id: 'GitHub.GitHubDesktop', category: 'Development Tools', enabled: true, icon_url: 'https://logo.clearbit.com/github.com' },
  { id: '8', name: 'Postman', winget_id: 'Postman.Postman', category: 'Development Tools', enabled: true, icon_url: 'https://logo.clearbit.com/postman.com' },
  { id: '9', name: 'Docker Desktop', winget_id: 'Docker.DockerDesktop', category: 'Development Tools', enabled: true, icon_url: 'https://logo.clearbit.com/docker.com' },
  { id: '10', name: 'Python 3', winget_id: 'Python.Python.3.12', category: 'Development Tools', enabled: true, icon_url: 'https://logo.clearbit.com/python.org' },
  { id: '11', name: 'Eclipse Temurin 17', winget_id: 'EclipseAdoptium.Temurin.17.JDK', category: 'Development Tools', enabled: true, icon_url: 'https://logo.clearbit.com/adoptium.net' },
  { id: '12', name: 'MySQL', winget_id: 'Oracle.MySQL', category: 'Development Tools', enabled: true, icon_url: 'https://logo.clearbit.com/mysql.com' },
  { id: '13', name: 'MongoDB Compass', winget_id: 'MongoDB.Compass', category: 'Development Tools', enabled: true, icon_url: 'https://logo.clearbit.com/mongodb.com' },
  { id: '14', name: '7-Zip', winget_id: '7zip.7zip', category: 'Utilities', enabled: true, icon_url: 'https://logo.clearbit.com/7-zip.org' },
  { id: '15', name: 'Notepad++', winget_id: 'Notepad++.Notepad++', category: 'Utilities', enabled: true, icon_url: 'https://logo.clearbit.com/notepad-plus-plus.org' },
  { id: '16', name: 'Microsoft PowerToys', winget_id: 'Microsoft.PowerToys', category: 'Utilities', enabled: true, icon_url: 'https://logo.clearbit.com/microsoft.com' },
  { id: '17', name: 'Figma', winget_id: 'Figma.Figma', category: 'Utilities', enabled: true, icon_url: 'https://logo.clearbit.com/figma.com' },
  { id: '18', name: 'Slack', winget_id: 'SlackTechnologies.Slack', category: 'Utilities', enabled: true, icon_url: 'https://logo.clearbit.com/slack.com' },
];

const CATALOG_URL = './software-list.json';

export function invalidateSoftwareCache(): void {}

export async function fetchAllSoftware(): Promise<SoftwareItem[]> {
  try {
    const res = await fetch(CATALOG_URL);
    if (!res.ok) return FALLBACK;
    const data = await res.json();
    return Array.isArray(data) ? data as SoftwareItem[] : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export async function fetchEnabledSoftware(): Promise<SoftwareItem[]> {
  const list = await fetchAllSoftware();
  return list.filter((s) => s.enabled);
}
