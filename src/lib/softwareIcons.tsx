import {
  Globe,
  Shield,
  Flame,
  Code2,
  Terminal,
  GitBranch,
  Github,
  Send,
  Container,
  FileCode,
  Coffee,
  Database,
  Archive,
  FileText,
  Zap,
  Palette,
  MessageCircle,
  Box,
  Bot,
  type LucideIcon,
} from 'lucide-react';
import type { SoftwareItem } from './catalog';

const SOFTWARE_ICON_MAP: Record<string, LucideIcon> = {
  chrome: Globe,
  brave: Shield,
  firefox: Flame,
  'node.js': Terminal,
  'visual studio code': Code2,
  vscode: Code2,
  git: GitBranch,
  'github desktop': Github,
  postman: Send,
  docker: Container,
  python: FileCode,
  temurin: Coffee,
  jdk: Coffee,
  mysql: Database,
  mongodb: Database,
  compass: Database,
  '7-zip': Archive,
  '7zip': Archive,
  notepad: FileText,
  powertoys: Zap,
  figma: Palette,
  slack: MessageCircle,
  'android studio': Box,
  'dotnet': Box,
  azure: Box,
  'windows terminal': Terminal,
  putty: Terminal,
  redis: Database,
  postgresql: Database,
  postgres: Database,
  discord: MessageCircle,
  zoom: MessageCircle,
  edge: Globe,
  cursor: Bot,
  copilot: Bot,
  perplexity: Bot,
  antigravity: Bot,
};

const CATEGORY_ICON: Record<string, LucideIcon> = {
  browser: Globe,
  'Development Tools': Code2,
  'Dev Tools': Code2,
  Databases: Database,
  Utilities: Box,
  'AI Tools': Bot,
  Custom: Box,
};

export function getSoftwareIcon(item: SoftwareItem): LucideIcon {
  const key = (item.name || '').toLowerCase();
  const winget = (item.winget_id || '').toLowerCase();
  for (const [k, icon] of Object.entries(SOFTWARE_ICON_MAP)) {
    if (key.includes(k) || winget.includes(k)) return icon;
  }
  return CATEGORY_ICON[item.category] ?? Box;
}
