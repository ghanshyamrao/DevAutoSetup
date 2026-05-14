import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { SoftwareCatalog } from './pages/SoftwareCatalog';
import { InstallationQueue } from './pages/InstallationQueue';
import { InstallationLogs } from './pages/InstallationLogs';
import { Settings } from './pages/Settings';
import { About } from './pages/About';
import { ManageSoftware } from './pages/ManageSoftware';
import { Splash } from './pages/Splash';
import { Login } from './pages/Login';
import { Pricing } from './pages/Pricing';
import { Account } from './pages/Account';
import { OnboardingWizard } from './pages/onboarding/OnboardingWizard';
import { SystemRepairCenter } from './pages/extended/SystemRepairCenter';
import { EnvironmentDoctor } from './pages/extended/EnvironmentDoctor';
import { QuickSetupProfiles } from './pages/extended/QuickSetupProfiles';
import { AIDebugAssistant } from './pages/extended/AIDebugAssistant';
import { PerformanceMonitor } from './pages/extended/PerformanceMonitor';
import { PermissionSecurityScanner } from './pages/extended/PermissionSecurityScanner';
import { ProjectHealthChecker } from './pages/extended/ProjectHealthChecker';
import { TeamMode } from './pages/extended/TeamMode';
import { ExtendableVersion } from './pages/extended/ExtendableVersion';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import type { ReactElement } from 'react';

function RequireAuth({ children }: { children: ReactElement }) {
  const { ready, user } = useAuth();
  const location = useLocation();
  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} className="spinner" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/splash" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<OnboardingWizard />} />
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="catalog" element={<SoftwareCatalog />} />
        <Route path="queue" element={<InstallationQueue />} />
        <Route path="logs" element={<InstallationLogs />} />
        <Route path="manage" element={<ManageSoftware />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="account" element={<Account />} />
        <Route path="settings" element={<Settings />} />
        <Route path="about" element={<About />} />
        <Route path="repair-center" element={<SystemRepairCenter />} />
        <Route path="environment-doctor" element={<EnvironmentDoctor />} />
        <Route path="quick-profiles" element={<QuickSetupProfiles />} />
        <Route path="ai-assistant" element={<AIDebugAssistant />} />
        <Route path="performance" element={<PerformanceMonitor />} />
        <Route path="security" element={<PermissionSecurityScanner />} />
        <Route path="project-health" element={<ProjectHealthChecker />} />
        <Route path="team-mode" element={<TeamMode />} />
        <Route path="extendable" element={<ExtendableVersion />} />
      </Route>
    </Routes>
  );
}
