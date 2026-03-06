import { useState } from 'react';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { APP_NAME } from '../../lib/appInfo';
import { WelcomeStep } from './steps/WelcomeStep';
import { FeatureOverviewStep } from './steps/FeatureOverviewStep';
import { SystemCheckStep } from './steps/SystemCheckStep';
import { PreferencesStep } from './steps/PreferencesStep';
import { FinalConfirmationStep } from './steps/FinalConfirmationStep';

const STEPS = [
  { id: 1, key: 'welcome', title: 'Welcome', subtitle: 'Get started' },
  { id: 2, key: 'features', title: 'Features', subtitle: "What's new" },
  { id: 3, key: 'permissions', title: 'Permissions', subtitle: 'System access' },
  { id: 4, key: 'preferences', title: 'Preferences', subtitle: 'Personalize' },
  { id: 5, key: 'summary', title: 'Summary', subtitle: 'Review setup' },
] as const;

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const isFirst = step === 1;
  const isLast = step === STEPS.length;

  const handleNext = () => {
    if (isLast) return;
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const handleBack = () => {
    if (isFirst) return;
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSkip = () => {
    if (typeof window.electronAPI?.completeOnboarding === 'function') {
      window.electronAPI.completeOnboarding();
    }
  };

  const handleComplete = () => {
    if (typeof window.electronAPI?.completeOnboarding === 'function') {
      window.electronAPI.completeOnboarding();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div className="logo-css" aria-hidden>
            <div className="logo-css__inner">
              <div className="logo-css__cell" />
              <div className="logo-css__cell" />
              <div className="logo-css__cell" />
              <div className="logo-css__cell" />
            </div>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.02em' }}>{APP_NAME}</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {STEPS.map((s) => {
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div
                key={s.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius)',
                  background: isActive ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: isDone ? 'var(--accent)' : isActive ? 'var(--accent)' : 'var(--bg-card)',
                    border: isDone || isActive ? 'none' : '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isDone ? (
                    <Check size={16} style={{ color: '#fff' }} />
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#fff' : 'var(--text-secondary)' }}>
                      {s.id}
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: isActive || isDone ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.subtitle}</div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: 32,
          overflow: 'auto',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {step === 1 && <WelcomeStep />}
          {step === 2 && <FeatureOverviewStep />}
          {step === 3 && <SystemCheckStep />}
          {step === 4 && <PreferencesStep />}
          {step === 5 && <FinalConfirmationStep />}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {isFirst ? 'Skip Setup' : 'Cancel Setup'}
          </button>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={handleBack}
              disabled={isFirst}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: isFirst ? 'var(--text-secondary)' : 'var(--text-primary)',
                fontSize: 14,
                cursor: isFirst ? 'default' : 'pointer',
              }}
            >
              <ChevronLeft size={18} />
              Back
            </button>
            <button
              type="button"
              onClick={isLast ? handleComplete : handleNext}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 'var(--radius)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isLast ? 'Finish' : 'Continue'}
              {!isLast && <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
