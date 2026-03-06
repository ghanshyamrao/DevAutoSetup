import { CheckCircle } from 'lucide-react';
import { APP_NAME } from '../../../lib/appInfo';

export function FinalConfirmationStep() {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <CheckCircle size={36} style={{ color: 'var(--accent)' }} />
      </div>
      <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 700 }}>You're All Set</h1>
      <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {APP_NAME} is ready to use. Click Finish to open the main app and start installing your development tools.
      </p>
      <div
        style={{
          marginTop: 32,
          padding: 20,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'left',
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          • Browse the software catalog and select packages to install.<br />
          • Use the installation queue to run installs in order.<br />
          • Manage installed software from the Manage Software page.
        </div>
      </div>
    </div>
  );
}
